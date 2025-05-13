// frontend/src/components/requests/WFHRequestForm.jsx
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
import { format, addDays, isBefore } from "date-fns";
import requestService from "../../services/requestService";
import { useNavigate } from "react-router-dom";

const WFHRequestForm = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const today = new Date();
  const minDate = addDays(today, 1); // Can only request WFH for future dates

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate) {
      setError("Please select a date");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for work from home");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Format date for API
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      const response = await requestService.createWFHRequest(
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
        setError(response.message || "Failed to submit WFH request");
      }
    } catch (err) {
      setError("An error occurred while submitting the request");
      console.error("WFH request error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if date is valid (must be in the future)
  const isDateValid = (date) => {
    return !isBefore(date, minDate);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Work From Home Request
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
                Work from home request submitted successfully!
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Typography variant="subtitle1" gutterBottom>
                Select the date you want to work from home:
              </Typography>

              <DatePicker
                label="Date"
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={minDate}
                format="dd/MM/yyyy"
                sx={{ width: "100%", mb: 3 }}
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                    margin: "normal",
                    error: selectedDate && !isDateValid(selectedDate),
                    helperText:
                      selectedDate && !isDateValid(selectedDate)
                        ? "Date must be at least one day in the future"
                        : "",
                  },
                }}
              />

              <TextField
                label="Reason for Working From Home"
                multiline
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                fullWidth
                required
                margin="normal"
                placeholder="Please provide a reason for your work from home request"
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
                Work From Home Policy
              </Typography>
              <Typography variant="body2" paragraph>
                You can request to work from home when circumstances prevent you from 
                coming to the office but you are still able to perform your duties.
              </Typography>
              <Typography variant="body2" paragraph>
                This request will be sent to your manager for approval.
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Note:
              </Typography>
              <Typography variant="body2">
                Requests must be made at least one day in advance except in emergencies.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WFHRequestForm;