// Centralized API client for all backend communication

class ApiClient {
  private baseUrl = '';

  async request<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...opts.headers },
    });

    if (res.status === 401) {
      throw new Error('Unauthorized');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) {
    return this.request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async logout() {
    return this.request('/api/auth/login', { method: 'DELETE' });
  }

  async verifyEmail(email: string, otp: string) {
    return this.request('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, otp }) });
  }

  async resendVerification(email: string) {
    return this.request('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
  }

  async adminLoginRequest(email: string) {
    return this.request('/api/auth/admin-login', { method: 'POST', body: JSON.stringify({ email }) });
  }

  async adminLoginVerify(email: string, otp: string) {
    return this.request('/api/auth/admin-verify', { method: 'POST', body: JSON.stringify({ email, otp }) });
  }

  async requestActionVerification(action: string, metadata?: any) {
    return this.request('/api/auth/verify-action', { method: 'POST', body: JSON.stringify({ action, metadata }) });
  }

  async verifyAction(action: string, otp: string) {
    return this.request('/api/auth/verify-action', { method: 'PUT', body: JSON.stringify({ action, otp }) });
  }

  // Password Reset
  async requestPasswordReset(email: string) {
    return this.request('/api/auth/request-reset', { method: 'POST', body: JSON.stringify({ email }) });
  }

  async verifyPasswordReset(email: string, otp: string) {
    return this.request('/api/auth/verify-reset', { method: 'POST', body: JSON.stringify({ email, otp }) });
  }

  async resetPassword(resetToken: string, newPassword: string) {
    return this.request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ resetToken, newPassword }) });
  }

  // Domains
  async getDomains() {
    return this.request('/api/domains');
  }

  async registerDomain(data: any) {
    return this.request('/api/domains', { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteDomain(domainId: string) {
    return this.request('/api/domains', { method: 'DELETE', body: JSON.stringify({ domainId }) });
  }

  async checkDomain(domain: string) {
    return this.request(`/api/domains/check?domain=${domain}`);
  }

  async getDnsRecords(domainId: string, domain: string) {
    return this.request(`/api/domains/dns?domainId=${domainId}&domain=${domain}`);
  }

  async addDnsRecord(data: any) {
    return this.request('/api/domains/dns', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateDnsRecord(data: any) {
    return this.request('/api/domains/dns', { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteDnsRecord(recordId: string) {
    return this.request(`/api/domains/dns?recordId=${recordId}`, { method: 'DELETE' });
  }

  // SSL
  async installSsl(domainName: string) {
    return this.request('/api/domains/ssl', { method: 'POST', body: JSON.stringify({ domainName }) });
  }

  async getSslStatus(domainName: string) {
    return this.request(`/api/domains/ssl?domain=${domainName}`);
  }

  // Hosting
  async getHostingPlans() {
    return this.request('/api/hosting');
  }

  async createHostingSubscription(data: any) {
    return this.request('/api/hosting', { method: 'POST', body: JSON.stringify(data) });
  }

  // Orders & Payments
  async getOrders() {
    return this.request('/api/orders');
  }

  async createOrder(data: any) {
    return this.request('/api/orders', { method: 'POST', body: JSON.stringify(data) });
  }

  async createPayment(data: any) {
    return this.request('/api/payments/create', { method: 'POST', body: JSON.stringify(data) });
  }

  async verifyPayment(data: any) {
    return this.request('/api/payments/verify', { method: 'POST', body: JSON.stringify(data) });
  }

  async getPaymentHistory(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/payments/history${query ? '?' + query : ''}`);
  }

  // Pricing
  async getPricing(params?: { category?: string; promo?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/pricing${query ? '?' + query : ''}`);
  }

  // Whois
  async getWhois(domain: string) {
    return this.request(`/api/whois?domain=${domain}`);
  }

  // Storage
  async getFiles() {
    return this.request('/api/storage');
  }

  async uploadFile(formData: FormData) {
    return this.request('/api/upload', { method: 'POST', body: formData, headers: {} });
  }

  // User profile
  async updateProfile(data: any) {
    return this.request('/api/user', { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteAccount() {
    return this.request('/api/user', { method: 'DELETE' });
  }

  // AI Agent
  async sendAgentMessage(message: string, sessionId?: string) {
    return this.request('/api/agent/chat', { method: 'POST', body: JSON.stringify({ message, sessionId }) });
  }

  async getAgentHistory() {
    return this.request('/api/agent/history?type=tasks&limit=20');
  }

  async getAgentSystem() {
    return this.request('/api/agent/orchestrator');
  }

  async getAgentSecurity() {
    return this.request('/api/agent/security');
  }

  async getAgentLearning() {
    return this.request('/api/agent/learning');
  }

  async deployAgent(data: any) {
    return this.request('/api/agent/deploy', { method: 'POST', body: JSON.stringify(data) });
  }

  async executeCommand(command: string, sessionId?: string) {
    return this.request('/api/agent/execute', { method: 'POST', body: JSON.stringify({ command, sessionId }) });
  }

  async getAgentTasks(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/agent/tasks${query ? '?' + query : ''}`);
  }

  // Monitoring
  async getMonitoring() {
    return this.request('/api/agent/monitor');
  }

  // ==================== ADMIN APIs ====================

  // Admin Dashboard
  async getAdminDashboard() {
    return this.request('/api/admin');
  }

  // Admin Stats (enhanced with active/blocked/unverified)
  async getAdminStats() {
    return this.request('/api/admin/stats');
  }

  // Admin Users (enhanced with block/unblock/delete)
  async getAdminUsers(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/users${query ? '?' + query : ''}`);
  }

  async updateUserRole(data: any) {
    return this.request('/api/admin/users', { method: 'PUT', body: JSON.stringify(data) });
  }

  async blockUser(userId: string) {
    return this.request('/api/admin/users', { method: 'PUT', body: JSON.stringify({ userId, action: 'block' }) });
  }

  async unblockUser(userId: string, role?: string) {
    return this.request('/api/admin/users', { method: 'PUT', body: JSON.stringify({ userId, action: 'unblock', role }) });
  }

  async deleteUser(userId: string) {
    return this.request(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
  }

  // Admin Payments
  async getAdminPayments(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/payments${query ? '?' + query : ''}`);
  }

  async approvePayment(paymentId: string, adminNotes?: string) {
    return this.request('/api/admin/payments/approve', { method: 'POST', body: JSON.stringify({ paymentId, adminNotes }) });
  }

  async rejectPayment(paymentId: string, reason: string) {
    return this.request('/api/admin/payments/reject', { method: 'POST', body: JSON.stringify({ paymentId, reason }) });
  }

  // Admin Domains
  async getAdminDomains(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/domains${query ? '?' + query : ''}`);
  }

  async adminRegisterDomain(data: any) {
    return this.request('/api/admin/domains', { method: 'POST', body: JSON.stringify(data) });
  }

  async adminDeleteDomain(domainId: string) {
    return this.request(`/api/admin/domains?domainId=${domainId}`, { method: 'DELETE' });
  }

  // Admin Logs (Activity Logging)
  async getAdminLogs(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/logs${query ? '?' + query : ''}`);
  }

  // Admin Analytics
  async getAdminAnalytics(params?: { period?: string; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/analytics${query ? '?' + query : ''}`);
  }

  // Admin Settings
  async getAdminSettings() {
    return this.request('/api/admin/settings');
  }

  async updateAdminSettings(settings: Record<string, string>) {
    return this.request('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings }) });
  }

  // Admin Notifications
  async getAdminNotifications(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/notifications${query ? '?' + query : ''}`);
  }

  async sendNotification(data: { userId: string; title: string; message: string; type?: string }) {
    return this.request('/api/admin/notifications', { method: 'POST', body: JSON.stringify(data) });
  }

  async markNotificationRead(notificationId: string) {
    return this.request('/api/admin/notifications', { method: 'PUT', body: JSON.stringify({ notificationId }) });
  }

  async markAllNotificationsRead() {
    return this.request('/api/admin/notifications', { method: 'PUT', body: JSON.stringify({ markAllRead: true }) });
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/api/admin/notifications?notificationId=${notificationId}`, { method: 'DELETE' });
  }

  // Admin Activity
  async getAdminActivity(params?: { limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/activity${query ? '?' + query : ''}`);
  }

  // AI Admin
  async getAdminAiStats() {
    return this.request('/api/agent/admin');
  }
}

export const apiClient = new ApiClient();