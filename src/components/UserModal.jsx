import React, { useState } from 'react';
import './UserModal.css';

export default function UserModal({ user, onClose, onSave }) {
  const [form, setForm]     = useState({ ...user });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      // if onSave succeeds, modal will close in parent
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal-content"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h3>{form._id ? 'Edit Staff' : 'Add New Staff'}</h3>

        <label>
          Name<br/>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Email<br/>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        {!form._id && (
          <label>
            Password<br/>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
        )}

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-buttons">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-save"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
