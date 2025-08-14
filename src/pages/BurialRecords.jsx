import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import RecordModal from '../components/RecordModal';
import './BurialRecords.css';

export default function BurialRecords() {
  const { token } = useContext(AuthContext);
  const API_BASE = process.env.REACT_APP_API_URL;

  const [records,   setRecords]     = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [error,     setError]       = useState(null);
  const [modalRec,  setModalRecord] = useState(null);
  const [newRecord, setNewRecord]   = useState({
    name: '', burialDate: '', plotId: '', deathCertificateUrl: ''
  });

  // Inline the fetch logic so useEffect has no missing deps
  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/admin/burials`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (isActive) {
          setRecords(res.data);
          setError(null);
        }
      } catch {
        if (isActive) {
          setError('Failed to load burial records');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };
    load();
    return () => { isActive = false; };
  }, [API_BASE, token]);

  const handleEdit   = r => setModalRecord(r);
  const handleSave   = async updated => {
    await axios.put(
      `${API_BASE}/admin/burials/${updated._id}`,
      updated,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // reload
    setRecords(rs => rs.map(r => r._id === updated._id ? updated : r));
    setModalRecord(null);
  };
  const handleDelete = async id => {
    if (!window.confirm('Delete this burial record?')) return;
    await axios.delete(
      `${API_BASE}/admin/burials/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRecords(rs => rs.filter(r => r._id !== id));
    setModalRecord(null);
  };
  const handleCreate = async e => {
    e.preventDefault();
    const res = await axios.post(
      `${API_BASE}/admin/burials`,
      newRecord,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNewRecord({ name: '', burialDate: '', plotId: '', deathCertificateUrl: '' });
    setRecords(rs => [...rs, res.data]);
  };
  const handleSeed = async () => {
    if (!window.confirm('Seed 20 dummy burial records?')) return;
    const res = await axios.post(
      `${API_BASE}/admin/burials/seed`, {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRecords(res.data);
  };

  if (loading) return <div>Loading burial records…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="burial-records-page">
      <h2>Burial Records</h2>
      <button onClick={handleSeed} style={{ marginBottom: '1rem' }}>
        Seed 20 Dummy Records
      </button>

      <form onSubmit={handleCreate} className="create-form">
        <input
          type="text"
          placeholder="Name"
          value={newRecord.name}
          onChange={e => setNewRecord({ ...newRecord, name: e.target.value })}
          required
        />
        <input
          type="date"
          placeholder="Burial Date"
          value={newRecord.burialDate}
          onChange={e => setNewRecord({ ...newRecord, burialDate: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Plot ID"
          value={newRecord.plotId}
          onChange={e => setNewRecord({ ...newRecord, plotId: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Death Certificate URL"
          value={newRecord.deathCertificateUrl}
          onChange={e =>
            setNewRecord({ ...newRecord, deathCertificateUrl: e.target.value })
          }
        />
        <button type="submit">Add Burial</button>
      </form>

      <table className="records-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Burial Date</th>
            <th>Plot</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map(rec => (
            <tr key={rec._id}>
              <td>{rec.name}</td>
              <td>{new Date(rec.burialDate).toLocaleDateString()}</td>
              <td>{rec.plotId}</td>
              <td>
                <button onClick={() => handleEdit(rec)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalRec && (
        <RecordModal
          record={modalRec}
          onClose={() => setModalRecord(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
