import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await fetch("http://localhost:3000/api/health").then(r => r.json()).catch(() => null);
  
  return NextResponse.json({
    service: "FahadCloud Ultra",
    version: "5.0.0-ultra",
    status: health?.status || "checking",
    features: {
      domainRegistration: "active",
      hostingManagement: "active",
      aiAgent: "active",
      aiLearning: "active",
      monitoring: "active",
      sslManagement: "active",
      dnsManagement: "active",
      fileStorage: "active",
      paymentProcessing: "active",
      terminalAccess: "active",
      adminPanel: "active",
      apiSystem: "active",
      webhookSystem: "active",
      apiKeyManagement: "active"
    },
    infrastructure: {
      appServer: health?.checks?.server?.status || "unknown",
      database: health?.checks?.database?.status || "unknown",
      redis: health?.checks?.redis?.status || "unknown",
      qdrant: health?.checks?.qdrant?.status || "unknown",
      nginx: "healthy",
      cloudflare: "connected"
    },
    stats: {
      uptime: health?.uptime ? Math.floor(health.uptime) : 0,
      responseTime: health?.responseTime || "0ms",
      version: "5.0.0-ultra"
    }
  });
}
