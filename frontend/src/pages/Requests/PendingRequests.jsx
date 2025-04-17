// frontend/src/pages/Requests/PendingRequests.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Avatar,
  Breadcrumbs,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import DashboardIcon from "@mui/icons-material/Dashboard";
import requestService from "../../services/requestService";

const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      // Determine filter based on tab
      const filter = {
        type:
          tabValue === 1
            ? "regularization"
            : tabValue === 2
            ? "wfh"
            : undefined,
      };

      const response = await requestService.getPendingRequests(filter);

      if (response.success) {
        setRequests(response.data);
      } else {
        setError(response.message || "Failed to fetch pending requests");
      }
    } catch (err) {
      setError("An error occurred while fetching requests");
      console.error("Fetch requests error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
    setActionError("");
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
    setActionError("");
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      setActionError("");

      const response = await requestService.approveRequest(
        selectedRequest.id,
        responseMessage
      );

      if (response.success) {
        // Refresh requests
        await fetchRequests();
        handleCloseApproveDialog();
      } else {
        setActionError(response.message || "Failed to approve request");
      }
    } catch (err) {
      setActionError("An error occurred while processing the request");
      console.error("Approve request error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !responseMessage) return;

    try {
      setProcessing(true);
      setActionError("");

      const response = await requestService.rejectRequest(
        selectedRequest.id,
        responseMessage
      );

      if (response.success) {
        // Refresh requests
        await fetchRequests();
        handleCloseRejectDialog();
      } else {
        setActionError(response.message || "Failed to reject request");
      }
    } catch (err) {
      setActionError("An error occurred while processing the request");
      console.error("Reject request error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const getRequestTypeIcon = (type) => {
    return type === "regularization" ? <NoteAddIcon /> : <HomeWorkIcon />;
  };

  const getRequestTypeLabel = (type) => {
    return type === "regularization" ? "Regularization" : "Work From Home";
  };

  return (
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
        <Typography color="text.primary">Pending Requests</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Pending Requests</Typography>

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

          <Tooltip title="Refresh requests">
            <IconButton onClick={fetchRequests}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="request type tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="All Requests" />
          <Tab label="Regularization" />
          <Tab label="Work From Home" />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : requests.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Requested On</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {request.user.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {request.user.department}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getRequestTypeIcon(request.type)}
                      label={getRequestTypeLabel(request.type)}
                      color={
                        request.type === "regularization" ? "warning" : "info"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>{request.reason}</TableCell>
                  <TableCell>
                    {format(new Date(request.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Approve">
                        <IconButton
                          color="success"
                          onClick={() => handleOpenApproveDialog(request)}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton
                          color="error"
                          onClick={() => handleOpenRejectDialog(request)}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            No pending requests
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            There are no pending requests that require your attention.
          </Typography>
          <Button
            variant="contained"
            component={RouterLink}
            to="/dashboard"
            startIcon={<HomeIcon />}
          >
            Back to Dashboard
          </Button>
        </Paper>
      )}

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

              {actionError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {actionError}
                </Alert>
              )}

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

              {actionError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {actionError}
                </Alert>
              )}

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

export default PendingRequests;
