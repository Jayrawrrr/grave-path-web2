import React from 'react';
import { FaTimes, FaBuilding, FaMapMarkerAlt, FaRuler, FaDollarSign, FaCalendarAlt } from 'react-icons/fa';
import './ColumbariumModals.css';

const SlotDetailsModal = ({ slot, onClose }) => {
  if (!slot) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#34c759';
      case 'reserved': return '#ff9500';
      case 'occupied': return '#ff3b30';
      case 'maintenance': return '#8e8e93';
      default: return '#8e8e93';
    }
  };

  const getSizeDescription = (size) => {
    switch (size) {
      case 'single': return 'Single person (30x30x30 cm)';
      case 'double': return 'Two people (60x30x30 cm)';
      case 'family': return 'Family (90x45x45 cm)';
      default: return 'Unknown size';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content columbarium-modal details-modal">
        <div className="modal-header">
          <h2>Slot Details: {slot.slotId}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="slot-details">
          <div className="details-section">
            <h3>
              <FaBuilding /> Basic Information
            </h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Slot ID:</label>
                <span className="slot-id">{slot.slotId}</span>
              </div>
              <div className="detail-item">
                <label>Building:</label>
                <span>{slot.building}</span>
              </div>
              <div className="detail-item">
                <label>Floor:</label>
                <span>Floor {slot.floor}</span>
              </div>
              <div className="detail-item">
                <label>Section:</label>
                <span>Section {slot.section}</span>
              </div>
              <div className="detail-item">
                <label>Row:</label>
                <span>Row {slot.row}</span>
              </div>
              <div className="detail-item">
                <label>Column:</label>
                <span>Column {slot.column}</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>
              <FaMapMarkerAlt /> Location Details
            </h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Full Location:</label>
                <span>Floor {slot.floor}, Section {slot.section}, Row {slot.row}, Column {slot.column}</span>
              </div>
              <div className="detail-item">
                <label>3D Position:</label>
                <span>X: {slot.position?.x || 0}cm, Y: {slot.position?.y || 0}cm, Z: {slot.position?.z || 0}cm</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>
              <FaRuler /> Dimensions & Size
            </h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Size Type:</label>
                <span className="size-badge">{slot.size}</span>
              </div>
              <div className="detail-item">
                <label>Size Description:</label>
                <span>{getSizeDescription(slot.size)}</span>
              </div>
              <div className="detail-item">
                <label>Width:</label>
                <span>{slot.dimensions?.width || 30} cm</span>
              </div>
              <div className="detail-item">
                <label>Height:</label>
                <span>{slot.dimensions?.height || 30} cm</span>
              </div>
              <div className="detail-item">
                <label>Depth:</label>
                <span>{slot.dimensions?.depth || 30} cm</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>
              <FaDollarSign /> Pricing & Status
            </h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Price:</label>
                <span className="price">₱{slot.price?.toLocaleString() || '0'}</span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(slot.status) }}
                >
                  {slot.status}
                </span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>
              <FaCalendarAlt /> Timestamps
            </h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Created:</label>
                <span>{slot.createdAt ? formatDate(slot.createdAt) : 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <label>Last Updated:</label>
                <span>{slot.updatedAt ? formatDate(slot.updatedAt) : 'Unknown'}</span>
              </div>
            </div>
          </div>

          {slot.status === 'reserved' || slot.status === 'occupied' ? (
            <div className="details-section">
              <h3>Reservation Information</h3>
              <div className="reservation-info">
                <p><strong>Note:</strong> This slot has an active reservation. For detailed reservation information, please check the Reservations tab.</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotDetailsModal;
