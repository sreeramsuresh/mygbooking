// frontend/src/components/requests/RegularizationForm.jsx
import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format, isAfter, isBefore, subMonths } from "date-fns";
import requestService from "../../services/requestService";
import { useNavigate } from "react-router-dom";

const RegularizationForm = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const today = new Date();
  const minDate = subMonths(today, 1); // Can only regularize up to 1 month back

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate) {
      setError("Please select a date");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for regularization");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Format date for API
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      const response = await requestService.createRegularizationRequest(
        formattedDate,
        reason
      );

      if (response.success) {
        setSuccess(true);
        // Clear form
        setSelectedDate(null);
        setReason("");

        // Redirect after a delay
        setTimeout(() => {
          navigate("/requests/my");
        }, 2000);
      } else {
        setError(response.message || "Failed to submit regularization request");
      }
    } catch (err) {
      setError("An error occurred while submitting the request");
      console.error("Regularization request error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if date is valid (not in future and within range)
  const isDateValid = (date) => {
    return !isAfter(date, today) && !isBefore(date, minDate);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h4" gutterBottom>
          Regularization Request
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Regularization request submitted successfully!
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Typography variant="subtitle1" gutterBottom>
                  Select the date you need to regularize:
                </Typography>

                <DatePicker
                  label="Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  maxDate={today}
                  minDate={minDate}
                  format="dd/MM/yyyy"
                  disableFuture
                  sx={{ width: "100%", mb: 3 }}
                  slotProps={{
                    textField: {
                      required: true,
                      fullWidth: true,
                      margin: "normal",
                      error: selectedDate && !isDateValid(selectedDate),
                      helperText:
                        selectedDate && !isDateValid(selectedDate)
                          ? "Date must be within the last month and not in the future"
                          : "",
                    },
                  }}
                />

                <TextField
                  label="Reason for Regularization"
                  multiline
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  fullWidth
                  required
                  margin="normal"
                  placeholder="Please provide a detailed reason for your absence"
                />

                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/dashboard")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      loading ||
                      !selectedDate ||
                      !reason.trim() ||
                      (selectedDate && !isDateValid(selectedDate))
                    }
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  What is Regularization?
                </Typography>
                <Typography variant="body2" paragraph>
                  Regularization is a process to record your attendance for days
                  when you were unable to check in through the normal system.
                </Typography>
                <Typography variant="body2" paragraph>
                  This request will be sent to your manager for approval.
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Note:
                </Typography>
                <Typography variant="body2">
                  You can only regularize attendance for dates within the last
                  30 days.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default RegularizationForm;
