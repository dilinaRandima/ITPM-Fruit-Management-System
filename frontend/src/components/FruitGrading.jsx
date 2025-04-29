// src/components/FruitGrading.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FruitGrading.css';

// Delete Button Component
const DeleteButton = ({ fruitId, onDelete, isDisabled }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onDelete(fruitId);
  };

  return (
    <button 
      className="delete-button"
      onClick={handleClick}
      disabled={isDisabled}
    >
      Delete
    </button>
  );
};

// Update Button Component
const UpdateButton = ({ fruit, onUpdate, isDisabled }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onUpdate(fruit);
  };

  // Adding inline styles to ensure the green color is applied
  const buttonStyle = {
    background: 'linear-gradient(45deg, #a4bc5a, #8aa548)',
    color: 'white'
  };

  return (
    <button 
      className="update-button"
      onClick={handleClick}
      disabled={isDisabled}
      style={buttonStyle}
    >
      Update
    </button>
  );
};

// Update Modal Component
const UpdateModal = ({ fruit, onClose, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState({
    price: fruit?.price || 0,
    quantity: fruit?.quantity || 0,
    status: fruit?.status || 'pending',
    expiryDate: fruit?.expiryDate ? new Date(fruit.expiryDate).toISOString().split('T')[0] : ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'quantity' ? Number(value) : value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(fruit._id, formData);
  };
  
  return (
    <div className="update-modal-backdrop">
      <div className="update-modal">
        <div className="update-modal-header">
          <h3>Update Fruit Details</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="price">Price:</label>
            <input 
              type="number" 
              name="price" 
              id="price"
              min="0"
              step="0.01"
              value={formData.price} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="quantity">Quantity:</label>
            <input 
              type="number" 
              name="quantity" 
              id="quantity"
              min="0"
              value={formData.quantity} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select 
              name="status" 
              id="status"
              value={formData.status} 
              onChange={handleChange} 
              required
            >
              <option value="pending">Pending</option>
              <option value="graded">Graded</option>
              <option value="rejected">Rejected</option>
              <option value="approved">Approved</option>
              <option value="available">Available</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date:</label>
            <input 
              type="date" 
              name="expiryDate" 
              id="expiryDate"
              value={formData.expiryDate} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="update-modal-footer">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FruitGrading = () => {
  const [fruits, setFruits] = useState([]);
  const [filteredFruits, setFilteredFruits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    collectorId: '',
    image: null
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    variety: '',
    collectorId: '',
    image: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyApproved, setShowOnlyApproved] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedFruit, setSelectedFruit] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Custom file input setup
  useEffect(() => {
    const setupFileInput = () => {
      const fileInput = document.querySelector('.file-input-hidden');
      const fileButton = document.querySelector('.file-input-button');
      
      if (fileInput && fileButton) {
        fileButton.addEventListener('click', () => {
          fileInput.click();
        });
        
        fileButton.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            fileInput.click();
          }
        });
      }
    };
    
    setupFileInput();
    
    return () => {
      const fileButton = document.querySelector('.file-input-button');
      if (fileButton) {
        fileButton.removeEventListener('click', () => {});
        fileButton.removeEventListener('keydown', () => {});
      }
    };
  }, []);

  useEffect(() => {
    fetchFruits();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [fruits, searchTerm, showOnlyApproved, sortBy, sortOrder]);

  const fetchFruits = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:3001/api/fruits');
      setFruits(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching fruits:', error);
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...fruits];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(fruit => 
        fruit.name.toLowerCase().includes(term) || 
        fruit.collectorId.toLowerCase().includes(term)
      );
    }
    
    if (showOnlyApproved) {
      result = result.filter(fruit => ['A', 'B', 'C'].includes(fruit.grade));
    }
    
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.collectionDate) - new Date(a.collectionDate);
          break;
        case 'grade':
          const gradeOrder = { 'A': 1, 'B': 2, 'C': 3, 'E': 4, 'F': 5 };
          comparison = gradeOrder[a.grade] - gradeOrder[b.grade];
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'collector':
          comparison = a.collectorId.localeCompare(b.collectorId);
          break;
        case 'score':
          comparison = (b.scores?.total || 0) - (a.scores?.total || 0);
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

  const toggleApprovedFilter = () => {
    setShowOnlyApproved(!showOnlyApproved);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const validateForm = () => {
    let valid = true;
    const errors = {
      name: '',
      variety: '',
      collectorId: '',
      image: ''
    };

    if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      errors.name = 'Name can only contain letters';
      valid = false;
    }
    
    if (formData.variety && !/^[A-Za-z\s]+$/.test(formData.variety)) {
      errors.variety = 'Variety can only contain letters';
      valid = false;
    }

    if (!/^C\d+$/.test(formData.collectorId)) {
      errors.collectorId = 'Collector ID must start with C followed by numbers';
      valid = false;
    }

    if (formData.image) {
      const fileType = formData.image.type;
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)) {
        errors.image = 'Only JPG, JPEG, and PNG images are allowed';
        valid = false;
      }
    }

    setFormErrors(errors);
    return valid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      const fileType = file.type;
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)) {
        setFormErrors({
          ...formErrors,
          image: 'Only JPG, JPEG, and PNG images are allowed'
        });
        e.target.value = '';
        setPreviewUrl(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      setFormData({
        ...formData,
        image: file
      });
      
      setFormErrors({
        ...formErrors,
        image: ''
      });
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setUploadStatus('Uploading image...');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('variety', formData.variety || formData.name);
      data.append('collectorId', formData.collectorId);
      data.append('image', formData.image);

      setUploadStatus('Analyzing image with AI quality assessment...');
      
      const response = await axios.post('http://localhost:3001/api/fruits/upload', data);
      
      const gradeDescriptions = {
        'A': 'Excellent',
        'B': 'Good',
        'C': 'Normal',
        'E': 'Bad (Rejected)',
        'F': 'Very Bad (Rejected)'
      };
      
      const scoreText = response.data.scores.total.toFixed(1);
      const gradeDesc = gradeDescriptions[response.data.grade] || 'Unknown';
      
      setUploadStatus(`Fruit graded as: ${response.data.grade} - ${gradeDesc} (Score: ${scoreText}/100)`);
      
      setFormData({
        name: '',
        variety: '',
        collectorId: '',
        image: null
      });
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      fetchFruits();
    } catch (error) {
      console.error('Error uploading fruit:', error);
      
      if (error.response && error.response.status === 400 && error.response.data && error.response.data.isNonFruit) {
        if (error.response.data.imageUrl) {
          setUploadStatus(`⚠️ NON-FRUIT IMAGE DETECTED: This image does not appear to be a fruit. Please upload a fruit image.`);
          setPreviewUrl(`http://localhost:3001${error.response.data.imageUrl}`);
        } else {
          setUploadStatus(`⚠️ NON-FRUIT IMAGE DETECTED: This image does not appear to be a fruit. Please upload a fruit image.`);
        }
      } else {
        setUploadStatus(`Error: Failed to upload and grade fruit - ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (fruitId) => {
    if (window.confirm('Are you sure you want to delete this fruit?')) {
      try {
        setIsLoading(true);
        
        await axios.delete(`http://localhost:3001/api/fruits/${fruitId}`);
        
        const updatedFruits = fruits.filter(fruit => fruit._id !== fruitId);
        setFruits(updatedFruits);
        
        setUploadStatus('Fruit deleted successfully');
      } catch (error) {
        console.error('Error deleting fruit:', error);
        setUploadStatus(`Error: Failed to delete fruit - ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateClick = (fruit) => {
    setSelectedFruit(fruit);
    setUpdateModalOpen(true);
  };

  const handleCloseModal = () => {
    setUpdateModalOpen(false);
    setSelectedFruit(null);
  };

  const handleUpdateFruit = async (fruitId, updatedData) => {
    try {
      setIsLoading(true);
      
      const response = await axios.put(`http://localhost:3001/api/fruits/${fruitId}`, updatedData);
      
      const updatedFruits = fruits.map(fruit => 
        fruit._id === fruitId ? { ...fruit, ...response.data } : fruit
      );
      
      setFruits(updatedFruits);
      setUploadStatus('Fruit updated successfully');
      
      handleCloseModal();
    } catch (error) {
      console.error('Error updating fruit:', error);
      setUploadStatus(`Error: Failed to update fruit - ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A': return 'grade-a';
      case 'B': return 'grade-b';
      case 'C': return 'grade-c';
      case 'E': return 'grade-e';
      case 'F': return 'grade-f';
      default: return '';
    }
  };

  const getGradeDescription = (grade) => {
    switch(grade) {
      case 'A': return 'Excellent';
      case 'B': return 'Good';
      case 'C': return 'Normal';
      case 'E': return 'Bad';
      case 'F': return 'Very Bad';
      default: return 'Unknown';
    }
  };

  const formatQuantity = (quantity) => {
    if (quantity === null || quantity === undefined) return '0';
    return quantity.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fruit-grading-container">
      {/* Upload Form Section */}
      <div className="upload-section">
        <h2>Upload Fruit Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Fruit Name (letters only):</label>
            <input 
              type="text" 
              name="name" 
              id="name"
              value={formData.name} 
              onChange={handleInputChange} 
              required 
              placeholder="e.g. Apple"
            />
            {formErrors.name && <span className="error-message">{formErrors.name}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="variety">Fruit Variety (optional):</label>
            <input 
              type="text" 
              name="variety" 
              id="variety"
              value={formData.variety} 
              onChange={handleInputChange} 
              placeholder="e.g. Gala, Granny Smith"
            />
            {formErrors.variety && <span className="error-message">{formErrors.variety}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="collectorId">Collector ID (C followed by numbers):</label>
            <input 
              type="text" 
              name="collectorId"
              id="collectorId" 
              value={formData.collectorId} 
              onChange={handleInputChange} 
              required 
              placeholder="e.g. C12345"
            />
            {formErrors.collectorId && <span className="error-message">{formErrors.collectorId}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="fruitImage">Fruit Image (JPG, JPEG, PNG only):</label>
            
            {/* Custom styled file input */}
            <div className="custom-file-input">
              <input 
                type="file"
                id="fruitImage" 
                className="file-input-hidden"
                accept="image/jpeg,image/jpg,image/png" 
                onChange={handleFileChange} 
                required 
              />
              <div className="file-input-wrapper">
                <button type="button" className="file-input-button">
                  {previewUrl ? 'Change Image' : 'Choose File'}
                </button>
                <span className="file-name">
                  {formData.image ? formData.image.name : 'No file chosen'}
                </span>
              </div>
            </div>
            
            {formErrors.image && <span className="error-message">{formErrors.image}</span>}
            
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="Preview" />
              </div>
            )}
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Upload and Grade'}
          </button>
        </form>
        
        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.includes('Error') ? 'error' : ''}`}>
            {uploadStatus}
          </div>
        )}
      </div>
      
      {/* Results Section */}
      <div className="results-section">
        <h2>Graded Fruits</h2>
        
        <div className="separator-line"></div>
        
        {/* Quality Grading Scale */}
        <div className="grade-scale-legend">
          <div className="grade-scale-title">Quality Grading Scale</div>
          <div className="grade-scale-items">
            <div className="grade-scale-item">
              <div className="grade-scale-badge grade-a">A</div>
              <span className="grade-scale-text">A - Excellent</span>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-badge grade-b">B</div>
              <span className="grade-scale-text">B - Good</span>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-badge grade-c">C</div>
              <span className="grade-scale-text">C - Normal</span>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-badge grade-e">E</div>
              <span className="grade-scale-text">E - Bad (Rejected)</span>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-badge grade-f">F</div>
              <span className="grade-scale-text">F - Very Bad (Rejected)</span>
            </div>
          </div>
        </div>
        
        <div className="separator-line"></div>
        
        {/* Filter and Search Controls */}
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
              className={`filter-button ${showOnlyApproved ? 'active' : ''}`}
              onClick={toggleApprovedFilter}
            >
              {showOnlyApproved ? 'Show All Grades' : 'Show Only Acceptable Grades (A, B, C)'}
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
                <option value="collector">Sort by Collector</option>
                <option value="score">Sort by Score</option>
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
        
        {isLoading ? (
          <div className="loading-indicator">Loading fruits...</div>
        ) : filteredFruits.length === 0 ? (
          <div className="no-results">No fruits match your search criteria.</div>
        ) : (
          <div className="fruits-grid">
            {filteredFruits.map((fruit) => (
              <div 
                key={fruit._id} 
                className="fruit-card"
              >
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
                <div className="fruit-details">
                  <h3>{fruit.name}</h3>
                  <p>
                    <strong>Grade:</strong> 
                    <span className={`grade-badge ${getGradeColor(fruit.grade)}`}>{fruit.grade}</span> 
                    {getGradeDescription(fruit.grade)}
                  </p>
                  <p>
                    <strong>Quality Score:</strong> {fruit.scores?.total?.toFixed(1) || '0.0'}/100
                  </p>
                  <p>
                    <strong>Status:</strong> 
                    <span className={`status-badge ${fruit.status}`}>
                      {fruit.status.charAt(0).toUpperCase() + fruit.status.slice(1)}
                    </span>
                  </p>
                  <p><strong>Collected:</strong> {new Date(fruit.collectionDate).toLocaleDateString()}</p>
                  <p><strong>Expiry Date:</strong> {formatDate(fruit.expiryDate)}</p>
                  <p><strong>Collector ID:</strong> {fruit.collectorId}</p>
                  <p><strong>Price:</strong> LKR {fruit.price?.toFixed(2) || '0.00'}</p>
                  <p><strong>Quantity:</strong> {formatQuantity(fruit.quantity)}</p>
                  
                  <div className="scores">
                    <div className="score-item">
                      <div className="score-value">{fruit.scores && typeof fruit.scores.color === 'number' ? fruit.scores.color.toFixed(1) : '0.0'}</div>
                      <div className="score-label">Color</div>
                    </div>
                    <div className="score-item">
                      <div className="score-value">{fruit.scores && typeof fruit.scores.texture === 'number' ? fruit.scores.texture.toFixed(1) : '0.0'}</div>
                      <div className="score-label">Texture</div>
                    </div>
                    <div className="score-item">
                      <div className="score-value">{fruit.scores && typeof fruit.scores.shape === 'number' ? fruit.scores.shape.toFixed(1) : '0.0'}</div>
                      <div className="score-label">Shape</div>
                    </div>
                    <div className="score-item">
                      <div className="score-value">{fruit.scores && typeof fruit.scores.defect === 'number' ? fruit.scores.defect.toFixed(1) : '0.0'}</div>
                      <div className="score-label">Quality</div>
                    </div>
                  </div>
                  
                  <div className="fruit-card-actions">
                    <UpdateButton 
                      fruit={fruit}
                      onUpdate={handleUpdateClick}
                      isDisabled={isLoading}
                    />
                    <DeleteButton 
                      fruitId={fruit._id}
                      onDelete={handleDelete}
                      isDisabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Update Modal */}
      {updateModalOpen && selectedFruit && (
        <UpdateModal 
          fruit={selectedFruit}
          onClose={handleCloseModal}
          onUpdate={handleUpdateFruit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default FruitGrading;