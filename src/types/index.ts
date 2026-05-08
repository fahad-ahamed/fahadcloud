// ============ AUTH TYPES ============
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  balance: number
  storageUsed: number
  storageLimit: number
  phone?: string
  company?: string
  address?: string
  city?: string
  country?: string
  createdAt?: string
  lastLogin?: string
  emailVerified?: boolean
  adminRole?: string
  avatar?: string
  twoFactorEnabled?: boolean
  domainCount?: number
  orderCount?: number
}

// ============ DOMAIN TYPES ============
export interface Domain {
  id: string
  name: string
  tld: string
  sld: string
  status: string
  sslEnabled: boolean
  expiresAt: string
  nameserver1: string
  nameserver2: string
  isFree?: boolean
  registeredAt?: string
  autoRenew?: boolean
  _count?: { dnsRecords: number }
  createdAt?: string
}

export interface DnsRecord {
  id: string
  type: string
  name: string
  value: string
  ttl: number
  priority?: number
  proxied: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TldPrice {
  tld: string
  registerPrice: number
  renewPrice: number
  isFree: boolean
  category: string
  promo?: boolean
  promoPrice?: number
  transferPrice?: number
}

// ============ HOSTING TYPES ============
export interface HostingEnv {
  id: string
  domainId?: string
  planSlug: string
  status: string
  rootPath: string
  serverType: string
  sslEnabled: boolean
  storageUsed: number
  storageLimit: number
  lastDeployedAt?: string
  domain?: { name: string }
}

export interface HostingPlan {
  id: string
  name: string
  slug: string
  price: number
  yearlyPrice: number
  storage: string
  bandwidth: string
  websites: number
  support: string
  features: string
  popular: boolean
  category: string
}

// ============ AI AGENT TYPES ============
export interface AgentMessage {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  toolCalls?: any[]
}

export interface AgentTask {
  id: string
  type: string
  description: string
  status: string
  priority: string
  currentStep: number
  totalSteps: number
  result?: string
  createdAt: string
  logs?: { step: number; action: string; status: string; output?: string; error?: string }[]
}

export interface AgentDefinition {
  id: string
  name: string
  description: string
  capabilities: string[]
  riskLevel: string
  canAutoExecute: boolean
  icon: string
  color: string
  status: string
}

// ============ PAYMENT TYPES ============
export interface OrderItem {
  id: string
  type: string
  description: string
  amount: number
  status: string
  createdAt: string
  domain?: string
  domainName?: string
  tld?: string
  years?: number
  isFreeDomain?: boolean
  hostingPlanSlug?: string
  bKashNumber?: string
  bKashTrxId?: string
  paymentStatus?: string
  adminNotes?: string
  domain?: any
  payment?: any
  updatedAt?: string
}

export interface PaymentInfo {
  id: string
  orderId: string
  amount: number
  currency: string
  paymentMethod: string
  status: string
  trxId?: string
  senderNumber?: string
  fraudScore: number
  fraudFlags: string[]
  createdAt: string
  order?: any
}

// ============ NOTIFICATION TYPES ============
export interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

// ============ MONITORING TYPES ============
export interface SystemMetrics {
  cpu: number
  cpuCores: number
  ram: number
  ramTotal: number
  ramUsed: number
  ramFree: number
  disk: number
  loadAverage: number[]
  uptime: string
  networkIn?: number
  networkOut?: number
  activeConnections?: number
  dockerContainers?: number
}

// ============ FILE TYPES ============
export interface FileEntry {
  id: string
  name: string
  path: string
  size: number
  mimeType: string
  isPublic: boolean
  isDirectory: boolean
  parentId?: string
  createdAt: string
  updatedAt: string
}

// ============ DOMAIN SEARCH RESULT ============
export interface DomainSearchResult {
  query: string
  sld: string
  tld: string
  primaryResult?: {
    domain: string
    available: boolean
    availabilitySource: string
    pricing: any
  }
  alternatives?: Record<string, {
    domain: string
    available: boolean
    availabilitySource: string
    pricing: any
  }>
}

// ============ ADMIN TYPES ============
export interface AdminStats {
  totalUsers: number
  totalDomains: number
  totalOrders: number
  totalPayments: number
  activeDomains: number
  freeDomains: number
  pendingPayments: number
  paidPayments: number
  rejectedPayments: number
  totalRevenue: number
  todayUsers: number
  todayOrders: number
  todayRevenue: number
}

export interface AdminDashboardData {
  stats: AdminStats
  orderDistribution: { domain: number; hosting: number; renewal: number; transfer: number }
  monthlyRevenue: { month: string; revenue: number }[]
  userGrowth: { date: string; count: number }[]
  recentPayments: any[]
}
