import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import './ColumbariumModals.css';

const CreateSlotModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    building: 'Main Building',
    floor: 1,
    section: 'A',
    row: 1,
    column: 1,
    size: 'single',
    dimensions: {
      width: 30,
      height: 30,
      depth: 30
    },
    price: 50000,
    status: 'available',
    position: {
      x: 0,
      y: 0,
      z: 0
    }
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.building) newErrors.building = 'Building is required';
    if (!formData.floor || formData.floor < 1 || formData.floor > 5) {
      newErrors.floor = 'Floor must be between 1 and 5';
    }
    if (!formData.section) newErrors.section = 'Section is required';
    if (!formData.row || formData.row < 1 || formData.row > 20) {
      newErrors.row = 'Row must be between 1 and 20';
    }
    if (!formData.column || formData.column < 1 || formData.column > 10) {
      newErrors.column = 'Column must be between 1 and 10';
    }
    if (!formData.price || formData.price < 0) {
      newErrors.price = 'Price must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDimensionChange = (dimension, value) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: parseInt(value) || 0
      }
    }));
  };

  const handlePositionChange = (axis, value) => {
    setFormData(prev => ({
      ...prev,
      position: {
        ...prev.position,
        [axis]: parseInt(value) || 0
      }
    }));
  };

  const updateDimensionsBySize = (size) => {
    let dimensions = { width: 30, height: 30, depth: 30 };
    
    if (size === 'double') {
      dimensions = { width: 60, height: 30, depth: 30 };
    } else if (size === 'family') {
      dimensions = { width: 90, height: 45, depth: 45 };
    }

    setFormData(prev => ({
      ...prev,
      size,
      dimensions
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content columbarium-modal">
        <div className="modal-header">
          <h2>Create New Slot</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="slot-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Building *</label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => handleInputChange('building', e.target.value)}
                  className={errors.building ? 'error' : ''}
                />
                {errors.building && <span className="error-text">{errors.building}</span>}
              </div>

              <div className="form-group">
                <label>Floor *</label>
                <select
                  value={formData.floor}
                  onChange={(e) => handleInputChange('floor', parseInt(e.target.value))}
                  className={errors.floor ? 'error' : ''}
                >
                  <option value={1}>Floor 1</option>
                  <option value={2}>Floor 2</option>
                  <option value={3}>Floor 3</option>
                  <option value={4}>Floor 4</option>
                  <option value={5}>Floor 5</option>
                </select>
                {errors.floor && <span className="error-text">{errors.floor}</span>}
              </div>

              <div className="form-group">
                <label>Section *</label>
                <select
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  className={errors.section ? 'error' : ''}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
                {errors.section && <span className="error-text">{errors.section}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Row *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.row}
                  onChange={(e) => handleInputChange('row', parseInt(e.target.value))}
                  className={errors.row ? 'error' : ''}
                />
                {errors.row && <span className="error-text">{errors.row}</span>}
              </div>

              <div className="form-group">
                <label>Column *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.column}
                  onChange={(e) => handleInputChange('column', parseInt(e.target.value))}
                  className={errors.column ? 'error' : ''}
                />
                {errors.column && <span className="error-text">{errors.column}</span>}
              </div>

              <div className="form-group">
                <label>Size *</label>
                <select
                  value={formData.size}
                  onChange={(e) => updateDimensionsBySize(e.target.value)}
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="family">Family</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Dimensions (cm)</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Width</label>
                <input
                  type="number"
                  min="1"
                  value={formData.dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Height</label>
                <input
                  type="number"
                  min="1"
                  value={formData.dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Depth</label>
                <input
                  type="number"
                  min="1"
                  value={formData.dimensions.depth}
                  onChange={(e) => handleDimensionChange('depth', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Pricing & Status</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Price (₱) *</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>3D Position (cm)</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>X Position</label>
                <input
                  type="number"
                  value={formData.position.x}
                  onChange={(e) => handlePositionChange('x', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Y Position</label>
                <input
                  type="number"
                  value={formData.position.y}
                  onChange={(e) => handlePositionChange('y', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Z Position</label>
                <input
                  type="number"
                  value={formData.position.z}
                  onChange={(e) => handlePositionChange('z', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Slot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSlotModal;
