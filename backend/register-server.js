// A simple Express server just for handling registration
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request received:', {
    ...req.body,
    password: req.body.password ? '********' : undefined
  });
  
  // Simple validation
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }
  
  // Return success response
  res.status(201).json({
    success: true,
    message: 'User registered successfully'
  });
});

// Same endpoint with another path
app.post('/api/auth/signup', (req, res) => {
  console.log('Signup request received:', {
    ...req.body,
    password: req.body.password ? '********' : undefined
  });
  
  // Simple validation
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }
  
  // Return success response
  res.status(201).json({
    success: true,
    message: 'User registered successfully'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Registration server running on port ${PORT}`);
});