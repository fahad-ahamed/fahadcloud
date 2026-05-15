#!/usr/bin/env bash
# ============================================
# FahadCloud - 1-Click Start Script v7.0
# ============================================
# Usage: chmod +x start.sh && ./start.sh
#
# Options:
#   ./start.sh          # Start in production mode (PM2)
#   ./start.sh dev      # Start in development mode
#   ./start.sh stop     # Stop the application
#   ./start.sh restart  # Restart the application
#   ./start.sh status   # Show application status
#   ./start.sh logs     # Show live logs
#   ./start.sh build    # Rebuild and start
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

MODE="${1:-prod}"
APP_NAME="fahadcloud"
HEALTH_URL="http://localhost:3000/api/health"
MAX_HEALTH_RETRIES=30
HEALTH_RETRY_INTERVAL=2

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       FahadCloud Quick Start v7.0            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# Pre-flight Checks
# ============================================================
preflight_checks() {
    local failed=0

    # Check .env file
    if [[ ! -f .env ]]; then
        echo -e "${RED}[FAIL] .env file not found!${NC}"
        echo -e "       Run: ${BLUE}cp .env.example .env${NC} and edit it first."
        failed=1
    else
        echo -e "${GREEN}[OK]   .env file found${NC}"
    fi

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[FAIL] Node.js not installed!${NC}"
        failed=1
    else
        echo -e "${GREEN}[OK]   Node.js $(node -v)${NC}"
    fi

    # Check PostgreSQL connection
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -q 2>/dev/null; then
            echo -e "${GREEN}[OK]   PostgreSQL is running${NC}"
        else
            echo -e "${RED}[FAIL] PostgreSQL is not running!${NC}"
            echo -e "       Run: ${BLUE}sudo systemctl start postgresql${NC}"
            failed=1
        fi
    else
        echo -e "${YELLOW}[WARN] pg_isready not found — skipping PostgreSQL check${NC}"
    fi

    # Check Redis connection
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            echo -e "${GREEN}[OK]   Redis is running${NC}"
        else
            echo -e "${RED}[FAIL] Redis is not running!${NC}"
            echo -e "       Run: ${BLUE}sudo systemctl start redis-server${NC}"
            failed=1
        fi
    else
        echo -e "${YELLOW}[WARN] redis-cli not found — skipping Redis check${NC}"
    fi

    # Check node_modules
    if [[ ! -d node_modules ]]; then
        echo -e "${YELLOW}[WARN] node_modules not found. Running npm install...${NC}"
        npm install
    fi

    if [ "$failed" -eq 1 ]; then
        echo ""
        echo -e "${RED}Pre-flight checks FAILED. Fix the issues above before starting.${NC}"
        exit 1
    fi

    echo ""
}

# ============================================================
# Database Migration
# ============================================================
run_migrations() {
    echo -e "${CYAN}>>> Running database migrations...${NC}"
    npx prisma migrate deploy 2>/dev/null || npx prisma db push 2>/dev/null || {
        echo -e "${YELLOW}[WARN] Database migration had issues. Check DATABASE_URL in .env${NC}"
    }
    echo -e "${GREEN}>>> Database migrations complete.${NC}"
    echo ""
}

# ============================================================
# Health Check Verification
# ============================================================
wait_for_health() {
    echo -e "${CYAN}>>> Waiting for application to become healthy...${NC}"
    local retries=0
    while [ $retries -lt $MAX_HEALTH_RETRIES ]; do
        if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
            echo -e "${GREEN}[OK]   Application is healthy!${NC}"
            return 0
        fi
        retries=$((retries + 1))
        sleep $HEALTH_RETRY_INTERVAL
    done
    echo -e "${RED}[FAIL] Application did not become healthy within $((MAX_HEALTH_RETRIES * HEALTH_RETRY_INTERVAL))s${NC}"
    echo -e "       Check logs: ${BLUE}pm2 logs $APP_NAME${NC}"
    return 1
}

# ============================================================
# Build
# ============================================================
do_build() {
    echo -e "${CYAN}>>> Building application...${NC}"
    npm run build

    echo -e "${CYAN}>>> Copying static files for standalone...${NC}"
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/static
    cp -r public .next/standalone/public
    cp -r prisma .next/standalone/ 2>/dev/null || true

    echo -e "${GREEN}>>> Build complete.${NC}"
    echo ""
}

