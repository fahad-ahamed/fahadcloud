#!/bin/bash
set -e
echo "FahadCloud 1-Click Installer"
echo "================================="

if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

echo "Installing dependencies..."
npm install

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "IMPORTANT: Edit .env with your SMTP credentials!"
fi

echo "Setting up database..."
npx prisma generate
npx prisma db push

echo "Building application..."
npm run build

echo "Copying static files..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

echo "Starting application..."
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "FahadCloud is running at http://localhost:3000"
echo "Admin: fahadcloud24@gmail.com / Admin@2024"
