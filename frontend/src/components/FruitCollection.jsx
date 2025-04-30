// src/components/FruitCollection.jsx - Updated to replace quantity with expiryDate
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './FruitCollection.css';
import ManualFruitAdd from './ManualFruitAdd';

const FruitCollection = () => {
  const { user } = useContext(AuthContext);
  const [fruits, setFruits] = useState([]);
  const [filteredFruits, setFilteredFruits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingFruit, setEditingFruit] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [dateError, setDateError] = useState('');
  const [isFormValid, setIsFormValid] = useState(true);

  useEffect(() => {
    fetchFruits();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [fruits, searchTerm, selectedGrade, sortBy, sortOrder]);

  const fetchFruits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Only get fruits with grades A, B, C
      const response = await axios.get('http://localhost:3001/api/fruits/quality');
      setFruits(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching fruits:', err);
      setError('Failed to load fruits. Please try again.');
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...fruits];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(fruit => 
        fruit.name.toLowerCase().includes(term) || 
        fruit.collectorId.toLowerCase().includes(term)
      );
    }
    
    // Apply grade filter
    if (selectedGrade !== 'all') {
      result = result.filter(fruit => fruit.grade === selectedGrade);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.collectionDate) - new Date(a.collectionDate);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'grade':
          const gradeOrder = { 'A': 1, 'B': 2, 'C': 3 };
          comparison = gradeOrder[a.grade] - gradeOrder[b.grade];
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredFruits(result);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleGradeFilter = (grade) => {
    setSelectedGrade(grade);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const startEditing = (fruit) => {
    // Initialize with existing data or defaults
    setEditingFruit({
      ...fruit,
      price: fruit.price || 0,
      expiryDate: fruit.expiryDate ? new Date(fruit.expiryDate).toISOString().split('T')[0] : ''
    });
  };

  const cancelEditing = () => {
    setEditingFruit(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'expiryDate') {
      validateExpiryDate(value);
    }
    
    setEditingFruit({
      ...editingFruit,
      [name]: name === 'price' ? parseFloat(value) : value
    });
  };

  const saveChanges = async () => {
    // Validate before saving
    if (!validateExpiryDate(editingFruit.expiryDate)) {
      return; // Don't proceed if invalid
    }
    
    try {
      setIsLoading(true);
      
      // Prepare update data - now with expiryDate instead of quantity
      const updateData = {
        price: editingFruit.price,
        expiryDate: editingFruit.expiryDate,
        status: 'available' // Mark as available when updating
      };
      
      // Make API call to update fruit
      const response = await axios.put(
        `http://localhost:3001/api/fruits/${editingFruit._id}`,
        updateData
      );
      
      // Update local state
      setFruits(prev => 
        prev.map(fruit => 
          fruit._id === editingFruit._id ? response.data : fruit
        )
      );
      
      // Show success message
      setSuccessMessage(`${editingFruit.name} updated successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset editing state
      setEditingFruit(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating fruit:', err);
      setError('Failed to update fruit. Please try again.');
      setIsLoading(false);
    }
  };

  const deleteFruit = async (fruitId) => {
    if (window.confirm('Are you sure you want to delete this fruit?')) {
      try {
        setIsLoading(true);
        
        await axios.delete(`http://localhost:3001/api/fruits/${fruitId}`);
        
        // Update local state
        setFruits(prev => prev.filter(fruit => fruit._id !== fruitId));
        
        setSuccessMessage('Fruit deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error deleting fruit:', err);
        setError('Failed to delete fruit. Please try again.');
        setIsLoading(false);
      }
    }
  };

  // Function to handle newly added fruits
  const handleFruitAdded = (newFruit) => {
    setFruits(prev => [newFruit, ...prev]);
    setShowManualAdd(false); // Hide the form after successful addition
    setSuccessMessage(`${newFruit.name} added successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Function to toggle back from manual add form
  const handleBackFromManualAdd = () => {
    setShowManualAdd(false);
  };

  // Function to get grade class
  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A': return 'grade-a';
      case 'B': return 'grade-b';
      case 'C': return 'grade-c';
      default: return '';
    }
  };

  //Function to validate expiry date
  const validateExpiryDate = (date) => {
    // Reset error state
    setDateError('');
    setIsFormValid(true);
    
    // Return true if valid, false if invalid
    if (!date) {
      setDateError('Expiry date is required');
      setIsFormValid(false);
      return false;
    }
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for comparison
    
    if (selectedDate < today) {
      setDateError('Expiry date cannot be in the past');
      setIsFormValid(false);
      return false;
    }
    
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1); // Max one year from now
    
    if (selectedDate > maxDate) {
      setDateError('Expiry date cannot be more than 1 year in the future');
      setIsFormValid(false);
      return false;
    }
    
    // Check if it's less than a week from now and return true but set a warning
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    if (selectedDate < oneWeekFromNow) {
      setDateError('Warning: Expiry date is less than 7 days from now');
      // Still valid, just a warning
      return true;
    }
    
    return true;
  };

  // Format price as LKR
  const formatPrice = (price) => {
    return `LKR ${price?.toFixed(2) || '0.00'}`;
  };

  // Format quantity
  const formatQuantity = (quantity) => {
    if (quantity === null || quantity === undefined) return '0';
    return quantity.toString();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (user?.role !== 'admin') {
    return (
      <div className="unauthorized-container">
        <h2>Access Denied</h2>
        <p>You don't have permission to access the Fruit Collection management.</p>
      </div>
    );
  }

  return (
    <div className="fruit-collection-container">
      <h2 className="collection-title">Fruit Collection Management</h2>
      
      {/* Info Panel */}
      <div className="collection-info-panel">
        <div className="info-icon">ℹ️</div>
        <div className="info-text">
          <p>This section allows you to manage the fruit collection for customer purchase.</p>
          <p>Set prices and expiry dates for high-quality fruits (Grade A, B, C) to make them available in the market.</p>
        </div>
      </div>
      
      {/* Conditional Rendering - Either show toggle button or the "Back to Collection" button, not both */}
      {!showManualAdd ? (
        <div className="manual-add-toggle">
          <button 
            onClick={() => setShowManualAdd(true)}
            className="toggle-button"
          >
            + Add Fruit Manually
          </button>
        </div>
      ) : (
        <div className="manual-add-toggle">
          <button 
            onClick={handleBackFromManualAdd}
            className="back-button"
          >
            ← Back to Collection
          </button>
        </div>
      )}
      
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
      
      {/* Conditional Rendering - Manual Add Form or Collection List */}
      {showManualAdd ? (
        <ManualFruitAdd 
          onFruitAdded={handleFruitAdded} 
          onBack={handleBackFromManualAdd}
        />
      ) : (
        <>
          {/* Filter Controls */}
          <div className="filter-controls">
            <input
              type="text"
              placeholder="Search by name or collector ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            
            <div className="filter-options">
              <button 
                className={`filter-button ${selectedGrade === 'all' ? 'active' : ''}`}
                onClick={() => handleGradeFilter('all')}
              >
                All Grades
              </button>
              <button 
                className={`filter-button ${selectedGrade === 'A' ? 'active' : ''}`}
                onClick={() => handleGradeFilter('A')}
              >
                Grade A
              </button>
              <button 
                className={`filter-button ${selectedGrade === 'B' ? 'active' : ''}`}
                onClick={() => handleGradeFilter('B')}
              >
                Grade B
              </button>
              <button 
                className={`filter-button ${selectedGrade === 'C' ? 'active' : ''}`}
                onClick={() => handleGradeFilter('C')}
              >
                Grade C
              </button>
              
              <div className="sort-controls">
                <select 
                  value={sortBy} 
                  onChange={handleSortChange}
                  className="sort-select"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="grade">Sort by Grade</option>
                  <option value="price">Sort by Price</option>
                  <option value="quantity">Sort by Quantity</option>
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
            <div className="loading-indicator">Loading fruit collection...</div>
          ) : filteredFruits.length === 0 ? (
            <div className="no-fruits-message">
              <p>No fruits found matching your criteria.</p>
              <p>Only high-quality fruits (Grade A, B, C) are shown here.</p>
            </div>
          ) : (
            <div className="fruits-collection-grid">
              {filteredFruits.map((fruit) => (
                <div 
                  key={fruit._id} 
                  className={`fruit-collection-card ${fruit.status === 'available' ? 'available' : ''}`}
                >
                  {editingFruit && editingFruit._id === fruit._id ? (
                    // Editing Mode
                    <div className="fruit-card-edit-mode">
                      <div className="fruit-card-header">
                        <h3>{fruit.name}</h3>
                        <span className={`grade-badge ${getGradeColor(fruit.grade)}`}>
                          {fruit.grade}
                        </span>
                      </div>
                      
                      <div className="image-container">
                        <img 
                          src={`http://localhost:3001${fruit.imageUrl}`} 
                          alt={fruit.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-fruit.png';
                          }}
                        />
                      </div>
                      
                      <div className="edit-form">
                        <div className="form-group">
                          <label>Price (LKR):</label>
                          <input 
                            type="number" 
                            name="price" 
                            value={editingFruit.price}
                            onChange={handleEditChange}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        
                      <div className="form-group">
                        <label>Expiry Date: <span className="required-field">*</span></label>
                        <div className="date-input-container">
                          <input 
                            type="date" 
                            name="expiryDate" 
                            value={editingFruit.expiryDate}
                            onChange={handleEditChange}
                            min={new Date().toISOString().split('T')[0]}
                            className={dateError ? 'input-error' : ''}
                            required
                          />
                          {dateError && (
                            <div className={`date-validation-message ${dateError.includes('Warning') ? 'warning' : 'error'}`}>
                              {dateError}
                            </div>
                          )}
                        </div>
                      </div>
                        
                        <div className="edit-actions">
                          <button 
                            className="save-button" 
                            onClick={saveChanges}
                            disabled={isLoading || !isFormValid}
                          >
                            Save Changes
                          </button>
                          <button 
                            className="cancel-button" 
                            onClick={cancelEditing}
                            disabled={isLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="fruit-card-header">
                        <h3>{fruit.name}</h3>
                        <span className={`grade-badge ${getGradeColor(fruit.grade)}`}>
                          {fruit.grade}
                        </span>
                      </div>
                      
                      <div className="image-container">
                        <img 
                          src={`http://localhost:3001${fruit.imageUrl}`} 
                          alt={fruit.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-fruit.png';
                          }}
                        />
                        {fruit.status === 'available' && (
                          <div className="availability-badge">Available</div>
                        )}
                      </div>
                      
                      <div className="fruit-card-details">
                        <div className="detail-row">
                          <span className="detail-label">Collection Date:</span>
                          <span className="detail-value">{formatDate(fruit.collectionDate)}</span>
                        </div>
                        
                        <div className="detail-row">
                          <span className="detail-label">Expiry Date:</span>
                          <span className="detail-value">{formatDate(fruit.expiryDate)}</span>
                        </div>
                        
                        <div className="detail-row">
                          <span className="detail-label">Quality Score:</span>
                          <span className="detail-value">{fruit.scores?.total?.toFixed(1) || '0.0'}/100</span>
                        </div>
                        
                        <div className="detail-row highlight">
                          <span className="detail-label">Price:</span>
                          <span className="detail-value price">{formatPrice(fruit.price)}</span>
                        </div>
                        
                        <div className="detail-row highlight">
                          <span className="detail-label">Quantity:</span>
                          <span className="detail-value quantity">{formatQuantity(fruit.quantity)}</span>
                        </div>
                        
                        <div className="detail-row">
                          <span className="detail-label">Status:</span>
                          <span className={`detail-value status ${fruit.status}`}>
                            {fruit.status === 'available' ? 'Available for sale' : 'Not available'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="fruit-card-actions">
                        <button 
                          className="edit-button"
                          onClick={() => startEditing(fruit)}
                          disabled={isLoading}
                        >
                          Edit Details
                        </button>
                        
                        <button 
                          className="delete-button"
                          onClick={() => deleteFruit(fruit._id)}
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FruitCollection;