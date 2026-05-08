#!/usr/bin/env bash
# ============================================
# FahadCloud - 1-Click Install Script
# ============================================
# Usage: chmod +x install.sh && ./install.sh
#
# This script installs all system dependencies,
# Node.js, sets up the database, and prepares
# the application for first run.
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        FahadCloud 1-Click Installer          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ----- Step 1: Check OS -----
echo -e "${YELLOW}[1/8] Detecting operating system...${NC}"
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$ID
    echo -e "  ${GREEN}Detected: $PRETTY_NAME${NC}"
else
    OS="unknown"
    echo -e "  ${YELLOW}Could not detect OS, proceeding anyway...${NC}"
fi

# ----- Step 2: Install Node.js -----
echo -e "${YELLOW}[2/8] Installing Node.js 20.x...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "  ${GREEN}Node.js already installed: $NODE_VERSION${NC}"
else
    echo -e "  Installing Node.js..."
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null || true
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "fedora" || "$OS" == "amzn" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - 2>/dev/null || true
        sudo yum install -y nodejs
    else
        echo -e "  ${RED}Unsupported OS. Please install Node.js 20.x manually.${NC}"
        echo -e "  Visit: https://nodejs.org/en/download/"
        exit 1
    fi
    echo -e "  ${GREEN}Node.js installed: $(node -v)${NC}"
fi

# ----- Step 3: Install npm -----
echo -e "${YELLOW}[3/8] Verifying npm...${NC}"
if command -v npm &> /dev/null; then
    echo -e "  ${GREEN}npm already installed: $(npm -v)${NC}"
else
    echo -e "  ${RED}npm not found. Please install it manually.${NC}"
    exit 1
fi

# ----- Step 4: Install PM2 -----
echo -e "${YELLOW}[4/8] Installing PM2 process manager...${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "  ${GREEN}PM2 already installed: $(pm2 -v)${NC}"
else
    sudo npm install -g pm2
    echo -e "  ${GREEN}PM2 installed successfully${NC}"
fi

# ----- Step 5: Install project dependencies -----
echo -e "${YELLOW}[5/8] Installing project dependencies (npm install)...${NC}"
npm install
echo -e "  ${GREEN}Dependencies installed${NC}"

# ----- Step 6: Setup environment file -----
echo -e "${YELLOW}[6/8] Setting up environment configuration...${NC}"
if [[ ! -f .env ]]; then
    cp .env.example .env
    echo -e "  ${GREEN}.env file created from .env.example${NC}"
    echo -e "  ${YELLOW}⚠ IMPORTANT: Edit .env with your real values before running!${NC}"
    echo -e "  ${YELLOW}  Key settings: JWT_SECRET, SMTP_USER, SMTP_PASS, SERVER_IP${NC}"
else
    echo -e "  ${GREEN}.env file already exists${NC}"
fi

# ----- Step 7: Initialize database -----
echo -e "${YELLOW}[7/8] Initializing database...${NC}"
mkdir -p db
npx prisma generate
npx prisma db push
echo -e "  ${GREEN}Database initialized${NC}"

# ----- Step 8: Build application -----
echo -e "${YELLOW}[8/8] Building application...${NC}"
npm run build
echo -e "  ${GREEN}Application built successfully${NC}"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Installation Complete!                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Edit ${BLUE}.env${NC} with your configuration"
echo -e "  2. Run: ${BLUE}./start.sh${NC} (or ${BLUE}npm run dev${NC} for development)"
echo -e "  3. Open: ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}For production with PM2:${NC}"
echo -e "  ${BLUE}pm2 start ecosystem.config.js${NC}"
echo -e "  ${BLUE}pm2 save && pm2 startup${NC}"
echo ""
