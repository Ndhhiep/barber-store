import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/UserProfile.css';

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login?redirect=user-profile');
          return;
        }
        
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login?redirect=user-profile');
            return;
          }
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUserData(prevState => ({
          ...prevState,
          name: data.data.user.name || '',
          email: data.data.user.email || '',
          phone: data.data.user.phone || ''
        }));
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form and exit edit mode
    setIsEditing(false);
    
    // Refetch user data to reset form
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData(prevState => ({
            ...prevState,
            name: data.data.user.name || '',
            email: data.data.user.email || '',
            phone: data.data.user.phone || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        }
      } catch (err) {
        console.error('Error resetting form:', err);
      }
    };
    
    fetchUserData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      // Validate passwords if user is trying to change password
      if (userData.newPassword || userData.confirmPassword) {
        if (!userData.currentPassword) {
          setError('Current password is required to set a new password');
          return;
        }
        
        if (userData.newPassword !== userData.confirmPassword) {
          setError('New passwords do not match');
          return;
        }
        
        if (userData.newPassword.length < 6) {
          setError('New password must be at least 6 characters long');
          return;
        }
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login?redirect=user-profile');
        return;
      }
      
      // Prepare update data
      const updateData = {
        name: userData.name,
        phone: userData.phone
      };
      
      // Only include password fields if user is changing password
      if (userData.currentPassword && userData.newPassword) {
        updateData.currentPassword = userData.currentPassword;
        updateData.newPassword = userData.newPassword;
      }
        let response;
      
      // If the user is changing their password
      if (userData.currentPassword && userData.newPassword) {
        // Separate call to update password
        response = await fetch('http://localhost:5000/api/auth/update-password', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: userData.currentPassword,
            newPassword: userData.newPassword
          })
        });
      } else {
        // Regular profile update (name, phone)
        response = await fetch('http://localhost:5000/api/auth/update-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Clear password fields
      setUserData(prevState => ({
        ...prevState,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      
      // Update user name in local storage if it was changed
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          user.name = userData.name;
          localStorage.setItem('user', JSON.stringify(user));
        } catch (err) {
          console.error('Error updating user in localStorage:', err);
        }
      }
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="user-profile-container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="user-profile-container my-5">
      <h1>My Information</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}
      
      <div className="profile-card">
        <form onSubmit={handleSubmit}>
          <div className="profile-section">
            <h3>Personal Information</h3>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={userData.email}
                    disabled={true} // Email cannot be changed
                    required
                  />
                  <small className="text-muted">Email address cannot be changed</small>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    name="phone"
                    value={userData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {isEditing && (
            <div className="profile-section">
              <h3>Change Password</h3>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="currentPassword"
                      name="currentPassword"
                      value={userData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Enter your current password"
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      name="newPassword"
                      value={userData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={userData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="profile-buttons">
            {!isEditing ? (
              <button 
                type="button" 
                className="btn update-profile-btn"
                onClick={handleEdit}
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  className="btn cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn update-profile-btn"
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;