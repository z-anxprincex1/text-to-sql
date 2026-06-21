export default function HistoryPanel({ history, onSelect }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="panel-header">◷ HISTORY</div>
        <div className="flex-1 flex items-center justify-center p-4">
          <span className="font-pixel text-[11px] text-[var(--border-dim)] text-center leading-8">
            NO QUERIES<br/>YET
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <span>◷ HISTORY</span>
        <span className="text-[var(--border-dim)] text-[11px]">{history.length} RECENT</span>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col">
        {history.map((item, i) => {
          const confPct = Math.round((item.confidence ?? 0) * 100);
          const confColor =
            confPct >= 85 ? 'var(--accent-green)' :
            confPct >= 60 ? 'var(--accent-yellow)' : 'var(--accent)';
          return (
            <button
              key={i}
              id={`history-item-${i}`}
              className="history-item text-left border-b border-[var(--border-dim)] w-full"
              onClick={() => onSelect?.(item)}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[var(--accent-green)] text-[12px] flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex gap-2 text-[12px] flex-shrink-0">
                  <span className="text-[var(--text-dim)]">{item.row_count}r</span>
                  <span className="text-[var(--text-dim)]">{item.elapsed_ms}ms</span>
                  <span style={{ color: confColor }}>{confPct}%</span>
                </div>
              </div>
              <p className="text-[14px] font-mono text-[var(--text-primary)] leading-5 truncate">
                {item.question}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
