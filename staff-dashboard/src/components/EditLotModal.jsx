// src/components/EditLotModal.jsx
import React, { useState } from 'react';
import './EditLotModal.css'; // we'll drop in basic styles below

export default function EditLotModal({ lot, onClose, onSave }) {
  const [form, setForm] = useState({
    _id: lot._id,
    id: lot.id,
    name: lot.name || '',
    birth: lot.birth || '',
    death: lot.death || '',
    status: lot.status || 'available',
    bounds: lot.bounds
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave({
      ...lot,
      ...form,
      _id: lot._id,
      id: lot.id,
      bounds: lot.bounds,
      name: form.name,
      birth: form.birth,
      death: form.death,
      status: form.status
    });
  };

  return (
    <div className="modal-backdrop">
      <form className="modal-content" onSubmit={handleSubmit}>
        <h3>Edit Lot {lot.id}</h3>
        <label>
          Name<br/>
          <input name="name" value={form.name} onChange={handleChange} />
        </label>
        <label>
          Birth<br/>
          <input name="birth" value={form.birth} onChange={handleChange} />
        </label>
        <label>
          Death<br/>
          <input name="death" value={form.death} onChange={handleChange} />
        </label>
        <label>
          Status<br/>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="active">Active</option>
          </select>
        </label>
        <div className="modal-buttons">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}
