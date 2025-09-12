import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaRobot, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaHistory, FaUndo } from 'react-icons/fa';
import axios from 'axios';
import './ChatbotManagement.css';

export default function ChatbotManagement() {
  const { token } = useContext(AuthContext);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Quick Questions Management
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    category: 'general',
    userType: 'all',
    order: 0
  });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  
  // FAQ Management
  const [editingFaq, setEditingFaq] = useState(null);
  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    category: 'general',
    keywords: '',
    userType: 'all'
  });
  const [showAddFaq, setShowAddFaq] = useState(false);
  
  // System Prompts
  const [editingSystemPrompt, setEditingSystemPrompt] = useState(false);
  const [editingGuestPrompt, setEditingGuestPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [guestSystemPrompt, setGuestSystemPrompt] = useState('');

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'reservation', label: 'Reservation' },
    { value: 'visiting', label: 'Visiting' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'location', label: 'Location' },
    { value: 'services', label: 'Services' }
  ];

  const userTypes = [
    { value: 'all', label: 'All Users' },
    { value: 'guest', label: 'Guests Only' },
    { value: 'client', label: 'Clients Only' }
  ];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/chatbot/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data.data);
      setSystemPrompt(response.data.data.systemPrompt);
      setGuestSystemPrompt(response.data.data.guestSystemPrompt);
      setError(null);
    } catch (err) {
      console.error('Error fetching chatbot config:', err);
      setError('Failed to load chatbot configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/admin/chatbot/config`, {
        quickQuestions: config.quickQuestions,
        faqResponses: config.faqResponses,
        systemPrompt,
        guestSystemPrompt
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.data);
      setSuccess('Configuration saved successfully');
      setEditingSystemPrompt(false);
      setEditingGuestPrompt(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Failed to save configuration');
    }
  };

  const handleAddQuestion = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/admin/chatbot/questions`, {
        ...newQuestion,
        order: config.quickQuestions.length + 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.data);
      setNewQuestion({ question: '', category: 'general', userType: 'all', order: 0 });
      setShowAddQuestion(false);
      setSuccess('Quick question added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error adding question:', err);
      setError('Failed to add quick question');
    }
  };

  const handleUpdateQuestion = async (id, updatedQuestion) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/admin/chatbot/questions/${id}`, updatedQuestion, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.data);
      setEditingQuestion(null);
      setSuccess('Quick question updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating question:', err);
      setError('Failed to update quick question');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quick question?')) return;
    
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/admin/chatbot/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.data);
      setSuccess('Quick question deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Failed to delete quick question');
    }
  };

  const handleAddFaq = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/admin/chatbot/faq`, {
        ...newFaq,
        keywords: newFaq.keywords.split(',').map(k => k.trim()).filter(k => k)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.data);
      setNewFaq({ question: '', answer: '', category: 'general', keywords: '', userType: 'all' });
      setShowAddFaq(false);
      setSuccess('FAQ response added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error adding FAQ:', err);
      setError('Failed to add FAQ response');
    }
  };

  const handleUpdateFaq = async (id, updatedFaq) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/admin/chatbot/faq/${id}`, updatedFaq, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.data);
      setEditingFaq(null);
      setSuccess('FAQ response updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating FAQ:', err);
      setError('Failed to update FAQ response');
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ response?')) return;
    
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/admin/chatbot/faq/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.data);
      setSuccess('FAQ response deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      setError('Failed to delete FAQ response');
    }
  };

  const handleResetConfig = async () => {
    if (!window.confirm('Are you sure you want to reset to default configuration? This will overwrite all current settings.')) return;
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/admin/chatbot/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.data);
      setSystemPrompt(response.data.data.systemPrompt);
      setGuestSystemPrompt(response.data.data.guestSystemPrompt);
      setSuccess('Configuration reset to defaults successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error resetting config:', err);
      setError('Failed to reset configuration');
    }
  };

  if (loading) return <div className="loading-spinner">Loading chatbot configuration...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="chatbot-management">
      <div className="chatbot-header">
        <div className="header-content">
          <div className="header-icon">
            <FaRobot />
          </div>
          <div className="header-text">
            <h1>Chatbot Management</h1>
            <p>Manage AI chatbot quick questions, FAQ responses, and system prompts</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleResetConfig}>
            <FaUndo /> Reset to Defaults
          </button>
          <button className="btn btn-primary" onClick={handleSaveConfig}>
            <FaSave /> Save Configuration
          </button>
        </div>
      </div>

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* System Prompts Section */}
      <div className="config-section">
        <div className="section-header">
          <h2>System Prompts</h2>
          <p>Configure the AI chatbot's personality and behavior</p>
        </div>

        <div className="prompt-section">
          <div className="prompt-header">
            <h3>Main System Prompt (Logged-in Users)</h3>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setEditingSystemPrompt(!editingSystemPrompt)}
            >
              {editingSystemPrompt ? <FaTimes /> : <FaEdit />}
              {editingSystemPrompt ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editingSystemPrompt ? (
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="prompt-textarea"
              rows="8"
              placeholder="Enter the main system prompt for logged-in users..."
            />
          ) : (
            <div className="prompt-display">
              {systemPrompt}
            </div>
          )}
        </div>

        <div className="prompt-section">
          <div className="prompt-header">
            <h3>Guest System Prompt (Non-logged-in Users)</h3>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setEditingGuestPrompt(!editingGuestPrompt)}
            >
              {editingGuestPrompt ? <FaTimes /> : <FaEdit />}
              {editingGuestPrompt ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editingGuestPrompt ? (
            <textarea
              value={guestSystemPrompt}
              onChange={(e) => setGuestSystemPrompt(e.target.value)}
              className="prompt-textarea"
              rows="8"
              placeholder="Enter the system prompt for guest users..."
            />
          ) : (
            <div className="prompt-display">
              {guestSystemPrompt}
            </div>
          )}
        </div>
      </div>

      {/* Quick Questions Section */}
      <div className="config-section">
        <div className="section-header">
          <h2>Quick Questions</h2>
          <p>Manage the quick response buttons shown to users</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddQuestion(true)}
          >
            <FaPlus /> Add Quick Question
          </button>
        </div>

        {showAddQuestion && (
          <div className="add-form">
            <h3>Add New Quick Question</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Question</label>
                <input
                  type="text"
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  placeholder="Enter the quick question..."
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>User Type</label>
                <select
                  value={newQuestion.userType}
                  onChange={(e) => setNewQuestion({ ...newQuestion, userType: e.target.value })}
                >
                  {userTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleAddQuestion}>
                <FaSave /> Add Question
              </button>
              <button className="btn btn-outline" onClick={() => setShowAddQuestion(false)}>
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        )}

        <div className="questions-list">
          {config.quickQuestions.map((question, index) => (
            <div key={question._id} className="question-item">
              {editingQuestion === question._id ? (
                <EditQuestionForm
                  question={question}
                  onSave={(updated) => handleUpdateQuestion(question._id, updated)}
                  onCancel={() => setEditingQuestion(null)}
                  categories={categories}
                  userTypes={userTypes}
                />
              ) : (
                <div className="question-display">
                  <div className="question-content">
                    <span className="question-text">{question.question}</span>
                    <div className="question-meta">
                      <span className={`category-badge ${question.category}`}>
                        {categories.find(c => c.value === question.category)?.label}
                      </span>
                      <span className={`user-type-badge ${question.userType}`}>
                        {userTypes.find(t => t.value === question.userType)?.label}
                      </span>
                      <span className="order-badge">Order: {question.order}</span>
                    </div>
                  </div>
                  <div className="question-actions">
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => setEditingQuestion(question._id)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteQuestion(question._id)}
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

      {/* FAQ Responses Section */}
      <div className="config-section">
        <div className="section-header">
          <h2>FAQ Responses</h2>
          <p>Manage frequently asked questions and their answers</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddFaq(true)}
          >
            <FaPlus /> Add FAQ Response
          </button>
        </div>

        {showAddFaq && (
          <div className="add-form">
            <h3>Add New FAQ Response</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Question</label>
                <input
                  type="text"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  placeholder="Enter the question..."
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newFaq.category}
                  onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>User Type</label>
                <select
                  value={newFaq.userType}
                  onChange={(e) => setNewFaq({ ...newFaq, userType: e.target.value })}
                >
                  {userTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Answer</label>
              <textarea
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                placeholder="Enter the answer..."
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Keywords (comma-separated)</label>
              <input
                type="text"
                value={newFaq.keywords}
                onChange={(e) => setNewFaq({ ...newFaq, keywords: e.target.value })}
                placeholder="e.g., hours, visiting, open, time"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleAddFaq}>
                <FaSave /> Add FAQ
              </button>
              <button className="btn btn-outline" onClick={() => setShowAddFaq(false)}>
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        )}

        <div className="faq-list">
          {config.faqResponses.map((faq) => (
            <div key={faq._id} className="faq-item">
              {editingFaq === faq._id ? (
                <EditFaqForm
                  faq={faq}
                  onSave={(updated) => handleUpdateFaq(faq._id, updated)}
                  onCancel={() => setEditingFaq(null)}
                  categories={categories}
                  userTypes={userTypes}
                />
              ) : (
                <div className="faq-display">
                  <div className="faq-content">
                    <h4 className="faq-question">{faq.question}</h4>
                    <p className="faq-answer">{faq.answer}</p>
                    <div className="faq-meta">
                      <span className={`category-badge ${faq.category}`}>
                        {categories.find(c => c.value === faq.category)?.label}
                      </span>
                      <span className={`user-type-badge ${faq.userType}`}>
                        {userTypes.find(t => t.value === faq.userType)?.label}
                      </span>
                      {faq.keywords && faq.keywords.length > 0 && (
                        <span className="keywords-badge">
                          Keywords: {faq.keywords.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="faq-actions">
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => setEditingFaq(faq._id)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteFaq(faq._id)}
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
  );
}

// Edit Question Form Component
function EditQuestionForm({ question, onSave, onCancel, categories, userTypes }) {
  const [formData, setFormData] = useState({
    question: question.question,
    category: question.category,
    userType: question.userType,
    order: question.order,
    isActive: question.isActive
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Question</label>
          <input
            type="text"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>User Type</label>
          <select
            value={formData.userType}
            onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
          >
            {userTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Order</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
            min="1"
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          <FaSave /> Save
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          <FaTimes /> Cancel
        </button>
      </div>
    </form>
  );
}

// Edit FAQ Form Component
function EditFaqForm({ faq, onSave, onCancel, categories, userTypes }) {
  const [formData, setFormData] = useState({
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    keywords: faq.keywords.join(', '),
    userType: faq.userType,
    isActive: faq.isActive
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
    });
  };

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Question</label>
          <input
            type="text"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>User Type</label>
          <select
            value={formData.userType}
            onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
          >
            {userTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Answer</label>
        <textarea
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          rows="4"
          required
        />
      </div>
      <div className="form-group">
        <label>Keywords (comma-separated)</label>
        <input
          type="text"
          value={formData.keywords}
          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          placeholder="e.g., hours, visiting, open, time"
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          <FaSave /> Save
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          <FaTimes /> Cancel
        </button>
      </div>
    </form>
  );
}
