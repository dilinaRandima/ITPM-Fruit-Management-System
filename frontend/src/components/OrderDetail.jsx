// src/components/OrderDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './OrderDetail.css';

const OrderDetail = () => {
  const { orderId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchOrderDetails();
  }, [user, navigate, orderId]);
  
  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`http://localhost:3001/api/orders/${orderId}`);
      
      // Modified check: Allow admins to view any order, but restrict regular users to their own orders
      if (user.role !== 'admin' && response.data.userId !== user.email) {
        setError('You do not have permission to view this order.');
        setIsLoading(false);
        return;
      }
      
      setOrder(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again.');
      setIsLoading(false);
    }
  };
  
  const cancelOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        setIsLoading(true);
        
        await axios.patch(`http://localhost:3001/api/orders/${orderId}/status`, {
          status: 'canceled'
        });
        
        // Update local state
        setOrder(prevOrder => ({
          ...prevOrder,
          status: 'canceled'
        }));
        
        setSuccessMessage('Order canceled successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error canceling order:', err);
        setError('Failed to cancel order. Please try again.');
        setIsLoading(false);
      }
    }
  };
  
  const handleEditOrder = () => {
    navigate(`/order-edit/${orderId}`);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleBackToOrders = () => {
    // Go back to previous page instead of using fixed routes
    navigate(-1);
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
    <div className="order-detail-container">
      <button 
        onClick={handleBackToOrders}
        className="back-link"
      >
        ← Back to {user.role === 'admin' ? 'Manage Orders' : 'My Orders'}
      </button>
      
      <h2 className="order-detail-title">Order Details</h2>
      
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
      
      {/* Loading State */}
      {isLoading ? (
        <div className="loading-indicator">Loading order details...</div>
      ) : !order ? (
        <div className="not-found-message">
          <div className="not-found-icon">🔍</div>
          <p>Order not found</p>
          <button 
            onClick={handleBackToOrders}
            className="back-to-orders-button"
          >
            Back to {user.role === 'admin' ? 'Manage Orders' : 'My Orders'}
          </button>
        </div>
      ) : (
        <div className="order-detail-content">
          <div className="order-header-section">
            <div className="order-id-section">
              <h3>Order ID: {order.orderId}</h3>
              <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
            </div>
            
            <div className={`order-status-badge ${getStatusBadgeClass(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>
          
          <div className="order-actions-top">
            <div className="order-total-badge">
              Total: {formatPrice(order.total)}
            </div>
            
            {user.role !== 'admin' && (order.status === 'pending' || order.status === 'processing') && (
              <div className="order-buttons">
                <button 
                  className="edit-order-button"
                  onClick={handleEditOrder}
                >
                  Edit Order
                </button>
                
                <button 
                  className="cancel-order-button"
                  onClick={cancelOrder}
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
          
          <div className="order-detail-card">
            <div className="order-detail-section">
              <h3>Items Ordered</h3>
              
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="order-item">
                          <div className="order-item-image">
                            <img 
                              src={`http://localhost:3001${item.imageUrl}`} 
                              alt={item.name} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/placeholder-fruit.png';
                              }}
                            />
                          </div>
                          <div className="order-item-details">
                            <div className="order-item-name">{item.name}</div>
                            <div className="order-item-grade">Grade {item.grade}</div>
                          </div>
                        </div>
                      </td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3">Subtotal</td>
                    <td>{formatPrice(order.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3">Shipping ({order.shipping.method})</td>
                    <td>{order.shipping.cost > 0 ? formatPrice(order.shipping.cost) : 'Free'}</td>
                  </tr>
                  <tr className="order-total-row">
                    <td colSpan="3">Total</td>
                    <td>{formatPrice(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="order-info-sections">
              <div className="order-detail-section half-width">
                <h3>Shipping Information</h3>
                <div className="info-box">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{order.userDetails.fullName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Address:</span>
                    <span className="info-value">{order.userDetails.address}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">City:</span>
                    <span className="info-value">{order.userDetails.city}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Postal Code:</span>
                    <span className="info-value">{order.userDetails.postalCode}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{order.userDetails.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Shipping Method:</span>
                    <span className="info-value">
                      {order.shipping.method === 'standard' ? 'Standard Delivery' : 
                       order.shipping.method === 'express' ? 'Express Delivery' : 'Store Pickup'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Estimated Delivery:</span>
                    <span className="info-value">{formatDate(order.shipping.estimatedDelivery)}</span>
                  </div>
                </div>
                
                {order.shipping.method !== 'pickup' && order.status !== 'canceled' && (
                  <div className="shipping-status">
                    <h4>Shipping Status</h4>
                    <div className="shipping-steps">
                      <div className={`shipping-step ${order.shipping.status === 'processing' || order.shipping.status === 'shipped' || order.shipping.status === 'delivered' ? 'active' : ''}`}>
                        <div className="step-icon">1</div>
                        <div className="step-name">Processing</div>
                      </div>
                      <div className={`shipping-step ${order.shipping.status === 'shipped' || order.shipping.status === 'delivered' ? 'active' : ''}`}>
                        <div className="step-icon">2</div>
                        <div className="step-name">Shipped</div>
                      </div>
                      <div className={`shipping-step ${order.shipping.status === 'delivered' ? 'active' : ''}`}>
                        <div className="step-icon">3</div>
                        <div className="step-name">Delivered</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="order-detail-section half-width">
                <h3>Payment Information</h3>
                <div className="info-box">
                  <div className="info-item">
                    <span className="info-label">Payment Method:</span>
                    <span className="info-value">{order.payment.method}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Payment Status:</span>
                    <span className="info-value">{order.payment.status}</span>
                  </div>
                </div>
                
                {order.payment.status === 'completed' && (
                  <div className="payment-success">
                    Payment completed successfully.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="order-actions-bottom">
            <button 
              onClick={handlePrint}
              className="print-order-button"
            >
              Print Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
