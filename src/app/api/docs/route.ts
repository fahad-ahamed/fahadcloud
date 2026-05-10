import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = "https://" + (process.env.SERVER_IP || "fahadcloud.com");
  return NextResponse.json({
    apiName: "FahadCloud Ultra API",
    version: "6.0.0",
    description: "AI-Powered Domain & Hosting Platform API",
    baseUrl,
    authentication: { type: "Bearer Cookie (JWT)", cookieName: "fahadcloud-token" },
    rateLimits: { auth: "10 req/min", general: "100 req/min", agent: "30 req/min" },
    endpoints: {
      auth: { POST: ["/api/auth/login", "/api/auth/register", "/api/auth/admin-login"], GET: ["/api/auth/me"] },
      admin: { GET: ["/api/admin", "/api/admin/users", "/api/admin/domains", "/api/admin/system", "/api/admin/logs", "/api/admin/firewall", "/api/admin/backup", "/api/admin/payments"] },
      domains: { GET: ["/api/domains", "/api/domains/check", "/api/domains/ssl"], POST: ["/api/domains"] },
      agent: { POST: ["/api/agent/chat", "/api/agent/execute", "/api/agent/deploy"], GET: ["/api/agent/history", "/api/agent/monitor"] },
      system: { GET: ["/api/health", "/api/status", "/api/pricing", "/api/docs"] },
    },
    responseFormat: { success: "{ success: true, data }", error: "{ success: false, error }" },
  });
}
