import api from './api';

/**
 * Get all users (admin only)
 * @returns {Promise} - Promise resolving to users data
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get user by ID
 * @param {string} userId - The ID of the user to retrieve
 * @returns {Promise} - Promise resolving to user data
 */
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

/**
 * Create a new user (admin only)
 * @param {Object} userData - User data (username, email, password, first_name, last_name, role, etc.)
 * @returns {Promise} - Promise resolving to created user data
 */
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update a user (admin only)
 * @param {string} userId - The ID of the user to update
 * @param {Object} userData - Updated user data
 * @returns {Promise} - Promise resolving to updated user data
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

/**
 * Delete a user (admin only)
 * @param {string} userId - The ID of the user to delete
 * @returns {Promise} - Promise resolving to response data
 */
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get users by department (manager only)
 * @param {string} department - Department name to filter by
 * @returns {Promise} - Promise resolving to filtered users data
 */
export const getUsersByDepartment = async (department) => {
  try {
    const response = await api.get('/users/department', { params: { department } });
    return response;
  } catch (error) {
    console.error(`Error fetching users for department ${department}:`, error);
    throw error;
  }
};

/**
 * Update user's schedule (admin or self)
 * @param {string} userId - The ID of the user to update schedule for
 * @param {Array} scheduleDays - Array of day numbers (0-6) representing the user's schedule
 * @returns {Promise} - Promise resolving to updated schedule data
 */
export const updateUserSchedule = async (userId, scheduleDays) => {
  try {
    const response = await api.put(`/users/${userId}/schedule`, { scheduleDays });
    return response;
  } catch (error) {
    console.error(`Error updating schedule for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get team members for a manager
 * @returns {Promise} - Promise resolving to team members data
 */
export const getTeamMembers = async () => {
  try {
    const response = await api.get('/users/team');
    return response;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

// Default export
const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByDepartment,
  updateUserSchedule,
  getTeamMembers
};

export default userService;