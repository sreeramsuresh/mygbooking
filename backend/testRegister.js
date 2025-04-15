// Test script for registration
const axios = require('axios');

const testRegistration = async () => {
  try {
    console.log('Testing registration endpoint...');
    
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'password123',
      department: 'Engineering',
      employeeId: 'TEST001'
    };
    
    console.log('Sending data:', userData);
    
    const response = await axios.post('http://localhost:5000/api/auth/signup', userData);
    
    console.log('Registration successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Registration failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
  }
};

// Run the test
testRegistration();