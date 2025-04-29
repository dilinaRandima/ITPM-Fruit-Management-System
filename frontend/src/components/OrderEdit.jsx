// src/components/OrderEdit.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './OrderEdit.css';

const OrderEdit = () => {
  const { orderId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    shippingMethod: 'standard'
  });
  
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
      
      // Check if the order belongs to the current user for security
      if (response.data.userId !== user.email) {
        setError('You do not have permission to edit this order.');
        setIsLoading(false);
        return;
      }
      
      // Check if order can be edited (only pending or processing status)
      if (response.data.status !== 'pending' && response.data.status !== 'processing') {
        setError('This order can no longer be edited. Only pending or processing orders can be modified.');
        setIsLoading(false);
        return;
      }
      
      setOrder(response.data);
      
      // Initialize form data from order
      setFormData({
        fullName: response.data.userDetails.fullName || '',
        email: response.data.userDetails.email || '',
        phone: response.data.userDetails.phone || '',
        address: response.data.userDetails.address || '',
        city: response.data.userDetails.city || '',
        postalCode: response.data.userDetails.postalCode || '',
        shippingMethod: response.data.shipping.method || 'standard'
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleShippingMethodChange = (e) => {
    setFormData({
      ...formData,
      shippingMethod: e.target.value
    });
  };
  
  const calculateShippingCost = (method) => {
    switch(method) {
      case 'express':
        return 500;
      case 'standard':
        return 250;
      case 'pickup':
        return 0;
      default:
        return 250;
    }
  };
  
  const calculateNewTotal = () => {
    if (!order) return 0;
    
    const shippingCost = calculateShippingCost(formData.shippingMethod);
    return order.subtotal + shippingCost;
  };
  
  const validateForm = () => {
    // Basic validation
    if (!formData.fullName || !formData.email || !formData.phone) {
      setError('Please fill in all required contact fields.');
      return false;
    }
    
    // If not pickup, validate address fields
    if (formData.shippingMethod !== 'pickup') {
      if (!formData.address || !formData.city || !formData.postalCode) {
        setError('Please fill in all required address fields.');
        return false;
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    
    // Phone validation (simple)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number.');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Calculate new total based on shipping method
      const shippingCost = calculateShippingCost(formData.shippingMethod);
      const newTotal = order.subtotal + shippingCost;
      
      // Calculate estimated delivery date based on shipping method
      const estimatedDelivery = new Date();
      if (formData.shippingMethod === 'express') {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
      } else if (formData.shippingMethod === 'standard') {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
      }
      
      // Prepare update data
      const updateData = {
        userDetails: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode
        },
        shipping: {
          method: formData.shippingMethod,
          cost: shippingCost,
          status: 'processing',
          estimatedDelivery
        },
        total: newTotal
      };
      
      // Send update request
      await axios.patch(`http://localhost:3001/api/orders/${orderId}`, updateData);
      
      setSuccessMessage('Order updated successfully!');
      setTimeout(() => {
        navigate(`/order/${orderId}`);
      }, 2000);
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate(`/order/${orderId}`);
  };
  
  // Format price as LKR
  const formatPrice = (price) => {
    return `LKR ${price?.toFixed(2) || '0.00'}`;
  };
  
  if (!user) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="order-edit-container">
      <button 
        onClick={() => navigate(-1)}
        className="back-link"
      >
        ← Back to Order Details
      </button>
      
      <h2 className="order-edit-title">Edit Order</h2>
      
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
            onClick={() => navigate('/orders')}
            className="back-to-orders-button"
          >
            Back to My Orders
          </button>
        </div>
      ) : (
        <div className="order-edit-content">
          <div className="edit-header">
            <div className="order-summary">
              <h3>Order: {order.orderId}</h3>
              <p className="order-items-count">{order.items.length} items | {formatPrice(order.subtotal)}</p>
            </div>
            
            <div className="new-total">
              New Total: {formatPrice(calculateNewTotal())}
            </div>
          </div>
          
          <div className="edit-form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-columns">
                <div className="form-column">
                  <h3>Contact Information</h3>
                  
                  <div className="form-row">
                    <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <label htmlFor="email">Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-column">
                  <h3>Shipping Information</h3>
                  
                  <div className="form-row">
                    <label htmlFor="address">Delivery Address <span className="required">*</span></label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-control"
                      required={formData.shippingMethod !== 'pickup'}
                      disabled={formData.shippingMethod === 'pickup'}
                    />
                  </div>
                  
                  <div className="form-row">
                    <label htmlFor="city">City <span className="required">*</span></label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-control"
                      required={formData.shippingMethod !== 'pickup'}
                      disabled={formData.shippingMethod === 'pickup'}
                    />
                  </div>
                  
                  <div className="form-row">
                    <label htmlFor="postalCode">Postal Code <span className="required">*</span></label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="form-control"
                      required={formData.shippingMethod !== 'pickup'}
                      disabled={formData.shippingMethod === 'pickup'}
                    />
                  </div>
                </div>
              </div>
              
              <div className="shipping-method-section">
                <h3>Shipping Method</h3>
                
                <div className="shipping-options">
                  <div className={`shipping-option ${formData.shippingMethod === 'standard' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      id="standard"
                      name="shippingMethod"
                      value="standard"
                      checked={formData.shippingMethod === 'standard'}
                      onChange={handleShippingMethodChange}
                    />
                    <div className="shipping-option-details">
                      <div className="shipping-name">Standard Delivery</div>
                      <div className="shipping-description">Delivered within 3-5 business days</div>
                    </div>
                    <div className="shipping-price">LKR 250.00</div>
                  </div>
                  
                  <div className={`shipping-option ${formData.shippingMethod === 'express' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      id="express"
                      name="shippingMethod"
                      value="express"
                      checked={formData.shippingMethod === 'express'}
                      onChange={handleShippingMethodChange}
                    />
                    <div className="shipping-option-details">
                      <div className="shipping-name">Express Delivery</div>
                      <div className="shipping-description">Delivered within 1-2 business days</div>
                    </div>
                    <div className="shipping-price">LKR 500.00</div>
                  </div>
                  
                  <div className={`shipping-option ${formData.shippingMethod === 'pickup' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      id="pickup"
                      name="shippingMethod"
                      value="pickup"
                      checked={formData.shippingMethod === 'pickup'}
                      onChange={handleShippingMethodChange}
                    />
                    <div className="shipping-option-details">
                      <div className="shipping-name">Store Pickup</div>
                      <div className="shipping-description">Collect from our store in Malabe</div>
                    </div>
                    <div className="shipping-price">Free</div>
                  </div>
                </div>
                
                {formData.shippingMethod === 'pickup' && (
                  <div className="pickup-notice">
                    <strong>Note:</strong> For store pickup, your order will be available at our Malabe store during business hours (9 AM - 6 PM).
                    Please bring a valid ID when collecting your order.
                  </div>
                )}
              </div>
              
              <div className="order-items-preview">
                <h3>Order Items</h3>
                <p className="items-note">Order items cannot be modified. To change items, please cancel this order and create a new one.</p>
                
                <div className="items-container">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item-card">
                      <div className="item-image">
                        <img 
                          src={`http://localhost:3001${item.imageUrl}`} 
                          alt={item.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-fruit.png';
                          }}
                        />
                      </div>
                      <div className="item-details">
                        <div className="item-name">{item.name}</div>
                        <div className="item-grade">Grade {item.grade}</div>
                        <div className="item-price">{formatPrice(item.price)} x {item.quantity}</div>
                      </div>
                      <div className="item-total">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderEdit;