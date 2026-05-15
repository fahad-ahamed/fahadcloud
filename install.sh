#!/bin/bash
set -e
echo "FahadCloud VPS Installer v7.0"
echo "================================="

# ============================================================
# 1. SYSTEM UPDATE & BASE PACKAGES
# ============================================================
echo ">>> Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y \
    curl wget git unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release \
    build-essential python3 python3-pip \
    logrotate cron htop jq

# ============================================================
# 2. KERNEL PARAMETER TUNING (sysctl)
# ============================================================
echo ">>> Tuning kernel parameters..."
if ! grep -q "fahadcloud-tuning" /etc/sysctl.conf 2>/dev/null; then
    cat <<'EOF' | sudo tee -a /etc/sysctl.conf
# === FahadCloud Performance Tuning ===
# Increase file descriptor limits
fs.file-max=65535
# TCP buffer sizes (min/default/max)
net.core.rmem_max=16777216
net.core.wmem_max=16777216
net.core.rmem_default=262144
net.core.wmem_default=262144
net.ipv4.tcp_rmem=4096 87380 16777216
net.ipv4.tcp_wmem=4096 65536 16777216
# TCP connection optimization
net.ipv4.tcp_tw_reuse=1
net.ipv4.tcp_fin_timeout=15
net.ipv4.tcp_keepalive_time=300
net.ipv4.tcp_keepalive_intvl=30
net.ipv4.tcp_keepalive_probes=5
net.ipv4.tcp_max_syn_backlog=8192
net.core.somaxconn=65535
net.core.netdev_max_backlog=8192
# Connection tracking
net.netfilter.nf_conntrack_max=131072
net.netfilter.nf_conntrack_tcp_timeout_established=86400
# Swap tuning (prefer RAM)
vm.swappiness=10
vm.dirty_ratio=15
vm.dirty_background_ratio=5
# Allow port range for ephemeral ports
net.ipv4.ip_local_port_range=1024 65535
EOF
    sudo sysctl -p
fi

# ============================================================
# 3. FILE DESCRIPTOR LIMITS
# ============================================================
echo ">>> Setting file descriptor limits..."
if ! grep -q "fahadcloud-nofile" /etc/security/limits.conf 2>/dev/null; then
    cat <<'EOF' | sudo tee -a /etc/security/limits.conf
# === FahadCloud File Descriptor Limits ===
* soft nofile 65535
* hard nofile 65535
root soft nofile 65535
root hard nofile 65535
EOF
fi

# ============================================================
# 4. Node.js 20 LTS
# ============================================================
if ! command -v node &> /dev/null; then
    echo ">>> Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
elif [[ "$(node -v)" != v20* ]]; then
    echo ">>> Node.js 20 required (current: $(node -v)). Upgrading..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

# ============================================================
# 5. PostgreSQL 16
# ============================================================
if ! command -v psql &> /dev/null; then
    echo ">>> Installing PostgreSQL 16..."
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi

# PostgreSQL Tuning
echo ">>> Tuning PostgreSQL..."
PG_CONF="/etc/postgresql/$(pg_config --version | awk '{print $2}' | cut -d. -f1)/main/postgresql.conf"
if [ -f "$PG_CONF" ] && ! grep -q "fahadcloud-tuning" "$PG_CONF" 2>/dev/null; then
    # Get system memory in KB
    TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    SHARED_BUFFERS=$((TOTAL_MEM_KB / 4))  # 25% of RAM
    EFFECTIVE_CACHE=$((TOTAL_MEM_KB * 3 / 4))  # 75% of RAM
    WORK_MEM=$((TOTAL_MEM_KB / 256))  # ~0.4% of RAM per operation

    # Cap shared_buffers at 4GB (in kB)
    if [ "$SHARED_BUFFERS" -gt 4194304 ]; then
        SHARED_BUFFERS=4194304
    fi
    # Cap work_mem at 64MB
    if [ "$WORK_MEM" -gt 65536 ]; then
        WORK_MEM=65536
    fi

    # Convert KB to human-readable
    SHARED_BUFFERS_MB=$((SHARED_BUFFERS / 1024))
    EFFECTIVE_CACHE_MB=$((EFFECTIVE_CACHE / 1024))
    WORK_MEM_MB=$((WORK_MEM / 1024))

    cat <<EOF | sudo tee -a "$PG_CONF"

