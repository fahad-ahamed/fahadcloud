#!/bin/bash
set -e
echo "FahadCloud VPS Installer v6.0"
echo "================================="

# ---------- System Update ----------
echo "Updating system packages..."
sudo apt-get update -y

# ---------- Node.js 20 LTS ----------
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
elif [[ "$(node -v)" != v20* ]]; then
    echo "Node.js 20 required (current: $(node -v)). Upgrading..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

# ---------- PostgreSQL 16 ----------
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL 16..."
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi

# ---------- Redis ----------
if ! command -v redis-server &> /dev/null; then
    echo "Installing Redis..."
    sudo apt-get install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
fi

# ---------- Nginx ----------
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
fi

# ---------- Certbot (Let's Encrypt) ----------
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot for SSL..."
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# ---------- UFW Firewall ----------
echo "Configuring UFW firewall..."
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

# ---------- Swap Configuration ----------
TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
if [ "$TOTAL_MEM" -lt 2097152 ] && [ ! -f /swapfile ]; then
    echo "Configuring 2GB swap (low memory system detected)..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
fi

# ---------- Application Setup ----------
echo "Installing dependencies..."
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

echo "Setting up database..."
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo "Building application..."
npm run build

echo "Copying static files..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp -r prisma .next/standalone/ 2>/dev/null || true

# ---------- PM2 ----------
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

echo "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup 2>/dev/null || true

# ---------- Nginx Configuration ----------
echo "Configuring Nginx..."
if [ ! -f /etc/nginx/sites-available/fahadcloud ]; then
    sudo cp nginx.conf /etc/nginx/sites-available/fahadcloud
    sudo ln -sf /etc/nginx/sites-available/fahadcloud /etc/nginx/sites-enabled/fahadcloud
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
fi

# ---------- Database Backup Cron ----------
echo "Setting up database backup cron..."
BACKUP_CRON="0 2 * * * cd $(pwd) && PGPASSWORD=\$(grep DATABASE_URL .env | sed 's|.*:||;s|@.*||') pg_dump -h localhost -U fahadcloud fahadcloud | gzip > backups/daily-\$(date +\\%Y\\%m\\%d).sql.gz 2>/dev/null || true"
(crontab -l 2>/dev/null | grep -v "pg_dump.*fahadcloud"; echo "$BACKUP_CRON") | crontab -

# ---------- Log Rotation ----------
echo "Setting up log rotation..."
sudo cp logrotate.conf /etc/logrotate.d/fahadcloud 2>/dev/null || true

echo ""
echo "================================="
echo "FahadCloud is running!"
echo "================================="
echo "App:       http://localhost:3000"
echo "Nginx:     http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"
echo ""
echo "Next steps:"
echo "  1. Set up SSL: sudo certbot --nginx -d yourdomain.com"
echo "  2. Configure DNS: Point your domain to this server's IP"
echo "  3. Set up admin: Use the admin login flow on the website"
echo "  4. Review .env: Ensure all production values are set correctly"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View application logs"
echo "  sudo nginx -t       - Test nginx configuration"
echo "  sudo certbot renew  - Renew SSL certificates"