# ============================================================
# Main Logic
# ============================================================
case "$MODE" in
    dev)
        # Check .env
        if [[ ! -f .env ]]; then
            echo -e "${RED}Error: .env file not found!${NC}"
            echo -e "  Run: ${BLUE}cp .env.example .env${NC} and edit it first."
            exit 1
        fi

        echo -e "${GREEN}Starting in DEVELOPMENT mode...${NC}"
        echo -e "  URL: ${BLUE}http://localhost:3000${NC}"
        echo -e "  Press Ctrl+C to stop"
        echo ""
        npm run dev
        ;;

    prod|start)
        echo -e "${CYAN}Running pre-flight checks...${NC}"
        preflight_checks

        # Check if built
        if [[ ! -d .next/standalone ]]; then
            echo -e "${YELLOW}Build not found. Building first...${NC}"
            do_build
        fi

        # Run migrations
        run_migrations

        echo -e "${GREEN}Starting in PRODUCTION mode with PM2...${NC}"

        # Stop existing if running
        pm2 delete $APP_NAME 2>/dev/null || true

        # Start with PM2
        pm2 start ecosystem.config.js

        # Wait for health check
        if wait_for_health; then
            echo ""
            echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║       FahadCloud is running!                 ║${NC}"
            echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
            echo -e "  URL:    ${BLUE}http://localhost:3000${NC}"
            echo -e "  Status: ${BLUE}./start.sh status${NC}"
            echo -e "  Logs:   ${BLUE}./start.sh logs${NC}"
            echo -e "  Stop:   ${BLUE}./start.sh stop${NC}"
        else
            echo ""
            echo -e "${RED}Application started but health check failed.${NC}"
            echo -e "  Check logs: ${BLUE}pm2 logs $APP_NAME${NC}"
            echo -e "  Check PM2:  ${BLUE}pm2 status${NC}"
        fi
        ;;

    stop)
        echo -e "${YELLOW}Stopping FahadCloud...${NC}"
        pm2 stop $APP_NAME 2>/dev/null || true
        echo -e "${GREEN}Stopped.${NC}"
        ;;

    restart)
        echo -e "${YELLOW}Restarting FahadCloud...${NC}"
        pm2 restart $APP_NAME 2>/dev/null || ./start.sh prod
        if wait_for_health; then
            echo -e "${GREEN}Restarted successfully.${NC}"
        else
            echo -e "${RED}Restarted but health check failed. Check logs.${NC}"
        fi
        ;;

    status)
        pm2 status
        echo ""
        # Quick health check
        if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
            echo -e "Health: ${GREEN}HEALTHY${NC}"
        else
            echo -e "Health: ${RED}UNHEALTHY${NC}"
        fi
        ;;

    logs)
        pm2 logs $APP_NAME
        ;;

    build)
        echo -e "${YELLOW}Rebuilding application...${NC}"
        do_build
        echo -e "${GREEN}Build complete. Starting...${NC}"
        ./start.sh prod
        ;;

    migrate)
        echo -e "${CYAN}Running database migrations only...${NC}"
        run_migrations
        ;;

    health)
        if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
            echo -e "${GREEN}HEALTHY${NC} — Application is responding"
            curl -s "$HEALTH_URL" | jq . 2>/dev/null || curl -s "$HEALTH_URL"
        else
            echo -e "${RED}UNHEALTHY${NC} — Application is not responding"
        fi
        ;;

    *)
        echo -e "${YELLOW}Usage: ./start.sh [command]${NC}"
        echo ""
        echo "  dev      - Start in development mode (hot reload)"
        echo "  prod     - Start in production mode with PM2 (default)"
        echo "  stop     - Stop the application"
        echo "  restart  - Restart the application"
        echo "  status   - Show PM2 process status + health"
        echo "  logs     - Show live application logs"
        echo "  build    - Rebuild and start in production"
        echo "  migrate  - Run database migrations only"
        echo "  health   - Check application health endpoint"
        ;;
esac
