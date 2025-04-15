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
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Admin Components
import UserManagement from '../components/admin/UserManagement';
import ScheduleManagement from '../components/admin/ScheduleManagement';
import ComplianceTable from '../components/dashboard/ComplianceTable';
import AttendanceChart from '../components/dashboard/AttendanceChart';

// Mock data
const getOverviewStats = () => {
  return {
    totalUsers: 42,
    activeUsers: 38,
    complianceRate: 89,
    pendingRequests: 6,
    capacityUtilization: 78
  };
};

const AdminPanel = ({ tab = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState(tab);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        const data = getOverviewStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/admin${newValue === 'dashboard' ? '' : `/${newValue}`}`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'schedules':
        return <ScheduleManagement />;
      case 'reports':
        return <ReportsPanel />;
      case 'settings':
        return <SettingsPanel />;
      case 'dashboard':
      default:
        return <DashboardPanel stats={stats} loading={loading} />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Admin Panel
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
          <Tab label="User Management" value="users" />
          <Tab label="Schedule Management" value="schedules" />
          <Tab label="Reports" value="reports" />
          <Tab label="Settings" value="settings" />
        </Tabs>
      </Paper>
      
      {renderTabContent()}
    </Box>
  );
};

// Dashboard Panel Component
const DashboardPanel = ({ stats, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0 },
    { title: 'Active Users', value: stats?.activeUsers || 0 },
    { title: 'Compliance Rate', value: `${stats?.complianceRate || 0}%` },
    { title: 'Pending Requests', value: stats?.pendingRequests || 0 },
    { title: 'Capacity Utilization', value: `${stats?.capacityUtilization || 0}%` }
  ];

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
        <Grid item xs={12} md={6}>
          <AttendanceChart />
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Important Notifications
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              6 employees are not meeting office attendance requirements
            </Alert>
            <Alert severity="info" sx={{ mb: 2 }}>
              New department schedules will take effect next week
            </Alert>
            <Alert severity="success">
              Office capacity utilization has improved by 12% this month
            </Alert>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <ComplianceTable />
        </Grid>
      </Grid>
    </>
  );
};

// Reports Panel Component
const ReportsPanel = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Reports
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This section will contain various reports including:
        </Typography>
        <ul>
          <li>Attendance reports by department</li>
          <li>Compliance reports</li>
          <li>WFH request statistics</li>
          <li>Office capacity utilization</li>
          <li>Trending analytics</li>
        </ul>
      </Paper>
    </Box>
  );
};

// Settings Panel Component
const SettingsPanel = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        System Settings
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This section will contain system settings including:
        </Typography>
        <ul>
          <li>Office capacity configuration</li>
          <li>Minimum attendance requirements</li>
          <li>Email notification settings</li>
          <li>System preferences</li>
          <li>Backup and restore options</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default AdminPanel;