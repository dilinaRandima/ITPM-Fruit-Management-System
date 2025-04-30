// src/components/HomePage.jsx (Updated to remove footer)
import React, { useState, useEffect } from 'react';
import './HomePage.css';
// Import images
import fruitGallery1 from '../assets/fruit-gallery-1.jpg';
import fruitGallery2 from '../assets/fruit-gallery-2.jpg';
import fruitGallery3 from '../assets/fruit-gallery-3.jpg';
import fruitGallery4 from '../assets/fruit-gallery-4.jpg';

const HomePage = () => {
  // State for animated elements
  const [isVisible, setIsVisible] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(Array(4).fill(false));
  // Gallery images array
  const galleryImages = [fruitGallery1, fruitGallery2, fruitGallery3, fruitGallery4];
  
  // Set visibility after component mounts for animations
  useEffect(() => {
    setIsVisible(true);
    
    // Gallery rotation timer
    const galleryTimer = setInterval(() => {
      setActiveGalleryIndex(prev => (prev + 1) % galleryImages.length);
    }, 5000);
    
    return () => clearInterval(galleryTimer);
  }, [galleryImages.length]);
  // Function to handle image loading
const handleImageLoaded = (index) => {
  const newLoadedState = [...imagesLoaded];
  newLoadedState[index] = true;
  setImagesLoaded(newLoadedState);
};
  return (
    <div className="home-container">
      {/* Video Hero Banner Section */}
      <div className="video-hero-banner">
        <div className="video-container">
        <video autoPlay muted loop className="hero-video">
  <source src="/videos/fruit-video.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
{/* Mobile Navigation */}
<div className="mobile-nav">
  <button 
    className={`hamburger-menu ${mobileMenuOpen ? 'open' : ''}`}
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    aria-label="Menu"
  >
    <span></span>
    <span></span>
    <span></span>
  </button>
  
  <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/grading">Fruit Grading</a></li>
        <li><a href="/analytics">Analytics</a></li>
        <li><a href="/inventory">Inventory</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </div>
</div>
          <div className="video-overlay"></div>
        </div>
        
        <div className={`hero-content ${isVisible ? 'fade-in' : ''}`}>
          <p className="hero-subtitle">The Srilanka's #1 Fruit Supplier</p>
          <h1 className="hero-title">Fresh Fruits Delivered To Your Door</h1>
          <p className="hero-description">Juicy, Sweet & Ready To Eat</p>
          <button className="hero-button pulse-animation">SHOP NOW</button>
        </div>
      </div>
      
      {/* Feature Highlights Section */}
      <div className="feature-highlights">
        <div className={`feature-item ${isVisible ? 'slide-in-left' : ''}`}>
          <div className="feature-icon">🚚</div>
          <h3>Free Next Day Delivery</h3>
          <p>On all orders over LKR5000/=</p>
        </div>
        
        <div className={`feature-item ${isVisible ? 'slide-in-up' : ''}`}>
          <div className="feature-icon">🍋</div>
          <h3>Always Fresh</h3>
          <p>Highest quality guaranteed</p>
        </div>
        
        <div className={`feature-item ${isVisible ? 'slide-in-right' : ''}`}>
          <div className="feature-icon">🌱</div>
          <h3>Ethically Sourced</h3>
          <p>Supporting sustainable farming</p>
        </div>
      </div>
      
      {/* Image Gallery Section */}
      <div className="fruit-gallery-section">
        <h2 className="section-title fade-in">Discover Exotic Varieties</h2>
        
        <div className="gallery-container">
        {galleryImages.map((image, index) => (
  <div 
    key={index}
    className={`gallery-item ${index === activeGalleryIndex ? 'active' : ''}`}
  >
    {!imagesLoaded[index] && (
      <div className="skeleton-loader"></div>
    )}
    <div
      className={`gallery-image ${imagesLoaded[index] ? 'loaded' : ''}`}
      style={{ backgroundImage: `url(${image})` }}
      onLoad={() => handleImageLoaded(index)}
    >
      <div className="gallery-overlay">
        <h3 className="gallery-title">Premium {index === 0 ? 'Tropical' : index === 1 ? 'Citrus' : index === 2 ? 'Exotic' : 'Seasonal'} Selection</h3>
        <button className="gallery-button">Explore</button>
      </div>
    </div>
  </div>
))}
          
          <div className="gallery-indicators">
            {galleryImages.map((_, index) => (
              <span 
                key={index} 
                className={`indicator ${index === activeGalleryIndex ? 'active' : ''}`}
                onClick={() => setActiveGalleryIndex(index)}
              ></span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Access Cards with enhanced styling */}
      <div className="quick-access-section">
        <h2 className="section-title fade-in">Our Services</h2>
        <div className="quick-access-grid">
          <div className="quick-access-card hover-lift">
            <div className="card-icon pulsate">🍎</div>
            <h3>Grade New Fruit</h3>
            <p>Upload and analyze fruit images </p>
            <button className="card-button">Start Grading</button>
          </div>
          
          <div className="quick-access-card hover-lift">
            <div className="card-icon pulsate">📊</div>
            <h3>View Analytics</h3>
            <p>Check latest quality metrics and trends</p>
            <button className="card-button">Open Dashboard</button>
          </div>
          
          <div className="quick-access-card hover-lift">
            <div className="card-icon pulsate">🚚</div>
            <h3>Manage Shipments</h3>
            <p>Track and organize distribution logistics</p>
            <button className="card-button">Distribution Center</button>
          </div>
          
          <div className="quick-access-card hover-lift">
            <div className="card-icon pulsate">📦</div>
            <h3>Inventory Control</h3>
            <p>Monitor stock levels and movements</p>
            <button className="card-button">Check Inventory</button>
          </div>
        </div>
      </div>
      {/* Newsletter Signup */}
<div className="newsletter-section">
  <div className="newsletter-container">
    <div className="newsletter-content">
      <h2>Stay Updated with Fresh News</h2>
      <p>Subscribe to our newsletter for exclusive offers, seasonal updates, and fruit care tips.</p>
      
      <form className="newsletter-form" onSubmit={(e) => {
        e.preventDefault();
        alert('Thank you for subscribing to our newsletter!');
        e.target.reset();
      }}>
        <div className="form-group">
          <input 
            type="email" 
            placeholder="Your email address" 
            required 
            className="newsletter-input"
          />
          <button type="submit" className="newsletter-button">Subscribe</button>
        </div>
        <label className="privacy-label">
          <input type="checkbox" required />
          <span>I agree to receive marketing emails and accept the <a href="/privacy">Privacy Policy</a></span>
        </label>
      </form>
    </div>
    <div className="newsletter-image">
      <div className="fruit-icon fruit-icon-1">🍎</div>
      <div className="fruit-icon fruit-icon-2">🍊</div>
      <div className="fruit-icon fruit-icon-3">🍓</div>
      <div className="fruit-icon fruit-icon-4">🥭</div>
    </div>
  </div>
</div>
      
      {/* Testimonials Section */}
      <div className="testimonials-section">
        <div className="testimonial-overlay"></div>
        <h2 className="section-title light">What Our Customers Say</h2>
        
        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="testimonial-quote">"The quality of fruit from Fresh Route has transformed our restaurant menu. Our customers can truly taste the difference."</div>
            <div className="testimonial-author">- Ranidu Promod, Executive Chef</div>
            <div className="testimonial-stars">★★★★★</div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-quote">"I've never tasted such sweet mangoes! The delivery is always on time and the grading system ensures consistent quality."</div>
            <div className="testimonial-author">- Dilina Randima, Home Customer</div>
            <div className="testimonial-stars">★★★★★</div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-quote">"The inventory management system has streamlined our procurement process and reduced waste by 35%. Highly recommended!"</div>
            <div className="testimonial-author">- Gimsha Supipi, Grocery Chain Manager</div>
            <div className="testimonial-stars">★★★★★</div>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="cta-section">
        <h2>Ready to experience the freshest fruits?</h2>
        <p>Join thousands of satisfied customers and elevate your fruit experience today.</p>
        <button className="cta-button shine-effect">Get Started Now</button>
      </div>
      
      {/* Footer has been removed from here and moved to the App component */}
    </div>
  );
};

export default HomePage;