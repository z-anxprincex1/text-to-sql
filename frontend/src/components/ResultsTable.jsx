import { useState } from 'react';

export default function ResultsTable({ results }) {
  const [sortCol, setSortCol]   = useState(null);
  const [sortDir, setSortDir]   = useState('asc');
  const [page, setPage]         = useState(0);
  const PAGE_SIZE = 25;

  if (!results) return null;

  const { columns = [], rows = [], row_count = 0 } = results;

  if (rows.length === 0) {
    return (
      <div className="tile p-6 text-center animate-slide-up">
        <span className="font-pixel text-[8px] text-[var(--text-dim)]">
          NO ROWS RETURNED
        </span>
      </div>
    );
  }

  // Sorting
  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(0);
  };

  let sorted = [...rows];
  if (sortCol) {
    sorted.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="tile flex flex-col animate-slide-up overflow-hidden" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-dim)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="tile-accent px-2 py-1 font-pixel text-[7px]">
            {row_count}
          </span>
          <span className="font-pixel text-[12px] text-[var(--text-dim)] uppercase tracking-widest">
            Rows Returned
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-dim)] font-pixel text-[11px]">
            {columns.length} COLS
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <table className="metro-table">
          <thead>
            <tr>
              <th className="text-[var(--border-dim)] w-8">#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  id={`th-${col}`}
                  onClick={() => handleSort(col)}
                  className="cursor-pointer select-none hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {sortCol === col && (
                      <span className="text-[var(--accent-green)]">
                        {sortDir === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr key={ri}>
                <td className="text-[var(--border-dim)] text-center text-[9px]">
                  {page * PAGE_SIZE + ri + 1}
                </td>
                {columns.map((col) => {
                  const val = row[col];
                  const isNum = typeof val === 'number';
                  const isNull = val === null || val === undefined;
                  return (
                    <td
                      key={col}
                      id={`cell-${ri}-${col}`}
                      title={String(val ?? '')}
                      style={{
                        color: isNull ? 'var(--border-dim)' :
                               isNum  ? 'var(--accent-green)' :
                               'var(--text-primary)',
                        fontStyle: isNull ? 'italic' : 'normal',
                      }}
                    >
                      {isNull ? 'NULL' : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-dim)] flex-shrink-0">
          <button
            className="btn-metro-ghost"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            id="prev-page-btn"
          >
            ◄ PREV
          </button>
          <span className="font-pixel text-[11px] text-[var(--text-dim)]">
              PAGE {page + 1} / {totalPages}
            </span>
          <button
            className="btn-metro-ghost"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            id="next-page-btn"
          >
            NEXT ►
          </button>
        </div>
      )}
    </div>
  );
}
