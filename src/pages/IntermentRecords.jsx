import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import IntermentModal from '../components/IntermentModal';
import './IntermentRecords.css';

export default function IntermentRecords() {
  const { token } = useContext(AuthContext);
  const API_BASE = process.env.REACT_APP_API_URL;

  const [records,   setRecords]     = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [error,     setError]       = useState(null);
  const [modalRec,  setModalRecord] = useState(null);
  const [newRecord, setNewRecord]   = useState({
    name: '', plotId: '', intermentDate: '',
    intermentTime: '', officiant: '', status: 'scheduled'
  });

  // inline data load
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/admin/interments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (active) {
          setRecords(res.data);
          setError(null);
        }
      } catch {
        if (active) {
          setError('Failed to load interment records');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => { active = false; };
  }, [API_BASE, token]);

  const handleEdit   = r => setModalRecord(r);
  const handleSave   = async updated => {
    const res = await axios.put(
      `${API_BASE}/admin/interments/${updated._id}`,
      updated,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRecords(rs => rs.map(r => r._id === res.data._id ? res.data : r));
    setModalRecord(null);
  };
  const handleDelete = async id => {
    if (!window.confirm('Delete this interment record?')) return;
    await axios.delete(
      `${API_BASE}/admin/interments/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRecords(rs => rs.filter(r => r._id !== id));
    setModalRecord(null);
  };
  const handleCreate = async e => {
    e.preventDefault();
    const res = await axios.post(
      `${API_BASE}/admin/interments`,
      newRecord,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNewRecord({
      name: '', plotId: '', intermentDate: '',
      intermentTime: '', officiant: '', status: 'scheduled'
    });
    setRecords(rs => [...rs, res.data]);
  };
  const handleSeed = async () => {
    if (!window.confirm('Seed 20 dummy interment records?')) return;
    const res = await axios.post(
      `${API_BASE}/admin/interments/seed`, {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRecords(res.data);
  };

  if (loading) return <div>Loading interment records…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="interment-records-page">
      <h2>Interment Records</h2>
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
          type="text"
          placeholder="Plot ID"
          value={newRecord.plotId}
          onChange={e => setNewRecord({ ...newRecord, plotId: e.target.value })}
          required
        />
        <input
          type="date"
          placeholder="Interment Date"
          value={newRecord.intermentDate}
          onChange={e => setNewRecord({ ...newRecord, intermentDate: e.target.value })}
          required
        />
        <input
          type="time"
          placeholder="Interment Time"
          value={newRecord.intermentTime}
          onChange={e => setNewRecord({ ...newRecord, intermentTime: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Officiant"
          value={newRecord.officiant}
          onChange={e => setNewRecord({ ...newRecord, officiant: e.target.value })}
        />
        <select
          value={newRecord.status}
          onChange={e => setNewRecord({ ...newRecord, status: e.target.value })}
        >
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="canceled">Canceled</option>
        </select>
        <button type="submit">Add Interment</button>
      </form>

      <table className="records-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Plot</th>
            <th>Date</th>
            <th>Time</th>
            <th>Officiant</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map(rec => (
            <tr key={rec._id}>
              <td>{rec.name}</td>
              <td>{rec.plotId}</td>
              <td>{new Date(rec.intermentDate).toLocaleDateString()}</td>
              <td>{rec.intermentTime}</td>
              <td>{rec.officiant}</td>
              <td>{rec.status}</td>
              <td>
                <button onClick={() => handleEdit(rec)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalRec && (
        <IntermentModal
          record={modalRec}
          onClose={() => setModalRecord(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
