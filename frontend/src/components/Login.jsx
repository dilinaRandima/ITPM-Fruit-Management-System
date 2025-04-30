// src/components/Login.jsx - Updated with Link to Signup
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

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