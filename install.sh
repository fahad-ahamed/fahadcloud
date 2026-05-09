#!/usr/bin/env bash
# ============================================
# FahadCloud - 1-Click Installer
# ============================================
# Usage: curl -fsSL https://raw.githubusercontent.com/fahad-ahamed/fahadcloud/main/install.sh | bash
# Or:   chmod +x install.sh && ./install.sh
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     FahadCloud 1-Click Installer v4.0.0     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}Running as root. Creating fahad user...${NC}"
    if ! id -u fahad &>/dev/null; then
        useradd -m -s /bin/bash fahad
        echo "fahad:fahad" | chpasswd
        usermod -aG sudo fahad 2>/dev/null || true
    fi
    cd /home/fahad
    SUDO_USER=fahad
else
    SUDO_USER=$(whoami)
    cd ~
fi

INSTALL_DIR="$HOME/fahadcloud"

# 1. Install Node.js if needed
echo -e "${BLUE}[1/7] Checking Node.js...${NC}"
if ! command -v node &>/dev/null; then
    echo -e "${YELLOW}Installing Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null || true
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}Node.js $(node -v) installed${NC}"

# 2. Install PM2 if needed
echo -e "${BLUE}[2/7] Checking PM2...${NC}"
if ! command -v pm2 &>/dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    sudo npm install -g pm2
fi
echo -e "${GREEN}PM2 installed${NC}"

# 3. Clone repository
echo -e "${BLUE}[3/7] Cloning FahadCloud...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Existing installation found. Updating...${NC}"
    cd "$INSTALL_DIR"
    git pull origin main 2>/dev/null || true
else
    git clone https://github.com/fahad-ahamed/fahadcloud.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
echo -e "${GREEN}Repository ready${NC}"

# 4. Install dependencies
echo -e "${BLUE}[4/7] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}Dependencies installed${NC}"

# 5. Configure environment
echo -e "${BLUE}[5/7] Configuring environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Prompt for SMTP settings
    echo ""
    echo -e "${YELLOW}SMTP Configuration (press Enter for defaults):${NC}"
    read -p "Gmail address [fahadcloud24@gmail.com]: " SMTP_EMAIL
    SMTP_EMAIL=${SMTP_EMAIL:-fahadcloud24@gmail.com}
    
    read -p "Gmail app password: " SMTP_PASS
    if [ -z "$SMTP_PASS" ]; then
        echo -e "${RED}Warning: No SMTP password set. Email features will not work.${NC}"
        SMTP_PASS="change-me"
    fi
    
    read -p "Server IP address: " SERVER_IP
    SERVER_IP=${SERVER_IP:-$(curl -s ifconfig.me 2>/dev/null || echo "localhost")}
    
    # Generate a secure JWT secret
    JWT_SECRET="fc-$(openssl rand -hex 24 2>/dev/null || echo "secret-$(date +%s)")"
    
    # Write .env
    cat > .env << ENVFILE
DATABASE_URL="file:$INSTALL_DIR/db/fahadcloud.db"
JWT_SECRET=$JWT_SECRET
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=$SMTP_EMAIL
SMTP_PASS=$SMTP_PASS
SMTP_FROM_NAME=FahadCloud
SMTP_FROM_EMAIL=$SMTP_EMAIL
OWNER_EMAIL=$SMTP_EMAIL
SERVER_IP=$SERVER_IP
ENVFILE
    
    echo -e "${GREEN}.env configured${NC}"
else
    echo -e "${GREEN}Existing .env found, keeping it${NC}"
fi

# 6. Initialize database
echo -e "${BLUE}[6/7] Initializing database...${NC}"
npx prisma db push
npx prisma generate

# Seed data
if [ -f seed-prod.js ]; then
    node seed-prod.js
fi
echo -e "${GREEN}Database ready${NC}"

# 7. Build and start
echo -e "${BLUE}[7/7] Building and starting...${NC}"
npm run build

# Start with PM2
pm2 delete fahadcloud 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   FahadCloud is now running!                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  URL: ${BLUE}http://$(curl -s ifconfig.me 2>/dev/null || echo 'localhost'):3000${NC}"
echo -e "  Admin: ${BLUE}Login with your OWNER_EMAIL${NC}"
echo -e "  Status: ${BLUE}pm2 status${NC}"
echo -e "  Logs: ${BLUE}pm2 logs fahadcloud${NC}"
echo -e "  Stop: ${BLUE}pm2 stop fahadcloud${NC}"
echo -e "  Restart: ${BLUE}pm2 restart fahadcloud${NC}"
echo ""
echo -e "${YELLOW}Important: Change the admin password after first login!${NC}"
echo ""

