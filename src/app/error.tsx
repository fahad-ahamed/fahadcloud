"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
    // Log to monitoring system
    fetch("/api/health", { method: "HEAD" }).catch(() => {});
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" role="alert">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </Button>
          <Button onClick={() => (window.location.href = "/")} className="gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go Home
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}

