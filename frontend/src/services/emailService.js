// src/services/emailService.js
// This service is a simulation for sending emails
// In a production environment, you would integrate with a real email service
// like SendGrid, Mailgun, AWS SES, etc.

// Function to simulate sending order confirmation email
export const sendOrderConfirmationEmail = (orderDetails, orderId) => {
    return new Promise((resolve, reject) => {
      // In a real implementation, you would call the email service API here
      console.log('Sending order confirmation email to:', orderDetails.userDetails.email);
      console.log('Order ID:', orderId);
      console.log('Order Total:', orderDetails.total);
      
      // Simulate API call delay
      setTimeout(() => {
        // Simulate success
        console.log('Email sent successfully');
        resolve({
          success: true,
          message: 'Order confirmation email sent successfully'
        });
        
        // To simulate error:
        // reject(new Error('Failed to send email'));
      }, 1000);
    });
  };
  
  // Function to generate HTML email content
  export const generateOrderConfirmationHTML = (orderDetails, orderId) => {
    const estimatedDelivery = new Date();
    if (orderDetails.shipping.method === 'express') {
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
    } else if (orderDetails.shipping.method === 'standard') {
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
    }
    
    const formattedDelivery = estimatedDelivery.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const itemsHTML = orderDetails.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.name} (Grade ${item.grade})
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          LKR ${item.price.toFixed(2)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          LKR ${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - Fresh Route</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 20px;
          }
          .order-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          .section-title {
            color: #a4bc5a;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #f0f7e6;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #eee;
          }
          .summary-row {
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #777;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            background-color: #a4bc5a;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://freshroute.com/logo.png" alt="Fresh Route" class="logo">
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
          </div>
          
          <div class="order-info">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })}</p>
            <p><strong>Estimated Delivery:</strong> ${formattedDelivery}</p>
          </div>
          
          <h2 class="section-title">Order Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
              <tr class="summary-row">
                <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                  Subtotal:
                </td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                  LKR ${orderDetails.subtotal.toFixed(2)}
                </td>
              </tr>
              <tr class="summary-row">
                <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                  Shipping (${orderDetails.shipping.method}):
                </td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                  ${orderDetails.shipping.cost > 0 ? `LKR ${orderDetails.shipping.cost.toFixed(2)}` : 'Free'}
                </td>
              </tr>
              <tr class="summary-row">
                <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                  <strong>Order Total:</strong>
                </td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; font-weight: bold; color: #a4bc5a;">
                  LKR ${orderDetails.total.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          
          <h2 class="section-title">Shipping Information</h2>
          <p><strong>Name:</strong> ${orderDetails.userDetails.fullName}</p>
          <p><strong>Address:</strong> ${orderDetails.userDetails.address}, ${orderDetails.userDetails.city}, ${orderDetails.userDetails.postalCode}</p>
          <p><strong>Phone:</strong> ${orderDetails.userDetails.phone}</p>
          <p><strong>Shipping Method:</strong> ${orderDetails.shipping.method}</p>
          
          <h2 className="section-title">Payment Information</h2>
        <p><strong>Payment Method:</strong> ${orderDetails.payment.method === 'card' 
          ? `Credit Card (ending in ${orderDetails.payment.cardLast4})` 
          : 'Cash on Delivery'}</p>
        <p><strong>Payment Status:</strong> ${orderDetails.payment.method === 'card' 
          ? 'Completed' 
          : 'Pay on delivery'}</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://freshroute.com/track-order/${orderId}" class="button">Track Your Order</a>
          </div>
          
          <div class="footer">
            <p>If you have any questions, please contact our customer service at info@freshroute.com or call us at (+94) 716666690.</p>
            <p>&copy; 2025 FRESH ROUTE - Fruit Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };