// staff-dashboard/src/components/AnnouncementForm.jsx
import React, { useState } from 'react';
import './AnnouncementForm.css';

export default function AnnouncementForm() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    alert(`Announcement created:\n${title}\n${message}`);
    setTitle('');
    setMessage('');
  };

  return (
    <form className="announcement-form" onSubmit={handleSubmit}>
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
      <button type="submit">Create Announcement</button>
    </form>
  );
}