# === FahadCloud PostgreSQL Tuning ===
shared_buffers = ${SHARED_BUFFERS_MB}MB
effective_cache_size = ${EFFECTIVE_CACHE_MB}MB
work_mem = ${WORK_MEM_MB}MB
maintenance_work_mem = 256MB
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
max_connections = 100
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = $(nproc)
max_parallel_workers_per_gather = $(( $(nproc) / 2 > 4 ? 4 : $(nproc) / 2 ))
max_parallel_workers = $(nproc)
EOF
    sudo systemctl restart postgresql
    echo "PostgreSQL tuned: shared_buffers=${SHARED_BUFFERS_MB}MB, effective_cache=${EFFECTIVE_CACHE_MB}MB, work_mem=${WORK_MEM_MB}MB"
fi

# ============================================================
# 6. Redis
# ============================================================
if ! command -v redis-server &> /dev/null; then
    echo ">>> Installing Redis..."
    sudo apt-get install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
fi

# Redis Persistence & Memory Optimization
REDIS_CONF="/etc/redis/redis.conf"
if [ -f "$REDIS_CONF" ] && ! grep -q "fahadcloud-tuning" "$REDIS_CONF" 2>/dev/null; then
    TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    REDIS_MAX_MEM=$((TOTAL_MEM_KB / 4 / 1024))  # 25% of RAM in MB
    if [ "$REDIS_MAX_MEM" -gt 1024 ]; then
        REDIS_MAX_MEM=1024  # Cap at 1GB
    fi

    cat <<EOF | sudo tee -a "$REDIS_CONF"

# === FahadCloud Redis Tuning ===
maxmemory ${REDIS_MAX_MEM}mb
maxmemory-policy allkeys-lru
# AOF persistence for durability
appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
# RDB snapshots for backup
save 900 1
save 300 10
save 60 10000
# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
EOF
    sudo systemctl restart redis-server
    echo "Redis tuned: maxmemory=${REDIS_MAX_MEM}MB with AOF persistence"
fi

# ============================================================
# 7. Nginx + Brotli Module
# ============================================================
if ! command -v nginx &> /dev/null; then
    echo ">>> Installing Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
fi

# Install Brotli nginx module if available
echo ">>> Installing Nginx Brotli module..."
if dpkg -l | grep -q libnginx-mod-http-brotli 2>/dev/null; then
    echo "Brotli module already installed."
else
    sudo apt-get install -y libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static 2>/dev/null || {
        echo "Brotli module not available in repos. Gzip will be used as fallback."
        echo "For Brotli support, compile nginx with ngx_brotli module manually."
    }
fi

# ============================================================
# 8. Certbot (Let's Encrypt)
# ============================================================
if ! command -v certbot &> /dev/null; then
    echo ">>> Installing Certbot for SSL..."
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# ============================================================
# 9. Docker Installation (for hosting engine)
# ============================================================
if ! command -v docker &> /dev/null; then
    echo ">>> Installing Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker fahad 2>/dev/null || true
    echo "Docker installed successfully."
else
    echo "Docker already installed: $(docker --version)"
fi

# ============================================================
# 10. Qdrant Vector Database
# ============================================================
echo ">>> Setting up Qdrant vector database..."
if ! docker ps --format '{{.Names}}' | grep -q "qdrant" 2>/dev/null; then
    docker run -d \
        --name qdrant \
        --restart unless-stopped \
        -p 6333:6333 \
        -p 6334:6334 \
        -v /opt/qdrant/storage:/qdrant/storage \
        qdrant/qdrant:latest 2>/dev/null || {
        echo "Qdrant setup via Docker failed. Install manually or via docker-compose."
    }
fi

# ============================================================
# 11. dnsmasq (for DNS engine)
# ============================================================
if ! command -v dnsmasq &> /dev/null; then
    echo ">>> Installing dnsmasq for DNS engine..."
    sudo apt-get install -y dnsmasq
    # Don't start dnsmasq automatically — it's controlled by the app
    sudo systemctl stop dnsmasq 2>/dev/null || true
    sudo systemctl disable dnsmasq 2>/dev/null || true
fi

# ============================================================
# 12. UFW Firewall
# ============================================================
echo ">>> Configuring UFW firewall..."
if ! command -v ufw &> /dev/null; then
    sudo apt-get install -y ufw
