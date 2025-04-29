// src/components/Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // Reusing the Login CSS

const Signup = ({ onSignup }) => {
  // Navigate hook for redirection
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('customer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Validate the form
  const validateForm = () => {
    // Reset error
    setError('');

    // Check if all fields are filled
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Check if email is already registered
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
    if (registeredUsers[email]) {
      setError('Email already registered. Please use a different email or login.');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Mock API call for demonstration
      // In a real app, you would call an API to register the user
      setTimeout(() => {
        // Store the user credentials in localStorage
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
        
        // Check if email already exists
        if (registeredUsers[email]) {
          setError('Email already registered. Please use a different email or login.');
          setIsLoading(false);
          return;
        }
        
        // Add the new user
        registeredUsers[email] = {
          name,
          password,
          role: selectedRole,
          registeredAt: new Date().toISOString()
        };
        
        // Save back to localStorage
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        
        // Mock successful registration
        setSuccessMessage('Registration successful! You can now login with your credentials.');
        
        // Auto-redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        
        // Optionally, pass the user data to the parent component
        if (onSignup) {
          onSignup({
            name,
            email,
            role: selectedRole
          });
        }
        
        // Clear the form after successful registration
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        setIsLoading(false);
      }, 1500);
      
    } catch (err) {
      setError('Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-image-section">
        <div className="login-overlay"></div>
        <div className="login-brand">
          <h2>Fresh Route</h2>
          <p>Join our fruit management system for seamless collecting and distribution</p>
        </div>
      </div>
      
      <div className="login-form-section">
        <div className="login-header">
          <img src="/log8.png" alt="Fresh Route Logo" className="login-logo" />
          <h1>Create Account</h1>
          <p className="login-subtitle">Register to start using our services</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="role-selector">
            <div 
              className={`role-option ${selectedRole === 'customer' ? 'active' : ''}`}
              onClick={() => setSelectedRole('customer')}
            >
              Customer
            </div>
            <div 
              className={`role-option ${selectedRole === 'admin' ? 'active' : ''}`}
              onClick={() => setSelectedRole('admin')}
            >
              Admin
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
            <span className="input-icon">👤</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <span className="input-icon">✉️</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
            <span className="input-icon">🔒</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
            <span className="input-icon">🔒</span>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'login-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <div className="signup-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;