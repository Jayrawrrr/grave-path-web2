// src/components/GraveLocator.jsx
import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, MapPin, Navigation, X } from 'lucide-react';
import './GraveLocator.css';

export default function GraveLocator({ lots = [], onSelect, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [navigationMode, setNavigationMode] = useState(false);
  const [startingLot, setStartingLot] = useState(null);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [destinationResults, setDestinationResults] = useState([]);

  useEffect(() => {
    if (query) {
      const q = query.toLowerCase();
      setResults(
        lots.filter(l =>
          l.name?.toLowerCase().includes(q) ||
          l.id?.toLowerCase().includes(q) ||
          l.landmark?.toLowerCase().includes(q)
        ).slice(0, 5)
      );
    } else {
      setResults([]);
    }
  }, [query, lots]);

  useEffect(() => {
    if (destinationQuery && navigationMode) {
      const q = destinationQuery.toLowerCase();
      setDestinationResults(
        lots.filter(l =>
          (l.name?.toLowerCase().includes(q) || 
           l.id?.toLowerCase().includes(q) || 
           l.landmark?.toLowerCase().includes(q)) &&
          l._id !== startingLot?._id // Exclude the starting lot from destination options
        ).slice(0, 5)
      );
    } else {
      setDestinationResults([]);
    }
  }, [destinationQuery, lots, navigationMode, startingLot]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  const handleDestinationClear = () => {
    setDestinationQuery('');
    setDestinationResults([]);
  };

  const toggleNavigationMode = () => {
    setNavigationMode(!navigationMode);
    if (navigationMode) {
      // Reset navigation state when exiting navigation mode
      setStartingLot(null);
      setDestinationQuery('');
      setDestinationResults([]);
    }
  };

  const handleSetStartingLot = (lot) => {
    setStartingLot(lot);
    setQuery('');
    setResults([]);
  };

  const handleNavigateToDestination = (destinationLot) => {
    if (startingLot && onNavigate) {
      onNavigate(startingLot, destinationLot);
    }
    // Clear destination search after navigation
    setDestinationQuery('');
    setDestinationResults([]);
  };

  const resetNavigation = () => {
    setStartingLot(null);
    setDestinationQuery('');
    setDestinationResults([]);
  };

  return (
    <div className="grave-locator">
      <div className="locator-header">
        <h3>Grave Locator</h3>
        <button
          type="button"
          className={`nav-mode-btn ${navigationMode ? 'active' : ''}`}
          onClick={toggleNavigationMode}
          title={navigationMode ? "Exit Navigation Mode" : "Point-to-Point Navigation"}
        >
          <Navigation size={16} />
          {navigationMode ? 'Exit Navigation' : 'Navigate'}
        </button>
      </div>

      {!navigationMode ? (
        // Standard search mode
        <>
          <form className="locator-form" onSubmit={e => e.preventDefault()}>
            <input
              type="text"
              placeholder="Search name, plot ID, or landmark"
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
                  <div className="lot-info">
                    <strong>{lot.id}</strong> – {lot.name || '—'}
                    {lot.landmark && (
                      <div className="lot-landmark">📍 {lot.landmark}</div>
                    )}
                  </div>
                  <button onClick={() => onSelect(lot)}>
                    View on Map
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        // Navigation mode
        <div className="navigation-mode">
          {!startingLot ? (
            // Step 1: Select starting lot
            <>
              <div className="navigation-step">
                <div className="step-header">
                  <MapPin size={16} />
                  <span>Step 1: Select Starting Location</span>
                </div>
                <form className="locator-form" onSubmit={e => e.preventDefault()}>
                  <input
                    type="text"
                    placeholder="Search starting lot (name, ID, or landmark)"
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
                        <div className="lot-info">
                          <strong>{lot.id}</strong> – {lot.name || '—'}
                          {lot.landmark && (
                            <div className="lot-landmark">📍 {lot.landmark}</div>
                          )}
                        </div>
                        <button onClick={() => handleSetStartingLot(lot)}>
                          Set as Start
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            // Step 2: Select destination lot
            <>
              <div className="navigation-step completed">
                <div className="step-header">
                  <MapPin size={16} />
                  <span>Starting Location</span>
                  <button
                    type="button"
                    className="reset-btn"
                    onClick={resetNavigation}
                    title="Change starting location"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="selected-lot">
                  <strong>{startingLot.id}</strong> – {startingLot.name || '—'}
                  {startingLot.landmark && (
                    <div className="lot-landmark">📍 {startingLot.landmark}</div>
                  )}
                </div>
              </div>

              <div className="navigation-step">
                <div className="step-header">
                  <Navigation size={16} />
                  <span>Step 2: Select Destination</span>
                </div>
                <form className="locator-form" onSubmit={e => e.preventDefault()}>
                  <input
                    type="text"
                    placeholder="Search destination lot (name, ID, or landmark)"
                    value={destinationQuery}
                    onChange={e => setDestinationQuery(e.target.value)}
                  />
                  {destinationQuery && (
                    <button
                      type="button"
                      className="clear-btn"
                      aria-label="Clear search"
                      onClick={handleDestinationClear}
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

                {destinationResults.length > 0 && (
                  <ul className="locator-results">
                    {destinationResults.map(lot => (
                      <li key={lot._id}>
                        <div className="lot-info">
                          <strong>{lot.id}</strong> – {lot.name || '—'}
                          {lot.landmark && (
                            <div className="lot-landmark">📍 {lot.landmark}</div>
                          )}
                        </div>
                        <button 
                          className="navigate-btn"
                          onClick={() => handleNavigateToDestination(lot)}
                        >
                          Navigate Here
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
