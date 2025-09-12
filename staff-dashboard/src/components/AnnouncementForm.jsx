import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './AnnouncementForm.css';
import { FaBullhorn, FaPlus, FaEdit, FaTrash, FaMapPin, FaSave, FaTimes, FaCheck, FaSpinner } from 'react-icons/fa';

export default function AnnouncementForm({ onCreated }) {
  const { token } = useContext(AuthContext);

  // Form state
  const [title, setTitle]       = useState('');
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Announcements list & edit state
  const [announcements, setAnnouncements] = useState([]);
  const [editingId, setEditingId]         = useState(null);
  const [editTitle, setEditTitle]         = useState('');
  const [editMessage, setEditMessage]     = useState('');
  const [fetchLoading, setFetchLoading]   = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setFetchLoading(true);
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
      setError('Failed to load announcements');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
      setSuccess('Announcement created successfully!');
      if (onCreated) onCreated(res.data);
      fetchAnnouncements();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Create error', err);
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this announcement? This action cannot be undone.')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/staff/announcements/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Announcement deleted successfully!');
      fetchAnnouncements();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error', err);
      setError('Failed to delete announcement');
    }
  };

  const startEdit = ann => {
    setEditingId(ann._id);
    setEditTitle(ann.title);
    setEditMessage(ann.message);
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditMessage('');
    setError('');
  };

  const saveEdit = async id => {
    if (!editTitle.trim() || !editMessage.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/staff/announcements/${id}`,
        { title: editTitle, message: editMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      setSuccess('Announcement updated successfully!');
      fetchAnnouncements();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Edit error', err);
      setError('Failed to update announcement');
    }
  };

  const togglePin = async ann => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/staff/announcements/${ann._id}/pin`,
        { pinned: !ann.pinned },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Announcement ${ann.pinned ? 'unpinned' : 'pinned'} successfully!`);
      fetchAnnouncements();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Pin error', err);
      setError('Failed to pin/unpin announcement');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="announcement-form-container">
      {/* Page Header */}
      <div className="announcement-page-header">
        <div className="announcement-header-content">
          <div className="announcement-icon-wrapper">
            <FaBullhorn className="announcement-header-icon" />
          </div>
          <div className="announcement-header-text">
            <h1 className="announcement-page-title">Manage Announcements</h1>
            <p className="announcement-page-subtitle">
              Create and manage important announcements for visitors and clients
            </p>
          </div>
        </div>
      </div>

      {/* Notification Messages */}
      {error && (
        <div className="announcement-notification error">
          <FaTimes className="announcement-notification-icon" />
          <span>{error}</span>
          <button 
            className="announcement-notification-close"
            onClick={() => setError('')}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {success && (
        <div className="announcement-notification success">
          <FaCheck className="announcement-notification-icon" />
          <span>{success}</span>
          <button 
            className="announcement-notification-close"
            onClick={() => setSuccess('')}
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="announcement-content-grid">
        {/* Create Form Section */}
        <div className="announcement-form-section">
          <div className="announcement-section-header">
            <h2>Create New Announcement</h2>
            <p>Share important information with all visitors</p>
          </div>

          <form className="announcement-create-form" onSubmit={handleSubmit}>
            <div className="announcement-form-group">
              <label htmlFor="announcement-title">
                Announcement Title <span className="announcement-required">*</span>
              </label>
              <input
                type="text"
                id="announcement-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="Enter a clear, descriptive title"
                className="announcement-input"
              />
            </div>

            <div className="announcement-form-group">
              <label htmlFor="announcement-message">
                Message Content <span className="announcement-required">*</span>
              </label>
              <textarea
                id="announcement-message"
                rows="4"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                placeholder="Write your announcement message here..."
                className="announcement-textarea"
              />
              <small className="announcement-form-hint">
                Be clear and concise. This message will be visible to all visitors.
              </small>
            </div>

            <button 
              type="submit" 
              disabled={loading || !title.trim() || !message.trim()}
              className="announcement-btn-create"
            >
              {loading ? (
                <>
                  <FaSpinner className="announcement-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <FaPlus />
                  Create Announcement
                </>
              )}
            </button>
          </form>
        </div>

        {/* Announcements List Section */}
        <div className="announcement-list-section">
          <div className="announcement-section-header">
            <h2>Existing Announcements</h2>
            <p>Manage, edit, and organize your announcements</p>
          </div>

          {fetchLoading ? (
            <div className="announcement-loading">
              <FaSpinner className="announcement-loading-spinner" />
              <p>Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="announcement-empty-state">
              <FaBullhorn className="announcement-empty-icon" />
              <h3>No Announcements Yet</h3>
              <p>Create your first announcement to get started</p>
            </div>
          ) : (
            <div className="announcement-list">
              {announcements.map(ann => (
                <div 
                  key={ann._id} 
                  className={`announcement-item ${ann.pinned ? 'announcement-pinned' : ''}`}
                >
                  {/* Pin Badge */}
                  {ann.pinned && (
                    <div className="announcement-pin-badge">
                      <FaMapPin className="announcement-pin-icon" />
                      <span>PINNED</span>
                    </div>
                  )}

                  {editingId === ann._id ? (
                    /* Edit Mode */
                    <div className="announcement-edit-form">
                      <div className="announcement-edit-header">
                        <h4>Editing Announcement</h4>
                        <div className="announcement-edit-actions">
                          <button 
                            onClick={() => saveEdit(ann._id)}
                            className="announcement-btn-save"
                            disabled={!editTitle.trim() || !editMessage.trim()}
                          >
                            <FaSave />
                            Save
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="announcement-btn-cancel"
                          >
                            <FaTimes />
                            Cancel
                          </button>
                        </div>
                      </div>

                      <div className="announcement-form-group">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="Announcement title"
                          className="announcement-edit-input"
                        />
                      </div>

                      <div className="announcement-form-group">
                        <textarea
                          rows="4"
                          value={editMessage}
                          onChange={e => setEditMessage(e.target.value)}
                          placeholder="Announcement message"
                          className="announcement-edit-textarea"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="announcement-content">
                      <div className="announcement-item-header">
                        <h3 className="announcement-item-title">{ann.title}</h3>
                        <span className="announcement-item-date">
                          {formatDate(ann.createdAt)}
                        </span>
                      </div>

                      <p className="announcement-item-message">{ann.message}</p>

                      <div className="announcement-item-actions">
                        <button 
                          onClick={() => startEdit(ann)}
                          className="announcement-btn-edit"
                          title="Edit announcement"
                        >
                          <FaEdit />
                          Edit
                        </button>
                        <button 
                          onClick={() => togglePin(ann)}
                          className={`announcement-btn-pin ${ann.pinned ? 'pinned' : ''}`}
                          title={ann.pinned ? 'Unpin announcement' : 'Pin announcement'}
                        >
                          <FaMapPin />
                          {ann.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button 
                          onClick={() => handleDelete(ann._id)}
                          className="announcement-btn-delete"
                          title="Delete announcement"
                        >
                          <FaTrash />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
