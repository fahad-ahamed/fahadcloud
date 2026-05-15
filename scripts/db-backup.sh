#!/usr/bin/env bash
# ============================================
# FahadCloud Database Backup Script
# ============================================
# Runs via cron daily at 2 AM
# Retention: 7 daily, 4 weekly, 3 monthly
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_FILE="${PROJECT_DIR}/logs/db-backup.log"
DB_NAME="${FAHADCLOUD_DB:-fahadcloud}"
DB_USER="${FAHADCLOUD_DB_USER:-fahadcloud}"
DB_HOST="${FAHADCLOUD_DB_HOST:-localhost}"

# Ensure directories exist
mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" "$BACKUP_DIR/monthly"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Get current date components
DATE_DAY=$(date +%Y%m%d)
DATE_WEEK=$(date +%Y_W%V)
DATE_MONTH=$(date +%Y%m)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    log "ERROR: pg_dump not found. Is PostgreSQL installed?"
    exit 1
fi

log "Starting database backup for '${DB_NAME}'..."

# ============================================================
# Daily Backup
# ============================================================
DAILY_FILE="${BACKUP_DIR}/daily/fahadcloud_daily_${TIMESTAMP}.sql.gz"
if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges 2>> "$LOG_FILE" | gzip > "$DAILY_FILE"; then
    SIZE=$(du -h "$DAILY_FILE" | cut -f1)
    log "Daily backup created: ${DAILY_FILE} (${SIZE})"
else
    log "ERROR: Daily backup failed!"
    rm -f "$DAILY_FILE" 2>/dev/null
    exit 1
fi

# ============================================================
# Weekly Backup (on Mondays)
# ============================================================
if [ "$(date +%u)" -eq 1 ]; then
    WEEKLY_FILE="${BACKUP_DIR}/weekly/fahadcloud_weekly_${DATE_WEEK}.sql.gz"
    cp "$DAILY_FILE" "$WEEKLY_FILE"
    log "Weekly backup created: ${WEEKLY_FILE}"
fi

# ============================================================
# Monthly Backup (on 1st of month)
# ============================================================
if [ "$(date +%d)" -eq 01 ]; then
    MONTHLY_FILE="${BACKUP_DIR}/monthly/fahadcloud_monthly_${DATE_MONTH}.sql.gz"
    cp "$DAILY_FILE" "$MONTHLY_FILE"
    log "Monthly backup created: ${MONTHLY_FILE}"
fi

# ============================================================
# Retention Policy
# ============================================================
log "Applying retention policy..."

# Keep last 7 daily backups
DAILY_COUNT=$(find "${BACKUP_DIR}/daily" -name "fahadcloud_daily_*.sql.gz" | wc -l)
if [ "$DAILY_COUNT" -gt 7 ]; then
    DELETED=$(find "${BACKUP_DIR}/daily" -name "fahadcloud_daily_*.sql.gz" -type f | sort | head -n -7 | wc -l)
    find "${BACKUP_DIR}/daily" -name "fahadcloud_daily_*.sql.gz" -type f | sort | head -n -7 -delete
    log "Deleted ${DELETED} old daily backup(s). Kept last 7."
fi

# Keep last 4 weekly backups
WEEKLY_COUNT=$(find "${BACKUP_DIR}/weekly" -name "fahadcloud_weekly_*.sql.gz" | wc -l)
if [ "$WEEKLY_COUNT" -gt 4 ]; then
    DELETED=$(find "${BACKUP_DIR}/weekly" -name "fahadcloud_weekly_*.sql.gz" -type f | sort | head -n -4 | wc -l)
    find "${BACKUP_DIR}/weekly" -name "fahadcloud_weekly_*.sql.gz" -type f | sort | head -n -4 -delete
    log "Deleted ${DELETED} old weekly backup(s). Kept last 4."
fi

# Keep last 3 monthly backups
MONTHLY_COUNT=$(find "${BACKUP_DIR}/monthly" -name "fahadcloud_monthly_*.sql.gz" | wc -l)
if [ "$MONTHLY_COUNT" -gt 3 ]; then
    DELETED=$(find "${BACKUP_DIR}/monthly" -name "fahadcloud_monthly_*.sql.gz" -type f | sort | head -n -3 | wc -l)
    find "${BACKUP_DIR}/monthly" -name "fahadcloud_monthly_*.sql.gz" -type f | sort | head -n -3 -delete
    log "Deleted ${DELETED} old monthly backup(s). Kept last 3."
fi

# ============================================================
# Summary
# ============================================================
DAILY_COUNT=$(find "${BACKUP_DIR}/daily" -name "*.sql.gz" | wc -l)
WEEKLY_COUNT=$(find "${BACKUP_DIR}/weekly" -name "*.sql.gz" | wc -l)
MONTHLY_COUNT=$(find "${BACKUP_DIR}/monthly" -name "*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "Backup complete. Daily: ${DAILY_COUNT}, Weekly: ${WEEKLY_COUNT}, Monthly: ${MONTHLY_COUNT}. Total: ${TOTAL_SIZE}"
