"use client";

/**
 * Last resort: replaces the root layout, so it renders its own document and
 * gets none of `globals.css`. The dark palette is therefore inlined rather than
 * using the design tokens — this file cannot reach them.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "2rem",
          textAlign: "center",
          background: "#0b0b0b",
          color: "#f5f5f5",
          colorScheme: "dark",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <title>Something went wrong · Beezie Claw</title>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>The claw jammed.</h1>
        <p style={{ margin: 0, color: "#b4b4b4" }}>
          Something went wrong on our side. Nothing was charged.
        </p>
        {error.digest ? (
          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "#8a8a8a" }}>
            Ref: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={retry}
          style={{
            cursor: "pointer",
            border: 0,
            borderRadius: 8,
            padding: "0.75rem 1.25rem",
            fontSize: "1rem",
            fontWeight: 600,
            background: "#ffca28",
            color: "#131313",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
