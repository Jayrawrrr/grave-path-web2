import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from 'react-icons/fa';
import './VisitorInfoManagement.css';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default function VisitorInfoManagement() {
  const { token } = useContext(AuthContext);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [showAddAmenity, setShowAddAmenity] = useState(false);
  const [newAmenity, setNewAmenity] = useState({ imageUrl: '', title: '', description: '' });

  useEffect(() => {
    fetchVisitorInfo();
  }, []);

  const fetchVisitorInfo = async () => {
    try {
      const response = await api.get('/admin/visitor-info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisitorInfo(response.data);
    } catch (error) {
      console.error('Error fetching visitor info:', error);
      setMessage({ type: 'error', text: 'Failed to load visitor information' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/visitor-info', visitorInfo, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Visitor information updated successfully!' });
    } catch (error) {
      console.error('Error saving visitor info:', error);
      setMessage({ type: 'error', text: 'Failed to save visitor information' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAmenity = async () => {
    if (!newAmenity.imageUrl || !newAmenity.title || !newAmenity.description) {
      setMessage({ type: 'error', text: 'Please fill in all amenity fields' });
      return;
    }

    try {
      await api.post('/admin/visitor-info/amenities', newAmenity, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewAmenity({ imageUrl: '', title: '', description: '' });
      setShowAddAmenity(false);
      fetchVisitorInfo();
      setMessage({ type: 'success', text: 'Amenity added successfully!' });
    } catch (error) {
      console.error('Error adding amenity:', error);
      setMessage({ type: 'error', text: 'Failed to add amenity' });
    }
  };

  const handleUpdateAmenity = async (index) => {
    try {
      await api.put(`/admin/visitor-info/amenities/${index}`, editingAmenity, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingAmenity(null);
      fetchVisitorInfo();
      setMessage({ type: 'success', text: 'Amenity updated successfully!' });
    } catch (error) {
      console.error('Error updating amenity:', error);
      setMessage({ type: 'error', text: 'Failed to update amenity' });
    }
  };

  const handleDeleteAmenity = async (index) => {
    if (!window.confirm('Are you sure you want to delete this amenity?')) {
      return;
    }

    try {
      await api.delete(`/admin/visitor-info/amenities/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchVisitorInfo();
      setMessage({ type: 'success', text: 'Amenity deleted successfully!' });
    } catch (error) {
      console.error('Error deleting amenity:', error);
      setMessage({ type: 'error', text: 'Failed to delete amenity' });
    }
  };

  if (loading) {
    return <div className="visitor-info-loading">Loading visitor information...</div>;
  }

  return (
    <div className="visitor-info-management">
      <div className="visitor-info-header">
        <h1>Visitor Information Management</h1>
        <p>Manage visitor hours, guidelines, and park amenities</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="visitor-info-sections">
        {/* Visiting Hours Section */}
        <div className="info-section">
          <h2>Visiting Hours</h2>
          <textarea
            value={visitorInfo?.visitingHours || ''}
            onChange={(e) => setVisitorInfo({...visitorInfo, visitingHours: e.target.value})}
            rows={6}
            placeholder="Enter visiting hours..."
          />
        </div>

        {/* Rules Section */}
        <div className="info-section">
          <h2>Visitor Guidelines</h2>
          <textarea
            value={visitorInfo?.rules || ''}
            onChange={(e) => setVisitorInfo({...visitorInfo, rules: e.target.value})}
            rows={8}
            placeholder="Enter visitor guidelines..."
          />
        </div>

        {/* Amenities Section */}
        <div className="info-section">
          <div className="amenities-header">
            <h2>Park Amenities</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddAmenity(true)}
            >
              <FaPlus /> Add Amenity
            </button>
          </div>

          {/* Add New Amenity Form */}
          {showAddAmenity && (
            <div className="add-amenity-form">
              <h3>Add New Amenity</h3>
              <div className="form-group">
                <label>Image URL:</label>
                <input
                  type="text"
                  value={newAmenity.imageUrl}
                  onChange={(e) => setNewAmenity({...newAmenity, imageUrl: e.target.value})}
                  placeholder="/image.jpg"
                />
              </div>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={newAmenity.title}
                  onChange={(e) => setNewAmenity({...newAmenity, title: e.target.value})}
                  placeholder="Amenity title"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newAmenity.description}
                  onChange={(e) => setNewAmenity({...newAmenity, description: e.target.value})}
                  rows={3}
                  placeholder="Amenity description"
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleAddAmenity}>
                  <FaSave /> Add Amenity
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAddAmenity(false)}>
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Amenities List */}
          <div className="amenities-list">
            {visitorInfo?.amenities?.map((amenity, index) => (
              <div key={index} className="amenity-item">
                {editingAmenity && editingAmenity.index === index ? (
                  <div className="edit-amenity-form">
                    <div className="form-group">
                      <label>Image URL:</label>
                      <input
                        type="text"
                        value={editingAmenity.imageUrl}
                        onChange={(e) => setEditingAmenity({...editingAmenity, imageUrl: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Title:</label>
                      <input
                        type="text"
                        value={editingAmenity.title}
                        onChange={(e) => setEditingAmenity({...editingAmenity, title: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Description:</label>
                      <textarea
                        value={editingAmenity.description}
                        onChange={(e) => setEditingAmenity({...editingAmenity, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="form-actions">
                      <button className="btn btn-primary" onClick={() => handleUpdateAmenity(index)}>
                        <FaSave /> Save
                      </button>
                      <button className="btn btn-secondary" onClick={() => setEditingAmenity(null)}>
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="amenity-display">
                    <div className="amenity-image">
                      <img src={amenity.imageUrl} alt={amenity.title} />
                    </div>
                    <div className="amenity-content">
                      <h3>{amenity.title}</h3>
                      <p>{amenity.description}</p>
                    </div>
                    <div className="amenity-actions">
                      <button 
                        className="btn btn-edit"
                        onClick={() => setEditingAmenity({...amenity, index})}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-delete"
                        onClick={() => handleDeleteAmenity(index)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="save-section">
        <button 
          className="btn btn-primary btn-large"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}

