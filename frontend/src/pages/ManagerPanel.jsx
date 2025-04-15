import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Button,
  Alert
} from '@mui/material';
import { 
  PersonAdd, 
  CheckCircle, 
  Cancel,
  Warning
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Components
import ComplianceTable from '../components/dashboard/ComplianceTable';
import AttendanceChart from '../components/dashboard/AttendanceChart';
import RequestApproval from '../components/requests/RequestApproval';

// Mock data
const getTeamStats = () => {
  return {
    teamSize: 12,
    presentToday: 8,
    workingRemote: 3,
    onLeave: 1,
    complianceRate: 91,
    pendingRequests: 4
  };
};

const getTeamMembers = () => {
  return [
    { id: 1, name: 'John Smith', status: 'in_office', checkedIn: true },
    { id: 2, name: 'Alice Johnson', status: 'wfh', checkedIn: true },
    { id: 3, name: 'Bob Williams', status: 'in_office', checkedIn: true },
    { id: 4, name: 'Emily Davis', status: 'in_office', checkedIn: false },
    { id: 5, name: 'Michael Brown', status: 'wfh', checkedIn: true },
    { id: 6, name: 'Sarah Wilson', status: 'in_office', checkedIn: true },
    { id: 7, name: 'James Taylor', status: 'on_leave', checkedIn: false },
    { id: 8, name: 'Jennifer Miller', status: 'in_office', checkedIn: true },
    { id: 9, name: 'David Anderson', status: 'wfh', checkedIn: true },
    { id: 10, name: 'Lisa Thomas', status: 'in_office', checkedIn: false },
    { id: 11, name: 'Robert Jackson', status: 'in_office', checkedIn: true },
    { id: 12, name: 'Jessica White', status: 'in_office', checkedIn: true }
  ];
};

const ManagerPanel = ({ tab = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState(tab);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, these would be API calls
        const statsData = getTeamStats();
        const teamData = getTeamMembers();
        
        setStats(statsData);
        setTeamMembers(teamData);
      } catch (error) {
        console.error('Error fetching manager data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/manager${newValue === 'dashboard' ? '' : `/${newValue}`}`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'teams':
        return <TeamManagement teamMembers={teamMembers} loading={loading} />;
      case 'approval':
        return <RequestApproval />;
      case 'reports':
        return <ReportsPanel />;
      case 'dashboard':
      default:
        return <DashboardPanel stats={stats} teamMembers={teamMembers} loading={loading} />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Manager Dashboard
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Dashboard" value="dashboard" />
          <Tab label="Team Management" value="teams" />
          <Tab label="Request Approvals" value="approval" />
          <Tab label="Reports" value="reports" />
        </Tabs>
      </Paper>
      
      {renderTabContent()}
    </Box>
  );
};

// Dashboard Panel Component
const DashboardPanel = ({ stats, teamMembers, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    { title: 'Team Size', value: stats?.teamSize || 0 },
    { title: 'Present Today', value: stats?.presentToday || 0 },
    { title: 'Working Remote', value: stats?.workingRemote || 0 },
    { title: 'On Leave', value: stats?.onLeave || 0 },
    { title: 'Compliance Rate', value: `${stats?.complianceRate || 0}%` }
  ];

  // Get team members who aren't checked in
  const notCheckedIn = teamMembers.filter(
    member => member.status === 'in_office' && !member.checkedIn
  );

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" component="div">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {stats?.pendingRequests > 0 && (
          <Grid item xs={12}>
            <Alert 
              severity="info" 
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={() => navigate('/manager/approval')}
                >
                  REVIEW
                </Button>
              }
            >
              You have {stats.pendingRequests} pending work from home requests that need your approval
            </Alert>
          </Grid>
        )}

        {notCheckedIn.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="warning">
              {notCheckedIn.length} team member{notCheckedIn.length > 1 ? 's' : ''} scheduled for office today {notCheckedIn.length > 1 ? 'have' : 'has'} not checked in yet
            </Alert>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <AttendanceChart teamId="my-team" />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Today's Team Status
            </Typography>
            
            <List>
              {teamMembers.slice(0, 6).map((member, index) => (
                <React.Fragment key={member.id}>
                  <ListItem>
                    <ListItemText 
                      primary={member.name} 
                      secondary={getStatusText(member.status)}
                    />
                    {getStatusChip(member)}
                  </ListItem>
                  {index < 5 && <Divider />}
                </React.Fragment>
              ))}
              {teamMembers.length > 6 && (
                <ListItem button onClick={() => navigate('/manager/teams')}>
                  <ListItemText primary={`View all ${teamMembers.length} team members`} />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <ComplianceTable />
        </Grid>
      </Grid>
    </>
  );
};

// Team Management Panel
const TeamManagement = ({ teamMembers, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Team Members
        </Typography>
        <Button variant="contained" startIcon={<PersonAdd />}>
          Add Team Member
        </Button>
      </Box>
      
      <Paper>
        <List>
          {teamMembers.map((member, index) => (
            <React.Fragment key={member.id}>
              <ListItem sx={{ py: 1.5 }}>
                <ListItemText 
                  primary={member.name} 
                  secondary={getStatusText(member.status)}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {getStatusChip(member)}
                  <Button size="small" variant="outlined">
                    Details
                  </Button>
                </Box>
              </ListItem>
              {index < teamMembers.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

// Reports Panel Component
const ReportsPanel = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Team Reports
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This section will contain team-specific reports including:
        </Typography>
        <ul>
          <li>Attendance trends</li>
          <li>Compliance statistics</li>
          <li>WFH request patterns</li>
          <li>Team productivity metrics</li>
        </ul>
      </Paper>
    </Box>
  );
};

// Helper functions
const getStatusText = (status) => {
  switch (status) {
    case 'in_office':
      return 'In Office Today';
    case 'wfh':
      return 'Working From Home';
    case 'on_leave':
      return 'On Leave';
    default:
      return 'Unknown';
  }
};

const getStatusChip = (member) => {
  let color = 'default';
  let icon = null;
  let label = 'Unknown';

  if (member.status === 'in_office') {
    if (member.checkedIn) {
      color = 'success';
      icon = <CheckCircle fontSize="small" />;
      label = 'Checked In';
    } else {
      color = 'warning';
      icon = <Warning fontSize="small" />;
      label = 'Not Checked In';
    }
  } else if (member.status === 'wfh') {
    color = 'info';
    label = 'WFH';
  } else if (member.status === 'on_leave') {
    color = 'default';
    label = 'Leave';
  }

  return (
    <Chip 
      size="small" 
      color={color} 
      label={label} 
      icon={icon} 
    />
  );
};

export default ManagerPanel;