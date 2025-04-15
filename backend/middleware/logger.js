// API request/response logger middleware
const apiLogger = (req, res, next) => {
  // Log the request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Request Headers:', req.headers);
  
  if (req.body && Object.keys(req.body).length > 0) {
    // Don't log passwords
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) {
      sanitizedBody.password = '********';
    }
    console.log('Request Body:', sanitizedBody);
  }
  
  // Capture the original send function
  const originalSend = res.send;
  
  // Override the send function to log the response
  res.send = function(body) {
    console.log(`[${new Date().toISOString()}] Response Status: ${res.statusCode}`);
    
    // Try to log the response body if it's JSON
    try {
      const responseBody = JSON.parse(body);
      console.log('Response Body:', responseBody);
    } catch (e) {
      // Not JSON or couldn't parse
      if (typeof body === 'string') {
        console.log(`Response Size: ${body.length} bytes`);
      }
    }
    
    // Call the original send function
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = { apiLogger };