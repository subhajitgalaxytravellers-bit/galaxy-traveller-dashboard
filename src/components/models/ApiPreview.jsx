export default function ApiPreview({
  keyStr = "",
  type = "collection",
  className = "",
}) {
  if (!keyStr) {
    return (
      <div className={`text-[11px] opacity-60 ${className}`}>
        Type a title to preview endpoints.
      </div>
    );
  }

  const Line = ({ children }) => (
    <div className="font-mono bg-zinc-50 dark:bg-zinc-900 border rounded px-2 py-1 mb-1 text-xs">
      {children}
    </div>
  );

  if (type === "single") {
    return (
      <div className={className}>
        <div className="font-medium mb-1 text-xs">API</div>
        <Line>GET /api/single/{keyStr}</Line>
        <Line>PUT /api/single/{keyStr}</Line>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="font-medium mb-1 text-xs">API</div>
      <Line>GET /api/content/{keyStr}</Line>
      <Line>POST /api/content/{keyStr}</Line>
      <Line>GET /api/content/{keyStr}/:id</Line>
      <Line>PUT /api/content/{keyStr}/:id</Line>
      <Line>DELETE /api/content/{keyStr}/:id</Line>
    </div>
  );
}
