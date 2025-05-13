// frontend/src/utils/auth.js

/**
 * Get auth token from local storage
 * @returns {string|null} The auth token or null if not found
 */
export const getAuthToken = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    return user.accessToken || null;
  } catch (error) {
    console.error("Error retrieving auth token:", error);
    return null;
  }
};

/**
 * Get current user from local storage
 * @returns {Object|null} The user object or null if not found
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error retrieving user data:", error);
    return null;
  }
};

/**
 * Check if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Check if user has a specific role
 * @param {string} role - The role to check (admin, manager, employee)
 * @returns {boolean} True if the user has the role, false otherwise
 */
export const hasRole = (role) => {
  const user = getCurrentUser();
  if (!user || !user.roles) return false;

  return user.roles.includes(`ROLE_${role.toUpperCase()}`);
};

/**
 * Set auth header for axios requests
 * @param {Object} axiosInstance - The axios instance
 * @returns {Object} The axios instance with auth header set
 */
export const setAuthHeader = (axiosInstance) => {
  const token = getAuthToken();
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
  return axiosInstance;
};

/**
 * Check if token is expired
 * Note: This is a simple check based on JWT structure. For more secure applications,
 * use a library like jwt-decode to properly decode the token.
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    // Split the token and get the payload
    const payload = token.split(".")[1];
    const decodedPayload = JSON.parse(atob(payload));

    // Check expiration
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedPayload.exp < currentTime;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true;
  }
};

/**
 * Handle authentication errors (like expired tokens)
 * @param {Object} error - The error object
 * @param {Function} logoutFn - Logout function to call if needed
 * @returns {Object} The original error
 */
export const handleAuthError = (error, logoutFn) => {
  if (error.response && error.response.status === 401) {
    // Token might be expired or invalid
    if (isAuthenticated()) {
      // If we thought we were authenticated but got 401,
      // the token is probably invalid, so log out
      logoutFn();
      window.location.href = "/login?expired=true";
    }
  }
  return error;
};

/**
 * Create a URL with authentication token as query parameter
 * Note: This should be used with caution, as it exposes the token in the URL
 * @param {string} url - The URL to add token to
 * @returns {string} URL with token parameter
 */
export const createAuthenticatedUrl = (url) => {
  const token = getAuthToken();
  if (!token) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${token}`;
};
