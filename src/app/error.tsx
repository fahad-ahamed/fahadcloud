"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CLIENT ERROR:", error.message);
    console.error("STACK:", error.stack);
  }, [error]);

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ color: "red", marginBottom: "1rem" }}>Application Error</h2>
      <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "14px" }}>
        {error.message}
      </pre>
      <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "12px", marginTop: "1rem" }}>
        {error.stack}
      </pre>
      <button
        onClick={reset}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#059669", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}

