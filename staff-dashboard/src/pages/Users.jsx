// src/pages/Users.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import UserModal from '../components/UserModal';
import { FaUsers, FaPlus } from 'react-icons/fa';
import './Users.css';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export default function Users() {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalUser, setModalUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // fetch staff list
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/admin/users?role=staff`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data);
      setError(null);
    } catch (err) {
      console.error('Fetch users failed', err);
      setError('Error loading users: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  const handleCreate = () => {
    setIsCreating(true);
    setModalUser({ name: '', email: '', password: '', role: 'staff' });
  };

  // onSave now bubbles errors to the modal
  const handleSave = async user => {
    try {
      if (isCreating) {
        await axios.post(
          `${API_BASE}/admin/users`,
          user,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.put(
          `${API_BASE}/admin/users/${user._id}`,
          user,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await loadUsers();
      setModalUser(null);
      setIsCreating(false);
    } catch (err) {
      // let modal show the error
      throw err;
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const res = await axios.delete(
        `${API_BASE}/admin/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('DELETE /admin/users/:id →', res.data);
      setUsers(u => u.filter(x => x._id !== id));
    } catch (err) {
      const msg = err.response?.data?.msg || err.message;
      console.error('Delete failed:', err.response || err);
      alert(`Delete failed: ${msg}`);
    }
  };

  // Calculate statistics
  const totalStaff = users.length;
  const activeStaff = users.filter(u => u.role === 'staff').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  if (loading) return <div className="loading-spinner">Loading staff users...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="users-page">
      <div className="users-page-header">
        <div className="header-content">
          <div className="header-icon">
            <FaUsers />
          </div>
          <div className="header-text">
            <h2>Staff User & Access Management</h2>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={handleCreate} className="btn-primary">
            <FaPlus />
            Add New Staff
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stat-box total">
          <span className="stat-label">Total Staff</span>
          <span className="stat-value">{totalStaff}</span>
        </div>
        <div className="stat-box active">
          <span className="stat-label">Active Staff</span>
          <span className="stat-value">{activeStaff}</span>
        </div>
        <div className="stat-box admin">
          <span className="stat-label">Administrators</span>
          <span className="stat-value">{adminCount}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-section">
        <h3>Staff Members ({users.length} total)</h3>
        {users.length === 0 ? (
          <div className="no-records">
            <p>No staff members found. Add your first staff member using the button above.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="name-cell">{u.name}</td>
                    <td className="email-cell">{u.email}</td>
                    <td className="role-cell">
                      <span className={`role-badge ${u.role}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="status-cell">
                      <span className="status-badge active">
                        ACTIVE
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setModalUser(u);
                        }}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(u._id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalUser && (
        <UserModal
          user={modalUser}
          onClose={() => setModalUser(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
