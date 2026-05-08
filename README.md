# ☁️ FahadCloud

**Domain Provider & Hosting Platform** — A full-featured domain registration, web hosting, and cloud management platform built with Next.js, TypeScript, Prisma, and SQLite.

---

## 🌟 Features

### 🌐 Domain Management
- Domain search and registration across 50+ TLDs
- Free domain support (.fahadcloud.com, .tk, .ml, .ga, .cf, .eu.org, .pp.ua)
- DNS zone management with full record types (A, AAAA, CNAME, MX, TXT, NS, SRV, CAA)
- WHOIS lookup
- Domain transfer and renewal

### 🖥️ Web Hosting
- Docker-based isolated hosting environments
- Multiple server types: Static, Node.js, PHP, Python
- One-click deployment with build logs
- SSL certificate management (Let's Encrypt)
- Storage management with 5GB default quota
- Backup creation and restoration

### 💳 Payment System
- bKash payment integration (Bangladesh)
- Manual payment verification with admin approval
- Fraud detection and duplicate checking
- Payment history and receipt tracking
- BDT currency with USD conversion

### 🤖 AI Agent
- Intelligent cloud assistant with conversational AI
- Multi-step task execution (deploy, DNS config, SSL setup)
- Task approval workflow for critical operations
- Agent memory and learning system
- Security policy enforcement
- Infrastructure monitoring and orchestration

### 👨‍💼 Admin Panel
- Dashboard with real-time statistics
- User management (view, edit, ban)
- Domain management and DNS oversight
- Payment verification and approval
- Pricing management for TLDs and hosting plans
- Fraud detection and monitoring
- System monitoring (CPU, RAM, Disk, Network)
- Admin action audit logs

### 🔐 Security
- JWT-based authentication with HTTP-only cookies
- Email OTP verification for registration
- Action verification OTP for sensitive operations (password change, account deletion)
- Rate limiting on all critical endpoints
- Admin login with separate verification
- Shell execution sandboxing

### 📧 Email System
- SMTP email with Nodemailer
- Registration email verification (6-digit OTP, 10-minute expiry)
- Security action verification emails
- Resend verification with cooldown

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5.6+ |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | Radix UI + shadcn/ui |
| **Database** | SQLite via Prisma ORM 6 |
| **Authentication** | JWT (jose) + bcryptjs |
| **Email** | Nodemailer (Gmail SMTP) |
| **Process Manager** | PM2 |
| **AI** | z-ai-web-dev-sdk |
| **Payments** | bKash API |
| **Hosting** | Docker containers |
| **DNS** | BIND9 zone management |
| **SSL** | Let's Encrypt (certbot) |

---

## 📁 Project Structure

```
fahadcloud/
├── install.sh                    # 1-click install script
├── start.sh                      # 1-click run script
├── ecosystem.config.js           # PM2 production config
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── .env.example                  # Environment template
├── .gitignore
│
├── prisma/
│   └── schema.prisma             # Database schema (21 models)
│
├── public/
│   ├── logo.svg
│   └── robots.txt
│
├── scripts/
│   └── monitoring-cron.sh        # Server monitoring cron
│
└── src/
    ├── app/
    │   ├── layout.tsx             # Root layout
    │   ├── page.tsx               # Main SPA entry
    │   ├── globals.css            # Global styles
    │   └── api/                   # API Routes
    │       ├── admin/             # Admin endpoints
    │       │   ├── route.ts       # Admin dashboard stats
    │       │   ├── domains/       # Domain management
    │       │   ├── fraud/         # Fraud detection
    │       │   ├── hosting/       # Hosting management
    │       │   ├── logs/          # Audit logs
    │       │   ├── payments/      # Payment approval/rejection
    │       │   ├── pricing/       # TLD & plan pricing
    │       │   ├── stats/         # System statistics
    │       │   ├── storage/       # Storage management
    │       │   └── users/         # User management
    │       ├── agent/             # AI Agent endpoints
    │       │   ├── admin/         # Agent admin controls
    │       │   ├── chat/          # Chat completions
    │       │   ├── deploy/        # Deployment agent
    │       │   ├── enterprise/    # Enterprise features
    │       │   ├── execute/       # Code execution
    │       │   ├── history/       # Session history
    │       │   ├── infrastructure/# Infrastructure agent
    │       │   ├── learning/      # Learning agent
    │       │   ├── monitor/       # Monitoring (collect + view)
    │       │   ├── orchestrator/  # Agent orchestration
    │       │   ├── security/      # Security policies
    │       │   └── tasks/         # Task management
    │       ├── auth/              # Authentication
    │       │   ├── admin-login/   # Admin authentication
    │       │   ├── admin-verify/  # Admin verification
    │       │   ├── login/         # User login
    │       │   ├── me/            # Current user
    │       │   ├── register/      # User registration
    │       │   ├── resend-verification/  # Resend OTP
    │       │   ├── verify-action/ # Security action OTP
    │       │   └── verify-email/  # Email verification
    │       ├── domains/           # Domain operations
    │       │   ├── check/         # Availability check
    │       │   ├── dns/           # DNS management
    │       │   ├── free/          # Free domains
    │       │   └── route.ts       # User domains
    │       ├── hosting/           # Hosting management
    │       ├── orders/            # Order processing
    │       ├── payments/          # Payment system
    │       │   ├── create/        # Create payment
    │       │   ├── history/       # Payment history
    │       │   └── verify/        # Verify payment
    │       ├── pricing/           # Public pricing
    │       ├── seed/              # Database seeder
    │       ├── storage/           # File storage
    │       ├── system/            # System utilities
    │       │   └── shell/         # Shell execution
    │       ├── upload/            # File upload
    │       ├── user/              # User profile/account
    │       └── whois/             # WHOIS lookup
    │
    ├── components/ui/             # shadcn/ui components
    │   ├── avatar.tsx
    │   ├── badge.tsx
    │   ├── button.tsx
    │   ├── card.tsx
    │   ├── dialog.tsx
    │   ├── input.tsx
    │   ├── label.tsx
    │   ├── select.tsx
    │   ├── separator.tsx
    │   ├── sonner.tsx
    │   ├── switch.tsx
    │   ├── tabs.tsx
    │   ├── textarea.tsx
    │   ├── toast.tsx
    │   └── toaster.tsx
    │
    ├── features/                  # Feature-based UI modules
    │   ├── admin/                 # Admin panels
    │   ├── agent/                 # AI Agent interface
    │   ├── auth/                  # Authentication forms
    │   ├── dashboard/             # User dashboard
    │   ├── deploy/                # Deployment interface
    │   ├── domains/               # Domain management UI
    │   ├── hosting/               # Hosting management UI
    │   ├── landing/               # Landing page
    │   ├── monitoring/            # System monitoring UI
    │   ├── payments/              # Payment dialogs
    │   ├── profile/               # User profile
    │   ├── ssl/                   # SSL management
    │   ├── storage/               # File storage UI
    │   └── terminal/              # Web terminal
    │
    ├── hooks/                     # React custom hooks
    │   ├── use-admin.ts
    │   ├── use-agent.ts
    │   ├── use-auth.tsx
    │   ├── use-domains.ts
    │   ├── use-monitoring.ts
    │   └── use-toast.ts
    │
    ├── lib/                       # Core business logic
    │   ├── agent/                 # AI Agent modules
    │   │   ├── core.ts
    │   │   ├── types.ts
    │   │   ├── enterprise/
    │   │   ├── infrastructure/
    │   │   ├── learning/
    │   │   ├── memory/
    │   │   ├── orchestrator/
    │   │   └── security/
    │   ├── cache/                 # In-memory caching
    │   ├── config/                # App configuration
    │   ├── events/                # Event bus system
    │   ├── middleware/            # Auth, logging, validation
    │   ├── repositories/          # Data access layer
    │   ├── services/              # Business services
    │   ├── auth.ts                # JWT auth utilities
    │   ├── bkash.ts               # bKash payment integration
    │   ├── db.ts                  # Prisma client singleton
    │   ├── dns-engine.ts          # BIND9 DNS management
    │   ├── hosting-engine.ts      # Docker hosting engine
    │   ├── monitoring-engine.ts   # System monitoring
    │   ├── otp.ts                 # OTP generation/validation
    │   ├── rateLimit.ts           # Rate limiting
    │   ├── shell-sandbox.ts       # Shell execution sandbox
    │   ├── smtp.ts                # Email sending/templates
    │   ├── ssl-engine.ts          # Let's Encrypt SSL
    │   ├── sysutils.ts            # System utilities
    │   ├── formatters.ts          # Data formatting
    │   └── utils.ts               # UI utilities
    │
    ├── services/                  # Client-side API services
    │   ├── api.ts
    │   └── index.ts
    │
    └── types/                     # TypeScript type definitions
        └── index.ts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later
- **Linux** server (Ubuntu 22.04+ recommended)
- **2GB RAM** minimum (4GB recommended)

### Option 1: 1-Click Install (Recommended)

```bash
# Clone the repository
git clone https://github.com/fahad249/fahadcloud.git
cd fahadcloud

# Run the 1-click installer
chmod +x install.sh && ./install.sh

# Edit environment configuration
nano .env

# Start the application
chmod +x start.sh && ./start.sh
```

### Option 2: Manual Setup

```bash
# 1. Clone and enter directory
git clone https://github.com/fahad249/fahadcloud.git
cd fahadcloud

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
nano .env  # Edit with your values

# 4. Initialize database
mkdir -p db
npx prisma generate
npx prisma db push

# 5. Build for production
npm run build

# 6. Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Development Mode

```bash
git clone https://github.com/fahad249/fahadcloud.git
cd fahadcloud
npm install
cp .env.example .env
# Edit .env...
npx prisma generate
npx prisma db push
npm run dev
# Open http://localhost:3000
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./db/fahadcloud.db` | SQLite database path |
| `JWT_SECRET` | **Yes** | — | Secret key for JWT tokens |
| `SERVER_IP` | No | — | Your server's public IP |
| `PORT` | No | `3000` | Application port |
| `SMTP_HOST` | Yes* | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | Yes* | — | SMTP username (email) |
| `SMTP_PASS` | Yes* | — | SMTP password/app password |
| `BKASH_API_KEY` | No | — | bKash API key |
| `BKASH_API_SECRET` | No | — | bKash API secret |
| `BKASH_MERCHANT_NUMBER` | No | — | bKash merchant number |
| `USD_TO_BDT` | No | `110` | USD to BDT conversion rate |

*\*Required for email verification features*

### SMTP Setup (Gmail)

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Factor Authentication
3. Go to App Passwords → Generate a new app password
4. Use the 16-character password as `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
```

### Generate a Secure JWT Secret

```bash
openssl rand -hex 32
```

---

## 🗄️ Database

FahadCloud uses **SQLite** via Prisma ORM, making it easy to deploy without any external database server.

### Database Models (21 total)

- **User** — User accounts with roles, balance, storage
- **Domain** — Registered domains with DNS and SSL status
- **DnsRecord** — DNS zone records
- **TldPricing** — TLD pricing configuration
- **HostingPlan** — Available hosting plans
- **HostingEnvironment** — User hosting environments
- **Backup** — Hosting backups
- **UserDatabase** — User databases
- **FileEntry** — File storage entries
- **Order** — Purchase orders
- **Payment** — Payment records with fraud detection
- **PaymentLog** — Payment action audit trail
- **CartItem** — Shopping cart items
- **Notification** — User notifications
- **AdminLog** — Admin action audit trail
- **RateLimitEntry** — Rate limiting data
- **AgentSession/Message/Task/TaskLog/Memory/ToolExecution** — AI Agent system
- **AgentSecurityPolicy/SystemConfig** — Agent configuration
- **MonitoringMetric** — System monitoring data
- **DeploymentLog** — Deployment history
- **EmailVerification/ActionVerification** — OTP verification

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Reset database (⚠️ deletes all data)
npx prisma db push --force-reset

# Open Prisma Studio (visual database browser)
npx prisma studio
```

### Seed Initial Data

Visit `http://localhost:3000/api/seed` after starting the app to populate default TLD pricing, hosting plans, and admin user.

---

## 🔑 Default Admin Access

After seeding, the default admin credentials are:

- **Email:** admin@fahadcloud.com
- **Password:** admin123

> ⚠️ **Change the admin password immediately after first login!**

---

## 🚦 Running the Application

### Using start.sh (Recommended)

```bash
./start.sh          # Production mode (PM2)
./start.sh dev      # Development mode (hot reload)
./start.sh stop     # Stop the app
./start.sh restart  # Restart the app
./start.sh status   # Show process status
./start.sh logs     # View live logs
./start.sh build    # Rebuild and start
```

### Using npm directly

```bash
npm run dev         # Development server on port 3000
npm run build       # Build for production
npm run start       # Start production server
```

### Using PM2 directly

```bash
pm2 start ecosystem.config.js    # Start
pm2 stop fahadcloud              # Stop
pm2 restart fahadcloud           # Restart
pm2 logs fahadcloud              # View logs
pm2 monit                        # Live monitoring
pm2 save                         # Save process list
pm2 startup                      # Auto-start on reboot
```

---

## 🌐 Production Deployment

### With Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### With HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Server Requirements for Production

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2 GB | 4 GB |
| CPU | 1 vCPU | 2 vCPU |
| Storage | 20 GB | 50 GB SSD |
| OS | Ubuntu 20.04 | Ubuntu 22.04 LTS |

### Additional Production Setup

```bash
# Install Docker (for hosting engine)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install BIND9 (for DNS engine)
sudo apt install bind9 bind9utils

# Install certbot (for SSL engine)
sudo apt install certbot

# Setup monitoring cron
crontab scripts/monitoring-cron.sh
```

---

## 🔌 API Overview

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (sends OTP) |
| POST | `/api/auth/verify-email` | Verify email with OTP |
| POST | `/api/auth/resend-verification` | Resend verification OTP |
| POST | `/api/auth/verify-action` | Request/verify action OTP |
| POST | `/api/auth/login` | Login (blocks unverified emails) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/admin-login` | Admin login |
| POST | `/api/auth/admin-verify` | Admin verification |

### Domains

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/domains/check?tld=xyz` | Check domain availability |
| GET | `/api/domains` | List user domains |
| POST | `/api/domains` | Register domain |
| GET/PUT | `/api/domains/dns` | Manage DNS records |
| GET | `/api/domains/free` | List free TLDs |

### Hosting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hosting` | List hosting environments |
| POST | `/api/hosting` | Create hosting environment |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create` | Create payment |
| POST | `/api/payments/verify` | Submit bKash transaction |
| GET | `/api/payments/history` | Payment history |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin` | Admin dashboard stats |
| GET/PUT | `/api/admin/users` | User management |
| GET/PUT | `/api/admin/domains` | Domain management |
| POST | `/api/admin/payments/approve` | Approve payment |
| POST | `/api/admin/payments/reject` | Reject payment |
| GET/PUT | `/api/admin/pricing` | Pricing management |

---

## 🛡️ Security Features

- **JWT Authentication** — HTTP-only cookies, 7-day expiry
- **Email OTP Verification** — 6-digit OTP, 10-minute expiry, 2-minute resend cooldown
- **Action Verification** — OTP required for password change, account deletion, domain transfer
- **Rate Limiting** — Per-IP rate limits on login, register, domain search, payments, shell
- **Shell Sandboxing** — Restricted command execution with allow/deny lists
- **Admin Audit Logging** — All admin actions logged with IP and timestamp
- **Fraud Detection** — Duplicate payment detection, fraud scoring
- **Input Validation** — Request validation middleware on all endpoints

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Author

**Fahad** — [GitHub](https://github.com/fahad249)

---

<p align="center">
  Built with ❤️ using Next.js, TypeScript, and Prisma
</p>
