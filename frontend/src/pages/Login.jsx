import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab,
  Alert
} from '@mui/material';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setMessage(null); // Clear messages on tab change
  };

  useEffect(() => {
    // Check for redirect message from query params
    const params = new URLSearchParams(location.search);
    const msg = params.get('message');
    if (msg) {
      setMessage(decodeURIComponent(msg));
    }
  }, [location]);

  // If already authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" />;
    } else if (user.role === 'manager') {
      return <Navigate to="/manager" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          MyGBooking
        </Typography>
        
        {message && (
          <Alert 
            severity="info" 
            sx={{ width: '100%', mb: 2 }}
            onClose={() => setMessage(null)}
          >
            {message}
          </Alert>
        )}
        
        <Paper sx={{ width: '100%', p: 3 }} elevation={3}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            sx={{ mb: 2 }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>
          
          {activeTab === 0 ? (
            <Login setMessage={setMessage} />
          ) : (
            <Register setActiveTab={setActiveTab} setMessage={setMessage} />
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;