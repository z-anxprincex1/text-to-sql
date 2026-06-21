import { useState, useEffect, useCallback } from 'react';
import QueryInput    from './components/QueryInput';
import SchemaPanel   from './components/SchemaPanel';
import SqlViewer     from './components/SqlViewer';
import ResultsTable  from './components/ResultsTable';
import HistoryPanel  from './components/HistoryPanel';
import StatusBar     from './components/StatusBar';

export default function App() {
  const [schema,      setSchema]      = useState(null);
  const [history,     setHistory]     = useState([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error,       setError]       = useState(null);
  const [queryCount,  setQueryCount]  = useState(0);
  const [lastMs,      setLastMs]      = useState(null);
  const [activeTab,   setActiveTab]   = useState('results'); // 'results' | 'history'

  // Query result state
  const [sql,         setSql]         = useState('');
  const [explanation, setExplanation] = useState('');
  const [confidence,  setConfidence]  = useState(null);
  const [results,     setResults]     = useState(null);

  // ── Fetch schema on mount ─────────────────────────────────────────────────
  const fetchSchema = useCallback(async () => {
    try {
      const res = await fetch('/api/schema');
      if (!res.ok) throw new Error(`Schema fetch failed: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setSchema(data.schema);
        setIsConnected(true);
      }
    } catch (err) {
      setIsConnected(false);
      console.error('[Schema]', err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.success) setHistory(data.history);
    } catch {}
  }, []);

  useEffect(() => {
    fetchSchema();
    fetchHistory();
    // Health poll every 30s
    const interval = setInterval(fetchSchema, 30_000);
    return () => clearInterval(interval);
  }, [fetchSchema, fetchHistory]);

  // ── Run query ─────────────────────────────────────────────────────────────
  const runQuery = useCallback(async (question) => {
    setIsLoading(true);
    setError(null);
    setSql('');
    setExplanation('');
    setConfidence(null);
    setResults(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? 'Unknown error');
        return;
      }

      setSql(data.sql);
      setExplanation(data.explanation);
      setConfidence(data.confidence);
      setResults(data.results);
      setLastMs(data.elapsed_ms);
      setQueryCount((c) => c + 1);
      setActiveTab('results');

      // Refresh history
      fetchHistory();
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistory]);

  // Re-run from history
  const handleHistorySelect = (item) => {
    setSql(item.sql);
    setActiveTab('results');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Pixel stripe decorative ── */}
      <div className="pixel-stripe" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-4 px-6 py-3 border-b-2 border-white flex-shrink-0">
        {/* Logo tile */}
        <div className="tile-accent px-3 py-2 font-pixel text-[14px] tracking-wider">
          ⬛ SQL
        </div>
        <div>
          <h1 className="font-pixel text-[18px] text-white leading-tight">
            TEXT-TO-SQL DASHBOARD
          </h1>
          <p className="font-mono text-[14px] text-[var(--text-dim)] mt-1">
            Powered by Google Gemini 2.0 Flash · Schema-Aware NL→SQL
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {/* Connection indicator */}
          <div className="tile-dim flex items-center gap-2 px-3 py-2">
            <span
              className="w-3 h-3 inline-block"
              style={{ background: isConnected ? 'var(--accent-green)' : 'var(--accent)' }}
            />
            <span className="font-pixel text-[11px]">
              {isConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
          {/* Query count */}
          {queryCount > 0 && (
            <div className="tile flex items-center gap-2 px-3 py-2">
              <span className="font-pixel text-[14px] text-[var(--accent-green)]">
                {queryCount}
              </span>
              <span className="font-pixel text-[11px] text-[var(--text-dim)]">QUERIES</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* Left: Schema + History sidebar */}
        <aside
          className="flex flex-col border-r-2 border-white overflow-hidden flex-shrink-0"
          style={{ width: '280px' }}
        >
          {/* Schema panel — takes top ~60% */}
          <div className="flex-1 border-b border-[var(--border-dim)] overflow-hidden" style={{ minHeight: 0 }}>
            <SchemaPanel schema={schema} />
          </div>
          {/* History panel — takes bottom ~40% */}
          <div className="overflow-hidden" style={{ height: '280px' }}>
            <HistoryPanel history={history} onSelect={handleHistorySelect} />
          </div>
        </aside>

        {/* Right: Main content */}
        <main className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>

          {/* Query input */}
          <div className="flex-shrink-0 p-4 border-b border-[var(--border-dim)]">
            <QueryInput onQuery={runQuery} isLoading={isLoading} />
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mt-3 banner-error animate-slide-up flex items-start gap-3 flex-shrink-0">
              <span className="font-pixel text-[8px] flex-shrink-0 mt-0.5">✕ ERROR</span>
              <span className="font-mono text-[11px] leading-5">{error}</span>
              <button
                className="ml-auto btn-metro-ghost flex-shrink-0 text-[var(--accent)]"
                onClick={() => setError(null)}
                id="dismiss-error-btn"
              >
                ✕
              </button>
            </div>
          )}

          {/* SQL Viewer */}
          {sql && (
            <div className="px-4 pt-3 flex-shrink-0">
              <SqlViewer sql={sql} explanation={explanation} confidence={confidence} />
            </div>
          )}

          {/* Tab bar */}
          {results && (
            <div className="flex gap-0 border-b border-[var(--border-dim)] flex-shrink-0 px-4 pt-3">
              {[
                { id: 'results', label: `RESULTS (${results.row_count})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-pixel text-[11px] border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-[var(--text-dim)] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Results table */}
          <div className="flex-1 overflow-hidden p-4" style={{ minHeight: 0 }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="flex gap-2">
                  {[0,1,2,3].map(i => (
                    <div
                      key={i}
                      className="w-4 h-4 bg-white"
                      style={{
                        animation: `pixel-blink 0.8s ${i * 0.2}s step-end infinite`,
                      }}
                    />
                  ))}
                </div>
                <p className="font-pixel text-[13px] text-[var(--text-dim)] cursor-blink">
                  ASKING GEMINI
                </p>
              </div>
            ) : results ? (
              <ResultsTable results={results} />
            ) : !error ? (
              /* Splash / empty state */
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                <div className="grid grid-cols-3 gap-1 opacity-20">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-white" style={{ opacity: i % 2 === 0 ? 1 : 0.4 }} />
                  ))}
                </div>
                <div>
                  <p className="font-pixel text-[13px] text-[var(--text-dim)] mb-2">
                    QUERY YOUR DATABASE
                  </p>
                  <p className="font-mono text-[15px] text-[var(--border-dim)]">
                    Type a question above and press RUN QUERY
                  </p>
                </div>
                <div className="tile-dim px-6 py-3 text-[14px] font-mono text-[var(--text-dim)]">
                  Try: <span className="text-white">"Show me the top 5 highest paid employees"</span>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* ── Status Bar ─────────────────────────────────────────────────────── */}
      <StatusBar
        isConnected={isConnected}
        lastElapsedMs={lastMs}
        queryCount={queryCount}
        model="GEMINI-2.0-FLASH"
      />

      {/* Bottom pixel stripe */}
      <div className="pixel-stripe" />
    </div>
  );
}
