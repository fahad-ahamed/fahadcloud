#!/usr/bin/env bash
# ============================================
# FahadCloud - 1-Click Start Script
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
NC='\033[0m'

MODE="${1:-prod}"
APP_NAME="fahadcloud"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         FahadCloud Quick Start               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [[ ! -f .env ]]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "  Run: ${BLUE}cp .env.example .env${NC} and edit it first."
    exit 1
fi

# Check if node_modules exists
if [[ ! -d node_modules ]]; then
    echo -e "${YELLOW}Dependencies not found. Running install first...${NC}"
    npm install
fi

case "$MODE" in
    dev)
        echo -e "${GREEN}Starting in DEVELOPMENT mode...${NC}"
        echo -e "  URL: ${BLUE}http://localhost:3000${NC}"
        echo -e "  Press Ctrl+C to stop"
        echo ""
        npm run dev
        ;;

    prod|start)
        # Check if built
        if [[ ! -d .next/standalone ]]; then
            echo -e "${YELLOW}Build not found. Building first...${NC}"
            npm run build
        fi

        echo -e "${GREEN}Starting in PRODUCTION mode with PM2...${NC}"

        # Stop existing if running
        pm2 delete $APP_NAME 2>/dev/null || true

        # Start with PM2
        pm2 start ecosystem.config.js

        echo ""
        echo -e "${GREEN}FahadCloud is running!${NC}"
        echo -e "  URL: ${BLUE}http://localhost:3000${NC}"
        echo -e "  Status: ${BLUE}./start.sh status${NC}"
        echo -e "  Logs: ${BLUE}./start.sh logs${NC}"
        echo -e "  Stop: ${BLUE}./start.sh stop${NC}"
        ;;

    stop)
        echo -e "${YELLOW}Stopping FahadCloud...${NC}"
        pm2 stop $APP_NAME 2>/dev/null || true
        echo -e "${GREEN}Stopped.${NC}"
        ;;

    restart)
        echo -e "${YELLOW}Restarting FahadCloud...${NC}"
        pm2 restart $APP_NAME 2>/dev/null || ./start.sh prod
        echo -e "${GREEN}Restarted.${NC}"
        ;;

    status)
        pm2 status
        ;;

    logs)
        pm2 logs $APP_NAME
        ;;

    build)
        echo -e "${YELLOW}Rebuilding application...${NC}"
        npm run build
        echo -e "${GREEN}Build complete. Starting...${NC}"
        ./start.sh prod
        ;;

    *)
        echo -e "${YELLOW}Usage: ./start.sh [dev|prod|stop|restart|status|logs|build]${NC}"
        echo ""
        echo "  dev      - Start in development mode (hot reload)"
        echo "  prod     - Start in production mode with PM2 (default)"
        echo "  stop     - Stop the application"
        echo "  restart  - Restart the application"
        echo "  status   - Show PM2 process status"
        echo "  logs     - Show live application logs"
        echo "  build    - Rebuild and start in production"
        ;;
esac
