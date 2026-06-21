import { useState, useRef, useEffect } from 'react';

const EXAMPLE_QUERIES = [
  'Show me the top 5 highest paid employees',
  'List all products in the Electronics category with price > 100',
  'How many orders were placed in 2019?',
  'What is the average salary by department?',
  'Show me all pending orders with their product names',
  'Which customer placed the most orders?',
];

export default function QueryInput({ onQuery, isLoading }) {
  const [value, setValue] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onQuery(value.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  const useExample = (example) => {
    setValue(example);
    setShowExamples(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="tile flex flex-col gap-3 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="tile-accent px-2 py-1 font-pixel text-[14px]">NL → SQL</span>
          <span className="font-pixel text-[14px] text-[var(--text-dim)] uppercase tracking-widest">
            Natural Language Query
          </span>
        </div>
        <button
          className="btn-metro-ghost text-[13px]"
          onClick={() => setShowExamples((p) => !p)}
          id="toggle-examples-btn"
        >
          {showExamples ? '▲ HIDE' : '▼ EXAMPLES'}
        </button>
      </div>

      {/* Example queries dropdown */}
      {showExamples && (
        <div className="tile-dim animate-slide-up flex flex-col gap-1 p-2">
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              className="history-item text-left w-full"
              onClick={() => useExample(q)}
              id={`example-query-${i}`}
            >
              <span className="text-[var(--accent-green)] mr-2 text-[14px]">›</span>
              <span className="text-[15px]">{q}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="nl-query-input"
            className="input-metro"
            rows={3}
            placeholder="Ask your database anything... e.g. 'Show me the top 10 orders by total value'"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          {!value && !isLoading && (
            <span className="absolute bottom-3 right-3 text-[var(--border-dim)] text-[12px] font-pixel">
              CTRL+↵ TO RUN
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            id="run-query-btn"
            className="btn-metro flex-shrink-0"
            disabled={isLoading || !value.trim()}
          >
            {isLoading ? (
              <>
                <span className="block-spinner" />
                <span>PROCESSING...</span>
              </>
            ) : (
              <>
                <span>▶</span>
                <span>RUN QUERY</span>
              </>
            )}
          </button>
          {value && (
            <button
              type="button"
              className="btn-metro-ghost"
              onClick={() => setValue('')}
              id="clear-query-btn"
            >
              ✕ CLEAR
            </button>
          )}
          <span className="ml-auto text-[var(--border-dim)] text-[13px] font-mono">
            {value.length} chars
          </span>
        </div>
      </form>
    </div>
  );
}
