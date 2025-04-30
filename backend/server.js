// server.js - Fixed and integrated with authentication, collection and market features

// Import all dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;



// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected m'))
.catch(err => console.error('MongoDB connection error:', err));

// Define schemas (AFTER mongoose connection)
// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'transporter', 'admin'],
    default: 'customer'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Fruit Schema - With updated fields for pricing and inventory
const fruitSchema = new mongoose.Schema({
    name: String,
    variety: String,
    collectionDate: Date,
    expiryDate: Date, // New field for expiry date
    collectorId: String,
    imageUrl: String,
    grade: {
        type: String,
        enum: ['A', 'B', 'C', 'E', 'F'],
        default: 'C'
    },
    scores: {
        total: Number,
        color: Number,
        texture: Number,
        shape: Number,
        defect: Number
    },
    status: {
        type: String,
        enum: ['pending', 'graded', 'rejected', 'approved', 'available'],
        default: 'pending'
    },
    price: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Fruit = mongoose.model('Fruit', fruitSchema);

// Cart Schema for shopping cart functionality
const cartItemSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    fruitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fruit',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    name: String,
    grade: String,
    imageUrl: String,
    price: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

// Authentication Middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based Authorization Middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images only (JPEG, JPG, PNG)');
        }
    }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== AUTHENTICATION ROUTES =====

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'customer'
    });
    
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Verify role if specified
    if (role && user.role !== role) {
      return res.status(400).json({ error: 'Invalid role for this account' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin stats example (protected route)
app.get('/api/admin/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // Admin-only functionality here
    res.json({ message: 'Admin stats accessed successfully' });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/stats/ids', authenticate, authorize(['admin']), async (req, res) => {
    try {
      res.json({ message: 'selected admin stats accessed successfully' });
    } catch (error) {
      console.error('stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

// ===== FRUIT ROUTES =====

// API endpoint to upload and grade fruit - Updated with non-fruit validation
app.post('/api/fruits/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const { name, variety, collectorId } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;
        const imagePath = req.file.path;

        // Create form data with the proper package
        const formData = new FormData();
        formData.append('image', fs.createReadStream(imagePath));
        
        console.log('Sending image to AI service:', imagePath);
        console.log('Form data created with image field');
        
        // Try connecting to the AI service with better error handling
        let aiResponse;
        try {
            aiResponse = await axios.post('http://localhost:5001/api/grade-fruit', formData, {
                headers: {
                    ...formData.getHeaders()
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 30000 // Timeout after 30 seconds
            });
        } catch (error) {
            // Check if this is a non-fruit error from the AI service
            if (error.response && error.response.data && error.response.data.error) {
                console.log('AI service identified non-fruit image:', error.response.data.error);
                
                // Return a formatted error to the client
                return res.status(400).json({ 
                    error: error.response.data.error,
                    isNonFruit: true,
                    imageUrl: imageUrl
                });
            }
            
            console.error('AI service connection error:', error.message);
            if (error.response) {
                console.error('AI service returned status:', error.response.status);
                console.error('AI service error data:', error.response.data);
            }
            throw new Error(`AI service error: ${error.message}`);
        }

        // Check if the AI service detected a non-fruit with normal status code
        if (aiResponse.data.error && !aiResponse.data.is_fruit) {
            console.log('AI service identified non-fruit image:', aiResponse.data.error);
            return res.status(400).json({
                error: aiResponse.data.error,
                isNonFruit: true,
                imageUrl: imageUrl
            });
        }

        console.log('AI service response:', aiResponse.data);

        // Extract grades and scores with safety checks
        const { 
            grade = 'C', 
            score = 60.0, 
            color_score = 60.0, 
            texture_score = 60.0, 
            shape_score = 60.0, 
            defect_score = 60.0
        } = aiResponse.data;

        // Determine status based on grade - Updated for accurate grading
        let status = 'graded';
        if (grade === 'E' || grade === 'F') {
            status = 'rejected';
        } else if (grade === 'A' || grade === 'B') {
            status = 'approved';
        }

        // Create new fruit entry
        const fruit = new Fruit({
            name,
            variety: variety || name, // Use name as fallback
            collectionDate: new Date(),
            collectorId,
            imageUrl,
            grade,
            scores: {
                total: parseFloat(score) || 60.0,
                color: parseFloat(color_score) || 60.0,
                texture: parseFloat(texture_score) || 60.0,
                shape: parseFloat(shape_score) || 60.0,
                defect: parseFloat(defect_score) || 60.0
            },
            status
        });

        await fruit.save();
        res.status(201).json(fruit);
    } catch (error) {
        console.error('Error processing fruit:', error);
        if (error.response) {
            console.error('Error response from AI service:', error.response.data);
            console.error('Status code:', error.response.status);
        }
        res.status(500).json({ 
            error: 'Failed to process fruit', 
            message: error.message 
        });
    }
});

// API endpoint to get all fruits
app.get('/api/fruits', async (req, res) => {
    try {
        const fruits = await Fruit.find().sort({ createdAt: -1 });
        res.json(fruits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fruits' });
    }
});

// API endpoint to get fruits by grade
app.get('/api/fruits/by-grade/:grade', async (req, res) => {
    try {
        const fruits = await Fruit.find({ grade: req.params.grade }).sort({ createdAt: -1 });
        res.json(fruits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fruits' });
    }
});

// API endpoint to get fruits by status
app.get('/api/fruits/by-status/:status', async (req, res) => {
    try {
        const fruits = await Fruit.find({ status: req.params.status }).sort({ createdAt: -1 });
        res.json(fruits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fruits' });
    }
});

// API endpoint to get fruits by quality (A, B, C only) for admin collection view
app.get('/api/fruits/quality', async (req, res) => {
    try {
        const fruits = await Fruit.find({ 
            grade: { $in: ['A', 'B', 'C'] } 
        }).sort({ createdAt: -1 });
        res.json(fruits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fruits' });
    }
});

// API endpoint to get all available fruits for customer market view
app.get('/api/fruits/available', async (req, res) => {
    try {
        const fruits = await Fruit.find({ 
            grade: { $in: ['A', 'B', 'C'] },
            status: 'available',
            quantity: { $gt: 0 }
        }).sort({ grade: 1 });
        res.json(fruits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch available fruits' });
    }
});

// API endpoint to get a single fruit by ID
app.get('/api/fruits/:id', async (req, res) => {
    try {
        const fruit = await Fruit.findById(req.params.id);
        if (!fruit) {
            return res.status(404).json({ error: 'Fruit not found' });
        }
        res.json(fruit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fruit' });
    }
});

// API endpoint to update fruit details (price, quantity, status)
app.put('/api/fruits/:id', async (req, res) => {
    try {
        const { price, quantity, status, expiryDate } = req.body;
        
        // Validate inputs
        if ((price !== undefined && price < 0) || (quantity !== undefined && quantity < 0)) {
            return res.status(400).json({ error: 'Price and quantity must be positive values' });
        }
        
        const fruit = await Fruit.findById(req.params.id);
        if (!fruit) {
            return res.status(404).json({ error: 'Fruit not found' });
        }
        
        // Update only provided fields
        if (price !== undefined) fruit.price = price;
        if (quantity !== undefined) fruit.quantity = quantity;
        if (status !== undefined) fruit.status = status;
        if (expiryDate !== undefined) fruit.expiryDate = expiryDate;
        
        await fruit.save();
        res.json(fruit);
    } catch (error) {
        console.error('Error updating fruit:', error);
        res.status(500).json({ error: 'Failed to update fruit' });
    }
});

// API endpoint to delete a fruit
app.delete('/api/fruits/:id', async (req, res) => {
    try {
        const fruit = await Fruit.findById(req.params.id);
        if (!fruit) {
          return res.status(404).json({ error: 'Fruit not found' });
        }
        
        // Delete image file
        if (fruit.imageUrl) {
          const imagePath = path.join(__dirname, fruit.imageUrl);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
        
        // Delete from database
        await Fruit.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Fruit deleted successfully' });
    } catch (error) {
        console.error('Error deleting fruit:', error);
        res.status(500).json({ error: 'Failed to delete fruit' });
    }
});

// ===== CART ROUTES =====

// API endpoint to add item to cart
app.post('/api/cart', async (req, res) => {
    try {
        const { userId, fruitId, quantity } = req.body;
        
        // Validate inputs
        if (!userId || !fruitId || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Invalid request data' });
        }
        
        // Find the fruit
        const fruit = await Fruit.findById(fruitId);
        if (!fruit) {
            return res.status(404).json({ error: 'Fruit not found' });
        }
        
        // Check if fruit is available
        if (fruit.status !== 'available' || fruit.quantity < quantity) {
            return res.status(400).json({ 
                error: 'Fruit is not available or insufficient quantity'
            });
        }
        
        // Check if item already exists in cart
        let cartItem = await CartItem.findOne({ userId, fruitId });
        
        if (cartItem) {
            // Calculate new total quantity
            const newTotalQuantity = cartItem.quantity + quantity;
            
            // Check if new total exceeds available inventory
            if (newTotalQuantity > fruit.quantity) {
                return res.status(400).json({ 
                    error: 'Adding this quantity would exceed available inventory',
                    availableQuantity: fruit.quantity,
                    cartQuantity: cartItem.quantity,
                    requestedQuantity: quantity
                });
            }
            
            // Update existing item with validated quantity
            cartItem.quantity = newTotalQuantity;
            cartItem.price = fruit.price; // Ensure price is current
        } else {
            // Create new cart item
            cartItem = new CartItem({
                userId,
                fruitId,
                quantity,
                name: fruit.name,
                grade: fruit.grade,
                imageUrl: fruit.imageUrl,
                price: fruit.price
            });
        }
        
        await cartItem.save();
        
        res.status(201).json(cartItem);
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
});

// API endpoint to get user's cart
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const cartItems = await CartItem.find({ 
            userId: req.params.userId 
        }).sort({ createdAt: -1 });
        
        res.json(cartItems);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart items' });
    }
});

// API endpoint to update cart item quantity
app.put('/api/cart/:id', async (req, res) => {
    try {
        const { quantity } = req.body;
        
        // Validate quantity
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }
        
        const cartItem = await CartItem.findById(req.params.id);
        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        
        // Check if requested quantity is available
        const fruit = await Fruit.findById(cartItem.fruitId);
        if (!fruit || fruit.quantity < quantity) {
            return res.status(400).json({ 
                error: 'Requested quantity not available'
            });
        }
        
        cartItem.quantity = quantity;
        await cartItem.save();
        
        res.json(cartItem);
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

// API endpoint to remove item from cart
app.delete('/api/cart/:id', async (req, res) => {
    try {
        const result = await CartItem.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

// API endpoint to clear entire cart
app.delete('/api/cart/user/:userId', async (req, res) => {
    try {
        await CartItem.deleteMany({ userId: req.params.userId });
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

// Updated server.js manual fruit addition endpoint
app.post('/api/fruits/manual', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
  
        const { name, grade, price, quantity, collectorId, expiryDate } = req.body;
        
        // Validate inputs
        if (!name || !grade || !price || !quantity || !collectorId) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (!['A', 'B', 'C'].includes(grade)) {
            return res.status(400).json({ error: 'Only grades A, B, and C are allowed for manual addition' });
        }
        
        if (parseFloat(price) <= 0 || parseInt(quantity) <= 0) {
            return res.status(400).json({ error: 'Price and quantity must be positive values' });
        }
  
        // Validate expiry date if provided
        if (expiryDate) {
            const expiryDateObj = new Date(expiryDate);
            const today = new Date();
            if (expiryDateObj <= today) {
                return res.status(400).json({ error: 'Expiry date must be in the future' });
            }
        }
  
        const imageUrl = `/uploads/${req.file.filename}`;
        
        // Default scores for manually added fruits
        const defaultScore = grade === 'A' ? 90 : (grade === 'B' ? 80 : 70);
        
        // Create new fruit entry with expiry date
        const fruit = new Fruit({
            name,
            variety: name,
            collectionDate: new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            collectorId,
            imageUrl,
            grade,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            scores: {
                total: defaultScore,
                color: defaultScore,
                texture: defaultScore,
                shape: defaultScore,
                defect: defaultScore
            },
            status: 'available' // Mark as available immediately
        });
  
        await fruit.save();
        res.status(201).json(fruit);
    } catch (error) {
        console.error('Error adding fruit manually:', error);
        res.status(500).json({ 
            error: 'Failed to add fruit manually', 
            message: error.message 
        });
    }
});

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    userDetails: {
        fullName: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        postalCode: String
    },
    items: [{
        fruitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Fruit'
        },
        name: String,
        grade: String,
        imageUrl: String,
        price: Number,
        quantity: Number
    }],
    payment: {
        method: String,
        cardLast4: String,
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        }
    },
    shipping: {
        method: String,
        cost: Number,
        status: {
            type: String,
            enum: ['processing', 'shipped', 'delivered'],
            default: 'processing'
        },
        estimatedDelivery: Date
    },
    subtotal: Number,
    total: Number,
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'canceled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model('Order', orderSchema);

// API endpoint to create a new order
app.post('/api/orders', async (req, res) => {
    try {
        const {
            userId,
            userDetails,
            items,
            payment,
            shipping,
            subtotal,
            total
        } = req.body;
        
        // Validate required fields
        if (!userId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        
        // Generate order ID (format: ORD-XXXXXX)
        const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        
        // Calculate estimated delivery date
        const estimatedDelivery = new Date();
        if (shipping.method === 'express') {
            estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
        } else if (shipping.method === 'standard') {
            estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
        }
        
        // Create the order
        const order = new Order({
            orderId,
            userId,
            userDetails,
            items,
            payment,
            shipping: {
                ...shipping,
                estimatedDelivery
            },
            subtotal,
            total,
            status: 'processing'
        });
        
        await order.save();
        
        // Update inventory (reduce quantity) for purchased items
        for (const item of items) {
            const fruit = await Fruit.findById(item.fruitId);
            if (fruit) {
                fruit.quantity = Math.max(0, fruit.quantity - item.quantity);
                await fruit.save();
            }
        }
        
        // Clear the user's cart
        await CartItem.deleteMany({ userId });
        
        // Send response with order details
        res.status(201).json({
            message: 'Order created successfully',
            order: {
                orderId: order.orderId,
                total: order.total,
                status: order.status,
                createdAt: order.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// API endpoint to get user's orders
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ 
            userId: req.params.userId 
        }).sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// API endpoint to get a single order by ID
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// API endpoint to update order status
app.patch('/api/orders/:orderId/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const order = await Order.findOne({ orderId: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        order.status = status;
        await order.save();
        
        res.json({ message: 'Order status updated', status: order.status });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});
// Add this endpoint to your server.js file, right after the existing 
// "API endpoint to get a single order by ID" endpoint

// API endpoint to update an entire order
app.patch('/api/orders/:orderId', async (req, res) => {
    try {
        const updates = req.body;
        
        // Find the order
        const order = await Order.findOne({ orderId: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Log what we're trying to update
        console.log('Updating order:', req.params.orderId);
        console.log('Update data:', updates);
        
        // Update shipping if provided
        if (updates.shipping) {
            console.log('Updating shipping with:', updates.shipping);
            order.shipping = {
                ...order.shipping,
                ...updates.shipping
            };
        }
        
        // Update other fields if needed
        if (updates.userDetails) {
            order.userDetails = {
                ...order.userDetails,
                ...updates.userDetails
            };
        }
        
        if (updates.payment) {
            order.payment = {
                ...order.payment,
                ...updates.payment
            };
        }
        
        if (updates.total !== undefined) {
            order.total = updates.total;
        }
        
        if (updates.status) {
            order.status = updates.status;
        }
        
        // Save updated order
        await order.save();
        console.log('Order updated successfully:', order);
        
        res.json({
            message: 'Order updated successfully',
            order
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});
app.get('/api/orders/all', async (req, res) => {
    try {
      // Get all orders, sorted by creation date (newest first)
      const orders = await Order.find().sort({ createdAt: -1 });
      
      res.json(orders);
    } catch (error) {
      console.error('Error fetching all orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // API endpoint to delete an order
app.delete('/api/orders/:orderId', async (req, res) => {
    try {
      // Find the order first to confirm it exists
      const order = await Order.findOne({ orderId: req.params.orderId });
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Delete the order from the database
      await Order.findOneAndDelete({ orderId: req.params.orderId });
      
      // Return success response
      res.json({ 
        message: 'Order deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});