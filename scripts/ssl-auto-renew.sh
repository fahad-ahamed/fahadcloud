#!/usr/bin/env bash
# ============================================
# FahadCloud SSL Auto-Renewal Script
# ============================================
# Runs via cron twice daily (0 0,12 * * *)
# Checks and renews Let's Encrypt SSL certificates
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_DIR}/logs/ssl-renew.log"
NOTIFY_EMAIL="${NOTIFY_EMAIL:-}"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    log "ERROR: certbot not found. Install with: sudo apt-get install certbot"
    exit 1
fi

# Attempt certificate renewal
log "Starting SSL certificate renewal check..."
RENEW_OUTPUT=$(sudo certbot renew --quiet --non-interactive 2>&1)
RENEW_EXIT=$?

if [ $RENEW_EXIT -eq 0 ]; then
    # Check if any certificates were actually renewed
    if echo "$RENEW_OUTPUT" | grep -q "renewed"; then
        log "SUCCESS: Certificate(s) renewed."
        
        # Reload nginx to pick up new certificates
        log "Reloading nginx..."
        if sudo nginx -t 2>/dev/null; then
            sudo systemctl reload nginx
            log "Nginx reloaded successfully."
        else
            log "ERROR: nginx config test failed after renewal. Manual intervention required."
            if [ -n "$NOTIFY_EMAIL" ]; then
                echo "FahadCloud SSL renewal: nginx reload failed after cert renewal." | mail -s "SSL Renewal Alert" "$NOTIFY_EMAIL" 2>/dev/null || true
            fi
            exit 1
        fi

        # Also restart PM2 app if using SSL in Node.js
        if command -v pm2 &> /dev/null; then
            pm2 reload fahadcloud 2>/dev/null || true
            log "PM2 application reloaded."
        fi
    else
        log "No certificates due for renewal."
    fi
else
    log "ERROR: certbot renew failed with exit code $RENEW_EXIT"
    log "Output: $RENEW_OUTPUT"
    
    # Send notification if email configured
    if [ -n "$NOTIFY_EMAIL" ]; then
        {
            echo "FahadCloud SSL Auto-Renewal Failed"
            echo ""
            echo "Exit code: $RENEW_EXIT"
            echo "Output:"
            echo "$RENEW_OUTPUT"
        } | mail -s "FahadCloud SSL Renewal Failed" "$NOTIFY_EMAIL" 2>/dev/null || true
    fi
    
    exit 1
fi

log "SSL renewal check complete."
