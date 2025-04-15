// frontend/src/components/requests/RequestForm.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { requestService } from "../../services";

const RequestForm = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!startDate || !endDate || !reason.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (endDate < startDate) {
      setError("End date cannot be before start date");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await requestService.createWFHRequest({
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        reason: reason.trim(),
      });

      setSuccess(true);
      setLoading(false);

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setReason("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h5" gutterBottom>
          Work From Home Request
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Your request has been submitted and is pending approval
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              renderInput={(params) => (
                <TextField {...params} fullWidth required />
              )}
              disablePast
            />

            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              renderInput={(params) => (
                <TextField {...params} fullWidth required />
              )}
              disablePast
              minDate={startDate}
            />
          </Box>

          <TextField
            label="Reason"
            multiline
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : "Submit Request"}
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default RequestForm;
