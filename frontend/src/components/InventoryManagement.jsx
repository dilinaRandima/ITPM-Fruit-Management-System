// src/components/InventoryManagement.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './InventoryManagement.css';

const InventoryManagement = () => {
  const { user } = useContext(AuthContext);
  const [fruits, setFruits] = useState([]);
  const [filteredFruits, setFilteredFruits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingFruit, setEditingFruit] = useState(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(50);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  
  // New state for add/delete functionality
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fruitToDelete, setFruitToDelete] = useState(null);
  const [newFruit, setNewFruit] = useState({
    name: '',
    grade: 'A',
    price: '',
    quantity: '',
    expiryDate: '',
    collectorId: ''
  });
  const fileInputRef = useRef(null);
  
  // New state for report generation
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('all');
  const [reportFormat, setReportFormat] = useState('csv');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Stats counters
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0
  });

  useEffect(() => {
    fetchFruits();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [fruits, searchTerm, selectedGrade, sortBy, sortOrder, showLowStock, showOutOfStock]);

  // Calculate stats whenever fruits change
  useEffect(() => {
    const totalFruits = fruits.length;
    const lowStockCount = fruits.filter(fruit => fruit.quantity > 0 && fruit.quantity <= lowStockThreshold).length;
    const outOfStockCount = fruits.filter(fruit => !fruit.quantity || fruit.quantity <= 0).length;
    
    setStats({
      total: totalFruits,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount
    });
  }, [fruits, lowStockThreshold]);

  const fetchFruits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:3001/api/fruits');
      setFruits(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching fruits:', err);
      setError('Failed to load inventory. Please try again.');
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
        fruit.collectorId?.toLowerCase().includes(term)
      );
    }
    
    // Apply grade filter
    if (selectedGrade !== 'all') {
      result = result.filter(fruit => fruit.grade === selectedGrade);
    }
    
    // Apply stock filters
    if (showLowStock) {
      result = result.filter(fruit => fruit.quantity > 0 && fruit.quantity <= lowStockThreshold);
    }
    
    if (showOutOfStock) {
      result = result.filter(fruit => !fruit.quantity || fruit.quantity <= 0);
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
          const gradeOrder = { 'A': 1, 'B': 2, 'C': 3, 'E': 4, 'F': 5 };
          comparison = gradeOrder[a.grade] - gradeOrder[b.grade];
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0);
          break;
        case 'expiry':
          const aDate = a.expiryDate ? new Date(a.expiryDate) : new Date(8640000000000000);
          const bDate = b.expiryDate ? new Date(b.expiryDate) : new Date(8640000000000000);
          comparison = aDate - bDate;
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

  const toggleLowStockFilter = () => {
    // If turning on low stock, turn off out of stock (they're mutually exclusive)
    if (!showLowStock && showOutOfStock) {
      setShowOutOfStock(false);
    }
    setShowLowStock(!showLowStock);
  };

  const toggleOutOfStockFilter = () => {
    // If turning on out of stock, turn off low stock (they're mutually exclusive)
    if (!showOutOfStock && showLowStock) {
      setShowLowStock(false);
    }
    setShowOutOfStock(!showOutOfStock);
  };

  const startEditing = (fruit) => {
    setEditingFruit({
      ...fruit,
      quantity: fruit.quantity || 0
    });
  };

  const cancelEditing = () => {
    setEditingFruit(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingFruit({
      ...editingFruit,
      [name]: name === 'quantity' ? parseInt(value, 10) : value
    });
  };

  const saveChanges = async () => {
    try {
      setIsLoading(true);
      
      // Prepare update data
      const updateData = {
        quantity: editingFruit.quantity
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
      setSuccessMessage(`${editingFruit.name} quantity updated successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset editing state
      setEditingFruit(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating inventory:', err);
      setError('Failed to update inventory. Please try again.');
      setIsLoading(false);
    }
  };
  
  // NEW FUNCTION: Handle changes to the add fruit form
  const handleAddFruitChange = (e) => {
    const { name, value, type } = e.target;
    setNewFruit({
      ...newFruit,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };
  
  // NEW FUNCTION: Submit the new fruit
  const submitNewFruit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create form data for file upload
      const formData = new FormData();
      const fileInput = fileInputRef.current;
      
      // Validate form data
      if (!newFruit.name || !newFruit.grade || !newFruit.price || !newFruit.quantity || !fileInput.files[0]) {
        setError('Please fill in all required fields and select an image');
        setIsLoading(false);
        return;
      }
      
      // Add all form fields to the FormData
      formData.append('name', newFruit.name);
      formData.append('grade', newFruit.grade);
      formData.append('price', newFruit.price);
      formData.append('quantity', newFruit.quantity);
      formData.append('expiryDate', newFruit.expiryDate);
      formData.append('collectorId', newFruit.collectorId || user.email);
      formData.append('image', fileInput.files[0]);
      
      // Send request to server
      const response = await axios.post(
        'http://localhost:3001/api/fruits/manual',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Add new fruit to state
      setFruits([response.data, ...fruits]);
      
      // Show success message
      setSuccessMessage(`${newFruit.name} added successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset form and close modal
      setNewFruit({
        name: '',
        grade: 'A',
        price: '',
        quantity: '',
        expiryDate: '',
        collectorId: ''
      });
      setShowAddModal(false);
      setIsLoading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error adding fruit:', err);
      setError(`Failed to add fruit: ${err.response?.data?.error || err.message}`);
      setIsLoading(false);
    }
  };
  
  // NEW FUNCTION: Open delete confirmation modal
  const openDeleteModal = (fruit) => {
    setFruitToDelete(fruit);
    setShowDeleteModal(true);
  };
  
  // NEW FUNCTION: Delete a fruit
  const deleteFruit = async () => {
    if (!fruitToDelete) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Send delete request
      await axios.delete(`http://localhost:3001/api/fruits/${fruitToDelete._id}`);
      
      // Remove fruit from state
      setFruits(fruits.filter(fruit => fruit._id !== fruitToDelete._id));
      
      // Show success message
      setSuccessMessage(`${fruitToDelete.name} deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setFruitToDelete(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error deleting fruit:', err);
      setError(`Failed to delete fruit: ${err.response?.data?.error || err.message}`);
      setIsLoading(false);
    }
  };
  
  // NEW FUNCTION: Generate report
  const generateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      // Filter data for report based on selected type
      let reportData = [];
      
      switch (reportType) {
        case 'low-stock':
          reportData = fruits.filter(fruit => fruit.quantity > 0 && fruit.quantity <= lowStockThreshold);
          break;
        case 'out-of-stock':
          reportData = fruits.filter(fruit => !fruit.quantity || fruit.quantity <= 0);
          break;
        case 'expired':
          reportData = fruits.filter(fruit => 
            fruit.expiryDate && new Date(fruit.expiryDate) < new Date()
          );
          break;
        default:
          reportData = [...fruits];
      }
      
      // Format data for export
      const formattedData = reportData.map(fruit => ({
        ID: fruit._id,
        Name: fruit.name,
        Grade: fruit.grade,
        Price: fruit.price || 0,
        Quantity: fruit.quantity || 0,
        'Collection Date': formatDate(fruit.collectionDate),
        'Expiry Date': formatDate(fruit.expiryDate),
        Status: getStockStatus(fruit.quantity).text
      }));
      
      // Generate file based on format
      if (reportFormat === 'csv') {
        // Generate CSV
        const headers = Object.keys(formattedData[0] || {}).join(',');
        const rows = formattedData.map(item => 
          Object.values(item).map(value => 
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          ).join(',')
        );
        const csv = [headers, ...rows].join('\n');
        
        // Create download
        downloadFile(csv, `inventory-report-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      } else if (reportFormat === 'json') {
        // Generate JSON
        const json = JSON.stringify(formattedData, null, 2);
        downloadFile(json, `inventory-report-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
      } else if (reportFormat === 'html') {
        // Generate HTML
        const tableRows = formattedData.map(item => 
          `<tr>${Object.values(item).map(value => `<td>${value}</td>`).join('')}</tr>`
        ).join('');
        
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Inventory Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              h1 { color: #a4bc5a; }
              .report-info { margin-bottom: 20px; color: #555; }
            </style>
          </head>
          <body>
            <h1>Inventory Report</h1>
            <div class="report-info">
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <p>Report type: ${reportType === 'all' ? 'All Inventory' : 
                               reportType === 'low-stock' ? 'Low Stock Items' : 
                               reportType === 'out-of-stock' ? 'Out of Stock Items' : 'Expired Items'}</p>
              <p>Total items: ${formattedData.length}</p>
            </div>
            <table>
              <thead>
                <tr>${Object.keys(formattedData[0] || {}).map(key => `<th>${key}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
          </html>
        `;
        
        downloadFile(html, `inventory-report-${new Date().toISOString().split('T')[0]}.html`, 'text/html');
      }
      
      // Show success message
      setSuccessMessage('Report generated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Close modal
      setShowReportModal(false);
      setIsGeneratingReport(false);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
      setIsGeneratingReport(false);
    }
  };
  
  // Helper function to download a file
  const downloadFile = (content, fileName, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Function to get grade class
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
  
  // Format price as LKR
  const formatPrice = (price) => {
    return `LKR ${price?.toFixed(2) || '0.00'}`;
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Check if a fruit is expired
  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };
  
  // Determine stock status based on quantity and threshold
  const getStockStatus = (quantity) => {
    if (!quantity || quantity <= 0) {
      return { text: 'Out of Stock', className: 'out-of-stock' };
    } else if (quantity <= lowStockThreshold) {
      return { text: 'Low Stock', className: 'low-stock' };
    } else {
      return { text: 'In Stock', className: 'in-stock' };
    }
  };
  
  // Get tomorrow's date in YYYY-MM-DD format for the date input min value
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="unauthorized-container">
        <h2>Access Denied</h2>
        <p>You don't have permission to access the Inventory Management System.</p>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <h2 className="inventory-title">Inventory Management System</h2>
      
      {/* Info Panel */}
      <div className="inventory-info-panel">
        <div className="info-icon">ℹ️</div>
        <div className="info-text">
          <p>This section allows you to manage fruit inventory and track stock levels.</p>
          <p>Update quantities, monitor low stock items, and identify expired products.</p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="inventory-actions">
        <button className="action-button add-fruit" onClick={() => setShowAddModal(true)}>
          <span className="action-icon">+</span>
          Add Fruit Manually
        </button>
        
        <button className="action-button generate-report" onClick={() => setShowReportModal(true)}>
          <span className="action-icon">📑</span>
          Generate Report
        </button>
      </div>
      
      {/* Inventory Stats */}
      <div className="inventory-stats">
        <div className="stat-card total">
          <h3>Total Products</h3>
          <span className="stat-value">{stats.total}</span>
        </div>
        
        <div className="stat-card low-stock">
          <h3>Low Stock Items</h3>
          <span className="stat-value">{stats.lowStock}</span>
          <span className="stat-label">(&lt; {lowStockThreshold} units)</span>
        </div>
        
        <div className="stat-card out-of-stock">
          <h3>Out of Stock</h3>
          <span className="stat-value">{stats.outOfStock}</span>
        </div>
        
        <div className="stat-card threshold-setting">
          <h3>Low Stock Threshold</h3>
          <div className="threshold-control">
            <button 
              onClick={() => setLowStockThreshold(Math.max(1, lowStockThreshold - 1))}
              className="threshold-button"
            >-</button>
            <span className="threshold-value">{lowStockThreshold}</span>
            <button 
              onClick={() => setLowStockThreshold(lowStockThreshold + 1)}
              className="threshold-button"
            >+</button>
          </div>
        </div>
      </div>
      
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
      
      {/* Filter Controls */}
      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search by name or ID..."
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
            className={`filter-button ${showLowStock ? 'active' : ''}`}
            onClick={toggleLowStockFilter}
          >
            Low Stock
          </button>
          <button 
            className={`filter-button ${showOutOfStock ? 'active' : ''}`}
            onClick={toggleOutOfStockFilter}
          >
            Out of Stock
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
              <option value="quantity">Sort by Quantity</option>
              <option value="expiry">Sort by Expiry Date</option>
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
        <div className="loading-indicator">Loading inventory data...</div>
      ) : filteredFruits.length === 0 ? (
        <div className="no-fruits-message">
          <p>No fruits found matching your criteria.</p>
        </div>
      ) : (
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Collection Date</th>
                <th>Expiry Date</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Stock Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFruits.map((fruit) => {
                const stockStatus = getStockStatus(fruit.quantity);
                const expired = isExpired(fruit.expiryDate);
                
                return (
                  <tr 
                    key={fruit._id}
                    className={`inventory-row ${expired ? 'expired-row' : ''} ${stockStatus.className}-row`}
                  >
                    <td>
                      <div className="inventory-image">
                        <img 
                          src={`http://localhost:3001${fruit.imageUrl}`} 
                          alt={fruit.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-fruit.png';
                          }}
                        />
                      </div>
                    </td>
                    <td>{fruit.name}</td>
                    <td>
                      <span className={`grade-badge ${getGradeColor(fruit.grade)}`}>
                        {fruit.grade}
                      </span>
                    </td>
                    <td>{formatDate(fruit.collectionDate)}</td>
                    <td className={expired ? 'expired-date' : ''}>
                      {formatDate(fruit.expiryDate)}
                      {expired && <span className="expired-tag">EXPIRED</span>}
                    </td>
                    <td>{formatPrice(fruit.price)}</td>
                    <td>
                      {editingFruit && editingFruit._id === fruit._id ? (
                        <div className="edit-quantity">
                          <input 
                            type="number" 
                            name="quantity" 
                            value={editingFruit.quantity}
                            onChange={handleEditChange}
                            min="0"
                            className="quantity-input"
                          />
                        </div>
                      ) : (
                        fruit.quantity || 0
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${stockStatus.className}`}>
                        {stockStatus.text}
                      </span>
                    </td>
                    <td>
                      {editingFruit && editingFruit._id === fruit._id ? (
                        <div className="action-buttons">
                          <button 
                            className="save-button" 
                            onClick={saveChanges}
                            disabled={isLoading}
                          >
                            Save
                          </button>
                          <button 
                            className="cancel-button" 
                            onClick={cancelEditing}
                            disabled={isLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button 
                            className="update-button"
                            onClick={() => startEditing(fruit)}
                            disabled={isLoading}
                          >
                            Update
                          </button>
                          <button 
                            className="delete-button"
                            onClick={() => openDeleteModal(fruit)}
                            disabled={isLoading}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add Fruit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Fruit Manually</h2>
              <button className="close-button" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={submitNewFruit} className="add-fruit-form">
                <div className="form-columns">
                  <div className="form-column">
                    <div className="form-group">
                      <label htmlFor="name">Fruit Name <span className="required">*</span></label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={newFruit.name}
                        onChange={handleAddFruitChange}
                        required
                        placeholder="Enter fruit name"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="grade">Grade <span className="required">*</span></label>
                      <select
                        id="grade"
                        name="grade"
                        value={newFruit.grade}
                        onChange={handleAddFruitChange}
                        required
                      >
                        <option value="A">Grade A</option>
                        <option value="B">Grade B</option>
                        <option value="C">Grade C</option>
                      </select>
                      <small>Only grades A, B, and C are allowed for manual addition</small>
                    </div>
                    
                    <div className="grade-info-box">
                      <h4>Grade Information</h4>
                      <div className="grade-info-item">
                        <span className="grade-badge grade-a">A</span>
                        <span>Premium quality - Perfect appearance, excellent taste</span>
                      </div>
                      <div className="grade-info-item">
                        <span className="grade-badge grade-b">B</span>
                        <span>Good quality - Minor imperfections, good taste</span>
                      </div>
                      <div className="grade-info-item">
                        <span className="grade-badge grade-c">C</span>
                        <span>Average quality - Visible imperfections, acceptable taste</span>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="price">Price (LKR) <span className="required">*</span></label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        min="0"
                        step="0.01"
                        value={newFruit.price}
                        onChange={handleAddFruitChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="quantity">Quantity <span className="required">*</span></label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        min="1"
                        value={newFruit.quantity}
                        onChange={handleAddFruitChange}
                        required
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="form-column">
                    <div className="form-group">
                      <label htmlFor="image">Fruit Image <span className="required">*</span></label>
                      <div className="upload-container">
                        {!fileInputRef.current?.files?.length ? (
                          <>
                            <div className="upload-icon">📷</div>
                            <div className="upload-text">Click to select or drag & drop image</div>
                            <div className="upload-text">JPEG, JPG, or PNG only</div>
                          </>
                        ) : (
                          <div className="image-preview">
                            <img 
                              src={fileInputRef.current?.files[0] ? URL.createObjectURL(fileInputRef.current.files[0]) : ''} 
                              alt="Preview" 
                            />
                            <button 
                              type="button" 
                              className="remove-image" 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                  setNewFruit({...newFruit});
                                }
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                        <input
                          type="file"
                          id="image"
                          name="image"
                          accept="image/jpeg,image/png,image/jpg"
                          ref={fileInputRef}
                          required
                          onChange={() => setNewFruit({...newFruit})}
                        />
                      </div>
                      <div className="file-info">
                        {fileInputRef.current?.files?.length 
                          ? `Selected: ${fileInputRef.current.files[0].name}` 
                          : 'No file selected'}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="expiryDate">Expiry Date</label>
                      <input
                        type="date"
                        id="expiryDate"
                        name="expiryDate"
                        value={newFruit.expiryDate}
                        min={getTomorrowDate()}
                        onChange={handleAddFruitChange}
                      />
                      <small>Must be a future date</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="collectorId">Collector ID</label>
                      <input
                        type="text"
                        id="collectorId"
                        name="collectorId"
                        value={newFruit.collectorId}
                        onChange={handleAddFruitChange}
                        placeholder="Your email will be used if left blank"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-buttons">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowAddModal(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Fruit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && fruitToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="close-button" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{fruitToDelete.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
              
              <div className="delete-fruit-info">
                <div className="delete-fruit-image">
                  <img 
                    src={`http://localhost:3001${fruitToDelete.imageUrl}`} 
                    alt={fruitToDelete.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-fruit.png';
                    }}
                  />
                </div>
                <div className="delete-fruit-details">
                  <p><strong>Grade:</strong> {fruitToDelete.grade}</p>
                  <p><strong>Price:</strong> {formatPrice(fruitToDelete.price)}</p>
                  <p><strong>Quantity:</strong> {fruitToDelete.quantity || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="delete-confirm-button"
                onClick={deleteFruit}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-content report-modal">
            <div className="modal-header">
              <h2>Generate Inventory Report</h2>
              <button className="close-button" onClick={() => setShowReportModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="reportType">Report Type</label>
                <select
                  id="reportType"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="all">All Inventory</option>
                  <option value="low-stock">Low Stock Items</option>
                  <option value="out-of-stock">Out of Stock Items</option>
                  <option value="expired">Expired Items</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="reportFormat">File Format</label>
                <select
                  id="reportFormat"
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="html">HTML</option>
                </select>
              </div>
              
              <div className="report-preview">
                <h3>Report Preview</h3>
                <p><strong>Report type:</strong> {
                  reportType === 'all' ? 'All Inventory' : 
                  reportType === 'low-stock' ? 'Low Stock Items' : 
                  reportType === 'out-of-stock' ? 'Out of Stock Items' : 'Expired Items'
                }</p>
                <p><strong>File format:</strong> {reportFormat.toUpperCase()}</p>
                <p><strong>Items included:</strong> {
                  reportType === 'all' ? filteredFruits.length : 
                  reportType === 'low-stock' ? stats.lowStock : 
                  reportType === 'out-of-stock' ? stats.outOfStock : 
                  fruits.filter(fruit => fruit.expiryDate && new Date(fruit.expiryDate) < new Date()).length
                }</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowReportModal(false)}
                disabled={isGeneratingReport}
              >
                Cancel
              </button>
              <button
                className="generate-button"
                onClick={generateReport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;