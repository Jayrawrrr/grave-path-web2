// src/components/RecordModal.jsx
import React, { useState } from 'react';

export default function RecordModal({ record, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...record });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>Edit Burial Record</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
            />

            <label>Plot ID</label>
            <input
              name="plotId"
              value={form.plotId}
              onChange={handleChange}
            />

            <label>Date of Burial</label>
            <input
              type="date"
              name="burialDate"
              value={form.burialDate.split('T')[0]}
              onChange={handleChange}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-delete" onClick={() => onDelete(record._id)}>
              Delete
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
