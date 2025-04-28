// Test script for the attendance-history endpoint
const axios = require('axios');

// Admin credentials
const adminCredentials = {
  login: 'admin@example.com', // Try with the email instead of username
  password: 'Admin@123'
};

// Base URL for the API
const baseUrl = 'http://localhost:9600/api';

// Function to test the attendance history endpoint
async function testAttendanceHistoryEndpoint() {
  try {
    console.log('Attempting to sign in as admin...');
    
    // Step 1: Login to get the token
    const loginResponse = await axios.post(`${baseUrl}/auth/signin`, adminCredentials);
    
    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('Successfully logged in with token:', token.substring(0, 15) + '...');
    
    // Step 2: Call the attendance-history endpoint
    console.log('Calling attendance-history endpoint...');
    const historyResponse = await axios.get(`${baseUrl}/desktop/attendance-history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: 10,
        offset: 0
      }
    });
    
    // Step 3: Check the response
    console.log('Response status:', historyResponse.status);
    console.log('Response data:', JSON.stringify(historyResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status code:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAttendanceHistoryEndpoint();