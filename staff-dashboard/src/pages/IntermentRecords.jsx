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

  if (loading) return <div>Loading interment records…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="interment-records-page">
      <h2>Interment Records</h2>
      <table className="records-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Plot ID</th>
            <th>Date of Interment</th>
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
              <td>{record.status}</td>
              <td>
                <button onClick={() => handleEdit(record)}>Edit</button>
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
