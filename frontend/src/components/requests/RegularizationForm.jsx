// frontend/src/components/requests/RegularizationForm.jsx
import React, { useState } from 'react';
import { Grid, Typography, Paper, TextField, Button, Box, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import requestService from '../../services/requestService';
import useAuth from '../../hooks/useAuth';

const RegularizationForm = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(null);
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!date) {
      setError('Please select a date');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await requestService.createRegularizationRequest(date, reason);
      
      if (response.success) {
        setSuccess(true);
        setDate(null);
        setReason('');
      } else {
        setError(response.message || 'Failed to submit the request');
      }
    } catch (err) {
      setError('An error occurred while submitting the request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Regularization Request
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Your regularization request has been submitted successfully!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DatePicker 
              label="Date for Regularization"
              value={date}
              onChange={(newDate) => {
                setDate(newDate);
                setSuccess(false);
              }}
              renderInput={(params) => <TextField {...params} required fullWidth />}
              disableFuture
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="reason"
              label="Reason for Regularization"
              name="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setSuccess(false);
              }}
              multiline
              rows={4}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default RegularizationForm;