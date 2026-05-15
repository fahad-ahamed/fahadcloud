import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function apiKeyAuth(request: NextRequest): Promise<{ valid: boolean; userId?: string; scopes?: string[]; error?: string }> {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  
  if (token.startsWith("fc_")) {
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    
    try {
      const { db } = await import("@/lib/db");
      
      const apiKey = await db.apiKey.findFirst({
        where: { keyHash: hash, active: true },
        select: { id: true, userId: true, permissions: true, expiresAt: true, lastUsedAt: true }
      });
      
      if (!apiKey) {
        return { valid: false, error: "Invalid API key" };
      }
      
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { valid: false, error: "API key expired" };
      }
      
      // Update lastUsedAt using shared db instance (fire-and-forget)
      db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
      
      return {
        valid: true,
        userId: apiKey.userId,
        scopes: JSON.parse(apiKey.permissions || "[]")
      };
    } catch {
      return { valid: false, error: "Internal error" };
    }
  }
  
  return { valid: false, error: "Invalid token format" };
}
