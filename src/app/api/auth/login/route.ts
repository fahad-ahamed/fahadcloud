import { ActivityLog } from "@/lib/activity-logger";
import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const body = await request.json();
    const { email, username, password } = body;
    const emailOrUsername = email || username || "";

    const result = await authService.login(emailOrUsername, password, ip);

    if (result.error) {
      const { status, ...errorBody } = result as any;
      return NextResponse.json(errorBody, { status: status || 500 });
    }

    const { token, ...successBody } = result as any;

    const response = NextResponse.json(successBody);

    const isHttps = request.headers.get("x-forwarded-proto") === "https" || process.env.ENFORCE_HTTPS === "true";
    
    response.cookies.set("fahadcloud-token", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      domain: undefined,
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ message: "Logged out successfully" });

    response.cookies.set("fahadcloud-token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}

