# FahadCloud - AI-Powered Domain & Hosting Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blueviolet)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

FahadCloud is an autonomous, AI-powered cloud infrastructure management platform that combines domain registration, hosting deployment, and system administration into a single unified control panel. Built with **14 specialized AI agents**, a comprehensive **Super Admin Panel**, and full-stack cloud management capabilities.

---

## Table of Contents

- [Features](#features)
- [Super Admin Panel](#super-admin-panel)
- [14 Specialized AI Agents](#14-specialized-ai-agents)
- [API Endpoints](#api-endpoints)
- [Quick Start](#quick-start)
- [Manual Installation](#manual-installation)
- [Environment Variables](#environment-variables)
- [Default Admin Credentials](#default-admin-credentials)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [License](#license)

---

## Features

### Core Platform
- **Domain Registration** with free `.fahadcloud.com` subdomains
- **One-Click Deployment** — React, Next.js, Vue, Node.js, Python, PHP
- **Free SSL Certificates** with auto-renewal via Let's Encrypt
- **Real-time System Monitoring** with live metrics and alerts
- **DNS Zone Management** with full record control (A, AAAA, CNAME, MX, TXT, NS)
- **Cloud Storage** with file upload and management
- **bKash Payment Integration** for Bangladesh-based payments
- **AI-Powered Terminal** with natural language shell execution
- **Profile Management** with email verification and OTP security
- **Forgot/Reset Password** flow with email-based recovery

### Authentication & Security
- JWT-based authentication with secure token management
- Admin password login with separate verification
- OTP-based email verification for new accounts
- Password reset via email with secure tokens
- Rate limiting on API endpoints
- Shell sandbox for safe terminal command execution

---

## Super Admin Panel

The Super Admin Panel provides complete control over the entire platform with 9 dedicated sections:

| Tab | Description |
|-----|-------------|
| **Dashboard** | Real-time platform analytics — total users, domains, hosting instances, revenue, system health |
| **Users** | Full CRUD management — view, edit, suspend, delete users with detailed user profiles |
| **Domains** | Domain lifecycle management — register, configure DNS, manage SSL, domain transfers |
| **Hosting** | Hosting instance control — deploy, restart, stop, scale, monitor deployments |
| **Payments** | Payment tracking — approve/reject payments, bKash verification, revenue reports |
| **File Manager** | Server file browser — navigate directories, upload, download, edit, delete files |
| **Database Manager** | SQLite database control — browse tables, view/edit rows, execute raw SQL queries |
| **System Controls** | Server administration — system info, process management, service control, logs |
| **Activity Log** | Audit trail — track all user and admin actions with timestamps and details |

### Admin API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stats` | GET | Platform statistics and analytics |
| `/api/admin/users` | GET | List all users with details |
| `/api/admin/user-detail` | GET | Detailed user information |
| `/api/admin/user-action` | POST | User actions (suspend, activate, delete) |
| `/api/admin/domains` | GET/PUT | Domain management |
| `/api/admin/hosting` | GET/DELETE | Hosting instance management |
| `/api/admin/payments` | GET | Payment listing and management |
| `/api/admin/payments/approve` | POST | Approve pending payments |
| `/api/admin/payments/reject` | POST | Reject pending payments |
| `/api/admin/database` | GET/POST | Database browser and SQL execution |
| `/api/admin/files` | GET/POST/PUT/DELETE | File manager operations |
| `/api/admin/system` | GET/POST | System controls and process management |
| `/api/admin/live-monitor` | GET | Real-time system metrics |
| `/api/admin/activity` | GET | Activity/audit log |
| `/api/admin/logs` | GET | Application and system logs |
| `/api/admin/analytics` | GET | Advanced analytics data |
| `/api/admin/notifications` | GET | Admin notifications |
| `/api/admin/fraud` | GET | Fraud detection reports |
| `/api/admin/change-password` | POST | Admin password change |
| `/api/admin/settings` | GET/PUT | Platform settings |
| `/api/admin/pricing` | GET/PUT | Pricing configuration |
| `/api/admin/storage` | GET | Storage usage statistics |

---

## 14 Specialized AI Agents

| Agent | Purpose |
|-------|---------|
| **DevOps Agent** | CI/CD pipelines, deployment workflows, build automation |
| **Security Agent** | Threat detection, vulnerability scanning, firewall rules |
| **Monitoring Agent** | 24/7 system monitoring with real-time alerts |
| **DNS Agent** | Automatic DNS configuration and propagation |
| **Database Agent** | Database management, optimization, migrations |
| **Infrastructure Agent** | Docker/K8s orchestration, container management |
| **Chat Agent** | Natural language interface for platform interaction |
| **SSL Agent** | Automated certificate management and renewal |
| **Orchestrator Agent** | Task coordination and multi-agent workflow engine |
| **Terminal Agent** | AI-guided shell execution with safety sandbox |
| **Learning Agent** | Predictive analysis and system optimization |
| **Recovery Agent** | Backup management and disaster recovery |
| **Optimization Agent** | Performance tuning and cost optimization |
| **Auto Learning Agent** | Continuous cross-agent learning and improvement |

---

## Quick Start (1-Click Install)

```bash
git clone https://github.com/fahad-ahamed/fahadcloud.git
cd fahadcloud
chmod +x install.sh
./install.sh
```

The install script automatically:
- Installs Node.js, npm, and PM2
- Installs project dependencies
- Configures environment variables
- Initializes the SQLite database
- Builds the production bundle
- Starts the server with PM2

---

## Manual Installation

```bash
# Clone the repository
git clone https://github.com/fahad-ahamed/fahadcloud.git
cd fahadcloud

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
npx prisma generate
npx prisma db push

# Build for production
npm run build

# Copy static assets for standalone mode
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp -r db .next/standalone/
cp .env .next/standalone/

# Start the server
npm start

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

---

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="change-this-secret-key-in-production"

# SMTP Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM_NAME="FahadCloud"
SMTP_FROM_EMAIL="your-email@gmail.com"

# Admin / Owner
OWNER_EMAIL="your-email@gmail.com"

# Server
SERVER_IP="your-server-ip"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Default Admin Credentials

- **Email:** fahadcloud24@gmail.com
- **Password:** Admin@2024

> **Important:** Change these credentials immediately after first login via the Admin Panel.

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 + React 18 |
| Language | TypeScript 5 |
| Database | Prisma ORM + SQLite |
| Styling | Tailwind CSS + shadcn/ui |
| Icons | Lucide React |
| Auth | JWT + bcryptjs + OTP |
| Email | Nodemailer SMTP |
| AI | 14-Agent System with Orchestrator |
| Process | PM2 Cluster Mode |
| SSL | Let's Encrypt + Auto-Renewal |
| Payments | bKash Integration |

---

## Project Structure

```
fahadcloud/
├── prisma/
│   └── schema.prisma            # Database schema
├── public/                      # Static assets
├── scripts/                     # Utility scripts
├── smtp-setup/                  # SMTP configuration tools
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/           # Admin API (22 endpoints)
│   │   │   ├── agent/           # AI Agent APIs
│   │   │   ├── auth/            # Authentication APIs
│   │   │   ├── domains/         # Domain management
│   │   │   ├── hosting/         # Hosting management
│   │   │   ├── payments/        # Payment processing
│   │   │   ├── storage/         # Cloud storage
│   │   │   └── system/          # System shell API
│   │   ├── error.tsx            # Error boundary
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Main application page
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   └── ui/                  # shadcn/ui components
│   ├── features/
│   │   ├── admin/               # Admin panel views
│   │   │   ├── SuperAdminView.tsx
│   │   │   ├── AdminView.tsx
│   │   │   ├── AdminDomainsPanel.tsx
│   │   │   ├── AdminPaymentsPanel.tsx
│   │   │   └── AdminUsersPanel.tsx
│   │   ├── agent/               # AI agent interface
│   │   ├── auth/                # Login, Register, Forgot Password
│   │   ├── dashboard/           # User dashboard
│   │   ├── deploy/              # Deployment interface
│   │   ├── domains/             # Domain management UI
│   │   ├── hosting/             # Hosting management UI
│   │   ├── landing/             # Landing page
│   │   ├── monitoring/          # System monitoring UI
│   │   ├── payments/            # Payment UI
│   │   ├── profile/             # User profile
│   │   ├── ssl/                 # SSL management
│   │   ├── storage/             # Cloud storage UI
│   │   └── terminal/            # AI terminal interface
│   ├── lib/
│   │   ├── activity-logger.ts   # Audit logging system
│   │   ├── agent/               # AI agent implementations
│   │   ├── auth.ts              # Auth utilities
│   │   ├── bkash.ts             # bKash payment integration
│   │   ├── dns-engine.ts        # DNS management engine
│   │   ├── hosting-engine.ts    # Hosting deployment engine
│   │   ├── monitoring-engine.ts # System monitoring engine
│   │   ├── shell-sandbox.ts     # Safe shell execution
│   │   ├── smtp.ts              # Email delivery system
│   │   └── ssl-engine.ts       # SSL certificate engine
│   └── services/
│       └── api.ts               # API client service
├── .env.example                 # Environment template
├── ecosystem.config.js          # PM2 configuration
├── install.sh                   # 1-click installer
├── next.config.ts               # Next.js configuration
└── package.json                 # Dependencies and scripts
```

---

## License

MIT License

---

Built with AI on AWS

