# FahadCloud - AI-Powered Domain and Hosting Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blueviolet)](https://www.prisma.io/)

FahadCloud is an autonomous, AI-powered cloud infrastructure management platform with **14 specialized AI agents** that deploy, configure, monitor, and secure your entire cloud infrastructure.

## Features

### 14 Specialized AI Agents
- DevOps Agent - CI/CD pipelines, deployment workflows
- Security Agent - Threat detection, vulnerability scanning
- Monitoring Agent - 24/7 system monitoring with alerts
- DNS Agent - Automatic DNS configuration
- Database Agent - Database management and optimization
- Infrastructure Agent - Docker/K8s orchestration
- Chat Agent - Natural language interface
- SSL Agent - Automated certificate management
- Orchestrator Agent - Task coordination engine
- Terminal Agent - AI-guided shell execution
- Learning Agent - Predictive analysis and optimization
- Recovery Agent - Backup and disaster recovery
- Optimization Agent - Performance and cost optimization
- Auto Learning Agent - Continuous cross-agent learning

### Core Features
- Domain registration with free .fahadcloud.com subdomains
- One-click deployment (React, Next.js, Vue, Node.js, Python, PHP)
- Free SSL certificates with auto-renewal
- Real-time system monitoring
- DNS zone management
- Cloud storage
- bKash payment integration
- AI-powered terminal
- Profile management with verification
- Admin panel with analytics

## Quick Start (1-Click Install)

```bash
git clone https://github.com/fahad-ahamed/fahadcloud.git
cd fahadcloud
chmod +x install.sh
./install.sh
```

## Manual Installation

```bash
npm install
cp .env.example .env
# Edit .env with your settings
npx prisma generate
npx prisma db push
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
npm start
```

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Default Admin Credentials

- Email: fahadcloud24@gmail.com
- Password: Admin@2024

## Tech Stack

- Next.js 15 + React 18 + TypeScript
- Prisma ORM + SQLite
- Tailwind CSS + shadcn/ui
- JWT Auth + OTP Verification
- Nodemailer SMTP
- 14 AI Agent System
- PM2 Process Manager

## License

MIT License

---

Built with AI on AWS
