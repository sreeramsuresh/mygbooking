// frontend/src/pages/Admin/Reports.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Tabs,
  Tab,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Breadcrumbs,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarViewMonthIcon from "@mui/icons-material/CalendarViewMonth";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import AssignmentIcon from "@mui/icons-material/Assignment";

import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  parseISO,
} from "date-fns";
import reportService from "../../services/reportService";
import userService from "../../services/userService";

// Mock data for demonstration (replace with actual API calls in production)
const generateMockAttendanceData = () => {
  const mockData = [];
  const startDate = subMonths(new Date(), 1);

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    mockData.push({
      date: format(date, "yyyy-MM-dd"),
      day: format(date, "EEE"),
      total: Math.floor(Math.random() * 40) + 10,
      present: Math.floor(Math.random() * 30) + 5,
      absent: Math.floor(Math.random() * 10),
      wfh: Math.floor(Math.random() * 15),
    });
  }

  return mockData;
};

const generateMockComplianceData = () => {
  const departments = ["IT", "HR", "Finance", "Marketing", "Operations"];
  const mockData = [];

  for (const dept of departments) {
    mockData.push({
      department: dept,
      totalUsers: Math.floor(Math.random() * 30) + 5,
      compliant: Math.floor(Math.random() * 25) + 5,
      nonCompliant: Math.floor(Math.random() * 10),
      complianceRate: Math.floor(Math.random() * 30) + 70,
    });
  }

  return mockData;
};

const generateMockSeatUtilizationData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const mockData = [];

  for (const day of days) {
    mockData.push({
      day,
      total: 10,
      booked: Math.floor(Math.random() * 10) + 1,
      utilized: Math.floor(Math.random() * 8) + 1,
    });
  }

  return mockData;
};

const generateMockRequestsData = () => {
  const mockData = [];
  const startDate = subMonths(new Date(), 1);

  for (let i = 0; i < 15; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i * 2);

    mockData.push({
      date: format(date, "yyyy-MM-dd"),
      regularization: Math.floor(Math.random() * 5),
      wfh: Math.floor(Math.random() * 8),
      approved: Math.floor(Math.random() * 10),
      rejected: Math.floor(Math.random() * 3),
    });
  }

  return mockData;
};

