// src/components/MyOrders.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './MyOrders.css';

const MyOrders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchOrders();
  }, [user, navigate]);
  
  useEffect(() => {
    applyFiltersAndSort();
  }, [orders, statusFilter, sortBy, sortOrder, searchTerm]);
  
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`http://localhost:3001/api/orders/user/${user.email}`);
      setOrders(response.data);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
      setIsLoading(false);
    }
  };
  
  const applyFiltersAndSort = () => {
    let result = [...orders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter (to order ID)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderId.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
          break;
        case 'total':
          comparison = b.total - a.total;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison * -1 : comparison;
    });
    
    setFilteredOrders(result);
  };
  
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };
  
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const viewOrderDetails = (orderId) => {
    navigate(`/order/${orderId}`);
  };
  
  const editOrder = (orderId) => {
    navigate(`/order-edit/${orderId}`);
  };
  
  // Changed from cancelOrder to deleteOrder
  const deleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        
        // Changed from PATCH to DELETE request
        await axios.delete(`http://localhost:3001/api/orders/${orderId}`);
        
        // Update local state by removing the order
        setOrders(prevOrders => 
          prevOrders.filter(order => order.orderId !== orderId)
        );
        
        setSuccessMessage('Order deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error deleting order:', err);
        setError('Failed to delete order. Please try again.');
        setIsLoading(false);
      }
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'completed': return 'status-completed';
      case 'canceled': return 'status-canceled';
      default: return '';
    }
  };
  
  // Format price as LKR
  const formatPrice = (price) => {
    return `LKR ${price?.toFixed(2) || '0.00'}`;
  };
  
  if (!user) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="myorders-container">
      <h2 className="myorders-title">My Orders</h2>
      
      {/* Info Panel */}
      <div className="myorders-info-panel">
        <div className="info-icon">ℹ️</div>
        <div className="info-text">
          <p>View and manage your orders. You can check order details, track shipments, or cancel orders if needed.</p>
          <p>Orders can be canceled only if they are in "pending" or "processing" status.</p>
        </div>
      </div>
      
      {/* Success and Error Messages */}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* Filter Controls */}
      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search by order ID..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        
        <div className="filter-options">
          <button 
            className={`filter-button ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange('all')}
          >
            All Orders
          </button>
          <button 
            className={`filter-button ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-button ${statusFilter === 'processing' ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange('processing')}
          >
            Processing
          </button>
          <button 
            className={`filter-button ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange('completed')}
          >
            Completed
          </button>
          <button 
            className={`filter-button ${statusFilter === 'canceled' ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange('canceled')}
          >
            Canceled
          </button>
          
          <div className="sort-controls">
            <select 
              value={sortBy} 
              onChange={handleSortChange}
              className="sort-select"
            >
              <option value="date">Sort by Date</option>
              <option value="total">Sort by Total</option>
              <option value="status">Sort by Status</option>
            </select>
            
            <button 
              className="sort-direction-button" 
              onClick={toggleSortOrder}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="loading-indicator">Loading your orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="no-orders-message">
          <div className="no-orders-icon">📋</div>
          <p>You don't have any orders yet.</p>
          <button 
            onClick={() => navigate('/market')}
            className="shop-now-button"
          >
            Shop Now
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div key={order.orderId} className="order-card">
              <div className="order-header">
                <div className="order-id">
                  <span className="order-label">Order ID:</span>
                  <span className="order-value">{order.orderId}</span>
                </div>
                
                <div className={`order-status ${getStatusBadgeClass(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
              </div>
              
              <div className="order-details">
                <div className="order-info">
                  <div className="order-date">
                    <span className="order-label">Order Date:</span>
                    <span className="order-value">{formatDate(order.createdAt)}</span>
                  </div>
                  
                  <div className="order-items-count">
                    <span className="order-label">Items:</span>
                    <span className="order-value">{order.items.length}</span>
                  </div>
                  
                  <div className="order-total">
                    <span className="order-label">Total:</span>
                    <span className="order-value">{formatPrice(order.total)}</span>
                  </div>
                </div>
                
                <div className="order-shipping">
                  <div className="shipping-method">
                    <span className="order-label">Shipping:</span>
                    <span className="order-value">
                      {order.shipping?.method === 'standard' ? 'Standard Delivery' : 
                       order.shipping?.method === 'express' ? 'Express Delivery' : 'Store Pickup'}
                    </span>
                  </div>
                  
                  {order.shipping?.estimatedDelivery && (
                    <div className="estimated-delivery">
                      <span className="order-label">Estimated Delivery:</span>
                      <span className="order-value">{formatDate(order.shipping.estimatedDelivery)}</span>
                    </div>
                  )}
                </div>
                
                <div className="order-preview">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="order-item-preview">
                      <img 
                        src={`http://localhost:3001${item.imageUrl}`} 
                        alt={item.name} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-fruit.png';
                        }}
                      />
                    </div>
                  ))}
                  
                  {order.items.length > 3 && (
                    <div className="more-items">+{order.items.length - 3} more</div>
                  )}
                </div>
              </div>
              
              <div className="order-actions">
                <button 
                  className="view-details-button"
                  onClick={() => viewOrderDetails(order.orderId)}
                >
                  View Details
                </button>
                
                {(order.status === 'pending' || order.status === 'processing') && (
                  <>
                    <button 
                      className="edit-order-button"
                      onClick={() => editOrder(order.orderId)}
                    >
                      Edit Order
                    </button>
                    
                    <button 
                      className="cancel-order-button"
                      onClick={() => deleteOrder(order.orderId)}
                    >
                      Delete Order
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;