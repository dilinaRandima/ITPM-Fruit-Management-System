// src/components/Footer.jsx
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="home-footer">
      <div className="footer-content">
        <div className="footer-column">
          <h3>Contact Us</h3>
          <p>Location: Malabe Srilanka</p>
          <p>Call us: (+94) 716666690</p>
          <p>Email: info@freshroute.com</p>
          <div className="social-icons">
            <a href="https://www.facebook.com" className="social-icon facebook hover-float"></a>
            <a href="https://www.instagram.com" className="social-icon instagram hover-float"></a>
            <a href="https://www.tiktok.com" className="social-icon tiktok hover-float"></a>
          </div>
        </div>
        
        <div className="footer-column">
          <h3>Information</h3>
          <ul>
            <li><a href="#" className="footer-link">About Us</a></li>
            <li><a href="#" className="footer-link">Grading System</a></li>
            <li><a href="#" className="footer-link">Distribution</a></li>
            <li><a href="#" className="footer-link">API Documentation</a></li>
            <li><a href="#" className="footer-link">Contact</a></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h3>Newsletter Sign Up</h3>
          <p>Receive our latest updates about our system and features.</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email address" />
            <button type="submit">Submit</button>
          </div>
        </div>
      </div>
      
      <div className="footer-divider"></div>
      
      <div className="footer-copyright">
        <p>© 2025 FRESH ROUTE - Fruit Management System</p>
      </div>
    </footer>
  );
};

export default Footer;