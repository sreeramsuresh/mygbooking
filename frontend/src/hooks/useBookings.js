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
      
      console.log("Calling getMyBookings API with filters:", filters);
      const response = await bookingService.getMyBookings(filters);
      console.log("MyBookings API response:", response);
      
      if (response.success) {
        console.log("Setting myBookings with data:", response.data || []);
        
        // Check if we have bookings or suggested bookings
        if (response.data && response.data.length === 0) {
          // If no bookings, check for suggestions based on user preferences
          try {
            const user = JSON.parse(localStorage.getItem("user")) || {};
            const days = user.defaultWorkDays || [1, 2, 3, 4, 5];
            const requiredDaysPerWeek = user.requiredDaysPerWeek || 2;
            const daysToShow = days.slice(0, requiredDaysPerWeek);
            
            console.log("No bookings found - showing suggestions based on preferences:", daysToShow);
            
            // Generate suggested booking dates for 4 weeks
            const suggestedBookings = [];
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
            
            for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
              const currentWeekStart = new Date(startOfWeek);
              currentWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7));
              
              for (const dayOfWeek of daysToShow) {
                const bookingDate = new Date(currentWeekStart);
                bookingDate.setDate(currentWeekStart.getDate() + ((dayOfWeek - currentWeekStart.getDay() + 7) % 7));
                
                // Skip dates in the past
                if (bookingDate <= today) continue;
                
                // Format date for display
                const formattedDate = bookingDate.toISOString().split("T")[0];
                
                // Create a suggested booking object similar to real bookings
                suggestedBookings.push({
                  id: `suggested-${weekOffset}-${dayOfWeek}`,
                  bookingDate: formattedDate,
                  status: "suggested",
                  isSuggested: true,
                  isAutoBooked: false,
                  dayOfWeek
                });
              }
            }
            
            console.log(`Generated ${suggestedBookings.length} suggested booking dates`);
            setMyBookings(suggestedBookings);
          } catch (suggestionError) {
            console.error("Error generating suggested bookings:", suggestionError);
            setMyBookings(response.data || []);
          }
        } else {
          setMyBookings(response.data || []);
        }
      } else {
        console.error("Error in MyBookings API response:", response.message);
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
  
  const updateBooking = useCallback(async (bookingId, updates) => {
    try {
      const response = await bookingService.updateBooking(bookingId, updates);
      return response;
    } catch (err) {
      console.error('Error updating booking:', err);
      return {
        success: false,
        message: 'An error occurred while updating the booking'
      };
    }
  }, []);
  
  const resetAndAutoBook = useCallback(async (weekStartDate) => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user ? user.id : null;
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      console.log('Resetting and auto-booking for user', userId, 'starting week', weekStartDate);
      const response = await bookingService.resetAndAutoBook(userId, weekStartDate);
      
      if (response.success) {
        // Refresh bookings after reset
        await fetchMyBookings();
      }
      return response;
    } catch (err) {
      console.error('Error resetting bookings:', err);
      return {
        success: false,
        message: 'An error occurred while resetting bookings'
      };
    } finally {
      setLoading(false);
    }
  }, [fetchMyBookings]);
  
  const changeWorkDay = useCallback(async (bookingId, newDate, seatId = null) => {
    try {
      // Validate that when changing workday, we always have a seatId
      if (!seatId) {
        console.error('A seat must be selected when changing workday');
        return {
          success: false,
          message: 'Please select a seat for the new date'
        };
      }
      
      console.log(`Changing workday for booking ${bookingId} to ${newDate} with seat ${seatId}`);
      const response = await bookingService.changeWorkDay(bookingId, newDate, seatId);
      
      if (response.success) {
        // Refresh bookings after change
        await fetchMyBookings();
      }
      return response;
    } catch (err) {
      console.error('Error changing workday:', err);
      return {
        success: false,
        message: 'An error occurred while changing workday'
      };
    }
  }, [fetchMyBookings]);

  return {
    myBookings,
    loading,
    error,
    fetchMyBookings,
    cancelBooking,
    createBooking,
    getAvailableSeats,
    checkIn,
    checkOut,
    updateBooking,
    resetAndAutoBook,
    changeWorkDay
  };
};

export default useBookings;