import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import './ColumbariumModals.css';

const BulkCreateModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    building: 'Main Building',
    startFloor: 1,
    endFloor: 1,
    sections: ['A'],
    startRow: 1,
    endRow: 1,
    startColumn: 1,
    endColumn: 1,
    size: 'single',
    basePrice: 50000,
    priceMultiplier: 1.0,
    status: 'available'
  });

  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.building) newErrors.building = 'Building is required';
    if (formData.startFloor < 1 || formData.startFloor > 5) {
      newErrors.startFloor = 'Start floor must be between 1 and 5';
    }
    if (formData.endFloor < formData.startFloor || formData.endFloor > 5) {
      newErrors.endFloor = 'End floor must be >= start floor and <= 5';
    }
    if (formData.sections.length === 0) {
      newErrors.sections = 'At least one section must be selected';
    }
    if (formData.startRow < 1 || formData.startRow > 20) {
      newErrors.startRow = 'Start row must be between 1 and 20';
    }
    if (formData.endRow < formData.startRow || formData.endRow > 20) {
      newErrors.endRow = 'End row must be >= start row and <= 20';
    }
    if (formData.startColumn < 1 || formData.startColumn > 10) {
      newErrors.startColumn = 'Start column must be between 1 and 10';
    }
    if (formData.endColumn < formData.startColumn || formData.endColumn > 10) {
      newErrors.endColumn = 'End column must be >= start column and <= 10';
    }
    if (!formData.basePrice || formData.basePrice < 0) {
      newErrors.basePrice = 'Base price must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculatePreview = () => {
    const floors = formData.endFloor - formData.startFloor + 1;
    const sections = formData.sections.length;
    const rows = formData.endRow - formData.startRow + 1;
    const columns = formData.endColumn - formData.startColumn + 1;
    const totalSlots = floors * sections * rows * columns;

    setPreview({
      floors,
      sections,
      rows,
      columns,
      totalSlots
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const slots = generateSlots();
      onSave({ slots });
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

  const handleSectionChange = (section) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  const handlePreview = () => {
    if (validateForm()) {
      calculatePreview();
    }
  };

  const generateSlots = () => {
    const slots = [];
    const floors = formData.endFloor - formData.startFloor + 1;
    const sections = formData.sections;
    const rows = formData.endRow - formData.startRow + 1;
    const columns = formData.endColumn - formData.startColumn + 1;

    for (let floor = formData.startFloor; floor <= formData.endFloor; floor++) {
      for (const section of sections) {
        for (let row = formData.startRow; row <= formData.endRow; row++) {
          for (let column = formData.startColumn; column <= formData.endColumn; column++) {
            const slotId = `${formData.building.substring(0, 1)}${floor}${section}${String(row).padStart(2, '0')}${String(column).padStart(2, '0')}`;
            
            // Calculate price with multiplier
            let price = formData.basePrice;
            if (floor <= 2) price *= 1.2; // Ground and first floor premium
            if (section === 'A' || section === 'B') price *= 1.1; // Front sections premium
            price *= formData.priceMultiplier;

            // Dimensions based on size
            let dimensions = { width: 30, height: 30, depth: 30 };
            if (formData.size === 'double') {
              dimensions = { width: 60, height: 30, depth: 30 };
            } else if (formData.size === 'family') {
              dimensions = { width: 90, height: 45, depth: 45 };
              price *= 2.5; // Family slots cost more
            }

            slots.push({
              slotId,
              building: formData.building,
              floor,
              section,
              row,
              column,
              size: formData.size,
              dimensions,
              price: Math.round(price),
              status: formData.status,
              position: {
                x: (column - 1) * 40,
                y: (row - 1) * 40,
                z: (floor - 1) * 250
              }
            });
          }
        }
      }
    }

    return slots;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content columbarium-modal bulk-modal">
        <div className="modal-header">
          <h2>Bulk Create Slots</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bulk-form">
          <div className="form-section">
            <h3>Building Configuration</h3>
            
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
            </div>
          </div>

          <div className="form-section">
            <h3>Floor Range</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Start Floor *</label>
                <select
                  value={formData.startFloor}
                  onChange={(e) => handleInputChange('startFloor', parseInt(e.target.value))}
                  className={errors.startFloor ? 'error' : ''}
                >
                  <option value={1}>Floor 1</option>
                  <option value={2}>Floor 2</option>
                  <option value={3}>Floor 3</option>
                  <option value={4}>Floor 4</option>
                  <option value={5}>Floor 5</option>
                </select>
                {errors.startFloor && <span className="error-text">{errors.startFloor}</span>}
              </div>

              <div className="form-group">
                <label>End Floor *</label>
                <select
                  value={formData.endFloor}
                  onChange={(e) => handleInputChange('endFloor', parseInt(e.target.value))}
                  className={errors.endFloor ? 'error' : ''}
                >
                  <option value={1}>Floor 1</option>
                  <option value={2}>Floor 2</option>
                  <option value={3}>Floor 3</option>
                  <option value={4}>Floor 4</option>
                  <option value={5}>Floor 5</option>
                </select>
                {errors.endFloor && <span className="error-text">{errors.endFloor}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Sections</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Select Sections *</label>
                <div className="checkbox-group">
                  {['A', 'B', 'C', 'D'].map(section => (
                    <label key={section} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.sections.includes(section)}
                        onChange={() => handleSectionChange(section)}
                      />
                      Section {section}
                    </label>
                  ))}
                </div>
                {errors.sections && <span className="error-text">{errors.sections}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Row Range</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Start Row *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.startRow}
                  onChange={(e) => handleInputChange('startRow', parseInt(e.target.value))}
                  className={errors.startRow ? 'error' : ''}
                />
                {errors.startRow && <span className="error-text">{errors.startRow}</span>}
              </div>

              <div className="form-group">
                <label>End Row *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.endRow}
                  onChange={(e) => handleInputChange('endRow', parseInt(e.target.value))}
                  className={errors.endRow ? 'error' : ''}
                />
                {errors.endRow && <span className="error-text">{errors.endRow}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Column Range</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Start Column *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.startColumn}
                  onChange={(e) => handleInputChange('startColumn', parseInt(e.target.value))}
                  className={errors.startColumn ? 'error' : ''}
                />
                {errors.startColumn && <span className="error-text">{errors.startColumn}</span>}
              </div>

              <div className="form-group">
                <label>End Column *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.endColumn}
                  onChange={(e) => handleInputChange('endColumn', parseInt(e.target.value))}
                  className={errors.endColumn ? 'error' : ''}
                />
                {errors.endColumn && <span className="error-text">{errors.endColumn}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Slot Configuration</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Size</label>
                <select
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="family">Family</option>
                </select>
              </div>

              <div className="form-group">
                <label>Base Price (₱) *</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value))}
                  className={errors.basePrice ? 'error' : ''}
                />
                {errors.basePrice && <span className="error-text">{errors.basePrice}</span>}
              </div>

              <div className="form-group">
                <label>Price Multiplier</label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={formData.priceMultiplier}
                  onChange={(e) => handleInputChange('priceMultiplier', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {preview && (
            <div className="form-section">
              <h3>Preview</h3>
              <div className="preview-info">
                <p><strong>Total Slots to Create:</strong> {preview.totalSlots}</p>
                <p><strong>Floors:</strong> {preview.floors}</p>
                <p><strong>Sections:</strong> {preview.sections}</p>
                <p><strong>Rows per Section:</strong> {preview.rows}</p>
                <p><strong>Columns per Row:</strong> {preview.columns}</p>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-secondary" onClick={handlePreview}>
              Preview
            </button>
            <button type="submit" className="btn btn-primary">
              Create {preview?.totalSlots || 'Slots'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkCreateModal;
