import api from './api';

/**
 * Get all bookings with optional filtering parameters
 * @param {Object} params - Filter parameters (userId, date, status, etc.)
 * @returns {Promise} - Promise resolving to booking data
 */
export const getBookings = async (params = {}) => {
  try {
    const response = await api.get('/bookings', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

/**
 * Get a specific booking by ID
 * @param {string} bookingId - The ID of the booking to retrieve
 * @returns {Promise} - Promise resolving to booking data
 */
export const getBookingById = async (bookingId) => {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Get upcoming bookings for the authenticated user
 * @returns {Promise} - Promise resolving to upcoming bookings data
 */
export const getUpcomingBookings = async () => {
  try {
    const response = await api.get('/bookings/upcoming');
    return response;
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    throw error;
  }
};

/**
 * Create a new booking
 * @param {Object} bookingData - Data for the new booking (userId, seatId, date, etc.)
 * @returns {Promise} - Promise resolving to created booking data
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Update an existing booking
 * @param {string} bookingId - The ID of the booking to update
 * @param {Object} bookingData - Updated booking data
 * @returns {Promise} - Promise resolving to updated booking data
 */
export const updateBooking = async (bookingId, bookingData) => {
  try {
    const response = await api.put(`/bookings/${bookingId}`, bookingData);
    return response.data;
  } catch (error) {
    console.error(`Error updating booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Delete a booking
 * @param {string} bookingId - The ID of the booking to delete
 * @returns {Promise} - Promise resolving to response data
 */
export const deleteBooking = async (bookingId) => {
  try {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Check in for a booking
 * @param {string} bookingId - The ID of the booking to check in
 * @returns {Promise} - Promise resolving to updated booking data
 */
export const checkInBooking = async (bookingId) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/check-in`);
    return response.data;
  } catch (error) {
    console.error(`Error checking in for booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Get available seats for a specific date
 * @param {string} date - The date to check seat availability for
 * @returns {Promise} - Promise resolving to available seats data
 */
export const getAvailableSeats = async (date) => {
  try {
    const response = await api.get('/bookings/available-seats', {
      params: { date }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available seats:', error);
    throw error;
  }
};

// Export a default object for easier imports
export default {
  getBookings,
  getBookingById,
  getUpcomingBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  checkInBooking,
  getAvailableSeats
};