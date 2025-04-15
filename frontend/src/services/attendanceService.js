import api from './api';

/**
 * Check in to the office
 * @param {Object} checkInData - Check-in data including booking_id, ssid, and ip_address
 * @returns {Promise} - Promise resolving to the check-in data
 */
export const checkIn = async (checkInData) => {
  try {
    const response = await api.post('/attendance/check-in', checkInData);
    return response.data;
  } catch (error) {
    console.error('Error during check-in:', error);
    throw error;
  }
};

/**
 * Get network information (for office network validation)
 * @returns {Promise} - Promise resolving to network information
 */
export const getNetworkInfo = async () => {
  try {
    // This is simulated for demo purposes
    // In a real app, you'd need server-side or browser APIs to get this info
    
    // Simulating office network for demo
    const isInOffice = Math.random() > 0.3; // 70% chance of success for demo
    
    if (isInOffice) {
      return {
        ssid: 'GigLabz',
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        isOfficeNetwork: true
      };
    } else {
      return {
        ssid: 'OtherNetwork',
        ipAddress: '10.0.0.' + Math.floor(Math.random() * 255),
        isOfficeNetwork: false
      };
    }
  } catch (error) {
    console.error('Error getting network info:', error);
    throw error;
  }
};

/**
 * Get attendance history for the authenticated user
 * @param {Object} params - Filter parameters (startDate, endDate)
 * @returns {Promise} - Promise resolving to the attendance history
 */
export const getAttendanceHistory = async (params = {}) => {
  try {
    const response = await api.get('/attendance/history', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    throw error;
  }
};

/**
 * Get attendance history for a specific user (admin or manager)
 * @param {string} userId - The ID of the user to get attendance for
 * @param {Object} params - Filter parameters (startDate, endDate)
 * @returns {Promise} - Promise resolving to the attendance history
 */
export const getUserAttendanceHistory = async (userId, params = {}) => {
  try {
    const response = await api.get(`/attendance/user/${userId}/history`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching attendance history for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get attendance report for a department or team (manager or admin)
 * @param {Object} params - Filter parameters (departmentId, startDate, endDate)
 * @returns {Promise} - Promise resolving to the attendance report
 */
export const getAttendanceReport = async (params = {}) => {
  try {
    const response = await api.get('/attendance/report', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    throw error;
  }
};

// Default export
const attendanceService = {
  checkIn,
  getNetworkInfo,
  getAttendanceHistory,
  getUserAttendanceHistory,
  getAttendanceReport
};

export default attendanceService;