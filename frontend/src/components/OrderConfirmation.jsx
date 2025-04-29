// src/components/OrderConfirmation.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  
  useEffect(() => {
    // If there's no order state, redirect to home
    if (!location.state?.order) {
      navigate('/');
      return;
    }
    
    // Set order details from state
    setOrderDetails(location.state.order);
    setOrderId(location.state.orderId || 'ORD-' + Math.floor(100000 + Math.random() * 900000));
    
    // Calculate estimated delivery date based on shipping method
    const deliveryDate = new Date();
    if (location.state.order.shipping.method === 'express') {
      // Express delivery: 1-2 business days
      deliveryDate.setDate(deliveryDate.getDate() + 2);
    } else if (location.state.order.shipping.method === 'standard') {
      // Standard delivery: 3-5 business days
      deliveryDate.setDate(deliveryDate.getDate() + 5);
    } else {
      // Pickup: same day
      deliveryDate.setDate(deliveryDate.getDate() + 0);
    }
    
    // Format the date as DD MMM YYYY
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    setEstimatedDelivery(deliveryDate.toLocaleDateString('en-US', options));
    
    // Simulate sending email
    console.log("Sending confirmation email to:", location.state.order.userDetails.email);
  }, [location, navigate]);
  
  const handlePrint = () => {
    const printContent = document.getElementById('printable-receipt');
    const originalContents = document.body.innerHTML;
    
    // Create a print-friendly version
    document.body.innerHTML = printContent.innerHTML;
    
    // Add print-specific styling
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #000;
        }
        h2 {
          color: #000;
          text-align: center;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .order-total-row td {
          font-weight: bold;
          border-top: 2px solid #000;
        }
        .customer-info {
          margin-top: 30px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .info-item {
          margin-bottom: 15px;
        }
        .info-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .info-value {
          font-size: 14px;
          color: #000;
        }
        .company-info {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Print
    window.print();
    
    // Restore original content
    document.body.innerHTML = originalContents;
  };
  
  const handleContinueShopping = () => {
    navigate('/market');
  };
  
  if (!orderDetails) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="order-confirmation-container">
      <h2 className="confirmation-title">Order Confirmation</h2>
      
      <div className="confirmation-message">
        <span className="success-icon">✓</span>
        <p>Your order has been placed successfully!</p>
        <p>Order ID: <span className="order-id">{orderId}</span></p>
        <p>A confirmation email has been sent to <strong>{orderDetails.userDetails.email}</strong></p>
      </div>
      
      {/* Hidden printable receipt that's used for printing */}
      <div id="printable-receipt" style={{display: 'none'}}>
        <h2>Order Receipt - Fresh Route</h2>
        <p><strong>Order ID:</strong> {orderId}</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric'
        })}</p>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orderDetails.items.map((item) => (
              <tr key={item._id}>
                <td>{item.name} (Grade {item.grade})</td>
                <td>{item.quantity}</td>
                <td>LKR {item.price.toFixed(2)}</td>
                <td>LKR {(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="3" style={{textAlign: 'right'}}>Subtotal</td>
              <td>LKR {orderDetails.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="3" style={{textAlign: 'right'}}>Shipping ({orderDetails.shipping.method})</td>
              <td>{orderDetails.shipping.cost > 0 ? `LKR ${orderDetails.shipping.cost.toFixed(2)}` : 'Free'}</td>
            </tr>
            <tr className="order-total-row">
              <td colSpan="3" style={{textAlign: 'right'}}>Total</td>
              <td>LKR {orderDetails.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div className="customer-info">
          <div>
            <div className="info-item">
              <div className="info-label">Full Name</div>
              <div className="info-value">{orderDetails.userDetails.fullName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Email</div>
              <div className="info-value">{orderDetails.userDetails.email}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Phone</div>
              <div className="info-value">{orderDetails.userDetails.phone}</div>
            </div>
          </div>
          <div>
            <div className="info-item">
              <div className="info-label">Shipping Address</div>
              <div className="info-value">
                {orderDetails.userDetails.address}, {orderDetails.userDetails.city}, {orderDetails.userDetails.postalCode}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Payment Method</div>
              <div className="info-value">
                {orderDetails.payment.method === 'card' 
                  ? `Credit Card (ending in ${orderDetails.payment.cardLast4})` 
                  : 'Cash on Delivery'}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Estimated Delivery</div>
              <div className="info-value">{estimatedDelivery}</div>
            </div>
          </div>
        </div>
        
        <div className="company-info">
          <p>Fresh Route Fruit Management System</p>
          <p>Location: Malabe, Sri Lanka | Phone: (+94) 716666690 | Email: info@freshroute.com</p>
          <p>© 2025 FRESH ROUTE - All rights reserved</p>
        </div>
      </div>
      
      <div className="confirmation-card">
        <div className="confirmation-section">
          <h3>Order Summary</h3>
          
          <table className="order-items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orderDetails.items.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="order-item-name">
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
                      {item.name}
                      <span className="item-grade">Grade {item.grade}</span>
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>LKR {item.price.toFixed(2)}</td>
                  <td>LKR {(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" style={{textAlign: 'right'}}>Subtotal</td>
                <td>LKR {orderDetails.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="3" style={{textAlign: 'right'}}>Shipping ({orderDetails.shipping.method})</td>
                <td>{orderDetails.shipping.cost > 0 ? `LKR ${orderDetails.shipping.cost.toFixed(2)}` : 'Free'}</td>
              </tr>
              <tr className="order-total-row">
                <td colSpan="3" style={{textAlign: 'right'}}>Total</td>
                <td>LKR {orderDetails.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          {orderDetails.shipping.method !== 'pickup' && (
            <div className="delivery-estimate">
              <div className="delivery-icon">🚚</div>
              <div className="delivery-details">
                <div className="delivery-date">Estimated Delivery: {estimatedDelivery}</div>
                <div className="delivery-message">
                  {orderDetails.shipping.method === 'express' 
                    ? 'Express delivery (1-2 business days)' 
                    : 'Standard delivery (3-5 business days)'}
                </div>
              </div>
            </div>
          )}
          
          {orderDetails.shipping.method === 'pickup' && (
            <div className="delivery-estimate">
              <div className="delivery-icon">🏬</div>
              <div className="delivery-details">
                <div className="delivery-date">Ready for Pickup: {estimatedDelivery} (Today)</div>
                <div className="delivery-message">
                  You can pick up your order from our store in Malabe during business hours (9 AM - 6 PM)
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="confirmation-section">
          <h3>Customer Information</h3>
          
          <div className="customer-info">
            <div>
              <div className="info-item">
                <div className="info-label">Full Name</div>
                <div className="info-value">{orderDetails.userDetails.fullName}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">Email</div>
                <div className="info-value">{orderDetails.userDetails.email}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">Phone</div>
                <div className="info-value">{orderDetails.userDetails.phone}</div>
              </div>
            </div>
            
            <div>
              <div className="info-item">
                <div className="info-label">Shipping Address</div>
                <div className="info-value">
                  {orderDetails.userDetails.address}, {orderDetails.userDetails.city}, {orderDetails.userDetails.postalCode}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-label">Payment Method</div>
                <div className="info-value">
                  {orderDetails.payment.method === 'card' 
                    ? `Credit Card (ending in ${orderDetails.payment.cardLast4})` 
                    : 'Cash on Delivery'}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-label">Order Date</div>
                <div className="info-value">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="action-buttons">
        <button onClick={handlePrint} className="action-button secondary-button">
          Print Receipt
        </button>
        <button onClick={handleContinueShopping} className="action-button primary-button">
          Continue Shopping
        </button>
      </div>
      
      <div className="email-notification">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
        </svg>
        A detailed receipt has been sent to your email address.
      </div>
    </div>
  );
};

export default OrderConfirmation;