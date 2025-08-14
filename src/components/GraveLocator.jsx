// src/components/GraveLocator.jsx
import React, { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import './GraveLocator.css';

export default function GraveLocator({ lots = [], onSelect }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query) {
      const q = query.toLowerCase();
      setResults(
        lots.filter(l =>
          l.name?.toLowerCase().includes(q) ||
          l.id?.toLowerCase().includes(q)
        ).slice(0, 5)
      );
    } else {
      setResults([]);
    }
  }, [query, lots]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="grave-locator">
      <form className="locator-form" onSubmit={e => e.preventDefault()}>
        <input
          type="text"
          placeholder="Search name or plot ID"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="clear-btn"
            aria-label="Clear search"
            onClick={handleClear}
          >
            ×
          </button>
        )}
        <button
          type="submit"
          className="search-btn"
          aria-label="Search"
        >
          <SearchIcon />
        </button>
      </form>

      {results.length > 0 && (
        <ul className="locator-results">
          {results.map(lot => (
            <li key={lot._id}>
              <strong>{lot.id}</strong> – {lot.name || '—'}
              <button onClick={() => onSelect(lot)}>
                View on Map
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
