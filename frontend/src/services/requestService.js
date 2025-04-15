import api from './api';

/**
 * Create a new WFH (Work From Home) request
 * @param {Object} requestData - Data for the request (start_date, end_date, reason)
 * @returns {Promise} - Promise resolving to the created request data
 */
export const createWFHRequest = async (requestData) => {
  try {
    const response = await api.post('/requests/wfh', requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating WFH request:', error);
    throw error;
  }
};

/**
 * Get all WFH requests for the authenticated user
 * @param {Object} params - Filter parameters (status, startDate, endDate)
 * @returns {Promise} - Promise resolving to the user's requests
 */
export const getUserWFHRequests = async (params = {}) => {
  try {
    const response = await api.get('/requests/wfh/user', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching user WFH requests:', error);
    throw error;
  }
};

/**
 * Get all pending WFH requests for a manager to approve
 * @returns {Promise} - Promise resolving to pending requests data
 */
export const getPendingWFHRequests = async () => {
  try {
    const response = await api.get('/requests/wfh/pending');
    return response.data;
  } catch (error) {
    console.error('Error fetching pending WFH requests:', error);
    throw error;
  }
};

/**
 * Approve a WFH request
 * @param {string} requestId - The ID of the request to approve
 * @param {string} comment - Optional comment for approval
 * @returns {Promise} - Promise resolving to the updated request data
 */
export const approveWFHRequest = async (requestId, comment = '') => {
  try {
    const response = await api.put(`/requests/wfh/${requestId}/approve`, { comment });
    return response.data;
  } catch (error) {
    console.error(`Error approving WFH request ${requestId}:`, error);
    throw error;
  }
};

/**
 * Reject a WFH request
 * @param {string} requestId - The ID of the request to reject
 * @param {string} reason - Required reason for rejection
 * @returns {Promise} - Promise resolving to the updated request data
 */
export const rejectWFHRequest = async (requestId, reason) => {
  try {
    const response = await api.put(`/requests/wfh/${requestId}/reject`, { reason });
    return response.data;
  } catch (error) {
    console.error(`Error rejecting WFH request ${requestId}:`, error);
    throw error;
  }
};

/**
 * Cancel a WFH request
 * @param {string} requestId - The ID of the request to cancel
 * @returns {Promise} - Promise resolving to the updated request data
 */
export const cancelWFHRequest = async (requestId) => {
  try {
    const response = await api.put(`/requests/wfh/${requestId}/cancel`);
    return response.data;
  } catch (error) {
    console.error(`Error canceling WFH request ${requestId}:`, error);
    throw error;
  }
};

// Default export for backward compatibility
const requestService = {
  createWFHRequest,
  getUserWFHRequests,
  getPendingWFHRequests,
  approveWFHRequest,
  rejectWFHRequest,
  cancelWFHRequest
};

export default requestService;