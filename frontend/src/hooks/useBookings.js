// frontend/src/hooks/useBookings.js
import { useState, useCallback } from 'react';
import bookingService from '../services/bookingService';

const useBookings = () => {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMyBookings = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bookingService.getMyBookings(filters);
      
      if (response.success) {
        setMyBookings(response.data || []);
      } else {
        setError(response.message || 'Failed to load bookings');
      }
    } catch (err) {
      setError('An error occurred while fetching bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId, reason) => {
    try {
      const response = await bookingService.cancelBooking(bookingId, reason);
      return response;
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return { 
        success: false, 
        message: 'An error occurred while cancelling the booking' 
      };
    }
  }, []);

  const createBooking = useCallback(async (seatId, bookingDate) => {
    try {
      const response = await bookingService.createBooking(seatId, bookingDate);
      return response;
    } catch (err) {
      console.error('Error creating booking:', err);
      return { 
        success: false, 
        message: 'An error occurred while creating the booking' 
      };
    }
  }, []);

  const getAvailableSeats = useCallback(async (date) => {
    try {
      const response = await bookingService.getAvailableSeats(date);
      return response;
    } catch (err) {
      console.error('Error fetching available seats:', err);
      return { 
        success: false, 
        message: 'An error occurred while fetching available seats' 
      };
    }
  }, []);

  const checkIn = useCallback(async (bookingId) => {
    try {
      const response = await bookingService.checkIn(bookingId);
      return response;
    } catch (err) {
      console.error('Error checking in:', err);
      return { 
        success: false, 
        message: 'An error occurred while checking in' 
      };
    }
  }, []);

  const checkOut = useCallback(async (bookingId) => {
    try {
      const response = await bookingService.checkOut(bookingId);
      return response;
    } catch (err) {
      console.error('Error checking out:', err);
      return { 
        success: false, 
        message: 'An error occurred while checking out' 
      };
    }
  }, []);

  return {
    myBookings,
    loading,
    error,
    fetchMyBookings,
    cancelBooking,
    createBooking,
    getAvailableSeats,
    checkIn,
    checkOut
  };
};

export default useBookings;