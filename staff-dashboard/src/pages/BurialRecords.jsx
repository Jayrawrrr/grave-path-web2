// src/pages/BurialRecords.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import RecordModal from '../components/RecordModal';
import './BurialRecords.css';

export default function BurialRecords() {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalRecord, setModalRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({
    name: '',
    burialDate: '',
    plotId: '',
    deathCertificateUrl: ''
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/burials`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load burial records');
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
        `${process.env.REACT_APP_API_URL}/admin/burials/${updated._id}`,
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
    if (!window.confirm('Delete this burial record?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/burials/${id}`,
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
        `${process.env.REACT_APP_API_URL}/admin/burials`,
        newRecord,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewRecord({ name: '', burialDate: '', plotId: '', deathCertificateUrl: '' });
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Create failed');
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Seed 20 dummy burial records? This will add to existing records.')) return;
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/burials/seed`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Seeding failed');
    }
  };

  if (loading) return <div>Loading burial records…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="burial-records-page">
      <h2>Burial Records</h2>
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
          onChange={e => setNewRecord({ ...newRecord, deathCertificateUrl: e.target.value })}
        />
        <button type="submit">Add Burial</button>
      </form>
      <table className="records-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Plot ID</th>
            <th>Date of Burial</th>
            <th>Death Certificate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record._id}>
              <td>{record.name}</td>
              <td>{record.plotId}</td>
              <td>{new Date(record.burialDate).toLocaleDateString()}</td>
              <td>
                {record.deathCertificateUrl ? (
                  <a
                    href={record.deathCertificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                ) : '—'}
              </td>
              <td>
                <button onClick={() => handleEdit(record)}>Edit</button>
                <button onClick={() => handleDelete(record._id)} style={{ marginLeft: 8 }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalRecord && (
        <RecordModal
          record={modalRecord}
          onClose={() => setModalRecord(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
