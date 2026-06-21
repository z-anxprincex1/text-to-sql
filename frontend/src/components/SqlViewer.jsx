import { highlightSQL } from '../utils/sqlHighlight';

export default function SqlViewer({ sql, explanation, confidence }) {
  if (!sql) return null;

  const confidencePct = Math.round((confidence ?? 0) * 100);
  const confColor =
    confidencePct >= 85 ? 'var(--accent-green)' :
    confidencePct >= 60 ? 'var(--accent-yellow)' :
    'var(--accent)';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sql).catch(() => {});
  };

  // Format SQL with newlines for display
  const formattedSQL = sql
    .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|ORDER BY|GROUP BY|HAVING|LIMIT|AND|OR)\b/gi,
      (m) => `\n${m.toUpperCase()}`)
    .trim();

  return (
    <div className="tile flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-dim)]">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[12px] text-[var(--text-dim)] uppercase tracking-widest">
            Generated SQL
          </span>
          {/* Confidence */}
          <div className="flex items-center gap-2">
            <div className="confidence-bar-track w-16">
              <div
                className="confidence-bar-fill"
                style={{ width: `${confidencePct}%`, background: confColor }}
              />
            </div>
            <span className="font-pixel text-[12px]" style={{ color: confColor }}>
              {confidencePct}%
            </span>
          </div>
        </div>
        <button
          className="btn-metro-ghost"
          onClick={copyToClipboard}
          id="copy-sql-btn"
          title="Copy SQL"
        >
          ⎘ COPY
        </button>
      </div>

      {/* SQL Code Block */}
      <pre
        id="sql-output"
        className="p-4 overflow-x-auto text-[16px] leading-7 flex-1"
        style={{ fontFamily: 'var(--font-mono)', minHeight: '90px', maxHeight: '200px' }}
      >
        {highlightSQL(formattedSQL)}
      </pre>

      {/* Explanation */}
      {explanation && (
        <div className="border-t border-[var(--border-dim)] px-4 py-3 flex items-start gap-3">
          <span className="text-[var(--accent-green)] font-pixel text-[13px] mt-0.5 flex-shrink-0">
            ℹ
          </span>
          <p className="text-[var(--text-dim)] text-[15px] leading-6 font-mono">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