const Reports = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);

  // Date filters
  const currentDate = new Date();
  const [startDate, setStartDate] = useState(
    startOfMonth(subMonths(currentDate, 1))
  );
  const [endDate, setEndDate] = useState(endOfMonth(currentDate));
  const [selectedMonth, setSelectedMonth] = useState(currentDate);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState("");

  // Report data
  const [attendanceData, setAttendanceData] = useState([]);
  const [seatUtilizationData, setSeatUtilizationData] = useState([]);
  const [complianceData, setComplianceData] = useState([]);
  const [requestsData, setRequestsData] = useState([]);

  // Fetch department list on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // In a real app, this would be an API call to get unique departments
        // For now, we'll use mock departments
        setDepartments([
          "IT",
          "HR",
          "Finance",
          "Marketing",
          "Operations",
          "Sales",
        ]);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch report data based on tab and filters
  const fetchReportData = async () => {
    setLoading(true);
    setError("");

    try {
      switch (tabValue) {
        case 0: // Attendance
          // In a real app, this would be an API call
          // For now, use mock data
          setAttendanceData(generateMockAttendanceData());
          break;

        case 1: // Compliance
          // In a real app, this would be an API call
          // For now, use mock data
          setComplianceData(generateMockComplianceData());
          break;

        case 2: // Seat Utilization
          // In a real app, this would be an API call
          // For now, use mock data
          setSeatUtilizationData(generateMockSeatUtilizationData());
          break;

        case 3: // Requests
          // In a real app, this would be an API call
          // For now, use mock data
          setRequestsData(generateMockRequestsData());
          break;

        default:
          break;
      }
    } catch (err) {
      setError("An error occurred while fetching report data");
      console.error("Fetch report error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when tab or filters change
  useEffect(() => {
    fetchReportData();
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleExport = (format = "csv") => {
    // In a real app, this would call the export API
    alert(`Exporting ${format.toUpperCase()} report`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container sx={{ mt: 4, mb: 8 }}>
        {/* Breadcrumbs Navigation */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          <Button
            component={RouterLink}
            to="/dashboard"
            startIcon={<HomeIcon />}
            size="small"
          >
            Dashboard
          </Button>
          <Typography color="text.primary">Reports</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4">Reports</Typography>

          <Box>
            <Tooltip title="Back to Dashboard">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outlined"
                startIcon={<DashboardIcon />}
                sx={{ mr: 1 }}
              >
                Dashboard
              </Button>
            </Tooltip>

            <Tooltip title="Refresh data">
              <IconButton onClick={fetchReportData} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Export CSV">
              <IconButton onClick={() => handleExport("csv")} sx={{ mr: 1 }}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Print report">
              <IconButton onClick={handlePrint}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Paper sx={{ mb: 3, overflow: "hidden" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="report type tabs"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              paddingBottom: 0, // Remove any padding below the tabs
            }}
          >
            <Tab
              label="Attendance"
              icon={<CalendarViewMonthIcon />}
              iconPosition="start"
              sx={{ paddingBottom: 0 }} // Remove padding for individual Tab elements
            />
            <Tab
              label="Compliance"
              icon={<AssessmentIcon />}
              iconPosition="start"
              sx={{ paddingBottom: 0 }}
            />
            <Tab
              label="Seat Utilization"
              icon={<EventSeatIcon />}
              iconPosition="start"
              sx={{ paddingBottom: 0 }}
            />
            <Tab
              label="Requests"
              icon={<AssignmentIcon />}
              iconPosition="start"
              sx={{ paddingBottom: 0 }}
            />
          </Tabs>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>

          <Grid container spacing={3}>
            {/* Date Range Filters for Attendance, Seat Utilization, Requests */}
            {(tabValue === 0 || tabValue === 2 || tabValue === 3) && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: { fullWidth: true, margin: "normal" },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: { fullWidth: true, margin: "normal" },
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Month Picker for Compliance */}
            {tabValue === 1 && (
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Month"
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  views={["year", "month"]}
                  format="MMMM yyyy"
                  slotProps={{
                    textField: { fullWidth: true, margin: "normal" },
                  }}
                />
              </Grid>
            )}

            {/* Department Filter for Attendance and Compliance */}
            {(tabValue === 0 || tabValue === 1) && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth margin="normal">
                  <InputLabel shrink htmlFor="departmentFilter">
                    Department
                  </InputLabel>
                  <Select
                    id="departmentFilter"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    label="Department"
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>All Departments</em>
                    </MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Request Type Filter */}
            {tabValue === 3 && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth margin="normal">
                  <InputLabel shrink htmlFor="requestTypeFilter">
                    Request Type
                  </InputLabel>
                  <Select
                    id="requestTypeFilter"
                    value={requestTypeFilter}
                    onChange={(e) => setRequestTypeFilter(e.target.value)}
                    label="Request Type"
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>All Requests</em>
                    </MenuItem>
                    <MenuItem value="regularization">Regularization</MenuItem>
                    <MenuItem value="wfh">Work From Home</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Button
                variant="contained"
                onClick={fetchReportData}
                disabled={loading}
                sx={{ mt: 2 }}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <RefreshIcon />
                }
              >
                {loading ? "Loading..." : "Generate Report"}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Empty State - No Data */}
            {((tabValue === 0 && attendanceData.length === 0) ||
              (tabValue === 1 && complianceData.length === 0) ||
              (tabValue === 2 && seatUtilizationData.length === 0) ||
              (tabValue === 3 && requestsData.length === 0)) && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" gutterBottom>
                  No report data available
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {tabValue === 0
                    ? "No attendance data available for the selected period."
                    : tabValue === 1
                    ? "No compliance data available for the selected month."
                    : tabValue === 2
                    ? "No seat utilization data available for the selected period."
                    : "No request data available for the selected period."}
                </Typography>
                <Button
                  variant="contained"
                  onClick={fetchReportData}
                  startIcon={<RefreshIcon />}
                >
                  Generate Report
                </Button>
              </Paper>
            )}
          </>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default Reports;
