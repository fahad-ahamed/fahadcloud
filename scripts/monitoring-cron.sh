#!/bin/bash
# FahadCloud Monitoring Cron Script v2.0
# Runs every 5 minutes via crontab
# Handles: metrics collection, log rotation, DB vacuum, Redis optimization,
#          Docker cleanup, SSL expiry check, disk space alerting

set -euo pipefail

# ===================== Configuration =====================
FAHADCLOUD_DIR="${FAHADCLOUD_DIR:-/home/fahad/fahadcloud}"
FAHADCLOUD_URL="${FAHADCLOUD_URL:-http://localhost:3000}"
LOG_DIR="${FAHADCLOUD_DIR}/logs"
LOG_FILE="${LOG_DIR}/monitoring-cron.log"
ALERT_LOG="${LOG_DIR}/alerts.log"

# Thresholds
DISK_WARNING_PERCENT=85
DISK_CRITICAL_PERCENT=95
SSL_WARNING_DAYS=30
SSL_CRITICAL_DAYS=7
MEMORY_WARNING_PERCENT=85
MEMORY_CRITICAL_PERCENT=95

# Ensure log directory exists
mkdir -p "${LOG_DIR}"

# ===================== Logging =====================
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "${LOG_FILE}"
}

log_alert() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $*" >> "${ALERT_LOG}"
  log "ALERT: $*"
}

# ===================== 1. Metrics Collection =====================
collect_metrics() {
  log "Collecting metrics..."
  local jwt_secret
  jwt_secret=$(grep JWT_SECRET "${FAHADCLOUD_DIR}/.env" 2>/dev/null | cut -d= -f2 || echo "")
  
  if [ -n "${jwt_secret}" ]; then
    curl -s -X POST "${FAHADCLOUD_URL}/api/agent/monitor/collect" \
      -H "Authorization: Bearer ${jwt_secret}" \
      > /dev/null 2>&1 && log "Metrics collected successfully" || log "Failed to collect metrics"
  else
    log "WARNING: JWT_SECRET not found in .env, skipping metrics collection"
  fi
}

# ===================== 2. Log Rotation =====================
rotate_logs() {
  log "Checking log rotation..."
  
  # Rotate Next.js application logs
  if command -v logrotate &> /dev/null; then
    logrotate -s "${FAHADCLOUD_DIR}/logrotate.state" \
      "${FAHADCLOUD_DIR}/logrotate.conf" 2>/dev/null || true
  fi
  
  # Rotate our own monitoring logs if they get too large (>50MB)
  for logfile in "${LOG_FILE}" "${ALERT_LOG}"; do
    if [ -f "${logfile}" ]; then
      local size
      size=$(stat -f%z "${logfile}" 2>/dev/null || stat -c%s "${logfile}" 2>/dev/null || echo 0)
      if [ "${size}" -gt 52428800 ]; then
        mv "${logfile}" "${logfile}.$(date +%Y%m%d%H%M%S).old"
        gzip "${logfile}.$(date +%Y%m%d%H%M%S).old" 2>/dev/null || true
        log "Rotated ${logfile}"
      fi
    fi
  done
  
  # Clean old rotated logs (keep last 7 days)
  find "${LOG_DIR}" -name "*.old.gz" -mtime +7 -delete 2>/dev/null || true
}

# ===================== 3. Database Vacuum =====================
vacuum_database() {
  log "Running database maintenance..."
  local db_url
  db_url=$(grep DATABASE_URL "${FAHADCLOUD_DIR}/.env" 2>/dev/null | cut -d= -f2- || echo "")
  
  if [ -n "${db_url}" ]; then
    # Extract connection details from DATABASE_URL
    local db_host db_port db_name db_user
    db_host=$(echo "${db_url}" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p' | head -1)
    db_port=$(echo "${db_url}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p' | head -1)
    db_name=$(echo "${db_url}" | sed -n 's/.*\/\([^?]*\).*/\1/p' | head -1)
    db_user=$(echo "${db_url}" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p' | head -1)
    
    if [ -n "${db_name}" ]; then
      # Run VACUUM ANALYZE on PostgreSQL
      if command -v psql &> /dev/null; then
        PGPASSWORD=$(echo "${db_url}" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') \
          psql -h "${db_host:-localhost}" -p "${db_port:-5432}" -U "${db_user:-postgres}" \
          -d "${db_name}" -c "VACUUM ANALYZE;" 2>/dev/null \
          && log "Database vacuum completed" \
          || log "Database vacuum failed (non-critical)"
      fi
    fi
  fi
}

# ===================== 4. Redis Memory Optimization =====================
optimize_redis() {
  log "Optimizing Redis..."
  if command -v redis-cli &> /dev/null; then
    # Get Redis memory usage
    local used_memory
    used_memory=$(redis-cli INFO memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r' || echo "unknown")
    log "Redis memory usage: ${used_memory}"
    
    # Run MEMORY PURGE if available (Redis 4.0+)
    redis-cli MEMORY PURGE 2>/dev/null || true
    
    # Clean expired keys
    redis-cli SCAN 0 COUNT 1000 2>/dev/null | head -1 > /dev/null
    
    log "Redis optimization completed"
  else
    log "redis-cli not available, skipping Redis optimization"
  fi
}

# ===================== 5. Docker Cleanup =====================
cleanup_docker() {
  log "Cleaning Docker resources..."
  if command -v docker &> /dev/null; then
    # Remove dangling images
    local dangling_count
    dangling_count=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l || echo 0)
    if [ "${dangling_count}" -gt 0 ]; then
      docker image prune -f 2>/dev/null || true
      log "Removed ${dangling_count} dangling Docker images"
    fi
    
    # Remove stopped containers older than 24h
    local stopped_count
    stopped_count=$(docker ps -a -f "status=exited" -q 2>/dev/null | wc -l || echo 0)
    if [ "${stopped_count}" -gt 0 ]; then
      docker container prune -f --filter "until=24h" 2>/dev/null || true
      log "Cleaned ${stopped_count} stopped Docker containers"
    fi
    
    # Remove unused networks
    docker network prune -f 2>/dev/null || true
    
    # Remove unused build cache
    docker builder prune -f --filter "until=48h" 2>/dev/null || true
    
    # Report Docker disk usage
    local docker_disk
    docker_disk=$(docker system df 2>/dev/null | head -5 || echo "unknown")
    log "Docker disk usage: ${docker_disk}"
  else
    log "Docker not available, skipping cleanup"
  fi
}

# ===================== 6. SSL Certificate Expiry Check =====================
check_ssl_certs() {
  log "Checking SSL certificate expiry..."
  
  local ssl_dir="${FAHADCLOUD_DIR}/ssl"
  if [ ! -d "${ssl_dir}" ]; then
    ssl_dir="/home/fahad/hosting/ssl"
  fi
  
  if [ -d "${ssl_dir}" ]; then
    local cert_files
    cert_files=$(find "${ssl_dir}" -name "fullchain.pem" -maxdepth 2 2>/dev/null || true)
    
    for cert in ${cert_files}; do
      local domain
      domain=$(echo "${cert}" | sed 's|/fullchain.pem||' | xargs basename 2>/dev/null || echo "unknown")
      local expiry_date
      expiry_date=$(openssl x509 -in "${cert}" -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
      
      if [ -n "${expiry_date}" ]; then
        local expiry_epoch current_epoch days_left
        expiry_epoch=$(date -d "${expiry_date}" +%s 2>/dev/null || echo 0)
        current_epoch=$(date +%s)
        days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ "${days_left}" -le "${SSL_CRITICAL_DAYS}" ]; then
          log_alert "CRITICAL: SSL cert for ${domain} expires in ${days_left} days!"
        elif [ "${days_left}" -le "${SSL_WARNING_DAYS}" ]; then
          log_alert "WARNING: SSL cert for ${domain} expires in ${days_left} days"
        fi
        
        log "SSL cert ${domain}: ${days_left} days remaining"
      fi
    done
  else
    log "SSL directory not found, skipping cert check"
  fi
  
  # Also check Let's Encrypt certs
  if [ -d /etc/letsencrypt/live ]; then
    for cert_dir in /etc/letsencrypt/live/*/; do
      local domain
      domain=$(basename "${cert_dir}")
      local cert="${cert_dir}/fullchain.pem"
      
      if [ -f "${cert}" ]; then
        local expiry_date
        expiry_date=$(openssl x509 -in "${cert}" -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
        
        if [ -n "${expiry_date}" ]; then
          local expiry_epoch current_epoch days_left
          expiry_epoch=$(date -d "${expiry_date}" +%s 2>/dev/null || echo 0)
          current_epoch=$(date +%s)
          days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
          
          if [ "${days_left}" -le "${SSL_CRITICAL_DAYS}" ]; then
            log_alert "CRITICAL: Let's Encrypt cert for ${domain} expires in ${days_left} days!"
            # Attempt auto-renewal
            certbot renew --cert-name "${domain}" --non-interactive 2>/dev/null && \
              log "Auto-renewed cert for ${domain}" || \
              log "Failed to auto-renew cert for ${domain}"
          elif [ "${days_left}" -le "${SSL_WARNING_DAYS}" ]; then
            log_alert "WARNING: Let's Encrypt cert for ${domain} expires in ${days_left} days"
          fi
        fi
      fi
    done
  fi
}

# ===================== 7. Disk Space Alerting =====================
check_disk_space() {
  log "Checking disk space..."
  
  # Root filesystem
  local disk_usage
  disk_usage=$(df / | tail -1 | awk '{print $5}' | tr -d '%' || echo 0)
  local disk_info
  disk_info=$(df -h / | tail -1 | awk '{print $2, $3, $4, $5}' || echo "unknown")
  
  if [ "${disk_usage}" -ge "${DISK_CRITICAL_PERCENT}" ]; then
    log_alert "CRITICAL: Root disk usage at ${disk_usage}% (${disk_info})"
  elif [ "${disk_usage}" -ge "${DISK_WARNING_PERCENT}" ]; then
    log_alert "WARNING: Root disk usage at ${disk_usage}% (${disk_info})"
  fi
  log "Root disk usage: ${disk_usage}% (${disk_info})"
  
  # Check hosting filesystem if different
  local hosting_dir
  hosting_dir="/home/fahad/hosting"
  if [ -d "${hosting_dir}" ]; then
    local hosting_usage
    hosting_usage=$(df "${hosting_dir}" | tail -1 | awk '{print $5}' | tr -d '%' || echo 0)
    if [ "${hosting_usage}" -ge "${DISK_CRITICAL_PERCENT}" ]; then
      log_alert "CRITICAL: Hosting disk usage at ${hosting_usage}%"
    elif [ "${hosting_usage}" -ge "${DISK_WARNING_PERCENT}" ]; then
      log_alert "WARNING: Hosting disk usage at ${hosting_usage}%"
    fi
  fi
  
  # Check /tmp
  local tmp_usage
  tmp_usage=$(df /tmp | tail -1 | awk '{print $5}' | tr -d '%' || echo 0)
  if [ "${tmp_usage}" -ge "${DISK_CRITICAL_PERCENT}" ]; then
    log_alert "CRITICAL: /tmp disk usage at ${tmp_usage}%"
    # Clean old temp files
    find /tmp -type f -mtime +1 -delete 2>/dev/null || true
  fi
}

# ===================== 8. Memory Check =====================
check_memory() {
  log "Checking memory usage..."
  
  local mem_info
  mem_info=$(free -m | head -2 || echo "unknown")
  local mem_percent
  mem_percent=$(free | awk '/Mem/{printf("%.0f"), $3/$2*100}' 2>/dev/null || echo 0)
  
  if [ "${mem_percent}" -ge "${MEMORY_CRITICAL_PERCENT}" ]; then
    log_alert "CRITICAL: Memory usage at ${mem_percent}%"
    # Clear page cache (non-destructive)
    sync && echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true
    log "Cleared page cache due to critical memory usage"
  elif [ "${mem_percent}" -ge "${MEMORY_WARNING_PERCENT}" ]; then
    log_alert "WARNING: Memory usage at ${mem_percent}%"
  fi
  log "Memory usage: ${mem_percent}%"
}

# ===================== 9. Process Health =====================
check_processes() {
  log "Checking process health..."
  
  # Check if Next.js is running
  if pgrep -f "next-server" > /dev/null 2>&1; then
    log "Next.js server is running"
  else
    log_alert "WARNING: Next.js server appears to be down"
  fi
  
  # Check if PM2 is managing processes
  if command -v pm2 &> /dev/null; then
    local pm2_status
    pm2_status=$(pm2 jlist 2>/dev/null | head -50 || echo "unknown")
    log "PM2 status: ${pm2_status}"
  fi
  
  # Check zombie processes
  local zombie_count
  zombie_count=$(ps aux | awk '{if($8=="Z") print}' | wc -l || echo 0)
  if [ "${zombie_count}" -gt 10 ]; then
    log_alert "WARNING: ${zombie_count} zombie processes detected"
  fi
}

# ===================== Main Execution =====================
main() {
  log "===== FahadCloud Monitoring Cron v2.0 Starting ====="
  
  collect_metrics
  rotate_logs
  vacuum_database
  optimize_redis
  cleanup_docker
  check_ssl_certs
  check_disk_space
  check_memory
  check_processes
  
  log "===== FahadCloud Monitoring Cron v2.0 Complete ====="
}

# Run main function
main "$@"
