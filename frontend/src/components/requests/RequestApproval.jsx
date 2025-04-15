import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  AccessTime as PendingIcon
} from '@mui/icons-material';

// Mock data for pending requests
const getPendingRequests = () => {
  return [
    {
      id: 1,
      employeeName: 'John Smith',
      employeeId: 'EMP1001',
      startDate: '2025-04-22',
      endDate: '2025-04-22',
      days: 1,
      reason: 'Medical appointment',
      status: 'pending',
      requestDate: '2025-04-15'
    },
    {
      id: 2,
      employeeName: 'Emily Davis',
      employeeId: 'EMP1004',
      startDate: '2025-04-18',
      endDate: '2025-04-21',
      days: 2,
      reason: 'Family emergency',
      status: 'pending',
      requestDate: '2025-04-14'
    },
    {
      id: 3,
      employeeName: 'Michael Brown',
      employeeId: 'EMP1005',
      startDate: '2025-04-24',
      endDate: '2025-04-25',
      days: 2,
      reason: 'Home repairs scheduled',
      status: 'pending',
      requestDate: '2025-04-16'
    },
    {
      id: 4,
      employeeName: 'Lisa Thomas',
      employeeId: 'EMP1010',
      startDate: '2025-04-29',
      endDate: '2025-04-30',
      days: 2,
      reason: 'Internet service installation at home',
      status: 'pending',
      requestDate: '2025-04-15'
    }
  ];
};

const RequestApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState('');
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Simulate API call
    const fetchRequests = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        const data = getPendingRequests();
        setRequests(data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleOpenDialog = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setComment('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRequest(null);
    setAction('');
    setComment('');
  };

  const handleActionSubmit = () => {
    // Process the approval/rejection
    const updatedRequests = requests.filter(req => req.id !== selectedRequest.id);
    setRequests(updatedRequests);
    
    // Show success message
    const actionText = action === 'approve' ? 'approved' : 'rejected';
    setSuccessMessage(`Request from ${selectedRequest.employeeName} has been ${actionText}`);
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
    
    handleCloseDialog();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Work From Home Requests
      </Typography>
      
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      )}
      
      {requests.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>
            No pending requests to review
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {requests.map((request, index) => (
              <React.Fragment key={request.id}>
                <ListItem 
                  sx={{ 
                    py: 2,
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' }
                  }}
                >
                  <Box sx={{ 
                    flexGrow: 1, 
                    width: { xs: '100%', md: 'auto' }
                  }}>
                    <ListItemText 
                      primary={
                        <Typography variant="subtitle1">
                          {request.employeeName} ({request.employeeId})
                        </Typography>
                      } 
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {request.days} {request.days > 1 ? 'days' : 'day'} " 
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                            {formatDate(request.startDate)}
                            {request.startDate !== request.endDate && 
                              ` to ${formatDate(request.endDate)}`}
                          </Typography>
                        </>
                      }
                    />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mt: 0.5, mb: { xs: 1, md: 0 } }}
                    >
                      Reason: {request.reason}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    width: { xs: '100%', md: 'auto' },
                    justifyContent: { xs: 'flex-end', md: 'flex-end' }
                  }}>
                    <Chip 
                      icon={<PendingIcon />} 
                      label="Pending" 
                      size="small" 
                      color="warning"
                      sx={{ mr: 1 }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      onClick={() => handleOpenDialog(request, 'reject')}
                    >
                      Reject
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      onClick={() => handleOpenDialog(request, 'approve')}
                    >
                      Approve
                    </Button>
                  </Box>
                </ListItem>
                {index < requests.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {action === 'approve' ? 'Approve Request' : 'Reject Request'}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <DialogContentText>
                {action === 'approve'
                  ? `Are you sure you want to approve the work from home request for ${selectedRequest.employeeName}?`
                  : `Are you sure you want to reject the work from home request for ${selectedRequest.employeeName}?`}
              </DialogContentText>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Request details:</strong>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Dates: {formatDate(selectedRequest.startDate)} 
                  {selectedRequest.startDate !== selectedRequest.endDate && 
                    ` to ${formatDate(selectedRequest.endDate)}`}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Reason: {selectedRequest.reason}
                </Typography>
              </Box>
              <TextField
                margin="dense"
                label={action === 'approve' ? "Comments (optional)" : "Reason for rejection"}
                fullWidth
                multiline
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required={action === 'reject'}
                error={action === 'reject' && !comment}
                helperText={action === 'reject' && !comment ? "Please provide a reason for rejection" : ""}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleActionSubmit} 
            variant="contained" 
            color={action === 'approve' ? 'success' : 'error'}
            disabled={action === 'reject' && !comment}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestApproval;