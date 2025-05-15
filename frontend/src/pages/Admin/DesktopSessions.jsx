// frontend/src/pages/Admin/DesktopSessions.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  OutlinedInput,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ComputerIcon from '@mui/icons-material/Computer';
import SearchIcon from '@mui/icons-material/Search';
import WifiIcon from '@mui/icons-material/Wifi';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HistoryIcon from '@mui/icons-material/History';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import desktopService from '../../services/desktopService';

const DesktopSessions = () => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Active sessions state
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination for active sessions
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search for active sessions
  const [searchQuery, setSearchQuery] = useState('');

  // Reset Dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchType, setSearchType] = useState('email');
  const [searchValue, setSearchValue] = useState('');
  
  // Cleanup state
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Attendance history state
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [attendancePage, setAttendancePage] = useState(0);
  const [attendanceRowsPerPage, setAttendanceRowsPerPage] = useState(10);
  const [totalAttendanceRecords, setTotalAttendanceRecords] = useState(0);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await desktopService.getActiveSessions();

      if (response.success) {
        setSessions(response.data);
        setFilteredSessions(response.data);
      } else {
        setError(response.message || 'Failed to fetch desktop sessions');
      }
    } catch (err) {
      setError('An error occurred while fetching desktop sessions');
      console.error('Fetch sessions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setAttendanceLoading(true);
      setAttendanceError('');

      const params = {
        limit: attendanceRowsPerPage,
        offset: attendancePage * attendanceRowsPerPage,
      };

      // Add optional filters if they exist
      if (startDate) {
        params.startDate = startDate.toISOString().split('T')[0];
      }
      if (endDate) {
        params.endDate = endDate.toISOString().split('T')[0];
      }
      if (selectedUserId) {
        params.userId = selectedUserId;
      }

      const response = await desktopService.getAttendanceHistory(params);

      if (response.success) {
        setAttendanceHistory(response.data.records);
        setTotalAttendanceRecords(response.data.total);
      } else {
        setAttendanceError(response.message || 'Failed to fetch attendance history');
      }
    } catch (err) {
      setAttendanceError('An error occurred while fetching attendance history');
      console.error('Fetch attendance history error:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Clean up any interval on component unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    // Set up auto-refresh interval
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (tabValue === 0) {
          fetchSessions();
        }
      }, 10000); // 10 seconds refresh
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, tabValue]);
  
  // Load attendance history when tab changes to history or when filters change
  useEffect(() => {
    if (tabValue === 1) {
      fetchAttendanceHistory();
    }
  }, [tabValue, attendancePage, attendanceRowsPerPage, startDate, endDate, selectedUserId]);

  useEffect(() => {
    // Apply search filter
    if (sessions.length > 0) {
      if (searchQuery.trim() === '') {
        setFilteredSessions(sessions);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = sessions.filter(
          (session) =>
            (session.user?.fullName && session.user.fullName.toLowerCase().includes(query)) ||
            (session.user?.email && session.user.email.toLowerCase().includes(query)) ||
            (session.ssid && session.ssid.toLowerCase().includes(query)) ||
            (session.ip_address && session.ip_address.toLowerCase().includes(query)) ||
            (session.mac_address && session.mac_address.toLowerCase().includes(query)) ||
            (session.computer_name && session.computer_name.toLowerCase().includes(query))
        );
        setFilteredSessions(filtered);
      }
      setPage(0); // Reset to first page when filtering
    }
  }, [searchQuery, sessions]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleOpenResetDialog = (session) => {
    setSelectedSession(session);
    setSearchType('email');
    setSearchValue(session?.user?.email || '');
    setResetDialogOpen(true);
    setResetError('');
  };

  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
    setSelectedSession(null);
    setResetError('');
  };

  const handleResetMacAddress = async () => {
    try {
      setResetLoading(true);
      setResetError('');

      const userData = {
        [searchType]: searchValue,
      };

      const response = await desktopService.resetMacAddress(userData);

      if (response.success) {
        handleCloseResetDialog();
        fetchSessions(); // Refresh session list
      } else {
        setResetError(response.message || 'Failed to reset MAC address');
      }
    } catch (err) {
      setResetError('An error occurred while resetting the MAC address');
      console.error('Reset MAC address error:', err);
    } finally {
      setResetLoading(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  const handleCleanupInactiveSessions = async () => {
    try {
      setCleanupLoading(true);
      setError('');
      
      const response = await desktopService.cleanupInactiveSessions();
      
      if (response.success) {
        // Show success message
        alert(`Successfully cleaned up ${response.data.processedSessions.length} inactive sessions`);
        // Refresh the sessions list
        fetchSessions();
      } else {
        setError(response.message || 'Failed to clean up inactive sessions');
      }
    } catch (err) {
      setError('An error occurred while cleaning up inactive sessions');
      console.error('Cleanup error:', err);
    } finally {
      setCleanupLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Attendance history pagination handlers
  const handleAttendanceChangePage = (event, newPage) => {
    setAttendancePage(newPage);
  };

  const handleAttendanceChangeRowsPerPage = (event) => {
    setAttendanceRowsPerPage(parseInt(event.target.value, 10));
    setAttendancePage(0);
  };
  
  // Reset attendance history filters
  const resetAttendanceFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedUserId('');
    setAttendancePage(0);
  };

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ComputerIcon sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h4">
            Desktop Attendance
          </Typography>
        </Box>

        <Box>
          <Tooltip title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh (10s)'}>
            <Chip
              icon={<RefreshIcon />}
              label={autoRefresh ? 'Auto-refresh ON (10s)' : 'Auto-refresh OFF'}
              color={autoRefresh ? 'success' : 'default'}
              onClick={toggleAutoRefresh}
              sx={{ mr: 2 }}
            />
          </Tooltip>
          
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={tabValue === 0 ? fetchSessions : fetchAttendanceHistory} 
              sx={{ mr: 1 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          {tabValue === 0 && (
            <Tooltip title="Clean up inactive sessions">
              <IconButton 
                onClick={handleCleanupInactiveSessions}
                disabled={cleanupLoading}
                color="warning"
                sx={{ mr: 1 }}
              >
                {cleanupLoading ? <CircularProgress size={24} /> : <CleaningServicesIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label="Live Sessions" 
            icon={<WifiIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Attendance History" 
            icon={<HistoryIcon />}
            iconPosition="start" 
          />
        </Tabs>
      </Paper>

      {/* Active Sessions Tab */}
      {tabValue === 0 && (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Paper sx={{ mb: 3, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel htmlFor="search-sessions">Search Sessions</InputLabel>
                <OutlinedInput
                  id="search-sessions"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  }
                  label="Search Sessions"
                  placeholder="Search by name, email, computer name, IP address, etc."
                />
              </FormControl>
            </Box>
          </Paper>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredSessions.length > 0 ? (
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Network</TableCell>
                      <TableCell>Computer Info</TableCell>
                      <TableCell>Connection Details</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSessions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {session.user?.fullName || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {session.user?.email || session.email || 'No email'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{session.user?.department || 'N/A'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <WifiIcon fontSize="small" sx={{ mr: 0.5, color: 'success.main' }} />
                              <Typography variant="body2">
                                {session.ssid || 'Unknown'}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {session.ip_address || 'No IP'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {session.computer_name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {session.mac_address || 'No MAC'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              Connected: {session.connection_start_time_formatted || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Duration: {session.connection_duration_formatted || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Reset MAC Address">
                              <IconButton
                                color="warning"
                                onClick={() => handleOpenResetDialog(session)}
                                size="small"
                              >
                                <RestartAltIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredSessions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No active desktop sessions found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {searchQuery
                  ? 'No sessions match your search criteria.'
                  : 'No users are currently connected with the desktop application.'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchSessions}
              >
                Refresh
              </Button>
            </Paper>
          )}
        </>
      )}

      {/* Attendance History Tab */}
      {tabValue === 1 && (
        <>
          {attendanceError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {attendanceError}
            </Alert>
          )}

          <Paper sx={{ mb: 3, p: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>User</InputLabel>
                    <Select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      label="User"
                    >
                      <MenuItem value="">All Users</MenuItem>
                      {filteredSessions.map((session) => (
                        session.user && (
                          <MenuItem key={session.user.id} value={session.user.id}>
                            {session.user.fullName || session.user.email}
                          </MenuItem>
                        )
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={fetchAttendanceHistory}
                      fullWidth
                    >
                      Apply Filters
                    </Button>
                    <Button
                      variant="text"
                      onClick={resetAttendanceFilters}
                    >
                      Reset
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Paper>

          {attendanceLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : attendanceHistory.length > 0 ? (
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Device Info</TableCell>
                      <TableCell>Connection Time</TableCell>
                      <TableCell>Disconnection Time</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceHistory
                      .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {record.user?.fullName || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {record.user?.email || 'No email'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{record.user?.department || 'N/A'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {record.computerName || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {record.macAddress || 'No MAC'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {record.connectionStartTimeFormatted || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {record.connectionEndTimeFormatted || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {record.connectionDurationFormatted || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={record.status}
                              color={record.isActive ? "success" : "default"}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={totalAttendanceRecords}
                rowsPerPage={attendanceRowsPerPage}
                page={attendancePage}
                onPageChange={handleAttendanceChangePage}
                onRowsPerPageChange={handleAttendanceChangeRowsPerPage}
              />
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No attendance records found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Try adjusting your filters or refresh to see the latest data.
              </Typography>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchAttendanceHistory}
              >
                Refresh
              </Button>
            </Paper>
          )}
        </>
      )}

      {/* Reset MAC Address Dialog */}
      <Dialog open={resetDialogOpen} onClose={handleCloseResetDialog}>
        <DialogTitle>Reset User's MAC Address</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            This will disconnect the user from their current device and allow them to log in from a new device.
          </Typography>
          
          {resetError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resetError}
            </Alert>
          )}
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Search By</InputLabel>
            <Select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              label="Search By"
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="userId">User ID</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label={searchType === 'email' ? 'Email' : 'User ID'}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            margin="normal"
            required
          />
          
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Warning: This action will immediately terminate the user's current desktop session.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog}>Cancel</Button>
          <Button
            onClick={handleResetMacAddress}
            variant="contained"
            color="warning"
            disabled={resetLoading || !searchValue}
            startIcon={resetLoading ? <CircularProgress size={20} /> : <RestartAltIcon />}
          >
            {resetLoading ? 'Resetting...' : 'Reset MAC Address'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DesktopSessions;