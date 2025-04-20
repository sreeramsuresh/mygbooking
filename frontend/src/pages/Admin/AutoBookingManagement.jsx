import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, CircularProgress, 
  Alert, AlertTitle, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config';

const AutoBookingManagement = () => {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [forceResults, setForceResults] = useState(null);
  const [prefResults, setPrefResults] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Load debug data on page load
  useEffect(() => {
    fetchDebugData();
  }, []);

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/bookings/debug-auto-booking`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDebugData(response.data.data);
      setSuccess('Auto-booking data loaded successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load auto-booking debug data');
      console.error('Error fetching debug data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (action) => {
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const getConfirmMessage = () => {
    switch (confirmAction) {
      case 'force-booking':
        return 'Are you sure you want to force auto-booking for all users? This will create bookings for all eligible users.';
      case 'update-preferences':
        return 'Are you sure you want to update user preferences? This will set the work day preferences for all users based on the predefined list.';
      case 'update-and-book':
        return 'Are you sure you want to update user preferences AND run auto-booking? This will set the work day preferences for all users and then create bookings for them.';
      default:
        return 'Are you sure you want to continue?';
    }
  };

  const handleConfirm = async () => {
    closeConfirmDialog();
    
    switch (confirmAction) {
      case 'force-booking':
        await triggerForceAutoBooking();
        break;
      case 'update-preferences':
        await updateUserPreferences(false);
        break;
      case 'update-and-book':
        await updateUserPreferences(true);
        break;
      default:
        break;
    }
  };

  const triggerForceAutoBooking = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setForceResults(null);
    
    try {
      const response = await axios.post(`${API_URL}/bookings/force-auto-booking`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setForceResults(response.data.data);
      setSuccess(`Force auto-booking completed: ${response.data.data.successful} successful, ${response.data.data.failed} failed, ${response.data.data.skipped} skipped`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to force auto-booking');
      console.error('Error forcing auto-booking:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserPreferences = async (runAutoBooking = false) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPrefResults(null);
    
    try {
      const response = await axios.post(`${API_URL}/users/update-preferences`, { 
        runAutoBooking 
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setPrefResults(response.data.data);
      
      if (runAutoBooking) {
        setSuccess(`User preferences updated (${response.data.data.preferencesUpdated} success, ${response.data.data.preferencesFailed} failed) and auto-booking completed (${response.data.data.bookingsCreated} created, ${response.data.data.bookingsFailed} failed, ${response.data.data.bookingsSkipped} skipped)`);
      } else {
        setSuccess(`User preferences updated: ${response.data.data.updated} successful, ${response.data.data.failed} failed`);
      }
      
      // Refresh the debug data
      await fetchDebugData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user preferences');
      console.error('Error updating user preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDays = (days) => {
    if (!days || !Array.isArray(days)) return 'None';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Auto-Booking Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>Success</AlertTitle>
          {success}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={fetchDebugData}
            disabled={loading}
          >
            Refresh Debug Data
          </Button>
          
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={() => openConfirmDialog('force-booking')}
            disabled={loading}
          >
            Force Auto-Booking for All Users
          </Button>
          
          <Button 
            variant="contained" 
            color="warning" 
            onClick={() => openConfirmDialog('update-preferences')}
            disabled={loading}
          >
            Update User Preferences
          </Button>
          
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => openConfirmDialog('update-and-book')}
            disabled={loading}
          >
            Update Preferences & Run Auto-Booking
          </Button>
        </Box>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          Note: Admin users are excluded from auto-booking. Only regular employees and managers will receive auto-bookings.
        </Alert>
      </Box>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={closeConfirmDialog}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {getConfirmMessage()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirm} color="secondary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {debugData && (
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6">Auto-Booking Summary</Typography>
            <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Users</Typography>
                <Typography variant="h5">{debugData.totalUsers}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Eligible for Auto-Booking</Typography>
                <Typography variant="h5">{debugData.eligibleForAutoBooking}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Not Eligible</Typography>
                <Typography variant="h5">{debugData.totalUsers - debugData.eligibleForAutoBooking}</Typography>
              </Box>
            </Box>
          </Paper>
          
          <Typography variant="h6" gutterBottom>
            User Preferences
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Default Work Days</TableCell>
                  <TableCell>Required Days/Week</TableCell>
                  <TableCell>Auto-Booking Eligible</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {debugData.userPreferences.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>
                      {user.isActive ? 
                        <Chip size="small" label="Active" color="success" /> : 
                        <Chip size="small" label="Inactive" color="error" />
                      }
                    </TableCell>
                    <TableCell>{formatDays(user.defaultWorkDays)}</TableCell>
                    <TableCell>{user.requiredDaysPerWeek || 'None'}</TableCell>
                    <TableCell>
                      {user.preferences.isEligibleForAutoBooking ? 
                        <Chip size="small" label="Yes" color="success" /> : 
                        <Chip size="small" label="No" color="error" />
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      
      {prefResults && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            User Preference Update Results
          </Typography>
          
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Updated</Typography>
                <Typography variant="h5" color="success.main">{prefResults.updated || prefResults.preferencesUpdated || 0}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Failed</Typography>
                <Typography variant="h5" color="error.main">{prefResults.failed || prefResults.preferencesFailed || 0}</Typography>
              </Box>
              {prefResults.bookingsCreated !== undefined && (
                <>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Bookings Created</Typography>
                    <Typography variant="h5" color="success.main">{prefResults.bookingsCreated}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Bookings Failed</Typography>
                    <Typography variant="h5" color="error.main">{prefResults.bookingsFailed}</Typography>
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Box>
      )}
        
      {forceResults && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Force Auto-Booking Results
          </Typography>
          
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Successful</Typography>
                <Typography variant="h5" color="success.main">{forceResults.successful}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Failed</Typography>
                <Typography variant="h5" color="error.main">{forceResults.failed}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Skipped</Typography>
                <Typography variant="h5" color="text.secondary">{forceResults.skipped}</Typography>
              </Box>
            </Box>
          </Paper>
          
          {forceResults.details.success.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Successful Auto-Bookings
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User ID</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Bookings Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {forceResults.details.success.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.userId}</TableCell>
                        <TableCell>{item.username}</TableCell>
                        <TableCell>{item.bookingsCreated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          
          {forceResults.details.failed.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Failed Auto-Bookings
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User ID</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {forceResults.details.failed.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.userId}</TableCell>
                        <TableCell>{item.username}</TableCell>
                        <TableCell>{item.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          
          {forceResults.details.skipped.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Skipped Users
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User ID</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {forceResults.details.skipped.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.userId}</TableCell>
                        <TableCell>{item.username}</TableCell>
                        <TableCell>{item.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AutoBookingManagement;