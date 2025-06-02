// src/pages/IntermentRecords.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import IntermentModal from '../components/IntermentModal';
import './IntermentRecords.css';

export default function IntermentRecords() {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalRecord, setModalRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({
    name: '',
    plotId: '',
    intermentDate: '',
    intermentTime: '',
    officiant: '',
    status: 'scheduled'
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/interments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load interment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [token]);

  const handleEdit = record => setModalRecord(record);

  const handleSave = async updated => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/interments/${updated._id}`,
        updated,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRecords();
      setModalRecord(null);
    } catch (err) {
      console.error(err);
      alert('Save failed');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this interment record?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/interments/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRecords();
      setModalRecord(null);
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const handleCreate = async e => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/interments`,
        newRecord,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewRecord({ name: '', plotId: '', intermentDate: '', intermentTime: '', officiant: '', status: 'scheduled' });
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Create failed');
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Seed 20 dummy interment records? This will add to existing records.')) return;
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/interments/seed`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Seeding failed');
    }
  };

  if (loading) return <div>Loading interment records…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="interment-records-page">
      <h2>Interment Records</h2>
      <button onClick={handleSeed} style={{ marginBottom: '1rem' }}>Seed 20 Dummy Records</button>
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
          type="text"
          placeholder="Interment Time"
          value={newRecord.intermentTime}
          onChange={e => setNewRecord({ ...newRecord, intermentTime: e.target.value })}
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
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="submit">Add Interment</button>
      </form>
      <table className="records-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Plot ID</th>
            <th>Date of Interment</th>
            <th>Time</th>
            <th>Officiant</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record._id}>
              <td>{record.name}</td>
              <td>{record.plotId}</td>
              <td>{new Date(record.intermentDate).toLocaleDateString()}</td>
              <td>{record.intermentTime || '—'}</td>
              <td>{record.officiant || '—'}</td>
              <td>{record.status}</td>
              <td>
                <button onClick={() => handleEdit(record)}>Edit</button>
                <button onClick={() => handleDelete(record._id)} style={{ marginLeft: 8 }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalRecord && (
        <IntermentModal
          record={modalRecord}
          onClose={() => setModalRecord(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
