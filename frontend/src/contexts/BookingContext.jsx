// frontend/src/contexts/BookingContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import bookingService from "../services/bookingService";
import { format, parseISO, startOfToday } from "date-fns";

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  // Bookings state
  const [myBookings, setMyBookings] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [weeklyStatus, setWeeklyStatus] = useState(null);

  // Current booking state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  // Loading/error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all bookings for the current user
   */
  const fetchMyBookings = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await bookingService.getMyBookings(filters);

      if (response.success) {
        setMyBookings(response.data);
      } else {
        setError(response.message || "Failed to fetch bookings");
      }
    } catch (err) {
      setError("An error occurred while fetching bookings");
      console.error("Fetch bookings error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch available seats for a specific date
   */
  const fetchAvailableSeats = useCallback(async (date) => {
    try {
      setLoading(true);
      setError(null);

      const response = await bookingService.getAvailableSeats(date);

      if (response.success) {
        setAvailableSeats(response.data);
      } else {
        setError(response.message || "Failed to fetch available seats");
      }
    } catch (err) {
      setError("An error occurred while fetching available seats");
      console.error("Fetch available seats error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch weekly attendance status
   */
  const fetchWeeklyStatus = useCallback(async (year, weekNumber) => {
    try {
      setLoading(true);
      setError(null);

      const response = await bookingService.getWeeklyStatus(year, weekNumber);

      if (response.success) {
        setWeeklyStatus(response.data);
      } else {
        setError(response.message || "Failed to fetch weekly status");
      }
    } catch (err) {
      setError("An error occurred while fetching weekly status");
      console.error("Fetch weekly status error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new booking
   */
  const createBooking = async (seatId, bookingDate) => {
    try {
      setLoading(true);
      setError(null);

      const response = await bookingService.createBooking(seatId, bookingDate);

      if (response.success) {
        // Refresh bookings
        await fetchMyBookings();

        // If the booking date matches the currently selected date, update available seats
        if (selectedDate === bookingDate) {
          await fetchAvailableSeats(bookingDate);
        }

        return { success: true, data: response.data };
      } else {
        setError(response.message || "Failed to create booking");
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = "An error occurred while creating booking";
      setError(errorMessage);
      console.error("Create booking error:", err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel a booking
   */
  const cancelBooking = async (bookingId, reason) => {
    try {
      setLoading(true);
      setError(null);

      const response = await bookingService.cancelBooking(bookingId, reason);

      if (response.success) {
        // Refresh bookings
        await fetchMyBookings();

        // Find the cancelled booking's date to refresh available seats if needed
        const cancelledBooking = myBookings.find(
          (booking) => booking.id === bookingId
        );
        if (cancelledBooking && selectedDate === cancelledBooking.bookingDate) {
          await fetchAvailableSeats(cancelledBooking.bookingDate);
        }

        return { success: true, data: response.data };
      } else {
        setError(response.message || "Failed to cancel booking");
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = "An error occurred while cancelling booking";
      setError(errorMessage);
      console.error("Cancel booking error:", err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check in for a booking
   */
  const checkIn = async (bookingId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await bookingService.checkIn(bookingId);

      if (response.success) {
        // Refresh bookings
        await fetchMyBookings();
        return { success: true, data: response.data };
      } else {
        setError(response.message || "Failed to check in");
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = "An error occurred during check-in";
      setError(errorMessage);
      console.error("Check-in error:", err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check out for a booking
   */
  const checkOut = async (bookingId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await bookingService.checkOut(bookingId);

      if (response.success) {
        // Refresh bookings
        await fetchMyBookings();
        return { success: true, data: response.data };
      } else {
        setError(response.message || "Failed to check out");
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = "An error occurred during check-out";
      setError(errorMessage);
      console.error("Check-out error:", err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset booking selection
   */
  const resetSelection = () => {
    setSelectedDate(null);
    setSelectedSeat(null);
  };

  /**
   * Get booked dates array
   */
  const getBookedDates = () => {
    if (!myBookings || myBookings.length === 0) return [];

    return myBookings
      .filter((booking) => booking.status !== "cancelled")
      .map((booking) => booking.bookingDate);
  };

  /**
   * Helper to check if a date is already booked
   */
  const isDateBooked = (date) => {
    const formattedDate =
      typeof date === "string" ? date : format(date, "yyyy-MM-dd");
    return getBookedDates().includes(formattedDate);
  };

  // Initialize data on mount
  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  // Prepare context value
  const value = {
    // State
    myBookings,
    availableSeats,
    weeklyStatus,
    selectedDate,
    selectedSeat,
    loading,
    error,

    // Setters
    setSelectedDate,
    setSelectedSeat,

    // API functions
    fetchMyBookings,
    fetchAvailableSeats,
    fetchWeeklyStatus,
    createBooking,
    cancelBooking,
    checkIn,
    checkOut,

    // Helper functions
    resetSelection,
    getBookedDates,
    isDateBooked,
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
};

export default BookingContext;
