export default function StatusBar({ isConnected, lastElapsedMs, queryCount, model }) {
  return (
    <div className="status-bar">
      {/* Model pill */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 inline-block"
          style={{ background: isConnected ? '#00ff41' : '#ff0000' }}
        />
        <span>{model ?? 'GEMINI-3.5-FLASH'}</span>
      </div>

      <div className="sep" />

      <span>{isConnected ? '● CONNECTED' : '○ OFFLINE'}</span>

      {lastElapsedMs != null && (
        <>
          <div className="sep" />
          <span>LAST: {lastElapsedMs}ms</span>
        </>
      )}

      {queryCount > 0 && (
        <>
          <div className="sep" />
          <span>{queryCount} QUERIES</span>
        </>
      )}

      {/* Right side spacer & branding */}
      <span className="ml-auto text-[var(--border-dim)] text-[6px]">
        TEXT-TO-SQL DASHBOARD 2024
      </span>
    </div>
  );
}
