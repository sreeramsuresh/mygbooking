// frontend/src/services/bookingService.js
import axiosInstance from "../utils/axiosInterceptor";
import { API_URL } from "../config";

const API_ENDPOINT = `${API_URL}/bookings`;

const bookingService = {
  createBooking: async (seatId, bookingDate) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINT, {
        seatId,
        bookingDate,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  updateBooking: async (bookingId, updates) => {
    try {
      const response = await axiosInstance.put(
        `${API_ENDPOINT}/${bookingId}`,
        updates
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getMyBookings: async (filters = {}) => {
    try {
      // Fetch the bookings
      const response = await axiosInstance.get(`${API_ENDPOINT}/my`, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getAvailableSeats: async (date) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINT}/available-seats`,
        {
          params: { date },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getWeeklyStatus: async (year, weekNumber) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINT}/my-weekly-status`,
        {
          params: { year, weekNumber },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  cancelBooking: async (bookingId, reason) => {
    try {
      const response = await axiosInstance.delete(
        `${API_ENDPOINT}/${bookingId}`,
        {
          data: { reason },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  checkIn: async (bookingId) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINT}/${bookingId}/check-in`
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  checkOut: async (bookingId) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINT}/${bookingId}/check-out`
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getBookingsByDate: async (date) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/by-date`, {
        params: { date },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  createAutoBookings: async (weekStartDate) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINT}/auto-bookings`,
        {
          weekStartDate,
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  resetAndAutoBook: async (userId, weekStartDate) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINT}/reset-auto-book`,
        {
          userId,
          weekStartDate,
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },
};

export default bookingService;