fi
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 5432/tcp   # PostgreSQL (external)
sudo ufw deny 6379/tcp   # Redis (external)
sudo ufw deny 3000/tcp   # App (external — proxied through nginx)

# ============================================================
# 13. Fail2ban (SSH Protection)
# ============================================================
echo ">>> Installing fail2ban for SSH protection..."
if ! command -v fail2ban-server &> /dev/null; then
    sudo apt-get install -y fail2ban
fi
if [ ! -f /etc/fail2ban/jail.local ]; then
    cat <<'EOF' | sudo tee /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = root@localhost
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
EOF
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
fi

# ============================================================
# 14. Automatic Security Updates
# ============================================================
echo ">>> Configuring automatic security updates..."
if ! dpkg -l | grep -q unattended-upgrades 2>/dev/null; then
    sudo apt-get install -y unattended-upgrades
fi
sudo dpkg-reconfigure -plow unattended-upgrades 2>/dev/null || true

# ============================================================
# 15. Swap Configuration (based on system memory)
# ============================================================
TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
if [ ! -f /swapfile ]; then
    if [ "$TOTAL_MEM" -lt 1048576 ]; then
        # < 1GB RAM: 2GB swap
        SWAP_SIZE="2G"
    elif [ "$TOTAL_MEM" -lt 2097152 ]; then
        # < 2GB RAM: 2GB swap
        SWAP_SIZE="2G"
    elif [ "$TOTAL_MEM" -lt 4194304 ]; then
        # < 4GB RAM: 4GB swap
        SWAP_SIZE="4G"
    else
        # >= 4GB RAM: equal to RAM up to 8GB
        SWAP_SIZE_MB=$((TOTAL_MEM / 1024))
        if [ "$SWAP_SIZE_MB" -gt 8192 ]; then
            SWAP_SIZE_MB=8192
        fi
        SWAP_SIZE="${SWAP_SIZE_MB}M"
    fi
    echo ">>> Configuring ${SWAP_SIZE} swap (system has $((TOTAL_MEM / 1024))MB RAM)..."
    sudo fallocate -l "$SWAP_SIZE" /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
fi

# ============================================================
# 16. Directory Structure
# ============================================================
echo ">>> Creating directory structure..."
mkdir -p logs backups hosting/users hosting/ssl hosting/nginx dns/zones dns/config tmp scripts
sudo mkdir -p /var/www/certbot
sudo mkdir -p /var/cache/nginx/fahadcloud
sudo chown -R www-data:www-data /var/cache/nginx/fahadcloud
sudo mkdir -p /opt/qdrant/storage

# ============================================================
# 17. Application Setup
# ============================================================
echo ">>> Installing dependencies..."
npm install

if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "IMPORTANT: Edit .env with your production credentials before proceeding!"
    echo "  - JWT_SECRET: Generate a strong random string (at least 64 characters)"
    echo "  - DATABASE_URL: Set your PostgreSQL connection string"
    echo "  - SMTP_USER/SMTP_PASS: Set your email credentials"
    echo "  - SERVER_IP: Set your server's public IP"
    exit 1
fi

# Validate required env vars
if grep -q "change-this-to-a-very-long-random-string" .env; then
    echo "ERROR: JWT_SECRET not configured! Edit .env before running install."
    exit 1
fi

echo ">>> Setting up database..."
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo ">>> Building application..."
npm run build

echo ">>> Copying static files..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp -r prisma .next/standalone/ 2>/dev/null || true

# ============================================================
# 18. PM2
# ============================================================
if ! command -v pm2 &> /dev/null; then
    echo ">>> Installing PM2..."
    sudo npm install -g pm2
fi

# Install PM2 log rotation module
pm2 install pm2-logrotate 2>/dev/null || true
pm2 set pm2-logrotate:max_size 50M 2>/dev/null || true
pm2 set pm2-logrotate:retain 14 2>/dev/null || true
pm2 set pm2-logrotate:compress true 2>/dev/null || true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss 2>/dev/null || true

echo ">>> Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup 2>/dev/null || true

# ============================================================
# 19. Nginx Configuration
# ============================================================
echo ">>> Configuring Nginx..."
if [ ! -f /etc/nginx/sites-available/fahadcloud ]; then
    sudo cp nginx.conf /etc/nginx/sites-available/fahadcloud
    sudo ln -sf /etc/nginx/sites-available/fahadcloud /etc/nginx/sites-enabled/fahadcloud
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
fi

