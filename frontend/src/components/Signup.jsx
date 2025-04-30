// src/components/Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // Reusing the Login CSS
import React, { useState, useRef } from 'react';

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
  const [nameError, setNameError] = useState('');
const [emailError, setEmailError] = useState('');
const [recoveryEmail, setRecoveryEmail] = useState('');
const [showRecoveryField, setShowRecoveryField] = useState(false);
const [recoveryEmailError, setRecoveryEmailError] = useState('');
const [socialLoading, setSocialLoading] = useState('');
const formRef = useRef(null);
const [showConfirmation, setShowConfirmation] = useState(false);
const [passwordError, setPasswordError] = useState('');
const [confirmPasswordError, setConfirmPasswordError] = useState('');
const [passwordVisible, setPasswordVisible] = useState(false);
const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
const [termsAccepted, setTermsAccepted] = useState(false);
const [termsError, setTermsError] = useState('');
const [passwordStrength, setPasswordStrength] = useState({
  score: 0,
  message: '',
  color: 'red'
});


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
    if (!termsAccepted) {
      setTermsError('You must accept the Terms and Conditions');
      return false;
    }
    
    // Add before the main submit button (around line 173)
    <div className="terms-container">
      <label className="terms-label">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => {
            setTermsAccepted(e.target.checked);
            if (e.target.checked) setTermsError('');
          }}
        />
        <span>I agree to the <a href="/terms" target="_blank">Terms and Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a></span>
      </label>
      {termsError && <div className="field-error">{termsError}</div>}
    </div>
    

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
    const validateName = (name) => {
      if (!name.trim()) return 'Name is required';
      if (name.trim().length < 3) return 'Name must be at least 3 characters';
      return '';
    };
    setSuccessMessage('Registration successful! You can now login with your credentials.');
// Auto-redirect to login page after 2 seconds
setTimeout(() => {
  navigate('/login');
}, 2000);

// With this:
setSuccessMessage('Registration successful!');
setShowConfirmation(true);
// Don't auto-redirect - let user click to continue

// Add at the end of the form but before the closing div (around line 195)
{showConfirmation && (
  <div className="confirmation-popup">
    <div className="confirmation-content">
      <div className="confirmation-icon">✅</div>
      <h3>Account Created Successfully!</h3>
      <p>Your account has been created and is ready to use.</p>
      <button 
        onClick={() => navigate('/login')} 
        className="confirmation-button"
      >
        Proceed to Login
      </button>
    </div>
  </div>
)}

// Add to the return statement of handleSubmit, in the setTimeout callback (around line 88)
// Instead of auto-redirecting, update the success message animation
setIsLoading(false);
// Show the success message with animation
setSuccessMessage('Registration successful!');
setShowConfirmation(true);
    
    const validateEmail = (email) => {
      if (!email) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return 'Please enter a valid email address';
      return '';
    };
    
    const validatePassword = (password) => {
      if (!password) return 'Password is required';
      if (password.length < 8) return 'Password must be at least 8 characters';
      return '';
    };
    
    const validateConfirmPassword = (confirmPassword, password) => {
      if (!confirmPassword) return 'Please confirm your password';
      if (confirmPassword !== password) return 'Passwords do not match';
      return '';
    };
    // Add this function after validateForm (around line 47)
const checkPasswordStrength = (password) => {
  // Basic password strength checker
  let score = 0;
  let message = '';
  let color = 'red';
  
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  switch(score) {
    case 0:
    case 1:
      message = 'Very Weak';
      color = 'red';
      break;
    case 2:
      message = 'Weak';
      color = 'orange';
      break;
    case 3:
      message = 'Moderate';
      color = 'yellow';
      break;
    case 4:
      message = 'Strong';
      color = 'lightgreen';
      break;
    case 5:
      message = 'Very Strong';
      color = 'green';
      break;
    default:
      message = 'Very Weak';
      color = 'red';
  }
  
  return { score, message, color };
};
    
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
      <div className="form-group">
  <label htmlFor="password">Password</label>
  <div className="password-input-container">
    <input
      type={passwordVisible ? "text" : "password"}
      id="password"
      value={password}
      onChange={(e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordError(validatePassword(newPassword));
        if (confirmPassword) {
          setConfirmPasswordError(validateConfirmPassword(confirmPassword, newPassword));
        }
        setPasswordStrength(checkPasswordStrength(newPassword));
      }}
      placeholder="Create a password"
      required
    />
    <span className="input-icon">🔒</span>
    <button 
      type="button"
      className="password-toggle"
      onClick={() => setPasswordVisible(!passwordVisible)}
    >
      {passwordVisible ? '👁️' : '👁️‍🗨️'}
    </button>
  </div>
  {passwordError && <div className="field-error">{passwordError}</div>}
</div>
<div className="form-group">
  <label htmlFor="confirmPassword">Confirm Password</label>
  <div className="password-input-container">
    <input
      type={confirmPasswordVisible ? "text" : "password"}
      id="confirmPassword"
      value={confirmPassword}
      onChange={(e) => {
        const newConfirmPassword = e.target.value;
        setConfirmPassword(newConfirmPassword);
        setConfirmPasswordError(validateConfirmPassword(newConfirmPassword, password));
      }}
      placeholder="Confirm your password"
      required
    />
    <span className="input-icon">🔒</span>
    <button 
      type="button"
      className="password-toggle"
      onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
    >
      {confirmPasswordVisible ? '👁️' : '👁️‍🗨️'}
    </button>
  </div>
  {confirmPasswordError && <div className="field-error">{confirmPasswordError}</div>}
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