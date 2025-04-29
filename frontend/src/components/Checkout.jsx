// src/components/Checkout.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import './Checkout.css';

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(250); // Default shipping cost
  const [total, setTotal] = useState(0);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    shippingMethod: 'standard',
    paymentMethod: 'card' // Default to card payment
  });
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchCartItems();
  }, [user, navigate]);
  
  useEffect(() => {
    // Calculate subtotal
    const itemsSubtotal = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    setSubtotal(itemsSubtotal);
    
    // Calculate total
    setTotal(itemsSubtotal + shipping);
  }, [cartItems, shipping]);
  
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`http://localhost:3001/api/cart/${user.email}`);
      setCartItems(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cart items:', err);
      setError('Failed to load cart items. Please try again.');
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Format card number with spaces
      const cleaned = value.replace(/\s+/g, '');
      const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
      setFormData({
        ...formData,
        [name]: formatted
      });
    } else if (name === 'expiryDate') {
      // Format expiry date as MM/YY
      const cleaned = value.replace(/[^\d]/g, '');
      let formatted = cleaned;
      
      if (cleaned.length > 2) {
        formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
      }
      
      setFormData({
        ...formData,
        [name]: formatted
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when typing
    if (error) setError('');
  };
  
  const handleShippingChange = (e) => {
    const method = e.target.value;
    setFormData({
      ...formData,
      shippingMethod: method
    });
    
    // Update shipping cost based on method
    if (method === 'express') {
      setShipping(500);
    } else if (method === 'standard') {
      setShipping(250);
    } else {
      setShipping(0); // Pick-up
    }
  };
  
  const validateForm = () => {
    // Base required fields (always required regardless of payment method)
    const baseRequiredFields = [
      'fullName', 'email', 'phone', 'address', 
      'city', 'postalCode'
    ];
    
    // Validate base fields first
    for (const field of baseRequiredFields) {
      if (!formData[field].trim()) {
        setError(`Please enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    // Validate full name (letters and spaces only)
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(formData.fullName)) {
      setError('Full name can only contain letters and spaces');
      return false;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Validate phone number (must be 10 digits starting with 07)
    const phoneClean = formData.phone.replace(/\D/g, '');
    if (phoneClean.length !== 10 || !phoneClean.startsWith('07')) {
      setError('Phone number must be 10 digits and start with 07');
      return false;
    }
    
    // Validate city (letters and spaces only)
    const cityRegex = /^[A-Za-z\s]+$/;
    if (!cityRegex.test(formData.city)) {
      setError('City can only contain letters and spaces');
      return false;
    }
    
    // Validate postal code (numbers only)
    const postalCodeRegex = /^\d+$/;
    if (!postalCodeRegex.test(formData.postalCode)) {
      setError('Postal code can only contain numbers');
      return false;
    }
    
    // Only validate card details if payment method is 'card'
    if (formData.paymentMethod === 'card') {
      // Card payment specific fields
      const cardFields = ['cardNumber', 'cardName', 'expiryDate', 'cvv'];
      
      for (const field of cardFields) {
        if (!formData[field].trim()) {
          setError(`Please enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return false;
        }
      }
      
      // Validate card name (letters and spaces only)
      const cardNameRegex = /^[A-Za-z\s]+$/;
      if (!cardNameRegex.test(formData.cardName)) {
        setError('Name on card can only contain letters and spaces');
        return false;
      }
      
      // Validate card number (basic, remove spaces)
      const cardNumber = formData.cardNumber.replace(/\s+/g, '');
      if (cardNumber.length < 14 || cardNumber.length > 19) {
        setError('Please enter a valid card number');
        return false;
      }
      
      // Validate expiry date (MM/YY)
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(formData.expiryDate)) {
        setError('Please enter a valid expiry date (MM/YY)');
        return false;
      }
      
      // Validate CVV (exactly 3 digits)
      const cvvRegex = /^\d{3}$/;
      if (!cvvRegex.test(formData.cvv)) {
        setError('CVV must be exactly 3 digits');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create order object
      const orderData = {
        userId: user.email,
        userDetails: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode
        },
        items: cartItems,
        payment: {
          method: formData.paymentMethod,
          // Only include card details if payment method is card
          ...(formData.paymentMethod === 'card' && {
            cardLast4: formData.cardNumber.slice(-4),
            status: 'completed'
          }),
          ...(formData.paymentMethod !== 'card' && {
            status: 'pending'
          })
        },
        shipping: {
          method: formData.shippingMethod,
          cost: shipping,
          status: 'processing'
        },
        subtotal,
        total
      };
      
      // Create the order in the database
      const response = await axios.post('http://localhost:3001/api/orders', orderData);
      
      // REMOVE THIS ENTIRE SECTION - The server already handles quantity updates
      // ===== BEGIN REMOVE =====
      /*
      // Update fruit quantities in inventory
      for (const item of cartItems) {
        try {
          // Get current fruit data
          const fruitResponse = await axios.get(`http://localhost:3001/api/fruits/${item.fruitId}`);
          const fruit = fruitResponse.data;
          
          // Calculate new quantity
          const newQuantity = Math.max(0, fruit.quantity - item.quantity);
          
          // Update fruit quantity
          await axios.put(`http://localhost:3001/api/fruits/${item.fruitId}`, {
            quantity: newQuantity
          });
          
          console.log(`Updated quantity for ${fruit.name} from ${fruit.quantity} to ${newQuantity}`);
        } catch (error) {
          console.error(`Failed to update quantity for fruit ID ${item.fruitId}:`, error);
        }
      }
      */
      // ===== END REMOVE =====
      
      // Clear cart
      await axios.delete(`http://localhost:3001/api/cart/user/${user.email}`);
      
      // Show success message
      setSuccess('Your order has been placed successfully!');
      
      // Get the order ID from the response
      const orderId = response.data.order.orderId;
      
      // Redirect to confirmation page after short delay
      setTimeout(() => {
        navigate('/order-confirmation', { 
          state: { 
            order: orderData,
            orderId: orderId
          } 
        });
      }, 1500);
      
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const getCardTypeIcon = (cardNumber) => {
    const number = cardNumber.replace(/\s+/g, '');
    
    // Visa
    if (/^4/.test(number)) {
      return '💳 Visa';
    }
    
    // Mastercard
    if (/^5[1-5]/.test(number)) {
      return '💳 Mastercard';
    }
    
    // Amex
    if (/^3[47]/.test(number)) {
      return '💳 Amex';
    }
    
    // Discover
    if (/^6(?:011|5)/.test(number)) {
      return '💳 Discover';
    }
    
    return '💳';
  };
  
  if (!user) {
    return (
      <div className="checkout-container">
        <div className="error-message">Please log in to continue checkout.</div>
      </div>
    );
  }
  
  if (cartItems.length === 0 && !loading) {
    return (
      <div className="checkout-container">
        <h2 className="checkout-title">Checkout</h2>
        <div className="error-message">Your cart is empty. Please add items to your cart before checkout.</div>
        <button 
          onClick={() => navigate('/market')}
          className="back-link"
        >
          ← Go to Market
        </button>
      </div>
    );
  }
  
  return (
    <div className="checkout-container">
      <button 
        onClick={() => navigate(-1)}
        className="back-link"
      >
        ← Back to Cart
      </button>
      
      <h2 className="checkout-title">Secure Checkout</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="checkout-layout">
          {/* Left column: Shipping & Payment */}
          <div className="checkout-card">
            <h3>Shipping & Contact Information</h3>
            
            <div className="form-row">
              <label htmlFor="fullName">Full Name <span className="required">*</span></label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter your full name"
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
                placeholder="Enter your email address"
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
                placeholder="Enter your phone number"
              />
            </div>
            
            <div className="form-row">
              <label htmlFor="address">Delivery Address <span className="required">*</span></label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter your delivery address"
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
                placeholder="Enter your city"
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
                placeholder="Enter your postal code"
              />
            </div>
            
            <div className="form-row">
              <label>Shipping Method <span className="required">*</span></label>
              <div className="shipping-options">
                <div className={`shipping-option ${formData.shippingMethod === 'standard' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    id="standard"
                    name="shippingMethod"
                    value="standard"
                    checked={formData.shippingMethod === 'standard'}
                    onChange={handleShippingChange}
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
                    onChange={handleShippingChange}
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
                    onChange={handleShippingChange}
                  />
                  <div className="shipping-option-details">
                    <div className="shipping-name">Store Pickup</div>
                    <div className="shipping-description">Collect from our store in Malabe</div>
                  </div>
                  <div className="shipping-price">Free</div>
                </div>
              </div>
            </div>
            
            <h3>Payment Information</h3>
            
            <div className="form-row">
              <label htmlFor="cardNumber">Card Number <span className="required">*</span></label>
              <div className="card-number-container">
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="XXXX XXXX XXXX XXXX"
                  maxLength="19"
                />
                <span className="card-type-icon">
                  {getCardTypeIcon(formData.cardNumber)}
                </span>
              </div>
            </div>
            
            <div className="form-row">
              <label htmlFor="cardName">Name on Card <span className="required">*</span></label>
              <input
                type="text"
                id="cardName"
                name="cardName"
                value={formData.cardName}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter the name on your card"
              />
            </div>
            
            <div className="card-details">
              <div className="form-row">
                <label htmlFor="expiryDate">Expiry Date <span className="required">*</span></label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="MM/YY"
                  maxLength="5"
                />
              </div>
              
              <div className="form-row">
                <label htmlFor="cvv">CVV <span className="required">*</span></label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="XXX"
                  maxLength="4"
                />
              </div>
            </div>
            
            <div className="secure-badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              </svg>
              Secure encryption for your payment information
            </div>
          </div>
          
          {/* Right column: Order Summary */}
          <div className="checkout-card">
            <h3>Order Summary</h3>
            
            <div className="order-summary">
              {cartItems.map(item => (
                <div className="order-item" key={item._id}>
                  <div className="order-item-left">
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
                    <div>
                      <div className="order-item-name">{item.name}</div>
                      <div className="order-item-details">
                        Grade {item.grade} • Qty: {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="order-item-price">
                    LKR {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="order-subtotal">
              <div>Subtotal</div>
              <div>LKR {subtotal.toFixed(2)}</div>
            </div>
            
            <div className="order-shipping">
              <div>Shipping</div>
              <div>{shipping > 0 ? `LKR ${shipping.toFixed(2)}` : 'Free'}</div>
            </div>
            
            <div className="order-total">
              <div>Total</div>
              <div>LKR {total.toFixed(2)}</div>
            </div>
            
            <button 
              type="submit" 
              className={`payment-button ${loading ? 'loading' : ''}`}
              disabled={loading || cartItems.length === 0}
            >
              {loading ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;