# ============================================================
# 20. SSL Certificate Setup
# ============================================================
echo ">>> Setting up SSL certificate..."
SERVER_DOMAIN=$(grep -oP 'SERVER_IP=\K.*' .env 2>/dev/null || echo "")
if [ -n "$SERVER_DOMAIN" ] && [ "$SERVER_DOMAIN" != "localhost" ] && [ "$SERVER_DOMAIN" != "127.0.0.1" ]; then
    echo "Attempting automatic SSL setup for $SERVER_DOMAIN..."
    sudo certbot --nginx -d "$SERVER_DOMAIN" -d "www.$SERVER_DOMAIN" --non-interactive --agree-tos --email "admin@$SERVER_DOMAIN" --redirect 2>/dev/null || {
        echo "Automatic SSL failed. Run manually: sudo certbot --nginx -d yourdomain.com"
    }
else
    echo "No domain configured. Set SERVER_IP in .env to your domain, then run:"
    echo "  sudo certbot --nginx -d yourdomain.com"
fi

# ============================================================
# 21. Cron Jobs (SSL renew, DB backup, monitoring)
# ============================================================
echo ">>> Setting up cron jobs..."

# SSL auto-renewal
CRON_SSL="0 0,12 * * * $(pwd)/scripts/ssl-auto-renew.sh >> $(pwd)/logs/ssl-renew.log 2>&1"
# Database backup
CRON_BACKUP="0 2 * * * $(pwd)/scripts/db-backup.sh >> $(pwd)/logs/db-backup.log 2>&1"
# Monitoring cron (existing)
CRON_MONITOR="*/5 * * * * cd $(pwd) && node scripts/monitoring-cron.js 2>/dev/null || true"

(crontab -l 2>/dev/null | grep -v "ssl-auto-renew\|db-backup\|monitoring-cron"; echo "$CRON_SSL"; echo "$CRON_BACKUP"; echo "$CRON_MONITOR") | crontab -

# Make scripts executable
chmod +x scripts/*.sh 2>/dev/null || true

# ============================================================
# 22. Log Rotation
# ============================================================
echo ">>> Setting up log rotation..."
sudo cp logrotate.conf /etc/logrotate.d/fahadcloud 2>/dev/null || true

# ============================================================
# 23. Final Status
# ============================================================
echo ""
echo "================================="
echo "FahadCloud v7.0 Installation Complete!"
echo "================================="
echo "App:       http://localhost:3000"
echo "Nginx:     https://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"
echo ""
echo "Services installed:"
echo "  ✓ Node.js $(node -v)"
echo "  ✓ PostgreSQL $(psql --version | head -1)"
echo "  ✓ Redis $(redis-server --version | head -1)"
echo "  ✓ Nginx $(nginx -v 2>&1)"
echo "  ✓ Docker $(docker --version 2>/dev/null || echo 'N/A')"
echo "  ✓ Certbot $(certbot --version 2>/dev/null || echo 'N/A')"
echo "  ✓ fail2ban $(fail2ban-server --version 2>/dev/null || echo 'N/A')"
echo "  ✓ dnsmasq $(dnsmasq --version 2>/dev/null | head -1 || echo 'N/A')"
echo ""
echo "Cron jobs configured:"
echo "  ✓ SSL auto-renewal (twice daily)"
echo "  ✓ Database backup (daily at 2 AM)"
echo "  ✓ Monitoring (every 5 minutes)"
echo ""
echo "Security:"
echo "  ✓ UFW firewall enabled"
echo "  ✓ fail2ban SSH protection"
echo "  ✓ Automatic security updates"
echo "  ✓ File descriptor limits set"
echo "  ✓ Kernel parameters tuned"
echo ""
echo "Next steps:"
echo "  1. Verify SSL: sudo certbot certificates"
echo "  2. Review .env: Ensure all production values are set correctly"
echo "  3. Configure DNS: Point your domain to this server's IP"
echo "  4. Test backup: ./scripts/db-backup.sh"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View application logs"
echo "  sudo nginx -t       - Test nginx configuration"
echo "  sudo certbot renew  - Renew SSL certificates"
echo "  sudo fail2ban-status - Check SSH protection"
