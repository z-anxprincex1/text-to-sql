// SQL syntax highlighter — returns array of JSX spans
export function highlightSQL(sql) {
  if (!sql) return null;

  const KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE',
    'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN',
    'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS', 'DISTINCT',
    'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'ROUND', 'CAST', 'COALESCE',
    'NULL', 'IS', 'BETWEEN', 'ASC', 'DESC', 'CASE', 'WHEN', 'THEN',
    'ELSE', 'END', 'WITH', 'UNION', 'ALL', 'EXCEPT', 'INTERSECT',
  ];

  const tokens = [];
  let remaining = sql;
  let key = 0;

  while (remaining.length > 0) {
    // String literals
    const strMatch = remaining.match(/^('(?:[^'\\]|\\.)*')/);
    if (strMatch) {
      tokens.push(<span key={key++} className="sql-string">{strMatch[1]}</span>);
      remaining = remaining.slice(strMatch[1].length);
      continue;
    }
    // Numbers
    const numMatch = remaining.match(/^(\b\d+(?:\.\d+)?\b)/);
    if (numMatch) {
      tokens.push(<span key={key++} className="sql-number">{numMatch[1]}</span>);
      remaining = remaining.slice(numMatch[1].length);
      continue;
    }
    // Keywords (case-insensitive, word boundary)
    let matched = false;
    for (const kw of KEYWORDS) {
      const re = new RegExp(`^(${kw})\\b`, 'i');
      const m = remaining.match(re);
      if (m) {
        tokens.push(<span key={key++} className="sql-keyword">{m[1].toUpperCase()}</span>);
        remaining = remaining.slice(m[1].length);
        matched = true;
        break;
      }
    }
    if (matched) continue;
    // Fallback — single char
    tokens.push(<span key={key++}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return tokens;
}
