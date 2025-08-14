import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './AnnouncementForm.css';

export default function AnnouncementForm({ onCreated }) {
  const { token } = useContext(AuthContext);

  // Form state
  const [title, setTitle]       = useState('');
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Announcements list & edit state
  const [announcements, setAnnouncements] = useState([]);
  const [editingId, setEditingId]         = useState(null);
  const [editTitle, setEditTitle]         = useState('');
  const [editMessage, setEditMessage]     = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/staff/announcements`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // sort pinned first
      res.data.sort((a, b) => (b.pinned === true) - (a.pinned === true));
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { title, message };
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/staff/announcements`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle('');
      setMessage('');
      if (onCreated) onCreated(res.data);
      fetchAnnouncements();
    } catch (err) {
      console.error('Create error', err);
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/staff/announcements/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAnnouncements();
    } catch (err) {
      console.error('Delete error', err);
      alert('Failed to delete');
    }
  };

  const startEdit = ann => {
    setEditingId(ann._id);
    setEditTitle(ann.title);
    setEditMessage(ann.message);
  };

  const saveEdit = async id => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/staff/announcements/${id}`,
        { title: editTitle, message: editMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      fetchAnnouncements();
    } catch (err) {
      console.error('Edit error', err);
      alert('Failed to update');
    }
  };

  const togglePin = async ann => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/staff/announcements/${ann._id}/pin`,
        { pinned: !ann.pinned },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAnnouncements();
    } catch (err) {
      console.error('Pin error', err);
      alert('Failed to pin/unpin');
    }
  };

  return (
    <div className="announcement-container">
      <form className="announcement-form" onSubmit={handleSubmit}>
        {error && <div className="notification error">{error}</div>}
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Message
          <textarea
            rows="4"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Announcement'}
        </button>
      </form>

      <ul className="announcement-list">
        {announcements.map(ann => (
          <li key={ann._id} className={ann.pinned ? 'pinned' : ''}>
            {editingId === ann._id ? (
              <>
                <input
                  className="edit-title"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
                <textarea
                  className="edit-message"
                  rows="3"
                  value={editMessage}
                  onChange={e => setEditMessage(e.target.value)}
                />
                <div className="actions">
                  <button onClick={() => saveEdit(ann._id)}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h4>{ann.title}</h4>
                <p>{ann.message}</p>
                <div className="actions">
                  <button onClick={() => startEdit(ann)}>Edit</button>
                  <button onClick={() => handleDelete(ann._id)}>Delete</button>
                  <button onClick={() => togglePin(ann)}>
                    {ann.pinned ? 'Unpin' : 'Pin'}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
