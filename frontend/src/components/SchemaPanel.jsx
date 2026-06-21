import { useState } from 'react';

export default function SchemaPanel({ schema, onTableClick }) {
  const [expandedTable, setExpandedTable] = useState(null);
  const [activeTable, setActiveTable]     = useState(null);

  if (!schema) {
    return (
      <div className="flex flex-col h-full">
        <div className="panel-header">■ SCHEMA</div>
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <span className="text-[var(--border-dim)] font-pixel text-[8px] leading-6">
            LOADING<br/>SCHEMA...
            <span className="block-spinner ml-2" />
          </span>
        </div>
      </div>
    );
  }

  const tables = Object.entries(schema.tables || {});

  const handleTableClick = (tableName) => {
    setExpandedTable((prev) => (prev === tableName ? null : tableName));
    setActiveTable(tableName);
    onTableClick?.(tableName);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <span>■ SCHEMA BROWSER</span>
        <span className="text-[var(--border-dim)] text-[11px]">{tables.length} TABLES</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {tables.map(([tableName, columns], ti) => (
          <div key={tableName} className="animate-slide-left" style={{ animationDelay: `${ti * 40}ms` }}>
            {/* Table header */}
            <button
              id={`schema-table-${tableName}`}
              className={`schema-table-item w-full text-left flex items-center justify-between ${
                activeTable === tableName ? 'active' : ''
              }`}
              onClick={() => handleTableClick(tableName)}
            >
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent-green)] text-[13px]">▣</span>
                <span className="font-pixel text-[11px] uppercase">{tableName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-dim)] text-[12px]">
                  {schema.row_counts?.[tableName] ?? 0} rows
                </span>
                <span className="text-[var(--border-dim)] text-[12px]">
                  {expandedTable === tableName ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {/* Expanded columns */}
            {expandedTable === tableName && (
              <div className="ml-2 border-l border-[var(--border-dim)] pl-3 mt-1 mb-1 flex flex-col gap-0.5">
                {columns.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between py-1 px-2 hover:bg-[var(--bg-elevated)] transition-colors"
                    id={`col-${tableName}-${col.name}`}
                  >
                    <div className="flex items-center gap-2">
                      {col.pk && (
                        <span
                          className="text-[var(--accent-yellow)] text-[11px]"
                          title="Primary Key"
                        >🔑</span>
                      )}
                      {!col.pk && (
                        <span className="text-[var(--border-dim)] text-[13px]">·</span>
                      )}
                      <span className="text-[15px] font-mono">{col.name}</span>
                    </div>
                    <span className="text-[var(--text-dim)] text-[12px] font-pixel">{col.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Row count summary */}
      <div className="border-t border-[var(--border-dim)] p-2 flex flex-col gap-1">
        <span className="text-[var(--text-dim)] font-pixel text-[10px] uppercase tracking-wider mb-1">
          Row Counts
        </span>
        {Object.entries(schema.row_counts || {}).map(([t, n]) => (
          <div key={t} className="flex justify-between text-[13px]">
            <span className="text-[var(--text-dim)]">{t}</span>
            <span className="text-[var(--accent-green)]">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
