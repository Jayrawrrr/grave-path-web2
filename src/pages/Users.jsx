// src/pages/Users.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import UserModal from '../components/UserModal';
import './Users.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Users() {
  const { token } = useContext(AuthContext);
  const [users, setUsers]           = useState([]);
  const [modalUser, setModalUser]   = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // fetch staff list
  const loadUsers = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/admin/users?role=staff`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data);
    } catch (err) {
      console.error('Fetch users failed', err);
      alert('Error loading users: ' + (err.response?.data?.msg || err.message));
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

  return (
    <div className="users-page">
      <h2>Staff User & Access Management</h2>
      <button onClick={handleCreate} className="create-btn">+ Add Staff</button>

      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setModalUser(u);
                  }}
                >
                  Edit
                </button>
                <button onClick={() => handleDelete(u._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
