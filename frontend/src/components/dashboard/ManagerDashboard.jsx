// frontend/src/components/dashboard/ManagerDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import { Link as RouterLink } from "react-router-dom";
import format from "date-fns/format";
import dashboardService from "../../services/dashboardService";
import requestService from "../../services/requestService";

const ManagerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getManagerDashboard();

      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || "Failed to load dashboard data");
      }
    } catch (err) {
      setError("An error occurred while loading the dashboard");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Refresh dashboard every 5 minutes
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);

      const response = await requestService.approveRequest(
        selectedRequest.id,
        responseMessage
      );

      if (response.success) {
        // Refresh dashboard
        await fetchDashboard();
        handleCloseApproveDialog();
      } else {
        setError(response.message || "Failed to approve request");
      }
    } catch (err) {
      setError("An error occurred while processing the request");
      console.error("Approve request error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !responseMessage) return;

    try {
      setProcessing(true);

      const response = await requestService.rejectRequest(
        selectedRequest.id,
        responseMessage
      );

      if (response.success) {
        // Refresh dashboard
        await fetchDashboard();
        handleCloseRejectDialog();
      } else {
        setError(response.message || "Failed to reject request");
      }
    } catch (err) {
      setError("An error occurred while processing the request");
      console.error("Reject request error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenApproveDialog = (request) => {
    setSelectedRequest(request);
    setResponseMessage("Approved");
    setApproveDialogOpen(true);
  };

  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
    setSelectedRequest(null);
    setResponseMessage("");
  };

  const handleOpenRejectDialog = (request) => {
    setSelectedRequest(request);
    setResponseMessage("");
    setRejectDialogOpen(true);
  };

  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
    setSelectedRequest(null);
    setResponseMessage("");
  };

  if (loading && !dashboardData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">No dashboard data available</Alert>
      </Container>
    );
  }

  const {
    teamSize,
    pendingRequests,
    todayAttendance,
    teamCompliance,
    seatAvailability,
    currentWeek,
  } = dashboardData;

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Manager Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Team Overview */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Size
              </Typography>
              <Typography variant="h3" align="center" sx={{ py: 1 }}>
                {teamSize}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Team Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Attendance */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Attendance
              </Typography>
              <Typography variant="h3" align="center" sx={{ py: 1 }}>
                {todayAttendance.count}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                of {teamSize} members (
                {teamSize > 0
                  ? Math.round((todayAttendance.count / teamSize) * 100)
                  : 0}
                %)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Requests */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Requests
              </Typography>
              <Typography variant="h3" align="center" sx={{ py: 1 }}>
                {pendingRequests.count}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Approval Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Seat Availability */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seat Availability
              </Typography>
              <Typography variant="h3" align="center" sx={{ py: 1 }}>
                {seatAvailability.available}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                of {seatAvailability.total} seats ({seatAvailability.percentage}
                %)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Compliance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Compliance
              </Typography>

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Team Member</TableCell>
                      <TableCell>Required Days</TableCell>
                      <TableCell>Completed Days</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamCompliance.map((member) => (
                      <TableRow key={member.user.id}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {member.user.fullName}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {member.user.department}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{member.requiredDays}</TableCell>
                        <TableCell>{member.actualDays}</TableCell>
                        <TableCell>
                          <Chip
                            icon={
                              member.weeklyStatus.status === "green" ? (
                                <CheckCircleIcon />
                              ) : (
                                <CancelIcon />
                              )
                            }
                            label={
                              member.weeklyStatus.status === "green"
                                ? "Compliant"
                                : "Non-Compliant"
                            }
                            color={
                              member.weeklyStatus.status === "green"
                                ? "success"
                                : "error"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Attendance List */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Office Attendance
              </Typography>

              {todayAttendance.items.length > 0 ? (
                <List>
                  {todayAttendance.items.map((booking) => (
                    <ListItem key={booking.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={booking.user.fullName}
                        secondary={booking.user.department}
                      />
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <EventSeatIcon color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          Seat {booking.seat.seatNumber}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="textSecondary">
                    No team members in office today
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Requests */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Pending Requests</Typography>
                <Button
                  size="small"
                  component={RouterLink}
                  to="/requests/pending"
                  color="primary"
                >
                  View All
                </Button>
              </Box>

              {pendingRequests.items.length > 0 ? (
                <List>
                  {pendingRequests.items.slice(0, 5).map((request) => (
                    <ListItem
                      key={request.id}
                      divider
                      secondaryAction={
                        <Box>
                          <Tooltip title="Approve">
                            <IconButton
                              edge="end"
                              aria-label="approve"
                              color="success"
                              onClick={() => handleOpenApproveDialog(request)}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              edge="end"
                              aria-label="reject"
                              color="error"
                              onClick={() => handleOpenRejectDialog(request)}
                              sx={{ ml: 1 }}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              request.type === "regularization"
                                ? "warning.main"
                                : "info.main",
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography variant="subtitle2" sx={{ mr: 1 }}>
                              {request.user.fullName}
                            </Typography>
                            <Chip
                              label={
                                request.type === "regularization"
                                  ? "Regularize"
                                  : "WFH"
                              }
                              size="small"
                              color={
                                request.type === "regularization"
                                  ? "warning"
                                  : "info"
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {format(new Date(request.date), "EEE, MMM d")}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              Reason: {request.reason}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="textSecondary">
                    No pending requests
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approve Request Dialog */}
      <Dialog open={approveDialogOpen} onClose={handleCloseApproveDialog}>
        <DialogTitle>Approve Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {selectedRequest.user.fullName} -{" "}
                {format(new Date(selectedRequest.date), "EEEE, MMMM d, yyyy")}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                {selectedRequest.type === "regularization"
                  ? "Regularization Request"
                  : "Work From Home Request"}
              </Typography>
              <Typography variant="body2" paragraph>
                Reason: {selectedRequest.reason}
              </Typography>
              <TextField
                fullWidth
                label="Response Message (Optional)"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                multiline
                rows={2}
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApproveDialog}>Cancel</Button>
          <Button
            onClick={handleApproveRequest}
            variant="contained"
            color="success"
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog}>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {selectedRequest.user.fullName} -{" "}
                {format(new Date(selectedRequest.date), "EEEE, MMMM d, yyyy")}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                {selectedRequest.type === "regularization"
                  ? "Regularization Request"
                  : "Work From Home Request"}
              </Typography>
              <Typography variant="body2" paragraph>
                Reason: {selectedRequest.reason}
              </Typography>
              <TextField
                fullWidth
                label="Rejection Reason (Required)"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                multiline
                rows={3}
                margin="normal"
                required
                error={!responseMessage}
                helperText={
                  !responseMessage
                    ? "Please provide a reason for rejection"
                    : ""
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog}>Cancel</Button>
          <Button
            onClick={handleRejectRequest}
            variant="contained"
            color="error"
            disabled={processing || !responseMessage}
          >
            {processing ? <CircularProgress size={24} /> : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerDashboard;
