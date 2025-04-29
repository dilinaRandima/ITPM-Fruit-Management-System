// src/components/FruitMarket.jsx - Updated to show expiry date and stock status
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './FruitMarket.css';
import { useNavigate } from 'react-router-dom';

const FruitMarket = () => {
  const { user } = useContext(AuthContext);
  const [fruits, setFruits] = useState([]);
  const [filteredFruits, setFilteredFruits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedFruit, setSelectedFruit] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(50);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchAvailableFruits();
    fetchCartItems();
  }, [user]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [fruits, searchTerm, selectedGrade, sortBy, sortOrder]);

  useEffect(() => {
    // Calculate cart count and total price whenever cart items change
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    const price = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    setCartCount(count);
    setTotalPrice(price);
  }, [cartItems]);

  const fetchAvailableFruits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:3001/api/fruits/available');
      setFruits(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching available fruits:', err);
      setError('Failed to load available fruits. Please try again.');
      setIsLoading(false);
    }
  };

  const fetchCartItems = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`http://localhost:3001/api/cart/${user.email}`);
      setCartItems(response.data);
    } catch (err) {
      console.error('Error fetching cart items:', err);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...fruits];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(fruit => 
        fruit.name.toLowerCase().includes(term)
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
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'grade':
          const gradeOrder = { 'A': 1, 'B': 2, 'C': 3 };
          comparison = gradeOrder[a.grade] - gradeOrder[b.grade];
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

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const handleCartClick = (e) => {
    // Stop event propagation to prevent cart from closing when clicking inside
    e.stopPropagation();
  };

  const openAddToCartModal = (fruit) => {
    // Check if item is already in cart
    const existingCartItem = cartItems.find(item => item.fruitId === fruit._id);
    
    // Calculate remaining available quantity
    const availableQuantity = fruit.quantity - (existingCartItem ? existingCartItem.quantity : 0);
    
    // Set initial quantity and store the adjusted fruit
    setSelectedQuantity(Math.min(1, availableQuantity));
    setSelectedFruit({
      ...fruit,
      availableQuantity: availableQuantity // Add this property for the modal
    });
    
    setAddingToCart(true);
  };

  const closeAddToCartModal = () => {
    setAddingToCart(false);
    setSelectedFruit(null);
    setSelectedQuantity(1);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    
    if (isNaN(value) || value < 1) {
      setSelectedQuantity(1);
    } else if (selectedFruit && value > selectedFruit.availableQuantity) {
      setSelectedQuantity(selectedFruit.availableQuantity);
    } else {
      setSelectedQuantity(value);
    }
  };

  const addToCart = async () => {
    if (!user || !selectedFruit) return;
    
    try {
      const response = await axios.post('http://localhost:3001/api/cart', {
        userId: user.email,
        fruitId: selectedFruit._id,
        quantity: selectedQuantity
      });
      
      // Update cart
      fetchCartItems();
      
      // Show success message
      setSuccessMessage(`Added ${selectedQuantity} ${selectedFruit.name} to cart!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Close modal
      closeAddToCartModal();
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to add item to cart. Please try again.');
      }
      setTimeout(() => setError(null), 3000);
    }
  };

  const updateCartItemQuantity = async (itemId, newQuantity) => {
    try {
      // Validate that newQuantity is at least 1
      if (newQuantity < 1) newQuantity = 1;
      
      await axios.put(`http://localhost:3001/api/cart/${itemId}`, {
        quantity: newQuantity
      });
      
      // Update cart locally for faster UI response
      setCartItems(prevItems => 
        prevItems.map(item => 
          item._id === itemId ? {...item, quantity: newQuantity} : item
        )
      );
      
      // Also fetch from server to ensure sync
      fetchCartItems();
    } catch (err) {
      console.error('Error updating cart item:', err);
      setError('Failed to update cart. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`http://localhost:3001/api/cart/${itemId}`);
      
      // Update cart
      fetchCartItems();
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    try {
      await axios.delete(`http://localhost:3001/api/cart/user/${user.email}`);
      
      // Update cart
      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
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

  // Format price as LKR
  const formatPrice = (price) => {
    return `LKR ${price?.toFixed(2) || '0.00'}`;
  };

  // Determine stock status based on quantity
  const getStockStatus = (quantity) => {
    if (!quantity || quantity <= 0) {
      return { status: 'Out of Stock', className: 'out-of-stock' };
    } else if (quantity <= lowStockThreshold) { // Changed from quantity < 10
      return { status: 'Low Stock', className: 'low-stock' };
    } else {
      return { status: 'In Stock', className: 'in-stock' };
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Check if fruit is in cart
  const isInCart = (fruitId) => {
    return cartItems.some(item => item.fruitId === fruitId);
  };

  if (!user) {
    return (
      <div className="unauthorized-container">
        <h2>Please Login</h2>
        <p>You need to login to access the Fruit Market.</p>
      </div>
    );
  }

  return (
    <div className="fruit-market-container">
      <h2 className="market-title">Fresh Fruit Market</h2>
      
      {/* Market Intro Panel */}
      <div className="market-intro-panel">
        <div className="intro-icon">🍎</div>
        <div className="intro-text">
          <p>Welcome to our premium fruit market! All fruits are freshly graded and quality-assured.</p>
          <p>Only high-quality fruits (Grade A, B, C) are available for purchase.</p>
        </div>
        
        {/* Cart Toggle Button */}
        <button 
          className={`cart-toggle ${cartCount > 0 ? 'has-items' : ''}`}
          onClick={toggleCart}
        >
          <span className="cart-icon">🛒</span>
          <span className="cart-count">{cartCount}</span>
        </button>
      </div>
      
      {/* Filter Controls */}
      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search fruits..."
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
              <option value="price">Sort by Price</option>
              <option value="name">Sort by Name</option>
              <option value="grade">Sort by Grade</option>
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
      
      {/* Cart Overlay */}
      <div className={`cart-overlay ${isCartOpen ? 'active' : ''}`} onClick={toggleCart}></div>      
      
      {/* Shopping Cart (Slide-in Panel) */}
      <div 
        className={`shopping-cart ${isCartOpen ? 'open' : ''}`} 
        onClick={handleCartClick}  
      >
        <div className="cart-header">
          <h3>Your Shopping Cart</h3>
          <button className="close-cart" onClick={(e) => {
            e.stopPropagation();
            toggleCart();
          }}>×</button>
        </div>
        
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <p>Your cart is empty</p>
            <p className="empty-cart-subtext">Add some delicious fruits!</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-image">
                    <img 
                      src={`http://localhost:3001${item.imageUrl}`} 
                      alt={item.name} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-fruit.png';
                      }}
                    />
                  </div>
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    <div className="cart-item-meta">
                      <span className={`grade-badge ${getGradeColor(item.grade)}`}>
                        {item.grade}
                      </span>
                      <span className="cart-item-price">{formatPrice(item.price)}</span>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button 
                        onClick={() => updateCartItemQuantity(item._id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value) && value >= 1) {
                            updateCartItemQuantity(item._id, value);
                          }
                        }}
                        aria-label="Item quantity"
                      />
                      <button 
                        onClick={() => updateCartItemQuantity(item._id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      className="remove-item" 
                      onClick={() => removeFromCart(item._id)}
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="cart-item-subtotal">
                    <span>Subtotal:</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-total">
                <span>Total:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="cart-actions">
                <button 
                  className="checkout-button"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </button>
                <button 
                  className="clear-cart-button"
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Main Content - Fruit Listings */}
      {isLoading ? (
        <div className="loading-indicator">Loading available fruits...</div>
      ) : filteredFruits.length === 0 ? (
        <div className="no-fruits-message">
          <p>No fruits available matching your criteria.</p>
          <p>Please check back later or try different filters.</p>
        </div>
      ) : (
        <div className="fruits-market-grid">
          {filteredFruits.map((fruit) => {
            const stockStatus = getStockStatus(fruit.quantity);
            return (
              <div 
                key={fruit._id} 
                className="fruit-market-card"
              >
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
                  <div className="price-tag">{formatPrice(fruit.price)}</div>
                </div>
                
                <div className="fruit-card-details">
                  <div className="detail-row">
                    <span className="detail-label">Expiry Date:</span>
                    <span className="detail-value">{formatDate(fruit.expiryDate)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Availability:</span>
                    <span className={`detail-value stock-status ${stockStatus.className}`}>
                      {stockStatus.status}
                    </span>
                  </div>
                </div>
                
                <button 
                  className="add-to-cart-button" 
                  onClick={() => openAddToCartModal(fruit)}
                  disabled={addingToCart || fruit.quantity <= 0}
                >
                  {stockStatus.status === 'Out of Stock' ? 'Out of Stock' : 
                   isInCart(fruit._id) ? 'Add More to Cart' : 'Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Add to Cart Modal */}
      {addingToCart && selectedFruit && (
        <div className="modal-overlay">
          <div className="add-to-cart-modal">
            <button className="close-modal" onClick={closeAddToCartModal}>×</button>
            
            <div className="modal-header">
              <h3>Add to Cart</h3>
            </div>
            
            <div className="modal-body">
              <div className="modal-fruit-details">
                <div className="modal-fruit-image">
                  <img 
                    src={`http://localhost:3001${selectedFruit.imageUrl}`} 
                    alt={selectedFruit.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-fruit.png';
                    }}
                  />
                </div>
                
                <div className="modal-fruit-info">
                  <h4>{selectedFruit.name}</h4>
                  <p className="modal-fruit-grade">
                    <span className={`grade-badge ${getGradeColor(selectedFruit.grade)}`}>
                      {selectedFruit.grade}
                    </span>
                  </p>
                  <p className="modal-fruit-price">{formatPrice(selectedFruit.price)}</p>
                  <p className="modal-fruit-expiry">
                    Expiry Date: {formatDate(selectedFruit.expiryDate)}
                  </p>
                  
                  {isInCart(selectedFruit._id) && (
                    <p className="cart-note">
                      Note: You already have {cartItems.find(i => i.fruitId === selectedFruit._id).quantity} of this item in your cart.
                      You can add up to {selectedFruit.availableQuantity} more.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="modal-quantity">
                <label htmlFor="quantity">Quantity:</label>
                <div className="quantity-control large">
                  <button 
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    disabled={selectedQuantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={selectedFruit.availableQuantity}
                    value={selectedQuantity}
                    onChange={handleQuantityChange}
                  />
                  <button 
                    onClick={() => setSelectedQuantity(Math.min(selectedFruit.availableQuantity, selectedQuantity + 1))}
                    disabled={selectedQuantity >= selectedFruit.availableQuantity}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="modal-subtotal">
                <span>Subtotal:</span>
                <span>{formatPrice(selectedFruit.price * selectedQuantity)}</span>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-button" 
                onClick={closeAddToCartModal}
              >
                Cancel
              </button>
              <button 
                className="add-button" 
                onClick={addToCart}
                disabled={selectedFruit.availableQuantity <= 0}
              >
                {selectedFruit.availableQuantity <= 0 ? 'No More Available' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FruitMarket;