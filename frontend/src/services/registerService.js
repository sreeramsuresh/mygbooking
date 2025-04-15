// A dedicated service just for registration
import axios from "axios";

// Try all possible ports - original API and our dedicated registration servers
const API_URLS = [
  "http://localhost:5005/api",  // New dedicated server with no DB dependency
  "http://localhost:5001/api",
  "http://localhost:5000/api"
];

export const registerUser = async (userData) => {
  console.log("Registering user with data:", {
    ...userData,
    password: userData.password ? "********" : undefined
  });
  
  const errors = [];
  
  // Try all API URLs and endpoints
  for (const apiUrl of API_URLS) {
    // Try the /register endpoint
    try {
      console.log(`Trying ${apiUrl}/auth/register...`);
      const response = await axios.post(`${apiUrl}/auth/register`, userData);
      console.log(`Registration successful with ${apiUrl}/auth/register`);
      return response.data;
    } catch (error) {
      const errorMsg = `${apiUrl}/auth/register failed: ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
    
    // Try the /signup endpoint
    try {
      console.log(`Trying ${apiUrl}/auth/signup...`);
      const response = await axios.post(`${apiUrl}/auth/signup`, userData);
      console.log(`Registration successful with ${apiUrl}/auth/signup`);
      return response.data;
    } catch (error) {
      const errorMsg = `${apiUrl}/auth/signup failed: ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
    
    // Try the /public-register endpoint
    try {
      console.log(`Trying ${apiUrl}/auth/public-register...`);
      const response = await axios.post(`${apiUrl}/auth/public-register`, userData);
      console.log(`Registration successful with ${apiUrl}/auth/public-register`);
      return response.data;
    } catch (error) {
      const errorMsg = `${apiUrl}/auth/public-register failed: ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }
  
  // If we get here, all attempts failed
  const errorMessage = "All registration attempts failed: " + errors.join("; ");
  console.error(errorMessage);
  throw new Error(errorMessage);
};