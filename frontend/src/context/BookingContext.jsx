import React, { createContext, useState, useEffect, useContext } from 'react';
import { getBookings, createBooking, updateBooking, deleteBooking } from '../services/bookingService';
import { useAuth } from '../hooks/useAuth';

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSeat, setSelectedSeat] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserBookings();
    }
  }, [user, selectedDate]);

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const data = await getBookings({ userId: user.id, date: selectedDate });
      setBookings(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addBooking = async (bookingData) => {
    setLoading(true);
    try {
      const newBooking = await createBooking({
        ...bookingData,
        userId: user.id,
        date: selectedDate,
        seatId: selectedSeat?.id
      });
      setBookings([...bookings, newBooking]);
      setError(null);
      return newBooking;
    } catch (err) {
      setError('Failed to create booking');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const modifyBooking = async (bookingId, bookingData) => {
    setLoading(true);
    try {
      const updatedBooking = await updateBooking(bookingId, bookingData);
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? updatedBooking : booking
      ));
      setError(null);
      return updatedBooking;
    } catch (err) {
      setError('Failed to update booking');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeBooking = async (bookingId) => {
    setLoading(true);
    try {
      await deleteBooking(bookingId);
      setBookings(bookings.filter(booking => booking.id !== bookingId));
      setError(null);
    } catch (err) {
      setError('Failed to delete booking');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    bookings,
    loading,
    error,
    selectedDate,
    selectedSeat,
    setSelectedDate,
    setSelectedSeat,
    fetchUserBookings,
    addBooking,
    modifyBooking,
    removeBooking
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};