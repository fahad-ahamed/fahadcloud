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
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto", fontFamily: "monospace" }}>
      <h2 style={{ color: "red", marginBottom: "1rem", fontSize: "20px" }}>Application Error</h2>
      <div style={{ background: "#fee2e2", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", border: "2px solid red" }}>
        <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Error Message:</p>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "14px", color: "#991b1b" }}>{error.message}</pre>
      </div>
      {error.stack && (
        <div style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Stack Trace:</p>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px", color: "#555" }}>{error.stack}</pre>
        </div>
      )}
      {error.digest && (
        <p style={{ fontSize: "12px", color: "#999" }}>Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#059669", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}
      >
        Try again
      </button>
    </div>
  );
}
