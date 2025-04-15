import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { format, addDays, startOfWeek, endOfWeek, isToday, isWithinInterval } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';

// Mock data for schedule
const getScheduleData = (userId) => {
  // This would normally be fetched from an API
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const end = endOfWeek(today, { weekStartsOn: 0 }); // Saturday
  
  // Sample office day schedule (user is assigned Monday, Wednesday, Friday)
  const officeDays = [1, 3, 5]; // 0 = Sunday, 1 = Monday, etc.
  
  // Generate schedule for current week
  const schedule = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const dayOfWeek = date.getDay();
    
    // Set status based on day
    let status = 'unscheduled';
    if (officeDays.includes(dayOfWeek)) {
      status = 'office';
      
      // Randomly set some days as WFH for sample data variety
      if ((dayOfWeek === 1 && userId % 2 === 0) || (dayOfWeek === 3 && userId % 3 === 0)) {
        status = 'wfh';
      }
    }
    
    // Set past office days as either checked-in or missed
    if (status === 'office' && date < today && !isToday(date)) {
      status = Math.random() > 0.2 ? 'checked-in' : 'missed';
    }
    
    schedule.push({
      date: date,
      dayOfWeek: dayOfWeek,
      formattedDate: format(date, 'EEE, MMM d'),
      status: status
    });
  }
  
  return {
    currentWeek: schedule,
    requiredDays: 3,
    completedDays: schedule.filter(day => day.status === 'checked-in').length,
    pendingDays: schedule.filter(day => day.status === 'office' && (isToday(day.date) || day.date > today)).length,
    isTodayOffice: schedule.some(day => isToday(day.date) && (day.status === 'office' || day.status === 'checked-in'))
  };
};

// Get upcoming bookings data
const getUpcomingBookings = () => {
  const today = new Date();
  const nextTwoWeeks = addDays(today, 14);
  
  return [
    {
      id: 1,
      date: addDays(today, 2),
      formattedDate: format(addDays(today, 2), 'EEE, MMM d'),
      seatNumber: 7,
      status: 'confirmed'
    },
    {
      id: 2,
      date: addDays(today, 4),
      formattedDate: format(addDays(today, 4), 'EEE, MMM d'),
      seatNumber: 3,
      status: 'confirmed'
    },
    {
      id: 3,
      date: addDays(today, 7),
      formattedDate: format(addDays(today, 7), 'EEE, MMM d'),
      seatNumber: 5,
      status: 'pending'
    }
  ];
};

const ViewSchedule = ({ tab = 'schedule' }) => {
  const [activeTab, setActiveTab] = useState(tab);
  const [schedule, setSchedule] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate API calls to fetch data
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, these would be API calls
        const scheduleData = getScheduleData(user?.id || 1);
        const bookingsData = getUpcomingBookings();
        
        setSchedule(scheduleData);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
      <Typography variant="h4" gutterBottom>
        My Schedule
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Schedule" value="schedule" />
          <Tab label="Dashboard" value="dashboard" />
        </Tabs>
      </Paper>
      
      {activeTab === 'dashboard' ? (
        <EmployeeDashboard />
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Weekly Stats */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" component="div">
                    {schedule?.requiredDays || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Required Days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" component="div">
                    {schedule?.completedDays || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" component="div">
                    {schedule?.pendingDays || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" component="div" color={
                    (schedule?.completedDays || 0) >= (schedule?.requiredDays || 0) 
                      ? 'success.main' 
                      : 'warning.main'
                  }>
                    {schedule?.isTodayOffice ? 'YES' : 'NO'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Office Today
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Weekly Schedule */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  This Week's Schedule
                </Typography>
                
                <List>
                  {schedule?.currentWeek.map((day, index) => (
                    <React.Fragment key={day.formattedDate}>
                      <ListItem>
                        <ListItemText 
                          primary={day.formattedDate} 
                          secondary={isToday(day.date) ? 'Today' : ''} 
                          primaryTypographyProps={{
                            fontWeight: isToday(day.date) ? 'bold' : 'normal'
                          }}
                        />
                        {getStatusChip(day.status)}
                      </ListItem>
                      {index < schedule.currentWeek.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
            
            {/* Upcoming Bookings */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Upcoming Bookings
                </Typography>
                
                {bookings.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No upcoming bookings found
                  </Typography>
                ) : (
                  <List>
                    {bookings.map((booking, index) => (
                      <React.Fragment key={booking.id}>
                        <ListItem>
                          <ListItemText 
                            primary={booking.formattedDate} 
                            secondary={`Seat #${booking.seatNumber}`}
                          />
                          <Chip 
                            label={booking.status === 'confirmed' ? 'Confirmed' : 'Pending'} 
                            size="small"
                            color={booking.status === 'confirmed' ? 'success' : 'warning'}
                          />
                        </ListItem>
                        {index < bookings.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

// Helper function to display status chip
const getStatusChip = (status) => {
  switch (status) {
    case 'office':
      return <Chip label="Office" size="small" color="primary" />;
    case 'wfh':
      return <Chip label="WFH" size="small" color="info" />;
    case 'checked-in':
      return <Chip label="Checked In" size="small" color="success" />;
    case 'missed':
      return <Chip label="Missed" size="small" color="error" />;
    default:
      return <Chip label="Unscheduled" size="small" />;
  }
};

export default ViewSchedule;