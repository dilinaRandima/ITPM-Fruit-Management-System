// src/App.js with role-based navigation
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import FruitGrading from './components/FruitGrading';
import FruitCollection from './components/FruitCollection';
import FruitMarket from './components/FruitMarket';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import Login from './components/Login';
import Signup from './components/Signup';
import Footer from './components/Footer';
import AuthContext from './context/AuthContext';
import Checkout from './components/Checkout';
import OrderConfirmation from './components/OrderConfirmation';
import InventoryManagement from './components/InventoryManagement';
import MyOrders from './components/MyOrders';
import OrderDetail from './components/OrderDetail';
import OrderEdit from './components/OrderEdit';
import AdminOrders from './components/AdminOrders';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Fetch cart count for customers
  useEffect(() => {
    if (user && user.role === 'customer') {
      fetchCartCount();
    }
  }, [user]);

  // Add scroll listener for header effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Function to fetch cart count
  const fetchCartCount = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/cart/${user.email}`);
      const cartItems = await response.json();
      
      // Calculate total count
      const count = cartItems.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Handle signup
  const handleSignup = (userData) => {
    // In a real app, you might want to do something with the signup data
    // For now, we'll just redirect to login page
    console.log('User signed up:', userData);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setActiveTab('home');
  };

  // Loading screen
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Function to render navigation tabs based on user role
  const renderNavigationTabs = () => {
    // Admin navigation tabs
    if (user.role === 'admin') {
      return (
        <ul className="nav-tabs">
          <li
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <span className="nav-icon">🏠</span>
            Home
          </li>
          <li
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </li>
          <li
            className={`nav-tab ${activeTab === 'grading' ? 'active' : ''}`}
            onClick={() => setActiveTab('grading')}
          >
            <span className="nav-icon">🍎</span>
            Fruit Grading
          </li>
          <li
            className={`nav-tab ${activeTab === 'collection' ? 'active' : ''}`}
            onClick={() => setActiveTab('collection')}
          >
            <span className="nav-icon">🧺</span>
            Fruit Collection
          </li>
          <li
            className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <span className="nav-icon">📦</span>
            Inventory
          </li>
          <li
            className={`nav-tab ${activeTab === 'admin-orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin-orders')}
          >
            <span className="nav-icon">📋</span>
            Manage Orders
          </li>
        </ul>
      );
    }
    
    // Customer navigation tabs
    else if (user.role === 'customer') {
      return (
        <ul className="nav-tabs">
          <li
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <span className="nav-icon">🏠</span>
            Home
          </li>
          <li
            className={`nav-tab ${activeTab === 'market' ? 'active' : ''}`}
            onClick={() => setActiveTab('market')}
          >
            <span className="nav-icon">🛒</span>
            Fruit Market
            
          </li>
          <li
            className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span className="nav-icon">📋</span>
            My Orders
          </li>
        </ul>
      );
    }
    
    // Transporter navigation tabs
    else if (user.role === 'transporter') {
      return (
        <ul className="nav-tabs">
          <li
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <span className="nav-icon">🏠</span>
            Home
          </li>
          <li
            className={`nav-tab ${activeTab === 'distribution' ? 'active' : ''}`}
            onClick={() => setActiveTab('distribution')}
          >
            <span className="nav-icon">🚚</span>
            Distribution
          </li>
        </ul>
      );
    }
    
    // Default navigation (shouldn't reach here normally)
    return (
      <ul className="nav-tabs">
        <li
          className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">🏠</span>
          Home
        </li>
      </ul>
    );
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        {user ? (
          <div className="App">
            <header className={`App-header ${scrolled ? 'scrolled' : ''}`}>
              <div className="header-left">
                <img src="/log8.png" alt="Fresh Route Logo" className="logo-image" />
              </div>
              
              <div className="header-content">
                <h1>Fruit Management System</h1>
                <p className="tagline">Complete solution for fruit Collecting and distribution</p>
              </div>
              
              <div className="header-right">
                <span className="user-greeting">Hello, {user.name}</span>
                <button className="sign-up-button" onClick={handleLogout}>Sign Out</button>
              </div>
            </header>
            
            <nav className="main-nav">
              {renderNavigationTabs()}
            </nav>
            
            <main className="main-content">
              <Routes>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/admin/orders" element={
                  user && user.role === 'admin' ? <AdminOrders /> : <Navigate to="/login" replace />
                } />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/order/:orderId" element={<OrderDetail />} />
                <Route path="/order-edit/:orderId" element={<OrderEdit />} />
                <Route path="*" element={
                  <>
                    {activeTab === 'home' && <HomePage />}
                    
                    {/* Admin-specific tabs */}
                    {activeTab === 'dashboard' && user.role === 'admin' && <Dashboard />}
                    {activeTab === 'grading' && user.role === 'admin' && <FruitGrading />}
                    {activeTab === 'collection' && user.role === 'admin' && <FruitCollection />}
                    {activeTab === 'inventory' && user.role === 'admin' && <InventoryManagement />}
                    {activeTab === 'admin-orders' && user.role === 'admin' && <AdminOrders />}
                    
                    {/* Customer-specific tabs */}
                    {activeTab === 'market' && user.role === 'customer' && <FruitMarket />}
                    {activeTab === 'orders' && user.role === 'customer' && <MyOrders />}
                    
                    {/* Transporter-specific tabs */}
                    {activeTab === 'distribution' && user.role === 'transporter' && (
                      <div className="feature-placeholder">
                        <h2>Distribution Management</h2>
                        <p>This feature is currently under development. Check back soon!</p>
                      </div>
                    )}
                    
                    {/* Unauthorized access messages */}
                    {activeTab === 'dashboard' && user.role !== 'admin' && (
                      <div className="unauthorized-container">
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access the Dashboard.</p>
                      </div>
                    )}
                    {activeTab === 'grading' && user.role !== 'admin' && (
                      <div className="unauthorized-container">
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access Fruit Grading.</p>
                      </div>
                    )}
                    {activeTab === 'collection' && user.role !== 'admin' && (
                      <div className="unauthorized-container">
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access Fruit Collection.</p>
                      </div>
                    )}
                    {activeTab === 'inventory' && user.role !== 'admin' && (
                      <div className="unauthorized-container">
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access Inventory Management.</p>
                      </div>
                    )}
                    {activeTab === 'admin-orders' && user.role !== 'admin' && (
                      <div className="unauthorized-container">
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access Manage Orders.</p>
                      </div>
                    )}
                    {activeTab === 'market' && user.role !== 'customer' && (
                      <div className="unauthorized-container">
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access Fruit Market.</p>
                      </div>
                    )}
                    {activeTab === 'orders' && user.role !== 'customer' && (
                      <div className="unauthorized-container">
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access My Orders.</p>
                      </div>
                    )}
                    {activeTab === 'distribution' && user.role !== 'transporter' && (
                      <div className="unauthorized-container">
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access Distribution Management.</p>
                      </div>
                    )}
                  </>
                } />
              </Routes>
            </main>
            
            <Footer />
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </Router>
    </AuthContext.Provider>
  );
}

export default App;