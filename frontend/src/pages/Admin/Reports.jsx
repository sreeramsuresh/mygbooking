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
} from "@mui/material";
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

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="report type tabs"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              label="Attendance"
              icon={<CalendarViewMonthIcon />}
              iconPosition="start"
            />
            <Tab
              label="Compliance"
              icon={<AssessmentIcon />}
              iconPosition="start"
            />
            <Tab
              label="Seat Utilization"
              icon={<EventSeatIcon />}
              iconPosition="start"
            />
            <Tab
              label="Requests"
              icon={<AssignmentIcon />}
              iconPosition="start"
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
                  <InputLabel>Department</InputLabel>
                  <Select
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
                  <InputLabel>Request Type</InputLabel>
                  <Select
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
            {/* Attendance Report */}
            {tabValue === 0 && attendanceData.length > 0 && (
              <Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {/* Summary Cards */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Total Employees
                        </Typography>
                        <Typography variant="h4">
                          {attendanceData[0]?.total || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Avg. Daily Attendance
                        </Typography>
                        <Typography variant="h4">
                          {Math.round(
                            attendanceData.reduce(
                              (sum, day) => sum + day.present,
                              0
                            ) / attendanceData.length
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Avg. WFH Requests
                        </Typography>
                        <Typography variant="h4">
                          {Math.round(
                            attendanceData.reduce(
                              (sum, day) => sum + day.wfh,
                              0
                            ) / attendanceData.length
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Attendance Rate
                        </Typography>
                        <Typography variant="h4">
                          {Math.round(
                            (attendanceData.reduce(
                              (sum, day) => sum + day.present,
                              0
                            ) /
                              attendanceData.reduce(
                                (sum, day) => sum + day.total,
                                0
                              )) *
                              100
                          )}
                          %
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Chart */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Daily Attendance Trend
                  </Typography>

                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={attendanceData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="present"
                          name="In Office"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="wfh"
                          name="WFH"
                          stroke="#82ca9d"
                        />
                        <Line
                          type="monotone"
                          dataKey="absent"
                          name="Absent"
                          stroke="#ff7300"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                {/* Data Table */}
                <Paper>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Day</TableCell>
                          <TableCell align="right">Total Employees</TableCell>
                          <TableCell align="right">In Office</TableCell>
                          <TableCell align="right">WFH</TableCell>
                          <TableCell align="right">Absent</TableCell>
                          <TableCell align="right">Attendance %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendanceData.map((row) => (
                          <TableRow key={row.date}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.day}</TableCell>
                            <TableCell align="right">{row.total}</TableCell>
                            <TableCell align="right">{row.present}</TableCell>
                            <TableCell align="right">{row.wfh}</TableCell>
                            <TableCell align="right">{row.absent}</TableCell>
                            <TableCell align="right">
                              {Math.round((row.present / row.total) * 100)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            )}

            {/* Compliance Report */}
            {tabValue === 1 && complianceData.length > 0 && (
              <Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {/* Summary Cards */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Total Employees
                        </Typography>
                        <Typography variant="h4">
                          {complianceData.reduce(
                            (sum, dept) => sum + dept.totalUsers,
                            0
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Compliant Employees
                        </Typography>
                        <Typography variant="h4">
                          {complianceData.reduce(
                            (sum, dept) => sum + dept.compliant,
                            0
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Non-Compliant Employees
                        </Typography>
                        <Typography variant="h4">
                          {complianceData.reduce(
                            (sum, dept) => sum + dept.nonCompliant,
                            0
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Overall Compliance Rate
                        </Typography>
                        <Typography variant="h4">
                          {Math.round(
                            (complianceData.reduce(
                              (sum, dept) => sum + dept.compliant,
                              0
                            ) /
                              complianceData.reduce(
                                (sum, dept) => sum + dept.totalUsers,
                                0
                              )) *
                              100
                          )}
                          %
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Chart */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Compliance by Department
                  </Typography>

                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={complianceData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Bar
                          dataKey="compliant"
                          name="Compliant"
                          stackId="a"
                          fill="#82ca9d"
                        />
                        <Bar
                          dataKey="nonCompliant"
                          name="Non-Compliant"
                          stackId="a"
                          fill="#ff7300"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                {/* Data Table */}
                <Paper>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Department</TableCell>
                          <TableCell align="right">Total Employees</TableCell>
                          <TableCell align="right">Compliant</TableCell>
                          <TableCell align="right">Non-Compliant</TableCell>
                          <TableCell align="right">Compliance Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {complianceData.map((row) => (
                          <TableRow key={row.department}>
                            <TableCell>{row.department}</TableCell>
                            <TableCell align="right">
                              {row.totalUsers}
                            </TableCell>
                            <TableCell align="right">{row.compliant}</TableCell>
                            <TableCell align="right">
                              {row.nonCompliant}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${row.complianceRate}%`}
                                color={
                                  row.complianceRate >= 80
                                    ? "success"
                                    : row.complianceRate >= 60
                                    ? "warning"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            )}

            {/* Seat Utilization Report */}
            {tabValue === 2 && seatUtilizationData.length > 0 && (
              <Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {/* Summary Cards */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Total Seats
                        </Typography>
                        <Typography variant="h4">
                          {seatUtilizationData[0]?.total || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Avg. Daily Bookings
                        </Typography>
                        <Typography variant="h4">
                          {Math.round(
                            seatUtilizationData.reduce(
                              (sum, day) => sum + day.booked,
                              0
                            ) / seatUtilizationData.length
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Avg. Daily Utilization
                        </Typography>
                        <Typography variant="h4">
                          {Math.round(
                            seatUtilizationData.reduce(
                              (sum, day) => sum + day.utilized,
                              0
                            ) / seatUtilizationData.length
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Utilization Rate
                        </Typography>
                        <Typography variant="h4">
                          {Math.round(
                            (seatUtilizationData.reduce(
                              (sum, day) => sum + day.utilized,
                              0
                            ) /
                              (seatUtilizationData.reduce(
                                (sum, day) => sum + day.total,
                                0
                              ) *
                                seatUtilizationData.length)) *
                              100
                          )}
                          %
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Chart */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Daily Seat Utilization
                  </Typography>

                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={seatUtilizationData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="booked" name="Booked" fill="#8884d8" />
                        <Bar
                          dataKey="utilized"
                          name="Utilized"
                          fill="#82ca9d"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                {/* Data Table */}
                <Paper>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Day</TableCell>
                          <TableCell align="right">Total Seats</TableCell>
                          <TableCell align="right">Booked</TableCell>
                          <TableCell align="right">Utilized</TableCell>
                          <TableCell align="right">Booking Rate</TableCell>
                          <TableCell align="right">Utilization Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {seatUtilizationData.map((row) => (
                          <TableRow key={row.day}>
                            <TableCell>{row.day}</TableCell>
                            <TableCell align="right">{row.total}</TableCell>
                            <TableCell align="right">{row.booked}</TableCell>
                            <TableCell align="right">{row.utilized}</TableCell>
                            <TableCell align="right">
                              {Math.round((row.booked / row.total) * 100)}%
                            </TableCell>
                            <TableCell align="right">
                              {Math.round((row.utilized / row.total) * 100)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            )}

            {/* Requests Report */}
            {tabValue === 3 && requestsData.length > 0 && (
              <Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {/* Summary Cards */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Total Requests
                        </Typography>
                        <Typography variant="h4">
                          {requestsData.reduce(
                            (sum, day) => sum + day.regularization + day.wfh,
                            0
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Regularization Requests
                        </Typography>
                        <Typography variant="h4">
                          {requestsData.reduce(
                            (sum, day) => sum + day.regularization,
                            0
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          WFH Requests
                        </Typography>
                        <Typography variant="h4">
                          {requestsData.reduce((sum, day) => sum + day.wfh, 0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Approval Rate
                        </Typography>
                        <Typography variant="h4">
                          {Math.round(
                            (requestsData.reduce(
                              (sum, day) => sum + day.approved,
                              0
                            ) /
                              requestsData.reduce(
                                (sum, day) => sum + day.approved + day.rejected,
                                0
                              )) *
                              100
                          )}
                          %
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Chart */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Request Trend
                  </Typography>

                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={requestsData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="regularization"
                          name="Regularization"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="wfh"
                          name="WFH"
                          stroke="#82ca9d"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                {/* Data Table */}
                <Paper>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Regularization</TableCell>
                          <TableCell align="right">WFH</TableCell>
                          <TableCell align="right">Approved</TableCell>
                          <TableCell align="right">Rejected</TableCell>
                          <TableCell align="right">Approval Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {requestsData.map((row) => (
                          <TableRow key={row.date}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell align="right">
                              {row.regularization}
                            </TableCell>
                            <TableCell align="right">{row.wfh}</TableCell>
                            <TableCell align="right">{row.approved}</TableCell>
                            <TableCell align="right">{row.rejected}</TableCell>
                            <TableCell align="right">
                              {Math.round(
                                (row.approved /
                                  (row.approved + row.rejected || 1)) *
                                  100
                              )}
                              %
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            )}
          </>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default Reports;
