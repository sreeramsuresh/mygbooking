import api from './api';

/**
 * Get schedule for the authenticated user
 * @returns {Promise} - Promise resolving to user's schedule
 */
export const getUserSchedule = async () => {
  try {
    const response = await api.get('/schedule/user');
    return response;
  } catch (error) {
    console.error('Error fetching user schedule:', error);
    throw error;
  }
};

/**
 * Get schedule for a specific user (admin or manager)
 * @param {string} userId - The ID of the user to get schedule for
 * @returns {Promise} - Promise resolving to user's schedule
 */
export const getUserScheduleById = async (userId) => {
  try {
    const response = await api.get(`/schedule/user/${userId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching schedule for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Update schedule for a user
 * @param {string} userId - The ID of the user to update schedule for
 * @param {Array} scheduleDays - Array of weekdays (Monday, Tuesday, etc.)
 * @returns {Promise} - Promise resolving to updated schedule
 */
export const updateUserSchedule = async (userId, scheduleDays) => {
  try {
    const response = await api.put(`/schedule/user/${userId}`, { scheduleDays });
    return response;
  } catch (error) {
    console.error(`Error updating schedule for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get department schedule (manager)
 * @param {string} departmentId - The ID of the department to get schedule for
 * @returns {Promise} - Promise resolving to department schedule
 */
export const getDepartmentSchedule = async (departmentId) => {
  try {
    const response = await api.get(`/schedule/department/${departmentId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching schedule for department ${departmentId}:`, error);
    throw error;
  }
};

/**
 * Get team schedule for a manager
 * @returns {Promise} - Promise resolving to team schedule
 */
export const getTeamSchedule = async () => {
  try {
    const response = await api.get('/schedule/team');
    return response;
  } catch (error) {
    console.error('Error fetching team schedule:', error);
    throw error;
  }
};

/**
 * Get weekly or daily schedule overview (admin)
 * @param {string} date - The date to get schedule overview for
 * @param {string} view - View type ('day' or 'week')
 * @returns {Promise} - Promise resolving to schedule overview
 */
export const getScheduleOverview = async (date, view = 'day') => {
  try {
    const response = await api.get('/schedule/overview', {
      params: { date, view }
    });
    return response;
  } catch (error) {
    console.error('Error fetching schedule overview:', error);
    throw error;
  }
};

/**
 * Get compliance report for all users (admin)
 * @param {Object} params - Filter parameters (department, startDate, endDate)
 * @returns {Promise} - Promise resolving to compliance report
 */
export const getComplianceReport = async (params = {}) => {
  try {
    const response = await api.get('/schedule/compliance', { params });
    return response;
  } catch (error) {
    console.error('Error fetching compliance report:', error);
    throw error;
  }
};

/**
 * Get compliance statistics for a user
 * @param {string} userId - The ID of the user to get compliance for
 * @returns {Promise} - Promise resolving to user's compliance stats
 */
export const getUserCompliance = async (userId) => {
  try {
    const response = await api.get(userId ? `/schedule/compliance/${userId}` : '/schedule/compliance/user');
    return response;
  } catch (error) {
    console.error('Error fetching user compliance:', error);
    throw error;
  }
};

// Default export
const scheduleService = {
  getUserSchedule,
  getUserScheduleById,
  updateUserSchedule,
  getDepartmentSchedule,
  getTeamSchedule,
  getScheduleOverview,
  getComplianceReport,
  getUserCompliance
};

export default scheduleService;