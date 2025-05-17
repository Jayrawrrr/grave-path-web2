// staff-dashboard/src/components/GraveLocator.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './GraveLocator.css';

export default function GraveLocator() {
  const { token } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async e => {
    e.preventDefault();
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/client/lots`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const filtered = res.data.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.id.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
  };

  return (
    <div className="grave-locator">
      <form className="locator-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search name or plot ID"
          value={query}
          onChange={e => setQuery(e.target.value)}
          required
        />
        <button type="submit">Search</button>
      </form>
      <ul className="locator-results">
        {results.map(l => (
          <li key={l._id}>
            <strong>{l.id}</strong> – {l.name || '—'}
            <button onClick={() => alert('Navigate to map for ' + l.id)}>
              View on Map
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
