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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ComputerIcon from '@mui/icons-material/Computer';
import SearchIcon from '@mui/icons-material/Search';
import WifiIcon from '@mui/icons-material/Wifi';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import desktopService from '../../services/desktopService';

const DesktopSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Reset Dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchType, setSearchType] = useState('email');
  const [searchValue, setSearchValue] = useState('');

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

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
        fetchSessions();
      }, 30000); // 30 seconds refresh
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
  }, [autoRefresh]);

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
        <Typography variant="h4">
          <ComputerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Desktop Sessions
        </Typography>

        <Box>
          <Tooltip title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh (30s)'}>
            <Chip
              icon={<RefreshIcon />}
              label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              color={autoRefresh ? 'success' : 'default'}
              onClick={toggleAutoRefresh}
              sx={{ mr: 2 }}
            />
          </Tooltip>
          
          <Tooltip title="Refresh sessions">
            <IconButton onClick={fetchSessions} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

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