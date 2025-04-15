import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import RequestForm from '../components/requests/RequestForm';

// Mock data for existing requests
const getMockRequests = () => {
  return [
    {
      id: 1,
      startDate: '2025-05-05',
      endDate: '2025-05-06',
      days: 2,
      reason: 'Family event',
      status: 'approved',
      createdAt: '2025-04-10T10:15:00Z',
      approvedAt: '2025-04-11T14:30:00Z',
      approverName: 'Sarah Wilson',
      comments: 'Approved'
    },
    {
      id: 2,
      startDate: '2025-04-28',
      endDate: '2025-04-28',
      days: 1,
      reason: 'Home internet installation',
      status: 'pending',
      createdAt: '2025-04-14T09:20:00Z'
    },
    {
      id: 3,
      startDate: '2025-04-01',
      endDate: '2025-04-01',
      days: 1,
      reason: 'Doctor appointment',
      status: 'rejected',
      createdAt: '2025-03-25T16:45:00Z',
      rejectedAt: '2025-03-26T11:15:00Z',
      approverName: 'Sarah Wilson',
      comments: 'Please reschedule for next week due to important meeting'
    }
  ];
};

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Simulate API call
    const fetchRequests = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        const data = getMockRequests();
        setRequests(data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNewRequest = () => {
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSubmit = (requestData) => {
    // In a real app, this would send the data to the backend
    // For demo purposes, we'll just add it to our local state
    const newRequest = {
      id: Date.now(), // Use timestamp as temporary ID
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setRequests([newRequest, ...requests]);
    setShowForm(false);
  };

  // Filter requests based on active tab
  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    return request.status === activeTab;
  });

  // Format date helper
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM d, yyyy');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Work From Home Requests
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleNewRequest}
        >
          New Request
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="All Requests" value="all" />
          <Tab label="Pending" value="pending" />
          <Tab label="Approved" value="approved" />
          <Tab label="Rejected" value="rejected" />
        </Tabs>
      </Paper>

      {filteredRequests.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No requests found
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {filteredRequests.map((request, index) => (
              <React.Fragment key={request.id}>
                <ListItem
                  sx={{
                    py: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' }
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {request.days} {request.days > 1 ? 'days' : 'day'} " 
                          <Typography component="span" sx={{ ml: 0.5 }}>
                            {formatDate(request.startDate)}
                            {request.startDate !== request.endDate && 
                              ` to ${formatDate(request.endDate)}`}
                          </Typography>
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Reason: {request.reason}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Requested on {format(new Date(request.createdAt), 'MMM d, yyyy')}
                          </Typography>
                        </>
                      }
                    />
                    
                    {request.status !== 'pending' && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          {request.status === 'approved' ? 'Approved by' : 'Rejected by'}: {request.approverName}
                        </Typography>
                        {request.comments && (
                          <Typography variant="body2" color="text.secondary">
                            Comments: {request.comments}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                  
                  <Chip
                    label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    color={
                      request.status === 'approved' ? 'success' :
                      request.status === 'pending' ? 'warning' : 'error'
                    }
                    sx={{ mt: { xs: 1, sm: 0 } }}
                  />
                </ListItem>
                {index < filteredRequests.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* New Request Form Dialog */}
      <RequestForm 
        open={showForm} 
        onClose={handleFormClose} 
        onSubmit={handleFormSubmit} 
      />
    </Box>
  );
};

export default Requests;