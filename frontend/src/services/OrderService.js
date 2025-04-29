// src/services/OrderService.js
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const OrderService = {
  /**
   * Get all orders for a specific user
   * @param {string} userId - User's email or ID
   * @returns {Promise} - Promise resolving to array of orders
   */
  getUserOrders: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/orders/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  /**
   * Get a specific order by ID
   * @param {string} orderId - The order's ID
   * @returns {Promise} - Promise resolving to order object
   */
  getOrderById: async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  },

  /**
   * Update an order's status
   * @param {string} orderId - The order's ID
   * @param {string} status - New status (pending, processing, completed, canceled)
   * @returns {Promise} - Promise resolving to updated status
   */
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await axios.patch(`${API_URL}/orders/${orderId}/status`, {
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  /**
   * Update an entire order's details
   * @param {string} orderId - The order's ID
   * @param {object} updateData - Object containing fields to update
   * @returns {Promise} - Promise resolving to updated order
   */
  updateOrder: async (orderId, updateData) => {
    try {
      const response = await axios.patch(`${API_URL}/orders/${orderId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  /**
   * Create a new order
   * @param {object} orderData - Complete order data
   * @returns {Promise} - Promise resolving to created order
   */
  createOrder: async (orderData) => {
    try {
      const response = await axios.post(`${API_URL}/orders`, orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Calculate shipping cost based on method
   * @param {string} method - Shipping method (standard, express, pickup)
   * @returns {number} - Shipping cost
   */
  calculateShippingCost: (method) => {
    switch(method) {
      case 'express':
        return 500;
      case 'standard':
        return 250;
      case 'pickup':
        return 0;
      default:
        return 250;
    }
  },

  /**
   * Calculate estimated delivery date based on shipping method
   * @param {string} method - Shipping method (standard, express, pickup)
   * @returns {Date} - Estimated delivery date
   */
  calculateEstimatedDelivery: (method) => {
    const deliveryDate = new Date();
    
    if (method === 'express') {
      // Express delivery: 1-2 business days
      deliveryDate.setDate(deliveryDate.getDate() + 2);
    } else if (method === 'standard') {
      // Standard delivery: 3-5 business days
      deliveryDate.setDate(deliveryDate.getDate() + 5);
    } else {
      // Pickup: same day
      deliveryDate.setDate(deliveryDate.getDate() + 0);
    }
    
    return deliveryDate;
  }
};

export default OrderService;