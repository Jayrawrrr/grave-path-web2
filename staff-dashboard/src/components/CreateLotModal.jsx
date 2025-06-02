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
  const [lot, setLot] = useState({
    id: '',
    name: '',
    birth: '',
    death: '',
    status: 'available',
    sqm: '12.5',
    pricePerSqm: '4000',
    price: '50000',
    location: '',
    bounds: position ? [
      [position[0], position[1]],
      [position[0], position[1]]
    ] : [[0, 0], [0, 0]]
  });

  // Update form when initialLot changes
  useEffect(() => {
    if (initialLot) {
      console.log('Initial lot data:', initialLot);
      setLot({
        id: initialLot.id || '',
        name: initialLot.name || '',
        birth: initialLot.birth || '',
        death: initialLot.death || '',
        status: initialLot.status || 'available',
        sqm: initialLot.sqm || '12.5',
        pricePerSqm: initialLot.pricePerSqm || '4000',
        price: initialLot.price || '50000',
        location: initialLot.location || '',
        bounds: initialLot.bounds || [[0, 0], [0, 0]]
      });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!lot.id.trim()) {
      alert('Please enter a lot ID');
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

    // Calculate final price before submission
    const sqmValue = parseFloat(lot.sqm) || 0;
    const pricePerSqmValue = parseFloat(lot.pricePerSqm) || 4000;
    const calculatedPrice = sqmValue * pricePerSqmValue;

    const lotWithPrice = {
      ...lot,
      sqm: sqmValue.toString(),
      pricePerSqm: pricePerSqmValue.toString(),
      price: calculatedPrice.toString()
    };

    console.log('Submitting lot data:', lotWithPrice);
    onSave(lotWithPrice);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{initialLot ? 'Edit Lot' : 'Create New Lot'}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            ID:
            <input
              type="text"
              value={lot.id}
              onChange={e => setLot({...lot, id: e.target.value})}
              required
              disabled={initialLot} // Disable ID field when editing
            />
          </label>

          <label>
            Name:
            <input
              type="text"
              value={lot.name}
              onChange={e => setLot({...lot, name: e.target.value})}
            />
          </label>

          <label>
            Birth:
            <input
              type="text"
              value={lot.birth}
              onChange={e => setLot({...lot, birth: e.target.value})}
              placeholder="YYYY-MM-DD"
            />
          </label>

          <label>
            Death:
            <input
              type="text"
              value={lot.death}
              onChange={e => setLot({...lot, death: e.target.value})}
              placeholder="YYYY-MM-DD"
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
            Location:
            <input
              type="text"
              value={lot.location}
              onChange={e => setLot({...lot, location: e.target.value})}
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