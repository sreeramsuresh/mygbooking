// frontend/src/components/dashboard/ManagerDashboard.jsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Paper, Tabs, Tab, Button } from "@mui/material";
import {
  PersonOff as PersonOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

import AttendanceChart from "./AttendanceChart";
import ComplianceTable from "./ComplianceTable";
import { scheduleService, bookingService } from "../../services";

const ManagerDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({
    totalEmployees: 0,
    compliant: 0,
    nonCompliant: 0,
    pending: 0,
  });
  const [dailyBookings, setDailyBookings] = useState([]);
  const [complianceData, setComplianceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch weekly compliance stats
        const statsResponse = await scheduleService.getWeeklyComplianceStats();
        setWeeklyStats(statsResponse.data);

        // Fetch daily bookings for the week
        const bookingsResponse = await bookingService.getCurrentWeekBookings();
        setDailyBookings(bookingsResponse.data);

        // Fetch employee compliance data
        const complianceResponse =
          await scheduleService.getEmployeeCompliance();
        setComplianceData(complianceResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manager Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "primary.light",
            }}
          >
            <Typography variant="h6">Total Employees</Typography>
            <Typography variant="h3">{weeklyStats.totalEmployees}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "success.light",
            }}
          >
            <Typography variant="h6">Compliant</Typography>
            <Typography variant="h3">{weeklyStats.compliant}</Typography>
            <CheckCircleIcon color="success" />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "error.light",
            }}
          >
            <Typography variant="h6">Non-Compliant</Typography>
            <Typography variant="h3">{weeklyStats.nonCompliant}</Typography>
            <PersonOffIcon color="error" />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "warning.light",
            }}
          >
            <Typography variant="h6">Pending</Typography>
            <Typography variant="h3">{weeklyStats.pending}</Typography>
            <WarningIcon color="warning" />
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Weekly Overview" />
          <Tab label="Daily Attendance" />
          <Tab label="Compliance Reports" />
          <Tab label="Pending Approvals" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Weekly Attendance
              </Typography>
              <AttendanceChart data={dailyBookings} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Seating Capacity Usage
              </Typography>
              {/* Seating capacity visualization component would go here */}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Employee Compliance</Typography>
            <Button variant="contained" color="primary">
              Export Report
            </Button>
          </Box>
          <ComplianceTable data={complianceData} />
        </Paper>
      )}
    </Box>
  );
};

export default ManagerDashboard;
