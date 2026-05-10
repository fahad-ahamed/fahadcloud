// Centralized API Response Helper - Consistent format across all endpoints
import { NextResponse } from "next/server";

interface ApiResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

export function apiSuccess(data: any, message?: string, options?: ApiResponseOptions) {
  return NextResponse.json({
    success: true,
    data,
    message: message || "OK",
    timestamp: new Date().toISOString(),
  }, {
    status: options?.status || 200,
    headers: options?.headers,
  });
}

export function apiError(message: string, status?: number, details?: any) {
  return NextResponse.json({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString(),
  }, {
    status: status || 500,
  });
}

export function apiPaginated(data: any[], page: number, limit: number, total: number) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  });
}

export function apiCreated(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message: message || "Resource created successfully",
    timestamp: new Date().toISOString(),
  }, { status: 201 });
}

export function apiNoContent() {
  return new NextResponse(null, { status: 204 });
}

export function apiRateLimited(retryAfter: number) {
  return NextResponse.json({
    success: false,
    error: "Too many requests. Please try again later.",
    retryAfter,
    timestamp: new Date().toISOString(),
  }, {
    status: 429,
    headers: { "Retry-After": String(retryAfter) },
  });
}

export function apiUnauthorized(message = "Authentication required") {
  return apiError(message, 401);
}

export function apiForbidden(message = "Access denied") {
  return apiError(message, 403);
}

export function apiNotFound(message = "Resource not found") {
  return apiError(message, 404);
}

export function apiValidationFailed(errors: Record<string, string>) {
  return apiError("Validation failed", 400, { errors });
}

