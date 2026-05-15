# FahadCloud - AI-Powered VPS, Cloud, Domain & Hosting Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blueviolet)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

FahadCloud is a complete, production-grade VPS, Cloud, Domain & Hosting management platform powered by **14 specialized AI agents**. It provides full server infrastructure management including domain registration, DNS management, SSL provisioning, Docker-based hosting deployment, real-time monitoring, and an intelligent AI-powered control panel.

---

## Table of Contents

- [Features](#features)
- [Super Admin Panel](#super-admin-panel)
- [14 Specialized AI Agents](#14-specialized-ai-agents)
- [API Endpoints](#api-endpoints)
- [Quick Start](#quick-start)
- [Manual Installation](#manual-installation)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Performance Optimizations](#performance-optimizations)
- [License](#license)

---

## Features

### Core Platform
- **Domain Registration** with free `.fahadcloud.com` subdomains and TLD pricing
- **Docker-Based Hosting** — isolated containers for React, Next.js, Vue, Node.js, Python, PHP
- **Free SSL Certificates** with auto-renewal via Let's Encrypt
- **Real-time System Monitoring** with live metrics, alerts, and historical data
- **DNS Zone Management** with dnsmasq serving — A, AAAA, CNAME, MX, TXT, NS, SRV records
- **Cloud Storage** with file upload, directory management, and quota enforcement
- **bKash Payment Integration** for Bangladesh-based payments with fraud detection
- **AI-Powered Terminal** with role-based sandbox (admin: full access, user: restricted)
- **Profile Management** with email verification, OTP security, and action verification
- **Forgot/Reset Password** flow with secure email-based recovery
- **Webhook System** for event-driven integrations
- **API Key Management** for programmatic access
- **Database Management** with PostgreSQL and user-level database creation
- **Backup Automation** with tiered retention (daily/weekly/monthly)

### Authentication & Security
- JWT-based authentication with secure httpOnly cookies
- Admin password login with separate OTP verification
- OTP-based email verification for all new accounts
- Action verification for sensitive operations (password change, account deletion)
- Redis-based rate limiting with sliding window algorithm
- IP auto-blocking for repeated violations (10 violations = 15-minute block)
- Shell sandbox with 20+ blocked patterns for command injection prevention
- Safe shell execution using `execFileSync` with array-based argument passing
- Input validation and sanitization on all user-controlled inputs
- CORS strict origin checking in production mode
- Security headers (X-Frame-Options, CSP, HSTS, X-Content-Type-Options)
- Audit logging for all admin and security-sensitive actions

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
| **Database Manager** | PostgreSQL database control — browse tables, view/edit rows, execute queries |
| **System Controls** | Server administration — system info, process management, service control, logs |
| **Activity Log** | Audit trail — track all user and admin actions with timestamps and details |

---

## 14 Specialized AI Agents

| Agent | Purpose |
|-------|---------|
| **DevOps Agent** | CI/CD pipelines, deployment workflows, build automation |
| **Security Agent** | Threat detection, vulnerability scanning, firewall rules, malware scanning |
| **Monitoring Agent** | 24/7 system monitoring with real-time alerts and historical metrics |
| **DNS Agent** | Automatic DNS configuration and propagation via dnsmasq |
| **Database Agent** | PostgreSQL management, optimization, migrations, backups |
| **Infrastructure Agent** | Docker orchestration, container management, cluster monitoring |
| **Chat Agent** | Natural language interface for platform interaction |
| **SSL Agent** | Automated certificate management and renewal via Let's Encrypt |
| **Orchestrator Agent** | Task coordination and multi-agent workflow engine |
| **Terminal Agent** | AI-guided shell execution with role-based safety sandbox |
| **Learning Agent** | Predictive analysis, system optimization, and knowledge management |
| **Recovery Agent** | Backup management, disaster recovery, and environment replication |
| **Bug Detector Agent** | Automated code scanning, bug detection, and AI-powered auto-fix |
| **Auto Learning Agent** | Continuous cross-agent learning with Qdrant vector database |

---

## Quick Start (1-Click VPS Install)

```bash
git clone https://github.com/fahad-ahamed/fahadcloud.git
cd fahadcloud
chmod +x install.sh
./install.sh
```

The install script automatically:
- Installs Node.js 20 LTS, npm, and PM2
- Installs and configures PostgreSQL 16 with auto-tuning
- Installs and configures Redis with persistence and security
- Installs Nginx with performance optimization and Brotli
- Installs Docker for container-based hosting
- Installs Qdrant for AI vector database
- Installs dnsmasq for DNS serving
- Installs Certbot for SSL auto-renewal
- Configures UFW firewall (SSH, HTTP, HTTPS allowed; DB/Redis blocked)
- Configures fail2ban for SSH protection
- Configures unattended security updates
- Configures swap based on system memory
- Configures kernel parameters for performance
- Sets up database backup cron jobs
- Sets up SSL auto-renewal cron jobs
- Sets up log rotation
- Builds and starts the application with PM2

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
# Edit .env with your production settings

# Initialize database
npx prisma generate
npx prisma db push

# Build for production
npm run build

# Start the server
./start.sh prod
```

---

## Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
SERVER_IP=your-server-ip
HOSTNAME=0.0.0.0
PROJECT_ROOT=/home/fahad/fahadcloud

# Database (PostgreSQL)
DATABASE_URL=postgresql://fahadcloud:secure_password@localhost:5432/fahadcloud
DB_POOL_SIZE=5

# Redis
REDIS_URL=redis://127.0.0.1:6379

# JWT Secret (at least 64 characters!)
JWT_SECRET=generate-with-openssl-rand-base64-64

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=FahadCloud
SMTP_FROM_EMAIL=your-email@gmail.com

# Admin
OWNER_EMAIL=admin@fahadcloud.com
ADMIN_EMAILS=admin@fahadcloud.com

# CORS (comma-separated origins for production)
ALLOWED_ORIGINS=https://fahadcloud.com,https://www.fahadcloud.com

# HTTPS
ENFORCE_HTTPS=true

# bKash Payment
BKASH_API_KEY=
BKASH_API_SECRET=
BKASH_MERCHANT_NUMBER=
BKASH_API_URL=https://checkout.pay.bka.sh/v1.2.0-beta

# Qdrant Vector DB
QDRANT_URL=http://localhost:6333

# Hosting Directories
HOSTING_BASE_DIR=/home/fahad/hosting
HOSTING_USERS_DIR=/home/fahad/hosting/users
HOSTING_SSL_DIR=/home/fahad/hosting/ssl
HOSTING_NGINX_DIR=/home/fahad/hosting/nginx

# DNS Directories
DNS_ZONES_DIR=/home/fahad/dns/zones
DNS_CONFIG_DIR=/home/fahad/dns/config
DNS_DNSMASQ_CONF=/home/fahad/dns/dnsmasq.conf
DNS_DNSMASQ_HOSTS=/home/fahad/dns/hosts
```

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 + React 19 |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queue | Redis 7 + BullMQ |
| Vector DB | Qdrant |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Icons | Lucide React |
| Auth | JWT (jose) + bcryptjs + OTP |
| Email | Nodemailer SMTP |
| AI | 14-Agent System with Orchestrator |
| Process | PM2 with daily restart |
| Reverse Proxy | Nginx with HTTP/2 + Brotli |
| SSL | Let's Encrypt + Auto-Renewal |
| Containers | Docker for hosting isolation |
| DNS | dnsmasq for zone serving |
| Payments | bKash Integration + Fraud Detection |
| Security | UFW + fail2ban + Safe Shell Execution |

---

## Security Features

- **Safe Shell Execution**: All shell commands use `execFileSync` with array-based argument passing instead of `execSync` with string interpolation, preventing command injection
- **Input Validation**: All user-controlled inputs (domains, emails, paths, container names) are validated with regex before any system command
- **Redis Rate Limiting**: Sliding window algorithm with IP auto-blocking for repeated violations
- **Shell Sandbox**: 20+ blocked patterns including fork bombs, reverse shells, path traversal, and dangerous command chaining
- **Audit Trail**: Complete audit logging for all admin actions, shell executions, and security events
- **CORS Strict Mode**: Production environments only allow configured origins
- **Security Headers**: X-Frame-Options, CSP, HSTS, X-Content-Type-Options, X-XSS-Protection
- **Database Security**: Row-level security filters, connection pooling, and query parameterization via Prisma

---

## Performance Optimizations

- **Nginx Proxy Caching**: Static assets cached for 365 days, API responses with stale-while-revalidate
- **Redis Caching Layer**: CacheLayer with getOrSet pattern for frequently accessed data
- **Connection Pooling**: Configurable PostgreSQL connection pool per worker
- **PM2 Daily Restart**: Cron-based restart at 3 AM to prevent memory leaks
- **Systemd Watchdog**: Automatic process recovery with 60-second watchdog
- **Standalone Output**: Next.js standalone build for minimal Docker/PM2 footprint
- **Dynamic Imports**: Heavy feature components lazy-loaded with `next/dynamic`
- **Package Import Optimization**: `optimizePackageImports` for lucide-react and radix-ui
- **Image Optimization**: AVIF + WebP formats with responsive sizes
- **Kernel Tuning**: sysctl optimization for network, file descriptors, and memory
- **PostgreSQL Auto-tuning**: shared_buffers, work_mem, and effective_cache_size based on RAM
- **Redis Persistence**: AOF + RDB with dangerous commands disabled
- **Log Rotation**: Automatic with size-based and time-based policies

---

## Project Structure

```
fahadcloud/
├── prisma/
│   └── schema.prisma            # Database schema (40+ models)
├── public/                      # Static assets
├── scripts/
│   ├── monitoring-cron.sh       # System monitoring & maintenance
│   ├── ssl-auto-renew.sh        # SSL certificate auto-renewal
│   └── db-backup.sh             # Database backup with retention
├── smtp-setup/                  # SMTP configuration tools
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/           # Admin API (22+ endpoints)
│   │   │   ├── agent/           # AI Agent APIs (14 agents)
│   │   │   ├── auth/            # Authentication APIs
│   │   │   ├── domains/         # Domain + DNS + SSL management
│   │   │   ├── hosting/         # Hosting management
│   │   │   ├── payments/        # Payment processing + bKash
│   │   │   ├── storage/         # Cloud storage
│   │   │   └── system/          # System shell API
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Main application page
│   │   └── globals.css          # Global styles
│   ├── components/ui/           # shadcn/ui components
│   ├── features/
│   │   ├── admin/               # Super admin panel
│   │   ├── agent/               # AI agent chat + cloud intel
│   │   ├── agent-monitor/       # Agent monitoring dashboard
│   │   ├── auth/                # Login, Register, OTP verification
│   │   ├── dashboard/           # User dashboard
│   │   ├── database/            # Database management
│   │   ├── deploy/              # Deployment interface
│   │   ├── domains/             # Domain search + DNS manager
│   │   ├── hosting/             # Hosting management
│   │   ├── landing/             # Landing + AI landing pages
│   │   ├── learning/            # AI learning panel
│   │   ├── monitoring/          # System monitoring
│   │   ├── payments/            # bKash payment UI
│   │   ├── profile/             # User profile + security
│   │   ├── ssl/                 # SSL certificate management
│   │   ├── storage/             # Cloud storage UI
│   │   └── terminal/            # AI terminal interface
│   ├── lib/
│   │   ├── agent/               # 14 AI agent implementations
│   │   ├── cache/               # In-memory cache layer
│   │   ├── config/              # App configuration
│   │   ├── events/              # Event bus system
│   │   ├── middleware/          # Auth, logging, validation middleware
│   │   ├── repositories/        # Data access layer
│   │   ├── services/            # Business logic services
│   │   ├── auth.ts              # JWT auth utilities
│   │   ├── db.ts                # Prisma client with connection pooling
│   │   ├── db-security.ts       # Password security + rate limiting
│   │   ├── dns-engine.ts        # DNS zone management + dnsmasq
│   │   ├── hosting-engine.ts    # Docker-based hosting engine
│   │   ├── monitoring-engine.ts # System metrics collection
│   │   ├── queue.ts             # BullMQ job queue system
│   │   ├── redis.ts             # Redis cache + sessions + OTP + pub/sub
│   │   ├── shell-sandbox.ts     # Role-based command validation
│   │   ├── shell-utils.ts       # Safe shell execution (no execSync)
│   │   ├── smtp.ts              # Email delivery with templates
│   │   └── ssl-engine.ts        # Let's Encrypt + self-signed SSL
│   ├── hooks/                   # React hooks
│   ├── services/api.ts          # Centralized API client
│   └── types/index.ts           # TypeScript type definitions
├── .env.example                 # Environment template
├── docker-compose.yml           # Full stack Docker setup
├── Dockerfile                   # Multi-stage production build
├── ecosystem.config.js          # PM2 configuration
├── fahadcloud.service           # systemd service unit
├── install.sh                   # 1-click VPS installer
├── start.sh                     # Quick start script
├── nginx.conf                   # Production Nginx config
├── next.config.ts               # Next.js configuration
└── package.json                 # Dependencies and scripts
```

---

## License

MIT License

---

Built with AI on AWS
