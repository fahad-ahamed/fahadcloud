# ☁️ FahadCloud - AI-Powered Domain & Hosting Platform

<div align="center">

![FahadCloud](https://img.shields.io/badge/FahadCloud-v4.0.0-emerald?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Domain Provider & Hosting Platform with 14 AI Agents**

[Deploy in 1-Click](#-1-click-deploy) · [Features](#-features) · [Installation](#-installation) · [API Reference](#-api-reference)

</div>

---

## 🚀 Features

### 🤖 14 Specialized AI Agents (All v2.0)
| Agent | Capability |
|-------|-----------|
| DevOps Agent | CI/CD pipelines, build optimization, zero-downtime deploys |
| Security Agent | Threat detection, intrusion prevention, firewall management |
| Deployment Agent | One-click deploys for React, Next.js, Vue, PHP, Python, WordPress |
| Monitoring Agent | 24/7 CPU/RAM/Disk monitoring with intelligent alerting |
| Debugging Agent | Root cause analysis, automated fix suggestions |
| Infrastructure Agent | Docker/K8s orchestration, server provisioning |
| Scaling Agent | Auto-scaling, load balancing, traffic management |
| Recovery Agent | Self-healing, crash recovery, backup restoration |
| DNS Agent | Automatic DNS configuration, zone management |
| SSL Agent | Let's Encrypt provisioning, auto-renewal |
| Database Agent | Intelligent DB creation, migration, optimization |
| Optimization Agent | Performance profiling, cost optimization |
| Chat Agent | Natural language interface with context-aware understanding |
| Auto Learning Agent | Continuous learning, pattern recognition, cross-domain insights |

### 🌐 Domain Management
- Free domain registration (.fahadcloud.com, .tk, .ml, .ga, .cf, .gq)
- 50+ TLD support with competitive pricing
- Real-time availability checking
- DNS record management (A, AAAA, CNAME, MX, TXT, NS)
- WHOIS lookup

### 🚀 Deployment & Hosting
- One-click deployment with AI automation
- 10 framework templates (React, Next.js, Vue, Node.js, PHP, Python, etc.)
- Docker container isolation
- SSL certificate auto-provisioning
- Hosting environment management

### 💳 Payment System
- bKash payment integration (Bangladesh)
- Admin payment verification
- Fraud detection scoring
- Order management

### 🔒 Security
- JWT authentication with HTTP-only cookies
- Email verification with OTP
- Password reset via SMTP
- Rate limiting (Registration, Login, Password Reset)
- Admin role-based access control
- 2FA-ready architecture

---

## 📦 1-Click Deploy

### Option 1: AWS EC2 (Recommended)

```bash
# 1. Launch Ubuntu 22.04 EC2 instance (t3.medium recommended)

# 2. SSH into your server
ssh ubuntu@your-server-ip

# 3. Run the 1-click installer
curl -fsSL https://raw.githubusercontent.com/fahad-ahamed/fahadcloud/main/install.sh | bash
```

### Option 2: Manual Installation

```bash
# Clone the repository
git clone https://github.com/fahad-ahamed/fahadcloud.git
cd fahadcloud

# Run the setup script
chmod +x start.sh
./start.sh build
```

---

## 🔧 Installation

### Prerequisites
- Node.js 18+ 
- npm 9+
- 2GB+ RAM recommended

### Step-by-Step Setup

```bash
# 1. Clone repository
git clone https://github.com/fahad-ahamed/fahadcloud.git
cd fahadcloud

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings (see Environment Variables below)

# 4. Initialize database
npx prisma db push
npx prisma generate

# 5. Seed pricing data
node seed-prod.js

# 6. Build for production
npm run build

# 7. Start with PM2
npm start
# OR
pm2 start ecosystem.config.js
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./db/fahadcloud.db"

# Authentication
JWT_SECRET=your-secret-key-change-this

# SMTP Email (Gmail recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=FahadCloud
SMTP_FROM_EMAIL=your-email@gmail.com

# Admin
OWNER_EMAIL=your-email@gmail.com
SERVER_IP=your-server-ip
```

#### Gmail SMTP Setup
1. Enable 2-Factor Authentication on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Generate a new App Password for "Mail"
4. Use the 16-character password as `SMTP_PASS`

---

## 📁 Project Structure

```
fahadcloud/
├── prisma/                  # Database schema
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/            # API routes (60+ endpoints)
│   │   │   ├── admin/      # Admin APIs (stats, users, payments, etc.)
│   │   │   ├── agent/      # AI Agent APIs (chat, deploy, monitor, etc.)
│   │   │   ├── auth/       # Auth APIs (login, register, reset, verify)
│   │   │   ├── domains/    # Domain APIs (check, register, DNS)
│   │   │   ├── hosting/    # Hosting APIs
│   │   │   ├── orders/     # Order management
│   │   │   ├── payments/   # Payment processing
│   │   │   ├── storage/    # File storage
│   │   │   └── user/       # User profile
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main SPA application
│   ├── components/ui/      # Reusable UI components (shadcn/ui)
│   ├── features/           # Feature components
│   │   ├── admin/          # Admin panel (users, payments, domains, security)
│   │   ├── agent/          # AI Agent chat, cloud intel, task panel
│   │   ├── auth/           # Login, Register, Admin Login, Password Reset
│   │   ├── dashboard/      # Dashboard overview
│   │   ├── deploy/         # One-click deployment
│   │   ├── domains/        # Domain search & DNS management
│   │   ├── hosting/        # Hosting environments
│   │   ├── landing/        # Landing pages
│   │   ├── monitoring/     # System monitoring
│   │   ├── payments/       # Payment & orders
│   │   ├── profile/        # User profile & settings
│   │   ├── ssl/            # SSL management
│   │   ├── storage/        # File storage
│   │   └── terminal/       # AI terminal
│   ├── hooks/              # React hooks (auth, agent, domains, admin, monitoring)
│   ├── lib/
│   │   ├── agent/          # AI Agent engine (orchestrator, core, types, auto-learning)
│   │   ├── middleware/     # Auth, logging, validation middleware
│   │   ├── repositories/   # Data access layer
│   │   └── services/       # Business logic (auth, admin, domain, payment, user)
│   ├── services/           # API client
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── ecosystem.config.js     # PM2 configuration
├── install.sh              # 1-click installer
├── seed-prod.js            # Database seeder
└── start.sh                # Start script
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (email or username + password) |
| POST | `/api/auth/admin-login` | Request admin OTP |
| POST | `/api/auth/admin-verify` | Verify admin OTP |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/verify-email` | Verify email with OTP |
| POST | `/api/auth/resend-verification` | Resend verification OTP |
| POST | `/api/auth/request-reset` | Request password reset |
| POST | `/api/auth/verify-reset` | Verify reset OTP |
| POST | `/api/auth/reset-password` | Reset password |

### AI Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agent/chat` | Chat with AI agent |
| GET | `/api/agent/history` | Get chat/task history |
| GET | `/api/agent/orchestrator` | Get agent overview |
| GET | `/api/agent/security` | Get security status |
| GET | `/api/agent/learning` | Get learning predictions |
| GET | `/api/agent/monitor` | Get system metrics |
| POST | `/api/agent/deploy` | Start AI deployment |
| POST | `/api/agent/execute` | Execute terminal command |
| GET | `/api/agent/tasks` | Get agent tasks |

### Domains
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/domains` | List user domains |
| POST | `/api/domains` | Register domain |
| GET | `/api/domains/check?domain=` | Check availability |
| GET | `/api/domains/dns` | Get DNS records |
| POST | `/api/domains/dns` | Add DNS record |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Get admin statistics |
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users` | Block/unblock/update user |
| DELETE | `/api/admin/users` | Delete user |
| GET | `/api/admin/payments` | List payments |
| POST | `/api/admin/payments/approve` | Approve payment |
| POST | `/api/admin/payments/reject` | Reject payment |
| POST | `/api/admin/change-password` | Change admin password |

---

## 👤 Default Admin Account

After seeding, a default admin account is created:

| Field | Value |
|-------|-------|
| Email | `fahadcloud24@gmail.com` (or your OWNER_EMAIL) |
| Password | Set during first setup |
| Role | admin (super_admin) |

**⚠️ Important:** Change the default password immediately after first login!

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM, SQLite
- **AI:** Custom multi-agent orchestration engine with 14 specialized agents
- **Auth:** JWT (HTTP-only cookies), OTP email verification, bcryptjs
- **Email:** Nodemailer with Gmail SMTP
- **Process:** PM2 with cluster mode
- **Deployment:** Docker containers, standalone Node.js server

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [Fahad Ahamed](https://github.com/fahad-ahamed)**

</div>

