import React, { useState, useEffect } from 'react';
import './CreateLotModal.css';

export default function CreateLotModal({ 
  show, 
  onClose, 
  onSave, 
  onDelete,
  onMove,
  initialLot = null,
  position = null 
}) {
  // Function to generate unique lot ID
  const generateLotId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `LOT-${timestamp}-${randomStr}`.toUpperCase();
  };

  const [lot, setLot] = useState({
    id: initialLot ? initialLot.id : generateLotId(),
    type: initialLot ? (initialLot.type || 'lot') : 'lot', // 'lot' or 'landmark'
    block: '',
    lotNumber: '',
    name: '',
    birth: '',
    death: '',
    status: 'available',
    sqm: '12.5',
    pricePerSqm: '4000',
    price: '50000',
    location: '',
    landmark: '',
    bounds: position ? [
      [position[0], position[1]],
      [position[0], position[1]]
    ] : [[0, 0], [0, 0]]
  });

  // Common landmark options
  const landmarkOptions = [
    { value: '', label: 'Select a landmark (optional)' },
    { value: 'Main Office', label: 'Main Office' },
    { value: 'Chapel', label: 'Chapel' },
    { value: 'Restroom', label: 'Restroom' },
    { value: 'Memorial Garden', label: 'Memorial Garden' },
    { value: 'Parking Area', label: 'Parking Area' },
    { value: 'Main Entrance', label: 'Main Entrance' },
    { value: 'Side Entrance', label: 'Side Entrance' },
    { value: 'Maintenance Building', label: 'Maintenance Building' },
    { value: 'Bell Tower', label: 'Bell Tower' },
    { value: 'Water Fountain', label: 'Water Fountain' },
    { value: 'Gazebo', label: 'Gazebo' },
    { value: 'Custom', label: 'Custom (enter below)' }
  ];

  const [customLandmark, setCustomLandmark] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Update form when initialLot changes
  useEffect(() => {
    if (initialLot) {
      console.log('Initial lot data:', initialLot);
      const isCustomLandmark = initialLot.landmark && 
        !landmarkOptions.some(option => option.value === initialLot.landmark);
      
      setLot({
        id: initialLot.id || generateLotId(),
        type: initialLot.type || 'lot',
        block: initialLot.block || '',
        lotNumber: initialLot.lotNumber || '',
        name: initialLot.name || '',
        birth: initialLot.birth || '',
        death: initialLot.death || '',
        status: initialLot.status || 'available',
        sqm: initialLot.sqm || '12.5',
        pricePerSqm: initialLot.pricePerSqm || '4000',
        price: initialLot.price || '50000',
        location: initialLot.location || '',
        landmark: isCustomLandmark ? 'Custom' : (initialLot.landmark || ''),
        bounds: initialLot.bounds || [[0, 0], [0, 0]]
      });

      if (isCustomLandmark) {
        setCustomLandmark(initialLot.landmark);
        setShowCustomInput(true);
      }
    } else {
      // Reset form for new lot creation with new generated ID
      setLot(prevLot => ({
        ...prevLot,
        id: generateLotId(),
        type: 'lot',
        block: '',
        lotNumber: '',
        name: '',
        birth: '',
        death: '',
        status: 'available',
        location: '',
        landmark: ''
      }));
      setShowCustomInput(false);
      setCustomLandmark('');
    }
  }, [initialLot]);

  // Calculate total price when sqm or pricePerSqm changes
  useEffect(() => {
    const sqmValue = parseFloat(lot.sqm) || 0;
    const pricePerSqmValue = parseFloat(lot.pricePerSqm) || 4000;
    const calculatedPrice = sqmValue * pricePerSqmValue;
    console.log('Calculating price:', { sqm: sqmValue, pricePerSqm: pricePerSqmValue, total: calculatedPrice });
    
    if (!isNaN(calculatedPrice)) {
      setLot(prevLot => ({
        ...prevLot,
        price: calculatedPrice.toString()
      }));
    }
  }, [lot.sqm, lot.pricePerSqm]);

  const handleLandmarkChange = (e) => {
    const selectedValue = e.target.value;
    setLot({...lot, landmark: selectedValue});
    
    if (selectedValue === 'Custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomLandmark('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (lot.type === 'landmark' && !lot.name.trim()) {
      alert('Landmark name is required');
      return;
    }

    // Validate bounds format
    if (!lot.bounds || 
        !Array.isArray(lot.bounds) || 
        lot.bounds.length !== 2 ||
        !Array.isArray(lot.bounds[0]) || lot.bounds[0].length !== 2 ||
        !Array.isArray(lot.bounds[1]) || lot.bounds[1].length !== 2) {
      console.error('Invalid bounds format:', lot.bounds);
      alert('Invalid bounds data format');
      return;
    }

    // Validate numeric values in bounds
    const allNumbers = lot.bounds.every(point => 
      point.every(coord => typeof coord === 'number' && !isNaN(coord))
    );
    if (!allNumbers) {
      console.error('Bounds contain non-numeric values:', lot.bounds);
      alert('Invalid coordinates in bounds');
      return;
    }

    let finalData;

    if (lot.type === 'landmark') {
      // For landmarks, create simplified data structure
      finalData = {
        id: lot.id,
        type: 'landmark',
        name: lot.name.trim(),
        location: lot.location.trim(),
        bounds: lot.bounds,
        status: 'landmark' // Special status for landmarks
      };
    } else {
      // For lots, use the existing structure
      const sqmValue = parseFloat(lot.sqm) || 0;
      const pricePerSqmValue = parseFloat(lot.pricePerSqm) || 4000;
      const calculatedPrice = sqmValue * pricePerSqmValue;

      // Handle landmark value
      const finalLandmark = lot.landmark === 'Custom' ? customLandmark.trim() : lot.landmark;

      finalData = {
        ...lot,
        type: 'lot',
        sqm: sqmValue.toString(),
        pricePerSqm: pricePerSqmValue.toString(),
        price: calculatedPrice.toString(),
        landmark: finalLandmark
      };
    }

    console.log('Submitting data:', finalData);
    onSave(finalData);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{initialLot ? `Edit ${lot.type === 'landmark' ? 'Landmark' : 'Lot'}` : 'Create New Item'}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Type:
            <select
              value={lot.type}
              onChange={e => setLot({...lot, type: e.target.value})}
              disabled={!!initialLot} // Can't change type when editing
            >
              <option value="lot">Cemetery Lot</option>
              <option value="landmark">Landmark</option>
            </select>
          </label>

          <label>
            ID (System Generated):
            <input
              type="text"
              value={lot.id}
              disabled={true} // Always disabled - system generated
              style={{ backgroundColor: '#f5f5f5', color: '#666' }}
            />
          </label>

          {lot.type === 'lot' && (
            <>
              <label>
                Block:
                <input
                  type="text"
                  value={lot.block}
                  onChange={e => setLot({...lot, block: e.target.value})}
                  placeholder="e.g., A, B, C, 1, 2, 3"
                />
              </label>

              <label>
                Lot Number:
                <input
                  type="text"
                  value={lot.lotNumber}
                  onChange={e => setLot({...lot, lotNumber: e.target.value})}
                  placeholder="e.g., 1, 2, 3, 001, 002"
                />
              </label>
            </>
          )}

          <label>
            Name:
            <input
              type="text"
              value={lot.name}
              onChange={e => setLot({...lot, name: e.target.value})}
              placeholder={lot.type === 'landmark' ? 'e.g., Chapel, Restroom, Main Office' : 'Occupant name (optional)'}
              required={lot.type === 'landmark'}
            />
          </label>

          {lot.type === 'lot' && (
            <>
              <label>
                Birth:
                <input
                  type="date"
                  value={lot.birth}
                  onChange={e => setLot({...lot, birth: e.target.value})}
                />
              </label>

              <label>
                Death:
                <input
                  type="date"
                  value={lot.death}
                  onChange={e => setLot({...lot, death: e.target.value})}
                />
              </label>

              <label>
                Square Meters:
                <input
                  type="number"
                  value={lot.sqm}
                  onChange={e => setLot({...lot, sqm: e.target.value})}
                  step="0.1"
                  min="0"
                />
              </label>

              <label>
                Price per Sq.m (₱):
                <input
                  type="number"
                  value={lot.pricePerSqm}
                  onChange={e => setLot({...lot, pricePerSqm: e.target.value})}
                  step="100"
                  min="0"
                />
              </label>

              <label>
                Total Price (₱):
                <input
                  type="text"
                  value={Number(lot.price).toLocaleString()}
                  readOnly
                  disabled
                />
              </label>

              <label>
                Status:
                <select
                  value={lot.status}
                  onChange={e => setLot({...lot, status: e.target.value})}
                  disabled={!initialLot}
                >
                  <option value="available">Available</option>
                  {initialLot && (
                    <>
                      <option value="unavailable">Unavailable</option>
                      <option value="reserved">Reserved</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                    </>
                  )}
                </select>
              </label>
            </>
          )}

          <label>
            Location:
            <input
              type="text"
              value={lot.location}
              onChange={e => setLot({...lot, location: e.target.value})}
              placeholder={lot.type === 'landmark' ? 'Describe the location' : 'Plot location/section'}
            />
          </label>

          {lot.type === 'lot' && (
            <>
              <label>
                Nearby Landmark:
                <select
                  value={lot.landmark}
                  onChange={handleLandmarkChange}
                >
                  {landmarkOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              {showCustomInput && (
                <label>
                  Custom Landmark:
                  <input
                    type="text"
                    value={customLandmark}
                    onChange={e => setCustomLandmark(e.target.value)}
                    placeholder="Enter custom landmark name"
                  />
                </label>
              )}
            </>
          )}

          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            {initialLot && (
              <>
                <button 
                  type="button" 
                  className="delete-button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this lot?')) {
                      const lotId = initialLot._id || initialLot.id;
                      if (!lotId) {
                        console.error('No valid ID found in lot:', initialLot);
                        return;
                      }
                      onDelete(lotId);
                      onClose();
                    }
                  }}
                >
                  Delete
                </button>
                <button 
                  type="button" 
                  className="move-button"
                  onClick={() => {
                    console.log('Move button clicked with lot:', initialLot);
                    onMove(initialLot);
                    onClose();
                  }}
                >
                  Move
                </button>
              </>
            )}
            <button type="submit" className="save-button">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
} 