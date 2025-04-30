// src/components/Login.jsx - Updated with Link to Signup
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import React, { useState, useEffect, useRef } from 'react';
// Demo credentials for testing - removed transporter
const VALID_CREDENTIALS = {
  'customer@gmail.com': { password: 'customer123', role: 'customer', name: 'Dilina Randima' },
  'admin@gmail.com': { password: 'admin123', role: 'admin', name: 'Ranidu Pramod' }
};

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('customer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
const [passwordError, setPasswordError] = useState('');
const [retryCount, setRetryCount] = useState(0);
const maxRetries = 2; // Maximum number of automatic retries
const retryTimeoutRef = useRef(null);
  // Mock authentication function - will be replaced with actual API call later
  const authenticateUser = async (email, password, role) => {
    // This simulates an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // First check hardcoded credentials
        const userInfo = VALID_CREDENTIALS[email];
        
        // Then check localStorage for registered users
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
        const registeredUserInfo = registeredUsers[email];
        
        // Validate against either hardcoded or registered credentials
        if ((userInfo && userInfo.password === password && userInfo.role === role) ||
            (registeredUserInfo && registeredUserInfo.password === password && registeredUserInfo.role === role)) {
          
          // Use the appropriate user info based on where it was found
          const validUserInfo = userInfo || registeredUserInfo;
          
          
          resolve({
            success: true,
            user: {
              email,
              name: validUserInfo.name,
              role: validUserInfo.role,
            },
            token: 'mock-jwt-token-' + validUserInfo.role
          });
        } else {
          resolve({
            success: false,
            message: 'Invalid email, password, or role'
          });
        }
      }, 1000); // Simulate network delay
    });
  };
  
  
  useEffect(() => {
    // Check for existing token and user data
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Auto-redirect if token exists
        onLogin(user);
        
        switch (user.role) {
          case 'admin':
            navigate('/dashboard');
            break;
          default:
            navigate('/home');
            break;
        }
      } catch (err) {
        // Handle corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.error('Error parsing saved user data:', err);
      }
    }
  }, [navigate, onLogin]);
  const handleAuthError = (err) => {
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    // Determine error type and display appropriate message
    if (!navigator.onLine) {
      setError('You appear to be offline. Please check your internet connection.');
    } else if (err.message && err.message.includes('timeout')) {
      setError('Server is taking too long to respond. Please try again later.');
      
      // Auto-retry logic for timeouts
      if (retryCount < maxRetries) {
        setError(`Connection timed out. Retrying (${retryCount + 1}/${maxRetries})...`);
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleSubmit(new Event('autoRetry'));
        }, 2000); // Wait 2 seconds before retry
      } else {
        setError('Unable to connect after multiple attempts. Please try again later.');
        setRetryCount(0); // Reset for next manual attempt
      }
    } else {
      // Generic error with technical details in console for debugging
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error details:', err);
    }
  };
  
  // Modify the catch block in handleSubmit around line 66
  
  
  // Add cleanup for any pending retries when component unmounts
  // Place this after the first useEffect
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      <button 
  type="submit" 
  className={`login-button ${isLoading ? 'login-loading' : ''}`}
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <span className="spinner"></span>
      <span>Signing In...</span>
    </>
  ) : 'Sign In'}
</button>
      
      // Use the mock authentication for now
      const response = await authenticateUser(email, password, selectedRole);
      
      if (response.success) {
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        
        // Call the login handler with user data
        onLogin(response.user);
        
        // Redirect based on role - removed transporter case
        switch (selectedRole) {
          case 'admin':
            navigate('/dashboard');
            break;
          default:
            navigate('/home');
            break;
        }
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="login-container">
      <div className="login-image-section">
        <div className="login-overlay"></div>
        <div className="login-brand">
          <h2>Fresh Route</h2>
          <p>The complete fruit management system for fruit collecting and distribution</p>
        </div>
      </div>
      // After email input field (around line 87)
{emailError && <div className="field-error">{emailError}</div>}

// After password input field (around line 96)
{passwordError && <div className="field-error">{passwordError}</div>}
      <div className="login-form-section">
        <div className="login-header">
          <img src="/log8.png" alt="Fresh Route Logo" className="login-logo" />
          <h1>Welcome Back</h1>
          <p className="login-subtitle">Log in to access your account</p>
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
              placeholder="Enter your password"
              required
            />
            <span className="input-icon">🔒</span>
          </div>
          // Add after line 101 (after the password input field and its icon)
<button 
  type="button"
  className="password-toggle"
  onClick={() => setPasswordVisible(!passwordVisible)}
>
  {passwordVisible ? '👁️' : '👁️‍🗨️'}
</button>
          
          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <a href="#forgot-password" className="forgot-password">Forgot Password?</a>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'login-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <div className="signup-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;