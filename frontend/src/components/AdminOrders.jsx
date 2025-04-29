// src/components/AdminOrders.jsx - Updated to match InventoryManagement styling
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './AdminOrders.css';

const AdminOrders = () => {
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
  
  // Stats counters
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
    canceled: 0
  });
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // For testing purposes, let's allow any role to access the admin page
    // Remove this check when authentication is fixed
    /*
    if (user.role !== 'admin') {
      // Redirect non-admin users
      navigate('/');
      return;
    }
    */
    
    fetchAllOrders();
  }, [user, navigate]);
  
  useEffect(() => {
    applyFiltersAndSort();
  }, [orders, statusFilter, sortBy, sortOrder, searchTerm]);
  
  // Calculate stats whenever orders change
  useEffect(() => {
    const totalOrders = orders.length;
    const processingCount = orders.filter(order => order.status === 'processing').length;
    const completedCount = orders.filter(order => order.status === 'completed').length;
    const canceledCount = orders.filter(order => order.status === 'canceled').length;
    
    setStats({
      total: totalOrders,
      processing: processingCount,
      completed: completedCount,
      canceled: canceledCount
    });
  }, [orders]);
  
  // Updated fetchAllOrders function in AdminOrders.jsx
const fetchAllOrders = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Try using the all orders endpoint
    try {
      const ordersResponse = await axios.get('http://localhost:3001/api/orders/all');
      if (ordersResponse.data && Array.isArray(ordersResponse.data)) {
        console.log("All orders:", ordersResponse.data);
        setOrders(ordersResponse.data);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Could not fetch all orders:", error.message);
    }
    
    // If the API call fails or returns unexpected data format, try an alternative approach:
    // This is a temporary solution until the API is fixed
    console.log("Falling back to alternative method to fetch orders");
    
    // First, get all registered users from localStorage
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
    let allUserEmails = Object.keys(registeredUsers);
    
    // Add default test accounts
    const defaultEmails = ['customer@gmail.com', 'admin@gmail.com', 'transporter@gmail.com'];
    allUserEmails = [...new Set([...allUserEmails, ...defaultEmails])];
    
    let allOrders = [];
    
    // Fetch orders for each user
    for (const email of allUserEmails) {
      try {
        const response = await axios.get(`http://localhost:3001/api/orders/user/${email}`);
        if (response.data && response.data.length > 0) {
          console.log(`Orders for ${email}:`, response.data);
          allOrders = [...allOrders, ...response.data];
        }
      } catch (error) {
        console.log(`Could not fetch orders for ${email}:`, error.message);
      }
    }
    
    // Check if we got any orders
    if (allOrders.length > 0) {
      console.log("Successfully fetched orders from multiple users:", allOrders);
      setOrders(allOrders);
    } else {
      console.log("No real orders found, using demo data");
      setOrders(extendedDemoOrders);
      setError("No orders found in the system. Using demo data instead.");
    }
    
    setIsLoading(false);
  } catch (err) {
    console.error('Error in order fetching process:', err);
    
    // Use demo data as fallback
    setError('Could not retrieve orders. Using demo data instead.');
    setOrders(extendedDemoOrders);
    setIsLoading(false);
  }
};
  
  // Extended demo data with orders from multiple customers
  const extendedDemoOrders = [
    {
      orderId: 'ORD-123456',
      userDetails: {
        fullName: 'Dilina Randima',
        email: 'customer@gmail.com',
        phone: '0712345678',
        address: '123 Main St',
        city: 'Colombo',
        postalCode: '10100'
      },
      items: [
        {
          name: 'Apple',
          grade: 'A',
          price: 250,
          quantity: 5
        },
        {
          name: 'Orange',
          grade: 'B',
          price: 180,
          quantity: 3
        }
      ],
      shipping: {
        method: 'standard',
        cost: 250,
        status: 'processing',
        estimatedDelivery: new Date(new Date().setDate(new Date().getDate() + 5))
      },
      payment: {
        method: 'card',
        status: 'completed'
      },
      subtotal: 1290,
      total: 1540,
      status: 'processing',
      createdAt: new Date(new Date().setDate(new Date().getDate() - 2))
    },
    {
      orderId: 'ORD-789012',
      userDetails: {
        fullName: 'Vihanga Dilmi',
        email: 'transporter@gmail.com',
        phone: '0723456789',
        address: '456 Park Ave',
        city: 'Kandy',
        postalCode: '20000'
      },
      items: [
        {
          name: 'Mango',
          grade: 'A',
          price: 350,
          quantity: 4
        }
      ],
      shipping: {
        method: 'express',
        cost: 500,
        status: 'shipped',
        estimatedDelivery: new Date(new Date().setDate(new Date().getDate() + 1))
      },
      payment: {
        method: 'cash',
        status: 'pending'
      },
      subtotal: 1400,
      total: 1900,
      status: 'processing',
      createdAt: new Date(new Date().setDate(new Date().getDate() - 1))
    },
    {
      orderId: 'ORD-345678',
      userDetails: {
        fullName: 'Samantha Perera',
        email: 'samantha@example.com',
        phone: '0734567890',
        address: '789 Beach Road',
        city: 'Galle',
        postalCode: '80000'
      },
      items: [
        {
          name: 'Banana',
          grade: 'A',
          price: 120,
          quantity: 10
        },
        {
          name: 'Papaya',
          grade: 'B',
          price: 200,
          quantity: 2
        }
      ],
      shipping: {
        method: 'standard',
        cost: 250,
        status: 'processing',
        estimatedDelivery: new Date(new Date().setDate(new Date().getDate() + 4))
      },
      payment: {
        method: 'card',
        status: 'completed'
      },
      subtotal: 1600,
      total: 1850,
      status: 'pending',
      createdAt: new Date(new Date().setDate(new Date().getDate() - 3))
    },
    {
      orderId: 'ORD-567890',
      userDetails: {
        fullName: 'Anita Silva',
        email: 'anita@example.com',
        phone: '0745678901',
        address: '101 Hill Street',
        city: 'Nuwara Eliya',
        postalCode: '22200'
      },
      items: [
        {
          name: 'Strawberry',
          grade: 'A',
          price: 450,
          quantity: 3
        }
      ],
      shipping: {
        method: 'express',
        cost: 500,
        status: 'delivered',
        estimatedDelivery: new Date(new Date().setDate(new Date().getDate() - 1))
      },
      payment: {
        method: 'card',
        status: 'completed'
      },
      subtotal: 1350,
      total: 1850,
      status: 'completed',
      createdAt: new Date(new Date().setDate(new Date().getDate() - 5))
    },
    {
      orderId: 'ORD-678901',
      userDetails: {
        fullName: 'Malik Fernando',
        email: 'malik@example.com',
        phone: '0756789012',
        address: '222 Lake Drive',
        city: 'Colombo',
        postalCode: '10300'
      },
      items: [
        {
          name: 'Avocado',
          grade: 'A',
          price: 300,
          quantity: 5
        },
        {
          name: 'Pineapple',
          grade: 'B',
          price: 220,
          quantity: 2
        },
        {
          name: 'Dragon Fruit',
          grade: 'A',
          price: 500,
          quantity: 1
        }
      ],
      shipping: {
        method: 'standard',
        cost: 250,
        status: 'shipped',
        estimatedDelivery: new Date(new Date().setDate(new Date().getDate() + 1))
      },
      payment: {
        method: 'cash',
        status: 'pending'
      },
      subtotal: 2440,
      total: 2690,
      status: 'processing',
      createdAt: new Date(new Date().setDate(new Date().getDate() - 2))
    }
  ];
  
  const applyFiltersAndSort = () => {
    let result = [...orders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter (to order ID or customer name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderId.toLowerCase().includes(term) || 
        (order.userDetails && order.userDetails.fullName && 
         order.userDetails.fullName.toLowerCase().includes(term))
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
        case 'customer':
          if (a.userDetails && b.userDetails) {
            comparison = a.userDetails.fullName.localeCompare(b.userDetails.fullName);
          }
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
  
  const updateShippingStatus = async (orderId, newStatus) => {
    try {
      setIsLoading(true);
      
      // Make the actual API call to update shipping status in the database
      await axios.patch(
        `http://localhost:3001/api/orders/${orderId}`, 
        {
          shipping: {
            status: newStatus
          }
        }
      );
      
      console.log(`Successfully updated order ${orderId} shipping status to ${newStatus}`);
      
      // Update local state to reflect the change
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? {...order, shipping: {...order.shipping, status: newStatus}} 
            : order
        )
      );
      
      setSuccessMessage(`Order ${orderId} shipping status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating shipping status:', err);
      
      if (err.response) {
        console.error('Server response:', err.response.data);
        console.error('Status code:', err.response.status);
      }
      
      // Show error message but still update UI temporarily
      setError('Failed to update shipping status on the server. Changes won\'t be saved.');
      
      // Update local state anyway to show what the change would look like
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? {...order, shipping: {...order.shipping, status: newStatus}} 
            : order
        )
      );
      
      setIsLoading(false);
    }
  };
  
  // Update order status function
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setIsLoading(true);
      
      // Make the API call to update order status
      await axios.patch(
        `http://localhost:3001/api/orders/${orderId}/status`, 
        {
          status: newStatus
        }
      );
      
      console.log(`Successfully updated order ${orderId} status to ${newStatus}`);
      
      // Update local state to reflect the change
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? {...order, status: newStatus} 
            : order
        )
      );
      
      setSuccessMessage(`Order ${orderId} status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating order status:', err);
      
      if (err.response) {
        console.error('Server response:', err.response.data);
        console.error('Status code:', err.response.status);
      }
      
      // Show error message
      setError('Failed to update order status. Changes won\'t be saved.');
      
      // Update local state to show what the change would look like
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? {...order, status: newStatus} 
            : order
        )
      );
      
      setIsLoading(false);
    }
  };
  
  // Delete order function (actually sets status to canceled)
  const deleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? It will be marked as canceled.')) {
      try {
        setIsLoading(true);
        
        // Update order status to canceled
        await axios.patch(
          `http://localhost:3001/api/orders/${orderId}/status`, 
          {
            status: 'canceled'
          }
        );
        
        console.log(`Successfully marked order ${orderId} as canceled`);
        
        // Update local state to reflect the change
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? {...order, status: 'canceled'} 
              : order
          )
        );
        
        setSuccessMessage(`Order ${orderId} has been deleted (marked as canceled)`);
        setTimeout(() => setSuccessMessage(''), 3000);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error deleting order:', err);
        
        if (err.response) {
          console.error('Server response:', err.response.data);
          console.error('Status code:', err.response.status);
        }
        
        // Show error message
        setError('Failed to delete the order. Please try again.');
        
        setIsLoading(false);
      }
    }
  };
  
  const viewOrderDetails = (orderId) => {
    navigate(`/order/${orderId}`);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
  
  // Determine row class based on order status
  const getOrderRowClass = (status) => {
    switch(status) {
      case 'processing': return 'processing-row';
      case 'completed': return 'completed-row';
      case 'canceled': return 'canceled-row';
      default: return '';
    }
  };
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="unauthorized-container">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }
  
  return (
    <div className="admin-orders-container">
      <h2 className="admin-title">Manage Orders</h2>
      
      {/* Info Panel */}
      <div className="admin-info-panel">
        <div className="info-icon">ℹ️</div>
        <div className="info-text">
          <p>View and manage all customer orders. You can update shipping status, mark orders as completed, or delete orders.</p>
          <p>Use the filters below to find specific orders.</p>
        </div>
      </div>
      
      {/* Order Stats - New section matching InventoryManagement stats */}
      <div className="order-stats">
        <div className="stat-card total-orders">
          <h3>Total Orders</h3>
          <span className="stat-value">{stats.total}</span>
        </div>
        
        <div className="stat-card processing">
          <h3>Processing</h3>
          <span className="stat-value">{stats.processing}</span>
        </div>
        
        <div className="stat-card completed">
          <h3>Completed</h3>
          <span className="stat-value">{stats.completed}</span>
        </div>
        
        <div className="stat-card canceled">
          <h3>Canceled</h3>
          <span className="stat-value">{stats.canceled}</span>
        </div>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* Filter Controls */}
      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search by order ID or customer name..."
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
              <option value="customer">Sort by Customer</option>
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
        <div className="loading-indicator">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="no-orders-message">
          <div className="no-orders-icon">📋</div>
          <p>No orders found matching your filter criteria.</p>
        </div>
      ) : (
        <div className="admin-orders-table-container">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Shipping Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr 
                  key={order.orderId}
                  className={`order-row ${getOrderRowClass(order.status)}`}
                >
                  <td>{order.orderId}</td>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name">{order.userDetails?.fullName}</div>
                      <div className="customer-email">{order.userDetails?.email}</div>
                    </div>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.items?.length || 0}</td>
                  <td>
                    <div className="order-total">
                      {formatPrice(order.total)}
                    </div>
                  </td>
                  <td>
                    {/* Status - Badge or Select based on status */}
                    {order.status === 'canceled' ? (
                      <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    ) : (
                      <div className="status-select-container">
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                          className={`shipping-status-select ${order.status === 'canceled' ? 'disabled' : ''}`}
                          disabled={order.status === 'canceled'}
                        >
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    )}
                  </td>
                  <td>
                    {/* Shipping Status Select */}
                    <div className="status-select-container">
                      <select 
                        value={order.shipping?.status || 'processing'}
                        onChange={(e) => updateShippingStatus(order.orderId, e.target.value)}
                        className={`shipping-status-select ${order.status === 'canceled' ? 'disabled' : ''}`}
                        disabled={order.status === 'canceled'}
                      >
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </td>
                  <td className="action-buttons-cell">
                    <button 
                      className="view-details-button"
                      onClick={() => viewOrderDetails(order.orderId)}
                    >
                      View
                    </button>
                    {/* Delete button (only shown for non-canceled orders) */}
                    {order.status !== 'canceled' && (
                      <button 
                        className="delete-order-button"
                        onClick={() => deleteOrder(order.orderId)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;