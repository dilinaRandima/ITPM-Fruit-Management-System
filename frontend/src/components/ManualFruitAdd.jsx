// src/components/ManualFruitAdd.jsx - Updated with expiry date field
import React, { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './ManualFruitAdd.css';

const ManualFruitAdd = ({ onFruitAdded, onBack }) => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    grade: 'A',
    price: '',
    quantity: '',
    collectorId: '',
    expiryDate: '', // Added expiry date field
    image: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when typing
    if (error) {
      setError('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Check file type
      const fileType = file.type;
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)) {
        setError('Only JPG, JPEG, and PNG images are allowed');
        e.target.value = ''; // Clear the file input
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      setFormData({
        ...formData,
        image: file
      });
      
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Fruit name is required');
      return;
    }
    
    if (!formData.collectorId.trim()) {
      setError('Collector ID is required');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Price must be a positive number');
      return;
    }
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError('Quantity must be a positive number');
      return;
    }
    
    if (!formData.expiryDate) {
      setError('Expiry date is required');
      return;
    }
    
    // Validate expiry date is in the future
    const expiryDate = new Date(formData.expiryDate);
    const today = new Date();
    if (expiryDate <= today) {
      setError('Expiry date must be in the future');
      return;
    }
    
    if (!formData.image) {
      setError('Fruit image is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('grade', formData.grade);
      data.append('price', formData.price);
      data.append('quantity', formData.quantity);
      data.append('collectorId', formData.collectorId);
      data.append('expiryDate', formData.expiryDate); // Add expiry date to form data
      data.append('image', formData.image);
      
      const response = await axios.post('http://localhost:3001/api/fruits/manual', data);
      
      // Show success message
      setSuccessMessage(`${formData.name} added successfully with grade ${formData.grade}!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Reset form
      setFormData({
        name: '',
        grade: 'A',
        price: '',
        quantity: '',
        collectorId: '',
        expiryDate: '',
        image: null
      });
      setPreviewUrl(null);
      
      // Notify parent component
      if (onFruitAdded) {
        onFruitAdded(response.data);
      }
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error adding fruit manually:', err);
      setError(err.response?.data?.error || 'Failed to add fruit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="unauthorized-container">
        <h2>Access Denied</h2>
        <p>Only administrators can manually add fruits.</p>
      </div>
    );
  }

  // Get minimum date for the expiry date input (tomorrow)
  const getMinExpiryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="manual-fruit-container">
      {/* Removed the duplicate back button */}
      
      <h2 className="manual-fruit-title">Manually Add Fruit</h2>
      
      <div className="manual-fruit-info">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <p>Use this form to manually add fruits to the system with custom grades, prices, quantities, and expiry dates.</p>
          <p>Manually added fruits will immediately be available in the market.</p>
        </div>
      </div>
      
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
      
      <div className="manual-form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-columns">
            <div className="form-column">
              <div className="form-row">
                <label htmlFor="name">Fruit Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Apple, Orange, Mango"
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-row">
                <label htmlFor="grade">Grade <span className="required">*</span></label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="A">Grade A (Excellent)</option>
                  <option value="B">Grade B (Good)</option>
                  <option value="C">Grade C (Normal)</option>
                </select>
              </div>
              
              <div className="form-row">
                <label htmlFor="price">Unit Price (LKR) <span className="required">*</span></label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g. 150.00"
                  min="0"
                  step="0.01"
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-row">
                <label htmlFor="quantity">Quantity <span className="required">*</span></label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="e.g. 50"
                  min="1"
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-row">
                <label htmlFor="expiryDate">Expiry Date <span className="required">*</span></label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  min={getMinExpiryDate()}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-row">
                <label htmlFor="collectorId">Collector ID <span className="required">*</span></label>
                <input
                  type="text"
                  id="collectorId"
                  name="collectorId"
                  value={formData.collectorId}
                  onChange={handleInputChange}
                  placeholder="e.g. C12345"
                  required
                  className="form-control"
                />
              </div>
              
              <div className="grade-info-box">
                <h4>Grade Information</h4>
                <div className="grade-info-item">
                  <span className="grade-badge grade-a">A</span>
                  <span>Excellent quality, premium price</span>
                </div>
                <div className="grade-info-item">
                  <span className="grade-badge grade-b">B</span>
                  <span>Good quality, standard price</span>
                </div>
                <div className="grade-info-item">
                  <span className="grade-badge grade-c">C</span>
                  <span>Normal quality, economy price</span>
                </div>
              </div>
            </div>
            
            <div className="form-column">
              <div className="form-row">
                <label htmlFor="image">Fruit Image <span className="required">*</span></label>
                {previewUrl ? (
                  <div className="upload-container">
                    <div className="image-preview">
                      <img src={previewUrl} alt="Fruit preview" />
                      <button 
                        type="button" 
                        className="remove-image"
                        onClick={() => {
                          setPreviewUrl(null);
                          setFormData({...formData, image: null});
                          const fileInput = document.querySelector('input[type="file"]');
                          if (fileInput) fileInput.value = '';
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-container">
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">Click to upload an image</span>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      onChange={handleFileChange}
                      accept="image/jpeg,image/jpg,image/png"
                      className="upload-input"
                      required
                    />
                  </div>
                )}
                <div className="file-info">Accepted formats: JPG, JPEG, PNG</div>
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="add-fruit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Adding Fruit...' : 'Add Fruit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualFruitAdd;