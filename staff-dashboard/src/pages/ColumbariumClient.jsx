import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './ColumbariumClient.css';

const ColumbariumClient = () => {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('browse');
  const [slots, setSlots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [buildingLayout, setBuildingLayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters for browsing
  const [filters, setFilters] = useState({
    floor: '',
    section: '',
    size: '',
    minPrice: '',
    maxPrice: '',
    page: 1
  });

  // Selected slot for reservation
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showSlotDetailsModal, setShowSlotDetailsModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Reservation form
  const [reservationForm, setReservationForm] = useState({
    clientName: user?.firstName + ' ' + user?.lastName || '',
    clientContact: user?.phone || '',
    clientEmail: user?.email || '',
    deceasedName: '',
    deceasedDateOfBirth: '',
    deceasedDateOfDeath: '',
    deceasedRelationship: '',
    paymentMethod: 'gcash',
    paymentAmount: '',
    duration: 5,
    specialRequirements: '',
    proofImage: null
  });

  const api = (endpoint, options = {}) => {
    const baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : 'https://api.grave-path.com';
    
    return fetch(`${baseURL}/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
  };

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api(`/client/columbarium/slots?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
      } else {
        setError('Failed to fetch available slots');
      }
    } catch (error) {
      setError('Error fetching slots');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReservations = async () => {
    setLoading(true);
    try {
      const response = await api('/client/columbarium/reservations');
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      } else {
        setError('Failed to fetch reservations');
      }
    } catch (error) {
      setError('Error fetching reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildingLayout = async () => {
    try {
      const response = await api('/client/columbarium/building-layout');
      if (response.ok) {
        const data = await response.json();
        setBuildingLayout(data);
      }
    } catch (error) {
      console.error('Error fetching building layout:', error);
    }
  };

  const handleSlotReservation = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(reservationForm).forEach(([key, value]) => {
        if (key === 'proofImage' && value) {
          formData.append(key, value);
        } else if (key !== 'proofImage') {
          formData.append(key, value);
        }
      });
      
      // Add slot ID
      formData.append('slotId', selectedSlot.slotId);

      const response = await api('/client/columbarium/reservations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || 'Reservation submitted successfully!');
        setShowReservationModal(false);
        resetReservationForm();
        fetchAvailableSlots();
        fetchMyReservations();
        setCurrentStep(4);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to submit reservation');
      }
    } catch (error) {
      setError('Error submitting reservation');
    } finally {
      setLoading(false);
    }
  };

  const resetReservationForm = () => {
    setReservationForm({
      clientName: user?.firstName + ' ' + user?.lastName || '',
      clientContact: user?.phone || '',
      clientEmail: user?.email || '',
      deceasedName: '',
      deceasedDateOfBirth: '',
      deceasedDateOfDeath: '',
      deceasedRelationship: '',
      paymentMethod: 'gcash',
      paymentAmount: '',
      duration: 5,
      specialRequirements: '',
      proofImage: null
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH');
  };

  useEffect(() => {
    fetchBuildingLayout();
    if (activeTab === 'browse') {
      fetchAvailableSlots();
      setCurrentStep(1);
    } else if (activeTab === 'reservations') {
      fetchMyReservations();
      setCurrentStep(5);
    } else if (activeTab === 'layout') {
      setCurrentStep(1);
    }
  }, [activeTab, filters]);

  // Update step when user selects a slot
  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
    setCurrentStep(2);
  };

  // Update step when user opens reservation modal
  const handleReservationStart = (slot) => {
    setSelectedSlot(slot);
    setReservationForm({
      ...reservationForm,
      paymentAmount: slot.price
    });
    setShowReservationModal(true);
    setCurrentStep(3);
  };

  return (
    <div className="columbarium-client">
      <div className="columbarium-client-header">
        <div className="header-content">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="header-text">
            <h1>Columbarium Services</h1>
            <p>Browse and reserve columbarium slots for your loved ones</p>
          </div>
        </div>
      </div>

      {/* Process Flow Section */}
      <div className="process-section">
        <div className="section-header">
          <h2>How It Works</h2>
        </div>
        
        <div className="process-flow">
          <div className={`process-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Browse & Filter</h3>
              <p>Find available slots by location, size, and price</p>
            </div>
          </div>

          <div className="process-arrow">→</div>

          <div className={`process-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Select Slot</h3>
              <p>Choose your preferred slot and click reserve</p>
            </div>
          </div>

          <div className="process-arrow">→</div>

          <div className={`process-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Complete Form</h3>
              <p>Provide details and upload payment proof</p>
            </div>
          </div>

          <div className="process-arrow">→</div>

          <div className={`process-step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Submit & Wait</h3>
              <p>Staff reviews your application (1-3 days)</p>
            </div>
          </div>

          <div className="process-arrow">→</div>

          <div className={`process-step ${currentStep >= 5 ? 'active' : ''}`}>
            <div className="step-number">5</div>
            <div className="step-content">
              <h3>Get Confirmed</h3>
              <p>Receive approval and manage your reservation</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'browse' ? 'active' : ''}
          onClick={() => setActiveTab('browse')}
        >
          Browse Slots
        </button>
        <button 
          className={activeTab === 'reservations' ? 'active' : ''}
          onClick={() => setActiveTab('reservations')}
        >
          My Reservations
        </button>
        <button 
          className={activeTab === 'layout' ? 'active' : ''}
          onClick={() => setActiveTab('layout')}
        >
          Building Layout
        </button>
      </div>

      {/* Browse Slots Tab */}
      {activeTab === 'browse' && (
        <div className="browse-section">
          <div className="section-header">
            <h2>Available Columbarium Slots</h2>
          </div>

          {/* Filters */}
          <div className="filters">
            <select 
              value={filters.floor}
              onChange={(e) => setFilters({...filters, floor: e.target.value, page: 1})}
            >
              <option value="">All Floors</option>
              {[1,2,3,4,5].map(floor => (
                <option key={floor} value={floor}>Floor {floor}</option>
              ))}
            </select>

            <select 
              value={filters.section}
              onChange={(e) => setFilters({...filters, section: e.target.value, page: 1})}
            >
              <option value="">All Sections</option>
              {['A','B','C','D','E','F'].map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>

            <select 
              value={filters.size}
              onChange={(e) => setFilters({...filters, size: e.target.value, page: 1})}
            >
              <option value="">All Sizes</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="family">Family</option>
            </select>

            <input 
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value, page: 1})}
            />

            <input 
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value, page: 1})}
            />
          </div>

          {/* Slots Grid */}
          <div className="slots-grid">
            {loading ? (
              <div className="loading">Loading available slots...</div>
            ) : slots.length === 0 ? (
              <div className="no-data">No slots available matching your criteria</div>
            ) : (
              slots.map(slot => (
                <div key={slot.slotId} className="slot-card">
                  <div className="slot-header">
                    <h3 className="slot-id">{slot.slotId}</h3>
                    <span className={`size-badge ${slot.size}`}>{slot.size}</span>
                  </div>
                  
                  <div className="slot-details">
                    <div className="detail-item">
                      <span className="label">Location:</span>
                      <span>Floor {slot.floor}, Section {slot.section}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Position:</span>
                      <span>Row {slot.row}, Column {slot.column}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Dimensions:</span>
                      <span>{slot.dimensions.width}×{slot.dimensions.height}×{slot.dimensions.depth} cm</span>
                    </div>
                  </div>
                  
                  <div className="slot-price">
                    {formatCurrency(slot.price)}
                  </div>
                  
                  <div className="slot-actions">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSlotSelection(slot)}
                    >
                      View Details
                    </button>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleReservationStart(slot)}
                    >
                      Reserve Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* My Reservations Tab */}
      {activeTab === 'reservations' && (
        <div className="reservations-section">
          <div className="section-header">
            <h2>My Columbarium Reservations</h2>
          </div>

          <div className="reservations-list">
            {loading ? (
              <div className="loading">Loading your reservations...</div>
            ) : reservations.length === 0 ? (
              <div className="no-data">You have no columbarium reservations yet</div>
            ) : (
              reservations.map(reservation => (
                <div key={reservation._id} className="reservation-card">
                  <div className="reservation-header">
                    <h3>Reservation #{reservation._id.slice(-6)}</h3>
                    <span className={`status-badge ${reservation.status}`}>
                      {reservation.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="reservation-details">
                    <div className="details-grid">
                      <div className="detail-group">
                        <h4>Slot Information</h4>
                        <p><strong>Slot ID:</strong> {reservation.slotId}</p>
                        {reservation.slotDetails && (
                          <>
                            <p><strong>Location:</strong> Floor {reservation.slotDetails.floor}, Section {reservation.slotDetails.section}</p>
                            <p><strong>Size:</strong> {reservation.slotDetails.size}</p>
                            <p><strong>Price:</strong> {formatCurrency(reservation.slotDetails.price)}</p>
                          </>
                        )}
                      </div>
                      
                      <div className="detail-group">
                        <h4>Deceased Information</h4>
                        <p><strong>Name:</strong> {reservation.deceasedInfo.name}</p>
                        <p><strong>Relationship:</strong> {reservation.deceasedInfo.relationship}</p>
                        <p><strong>Birth:</strong> {formatDate(reservation.deceasedInfo.dateOfBirth)}</p>
                        <p><strong>Death:</strong> {formatDate(reservation.deceasedInfo.dateOfDeath)}</p>
                      </div>
                      
                      <div className="detail-group">
                        <h4>Payment Information</h4>
                        <p><strong>Method:</strong> {reservation.paymentMethod.toUpperCase()}</p>
                        <p><strong>Amount:</strong> {formatCurrency(reservation.paymentAmount)}</p>
                        <p><strong>Duration:</strong> {reservation.duration} years</p>
                      </div>
                      
                      <div className="detail-group">
                        <h4>Status Information</h4>
                        <p><strong>Submitted:</strong> {formatDate(reservation.createdAt)}</p>
                        {reservation.approvedAt && (
                          <p><strong>Approved:</strong> {formatDate(reservation.approvedAt)}</p>
                        )}
                        {reservation.renewalDate && (
                          <p><strong>Renewal Due:</strong> {formatDate(reservation.renewalDate)}</p>
                        )}
                      </div>
                    </div>
                    
                    {reservation.specialRequirements && (
                      <div className="special-requirements">
                        <h4>Special Requirements</h4>
                        <p>{reservation.specialRequirements}</p>
                      </div>
                    )}
                    
                    {reservation.rejectionReason && (
                      <div className="rejection-reason">
                        <h4>Rejection Reason</h4>
                        <p>{reservation.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Building Layout Tab */}
      {activeTab === 'layout' && (
        <div className="layout-section">
          <div className="section-header">
            <h2>Columbarium Building Layout</h2>
          </div>
          
          {buildingLayout ? (
            <div className="building-layout">
              <div className="layout-info">
                <p>Total Available Slots: <strong>{buildingLayout.metadata.totalAvailable}</strong></p>
                <p>Floors: <strong>{buildingLayout.metadata.floors.join(', ')}</strong></p>
                <p>Sections: <strong>{buildingLayout.metadata.sections.join(', ')}</strong></p>
              </div>
              
              <div className="floors-container">
                {buildingLayout.metadata.floors.map(floor => (
                  <div key={floor} className="floor-layout">
                    <h3>Floor {floor}</h3>
                    <div className="sections-grid">
                      {buildingLayout.metadata.sections.map(section => {
                        const sectionSlots = buildingLayout.layout[floor]?.[section] || [];
                        return (
                          <div key={section} className="section-block">
                            <h4>Section {section}</h4>
                            <div className="slots-count">
                              {sectionSlots.length} available
                            </div>
                            <div className="slots-preview">
                              {sectionSlots.slice(0, 6).map(slot => (
                                <div key={slot.slotId} className="slot-mini">
                                  {slot.slotId}
                                </div>
                              ))}
                              {sectionSlots.length > 6 && (
                                <div className="slot-mini more">
                                  +{sectionSlots.length - 6}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="loading">Loading building layout...</div>
          )}
        </div>
      )}

      {/* Slot Details Modal */}
      {showSlotDetailsModal && selectedSlot && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Slot Details - {selectedSlot.slotId}</h3>
              <button onClick={() => setShowSlotDetailsModal(false)}>×</button>
            </div>
            <div className="slot-details-modal">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Building:</span>
                  <span>{selectedSlot.building}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Floor:</span>
                  <span>{selectedSlot.floor}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Section:</span>
                  <span>{selectedSlot.section}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Row:</span>
                  <span>{selectedSlot.row}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Column:</span>
                  <span>{selectedSlot.column}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Size:</span>
                  <span className={`size-badge ${selectedSlot.size}`}>{selectedSlot.size}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Dimensions:</span>
                  <span>{selectedSlot.dimensions.width} × {selectedSlot.dimensions.height} × {selectedSlot.dimensions.depth} cm</span>
                </div>
                <div className="detail-item">
                  <span className="label">Price:</span>
                  <span className="price">{formatCurrency(selectedSlot.price)}</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowSlotDetailsModal(false)}>Close</button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowSlotDetailsModal(false);
                  setReservationForm({
                    ...reservationForm,
                    paymentAmount: selectedSlot.price
                  });
                  setShowReservationModal(true);
                }}
              >
                Reserve This Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && selectedSlot && (
        <div className="modal">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Reserve Slot {selectedSlot.slotId}</h3>
              <button onClick={() => setShowReservationModal(false)}>×</button>
            </div>
            <form onSubmit={handleSlotReservation}>
              <div className="form-sections">
                <div className="form-section">
                  <h4>Client Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input 
                        type="text"
                        value={reservationForm.clientName}
                        onChange={(e) => setReservationForm({...reservationForm, clientName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Number</label>
                      <input 
                        type="text"
                        value={reservationForm.clientContact}
                        onChange={(e) => setReservationForm({...reservationForm, clientContact: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input 
                        type="email"
                        value={reservationForm.clientEmail}
                        onChange={(e) => setReservationForm({...reservationForm, clientEmail: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Deceased Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name of Deceased</label>
                      <input 
                        type="text"
                        value={reservationForm.deceasedName}
                        onChange={(e) => setReservationForm({...reservationForm, deceasedName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input 
                        type="date"
                        value={reservationForm.deceasedDateOfBirth}
                        onChange={(e) => setReservationForm({...reservationForm, deceasedDateOfBirth: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Date of Death</label>
                      <input 
                        type="date"
                        value={reservationForm.deceasedDateOfDeath}
                        onChange={(e) => setReservationForm({...reservationForm, deceasedDateOfDeath: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Relationship to You</label>
                      <input 
                        type="text"
                        value={reservationForm.deceasedRelationship}
                        onChange={(e) => setReservationForm({...reservationForm, deceasedRelationship: e.target.value})}
                        placeholder="e.g., Spouse, Parent, Child, Sibling"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Payment Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Payment Method</label>
                      <select 
                        value={reservationForm.paymentMethod}
                        onChange={(e) => setReservationForm({...reservationForm, paymentMethod: e.target.value})}
                        required
                      >
                        <option value="gcash">GCash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="credit_card">Credit Card</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Payment Amount (PHP)</label>
                      <input 
                        type="number"
                        min={selectedSlot.price}
                        value={reservationForm.paymentAmount}
                        onChange={(e) => setReservationForm({...reservationForm, paymentAmount: e.target.value})}
                        required
                      />
                      <small>Minimum: {formatCurrency(selectedSlot.price)}</small>
                    </div>
                    <div className="form-group">
                      <label>Duration (Years)</label>
                      <select 
                        value={reservationForm.duration}
                        onChange={(e) => setReservationForm({...reservationForm, duration: parseInt(e.target.value)})}
                        required
                      >
                        <option value={5}>5 years</option>
                        <option value={10}>10 years</option>
                        <option value={25}>25 years</option>
                        <option value={99}>Perpetual</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Payment Proof (Required)</label>
                      <input 
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setReservationForm({...reservationForm, proofImage: e.target.files[0]})}
                        required
                      />
                      <small>Upload receipt or proof of payment</small>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Additional Information</h4>
                  <div className="form-group">
                    <label>Special Requirements (Optional)</label>
                    <textarea 
                      value={reservationForm.specialRequirements}
                      onChange={(e) => setReservationForm({...reservationForm, specialRequirements: e.target.value})}
                      placeholder="Any special requirements or requests..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowReservationModal(false)}>Cancel</button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumbariumClient;
