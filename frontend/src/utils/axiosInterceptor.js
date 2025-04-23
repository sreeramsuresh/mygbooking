// frontend/src/utils/axiosInterceptor.js
import axios from "axios";
import authService from "../services/authService";

// Create an axios instance
const axiosInstance = axios.create();

// Add a request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get user from localStorage
    const user = authService.getCurrentUser();

    if (user && user.accessToken) {
      // Check if the access token is expired
      if (authService.isTokenExpired(user.accessToken)) {
        console.log("Access token expired, attempting to refresh...");

        try {
          // Try to refresh the token
          const response = await authService.refreshToken(user.refreshToken);

          if (response.success) {
            // Token successfully refreshed, update the header
            config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          } else {
            // Refresh failed, force logout
            console.log("Token refresh failed, logging out...");
            await authService.logout();
            window.location.href = "/login?expired=true";
          }
        } catch (error) {
          console.error("Error refreshing token:", error);
          await authService.logout();
          window.location.href = "/login?expired=true";
        }
      } else {
        // Token is still valid, add it to the header
        config.headers.Authorization = `Bearer ${user.accessToken}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 Unauthorized and we haven't tried to refresh yet
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Mark this request as retried

      try {
        const user = authService.getCurrentUser();

        if (user && user.refreshToken) {
          // Try to refresh the token
          const response = await authService.refreshToken(user.refreshToken);

          if (response.success) {
            // Token refreshed successfully, retry the original request
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return axiosInstance(originalRequest);
          } else {
            // Refresh failed, force logout
            await authService.logout();
            window.location.href = "/login?expired=true";
          }
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        await authService.logout();
        window.location.href = "/login?expired=true";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
