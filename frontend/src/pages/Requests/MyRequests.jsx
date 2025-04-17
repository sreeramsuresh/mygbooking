// frontend/src/pages/Requests/MyRequests.jsx
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
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { format } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import AddHomeWorkIcon from "@mui/icons-material/AddHomeWork";
import RefreshIcon from "@mui/icons-material/Refresh";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import FilterListIcon from "@mui/icons-material/FilterList";
import requestService from "../../services/requestService";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabValue, setTabValue] = useState(0);

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

      const response = await requestService.getMyRequests(filter);

      if (response.success) {
        setRequests(response.data);
      } else {
        setError(response.message || "Failed to fetch requests");
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

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
      default:
        return "warning";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "pending":
      default:
        return "Pending";
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">My Requests</Typography>

        <Box>
          <Tooltip title="Refresh requests">
            <IconButton onClick={fetchRequests} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            component={RouterLink}
            to="/requests/regularization"
            startIcon={<NoteAddIcon />}
            sx={{ mr: 1 }}
          >
            Regularize
          </Button>

          <Button
            variant="contained"
            component={RouterLink}
            to="/requests/wfh"
            startIcon={<HomeWorkIcon />}
          >
            WFH Request
          </Button>
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
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested On</TableCell>
                <TableCell>Response</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
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
                    <Chip
                      label={getStatusLabel(request.status)}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {request.responseMessage ? (
                      <Tooltip title={request.responseMessage}>
                        <span>
                          {request.responseMessage.substring(0, 20)}...
                        </span>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {request.status === "pending"
                          ? "Awaiting response"
                          : "No response provided"}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            No requests found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            You haven't submitted any requests yet.
          </Typography>
          <Box
            sx={{ mt: 2, display: "flex", gap: 2, justifyContent: "center" }}
          >
            <Button
              variant="outlined"
              component={RouterLink}
              to="/requests/regularization"
              startIcon={<NoteAddIcon />}
            >
              Create Regularization
            </Button>

            <Button
              variant="contained"
              component={RouterLink}
              to="/requests/wfh"
              startIcon={<HomeWorkIcon />}
            >
              Create WFH Request
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default MyRequests;
