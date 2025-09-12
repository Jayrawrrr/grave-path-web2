import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './UserProfile.css';
import {
  FaUser,
  FaEdit,
  FaSave,
  FaTimes,
  FaLock,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUserTie,
  FaUserShield,
  FaCrown,
  FaCalendarAlt,
  FaBell,
  FaGlobe,
  FaClock,
  FaBuilding,
  FaIdCard,
  FaUsers,
  FaKey,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export default function UserProfile({ userId = null, isModal = false, onClose = null }) {
  const { token, role: currentUserRole } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profile: {
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      preferences: {
        notifications: {
          email: true,
          sms: false
        },
        language: 'en',
        timezone: 'America/New_York'
      }
    },
    clientData: {
      membershipType: 'basic',
      preferredPaymentMethod: ''
    },
    staffData: {
      employeeId: '',
      department: '',
      position: '',
      schedule: {
        workDays: [],
        startTime: '09:00',
        endTime: '17:00'
      }
    },
    adminData: {
      adminLevel: 'supervisor',
      departments: []
    }
  });

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const endpoint = userId ? `/profile/${userId}` : '/profile';
      const res = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfile(res.data);
      setFormData({
        firstName: res.data.firstName || '',
        lastName: res.data.lastName || '',
        profile: {
          phone: res.data.profile?.phone || '',
          address: {
            street: res.data.profile?.address?.street || '',
            city: res.data.profile?.address?.city || '',
            state: res.data.profile?.address?.state || '',
            zipCode: res.data.profile?.address?.zipCode || '',
            country: res.data.profile?.address?.country || 'USA'
          },
          emergencyContact: {
            name: res.data.profile?.emergencyContact?.name || '',
            phone: res.data.profile?.emergencyContact?.phone || '',
            relationship: res.data.profile?.emergencyContact?.relationship || ''
          },
          preferences: {
            notifications: {
              email: res.data.profile?.preferences?.notifications?.email !== false,
              sms: res.data.profile?.preferences?.notifications?.sms || false
            },
            language: res.data.profile?.preferences?.language || 'en',
            timezone: res.data.profile?.preferences?.timezone || 'America/New_York'
          }
        },
        clientData: {
          membershipType: res.data.clientData?.membershipType || 'basic',
          preferredPaymentMethod: res.data.clientData?.preferredPaymentMethod || ''
        },
        staffData: {
          employeeId: res.data.staffData?.employeeId || '',
          department: res.data.staffData?.department || '',
          position: res.data.staffData?.position || '',
          schedule: {
            workDays: res.data.staffData?.schedule?.workDays || [],
            startTime: res.data.staffData?.schedule?.startTime || '09:00',
            endTime: res.data.staffData?.schedule?.endTime || '17:00'
          }
        },
        adminData: {
          adminLevel: res.data.adminData?.adminLevel || 'supervisor',
          departments: res.data.adminData?.departments || []
        }
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load profile');
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const endpoint = userId && currentUserRole === 'admin' ? `/profile/${userId}` : '/profile';
      await axios.put(`${API_BASE}${endpoint}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Profile updated successfully!');
      setEditing(false);
      await loadProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile');
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API_BASE}/profile/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Password changed successfully!');
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to change password');
      console.error('Change password error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const pathArray = path.split('.');
      let current = newData;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) current[pathArray[i]] = {};
        current = current[pathArray[i]];
      }
      
      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  };

  const getRoleIcon = (userRole) => {
    switch (userRole) {
      case 'admin': return <FaUserShield className="role-icon admin" />;
      case 'staff': return <FaUserTie className="role-icon staff" />;
      case 'client': return <FaUser className="role-icon client" />;
      default: return <FaUser className="role-icon" />;
    }
  };

  const getRoleBadge = (userRole) => {
    const badges = {
      admin: { class: 'admin', icon: <FaCrown />, text: 'Administrator' },
      staff: { class: 'staff', icon: <FaUserTie />, text: 'Staff Member' },
      client: { class: 'client', icon: <FaUser />, text: 'Client' }
    };
    return badges[userRole] || badges.client;
  };

  if (loading) {
    return (
      <div className={`profile-container ${isModal ? 'modal' : ''}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`profile-container ${isModal ? 'modal' : ''}`}>
        <div className="error-message">
          <p>Profile not found</p>
          {isModal && (
            <button onClick={onClose} className="btn-secondary">Close</button>
          )}
        </div>
      </div>
    );
  }

  const badge = getRoleBadge(profile.role);
  const canEdit = !userId || (userId && currentUserRole === 'admin');
  const isOwnProfile = !userId;

  return (
    <div className={`profile-container ${isModal ? 'modal' : ''}`}>
      {isModal && (
        <div className="modal-backdrop" onClick={onClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={onClose}>
              <FaTimes />
            </button>
            <ProfileContent />
          </div>
        </div>
      )}
      
      {!isModal && <ProfileContent />}
    </div>
  );

  function ProfileContent() {
    return (
      <>
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.profile?.avatar ? (
              <img src={profile.profile.avatar} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                {getRoleIcon(profile.role)}
              </div>
            )}
          </div>
          
          <div className="profile-info">
            <h1 className="profile-name">
              {profile.fullName || `${profile.firstName} ${profile.lastName}`.trim() || 'User'}
            </h1>
            <div className={`role-badge ${badge.class}`}>
              {badge.icon}
              <span>{badge.text}</span>
            </div>
            <p className="profile-email">
              <FaEnvelope /> {profile.email}
            </p>
            {profile.profile?.phone && (
              <p className="profile-phone">
                <FaPhone /> {profile.profile.phone}
              </p>
            )}
          </div>

          <div className="profile-actions">
            {canEdit && (
              <>
                {!editing ? (
                  <button 
                    onClick={() => setEditing(true)} 
                    className="btn-primary"
                    disabled={saving}
                  >
                    <FaEdit /> Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button 
                      onClick={handleSaveProfile} 
                      className="btn-success"
                      disabled={saving}
                    >
                      <FaSave /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      onClick={() => {
                        setEditing(false);
                        loadProfile();
                      }} 
                      className="btn-secondary"
                      disabled={saving}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                )}
                
                {isOwnProfile && (
                  <button 
                    onClick={() => setShowPasswordChange(!showPasswordChange)} 
                    className="btn-outline"
                  >
                    <FaLock /> Change Password
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="alert-close">×</button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            {success}
            <button onClick={() => setSuccess('')} className="alert-close">×</button>
          </div>
        )}

        {/* Password Change Section */}
        {showPasswordChange && isOwnProfile && (
          <div className="password-change-section">
            <h3><FaLock /> Change Password</h3>
            <div className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <div className="password-input">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({
                      ...prev,
                      current: !prev.current
                    }))}
                    className="password-toggle"
                  >
                    {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <div className="password-input">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({
                      ...prev,
                      new: !prev.new
                    }))}
                    className="password-toggle"
                  >
                    {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({
                      ...prev,
                      confirm: !prev.confirm
                    }))}
                    className="password-toggle"
                  >
                    {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div className="password-actions">
                <button 
                  onClick={handleChangePassword} 
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
                <button 
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Sections */}
        <div className="profile-sections">
          {/* Basic Information */}
          <div className="profile-section">
            <h3><FaUser /> Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => handleInputChange('firstName', e.target.value)}
                    placeholder="First Name"
                  />
                ) : (
                  <span className="form-value">{profile.firstName || 'Not set'}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>Last Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => handleInputChange('lastName', e.target.value)}
                    placeholder="Last Name"
                  />
                ) : (
                  <span className="form-value">{profile.lastName || 'Not set'}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <span className="form-value">{profile.email}</span>
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.profile.phone}
                    onChange={e => handleInputChange('profile.phone', e.target.value)}
                    placeholder="Phone Number"
                  />
                ) : (
                  <span className="form-value">{profile.profile?.phone || 'Not set'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="profile-section">
            <h3><FaMapMarkerAlt /> Address</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Street Address</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.profile.address.street}
                    onChange={e => handleInputChange('profile.address.street', e.target.value)}
                    placeholder="Street Address"
                  />
                ) : (
                  <span className="form-value">{profile.profile?.address?.street || 'Not set'}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>City</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.profile.address.city}
                    onChange={e => handleInputChange('profile.address.city', e.target.value)}
                    placeholder="City"
                  />
                ) : (
                  <span className="form-value">{profile.profile?.address?.city || 'Not set'}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>State</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.profile.address.state}
                    onChange={e => handleInputChange('profile.address.state', e.target.value)}
                    placeholder="State"
                  />
                ) : (
                  <span className="form-value">{profile.profile?.address?.state || 'Not set'}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>ZIP Code</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.profile.address.zipCode}
                    onChange={e => handleInputChange('profile.address.zipCode', e.target.value)}
                    placeholder="ZIP Code"
                  />
                ) : (
                  <span className="form-value">{profile.profile?.address?.zipCode || 'Not set'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="profile-section">
            <h3><FaUsers /> Emergency Contact</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.profile.emergencyContact.name}
                    onChange={e => handleInputChange('profile.emergencyContact.name', e.target.value)}
                    placeholder="Emergency Contact Name"
                  />
                ) : (
                  <span className="form-value">{profile.profile?.emergencyContact?.name || 'Not set'}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.profile.emergencyContact.phone}
                    onChange={e => handleInputChange('profile.emergencyContact.phone', e.target.value)}
                    placeholder="Emergency Contact Phone"
                  />
                ) : (
                  <span className="form-value">{profile.profile?.emergencyContact?.phone || 'Not set'}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>Relationship</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.profile.emergencyContact.relationship}
                    onChange={e => handleInputChange('profile.emergencyContact.relationship', e.target.value)}
                    placeholder="Relationship"
                  />
                ) : (
                  <span className="form-value">{profile.profile?.emergencyContact?.relationship || 'Not set'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="profile-section">
            <h3><FaBell /> Preferences</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Email Notifications</label>
                {editing ? (
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={formData.profile.preferences.notifications.email}
                      onChange={e => handleInputChange('profile.preferences.notifications.email', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Enable email notifications
                  </label>
                ) : (
                  <span className="form-value">
                    {profile.profile?.preferences?.notifications?.email ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>
              
              <div className="form-group">
                <label>SMS Notifications</label>
                {editing ? (
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={formData.profile.preferences.notifications.sms}
                      onChange={e => handleInputChange('profile.preferences.notifications.sms', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Enable SMS notifications
                  </label>
                ) : (
                  <span className="form-value">
                    {profile.profile?.preferences?.notifications?.sms ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>
              
              <div className="form-group">
                <label>Language</label>
                {editing ? (
                  <select
                    value={formData.profile.preferences.language}
                    onChange={e => handleInputChange('profile.preferences.language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                ) : (
                  <span className="form-value">
                    {profile.profile?.preferences?.language === 'en' ? 'English' :
                     profile.profile?.preferences?.language === 'es' ? 'Spanish' :
                     profile.profile?.preferences?.language === 'fr' ? 'French' : 'English'}
                  </span>
                )}
              </div>
              
              <div className="form-group">
                <label>Timezone</label>
                {editing ? (
                  <select
                    value={formData.profile.preferences.timezone}
                    onChange={e => handleInputChange('profile.preferences.timezone', e.target.value)}
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                ) : (
                  <span className="form-value">
                    {profile.profile?.preferences?.timezone?.replace('America/', '').replace('_', ' ') || 'Eastern Time'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Role-specific sections */}
          {profile.role === 'client' && (
            <div className="profile-section">
              <h3><FaUser /> Client Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Membership Type</label>
                  {editing ? (
                    <select
                      value={formData.clientData.membershipType}
                      onChange={e => handleInputChange('clientData.membershipType', e.target.value)}
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="family">Family</option>
                    </select>
                  ) : (
                    <span className="form-value capitalize">
                      {profile.clientData?.membershipType || 'Basic'}
                    </span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Member Since</label>
                  <span className="form-value">
                    {profile.clientData?.memberSince ? 
                      new Date(profile.clientData.memberSince).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="form-group">
                  <label>Total Reservations</label>
                  <span className="form-value">
                    {profile.clientData?.totalReservations || 0}
                  </span>
                </div>
                
                <div className="form-group">
                  <label>Preferred Payment Method</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.clientData.preferredPaymentMethod}
                      onChange={e => handleInputChange('clientData.preferredPaymentMethod', e.target.value)}
                      placeholder="e.g., Credit Card, Bank Transfer"
                    />
                  ) : (
                    <span className="form-value">
                      {profile.clientData?.preferredPaymentMethod || 'Not set'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {profile.role === 'staff' && (
            <div className="profile-section">
              <h3><FaUserTie /> Staff Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Employee ID</label>
                  {editing && currentUserRole === 'admin' ? (
                    <input
                      type="text"
                      value={formData.staffData.employeeId}
                      onChange={e => handleInputChange('staffData.employeeId', e.target.value)}
                      placeholder="Employee ID"
                    />
                  ) : (
                    <span className="form-value">
                      {profile.staffData?.employeeId || 'Not set'}
                    </span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Department</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.staffData.department}
                      onChange={e => handleInputChange('staffData.department', e.target.value)}
                      placeholder="Department"
                    />
                  ) : (
                    <span className="form-value">
                      {profile.staffData?.department || 'Not set'}
                    </span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Position</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.staffData.position}
                      onChange={e => handleInputChange('staffData.position', e.target.value)}
                      placeholder="Position"
                    />
                  ) : (
                    <span className="form-value">
                      {profile.staffData?.position || 'Not set'}
                    </span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Hire Date</label>
                  <span className="form-value">
                    {profile.staffData?.hireDate ? 
                      new Date(profile.staffData.hireDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="form-group">
                  <label>Supervisor</label>
                  <span className="form-value">
                    {profile.staffData?.supervisor ? 
                      `${profile.staffData.supervisor.firstName} ${profile.staffData.supervisor.lastName}` : 'Not assigned'}
                  </span>
                </div>
                
                <div className="form-group full-width">
                  <label>Work Schedule</label>
                  <div className="schedule-display">
                    <p><strong>Work Days:</strong> {profile.staffData?.schedule?.workDays?.join(', ') || 'Not set'}</p>
                    <p><strong>Hours:</strong> {profile.staffData?.schedule?.startTime || '09:00'} - {profile.staffData?.schedule?.endTime || '17:00'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {profile.role === 'admin' && (
            <div className="profile-section">
              <h3><FaUserShield /> Administrator Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Admin Level</label>
                  {editing && currentUserRole === 'admin' ? (
                    <select
                      value={formData.adminData.adminLevel}
                      onChange={e => handleInputChange('adminData.adminLevel', e.target.value)}
                    >
                      <option value="supervisor">Supervisor</option>
                      <option value="manager">Manager</option>
                      <option value="super">Super Admin</option>
                    </select>
                  ) : (
                    <span className="form-value capitalize">
                      {profile.adminData?.adminLevel || 'Supervisor'}
                    </span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Departments Overseen</label>
                  <span className="form-value">
                    {profile.adminData?.departments?.length ? 
                      profile.adminData.departments.join(', ') : 'None'}
                  </span>
                </div>
                
                <div className="form-group">
                  <label>Last System Access</label>
                  <span className="form-value">
                    {profile.adminData?.lastSystemAccess ? 
                      new Date(profile.adminData.lastSystemAccess).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Account Status */}
          <div className="profile-section">
            <h3><FaCalendarAlt /> Account Status</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Account Created</label>
                <span className="form-value">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              
              <div className="form-group">
                <label>Last Login</label>
                <span className="form-value">
                  {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'}
                </span>
              </div>
              
              <div className="form-group">
                <label>Email Verified</label>
                <span className={`form-value status ${profile.emailVerified ? 'verified' : 'unverified'}`}>
                  {profile.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              
              <div className="form-group">
                <label>Account Status</label>
                <span className={`form-value status ${profile.isActive ? 'active' : 'inactive'}`}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
} 