// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  Checkbox,
  OutlinedInput,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import WorkIcon from "@mui/icons-material/Work";
import SaveIcon from "@mui/icons-material/Save";
import useAuth from "../hooks/useAuth";

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

const Profile = () => {
  const { user, isAdmin, isManager } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    department: "",
    defaultWorkDays: [],
    requiredDaysPerWeek: 2,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        fullName: user.fullName || "",
        email: user.email || "",
        department: user.department || "",
        defaultWorkDays: user.defaultWorkDays || [1, 2, 3, 4, 5],
        requiredDaysPerWeek: user.requiredDaysPerWeek || 2,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleWorkDaysChange = (event) => {
    const {
      target: { value },
    } = event;

    // On autofill we get a stringified value.
    const selectedDays =
      typeof value === "string" ? value.split(",").map(Number) : value;

    setFormData((prevData) => ({
      ...prevData,
      defaultWorkDays: selectedDays,
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // This is a mock implementation - in a real app, you would call an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success simulation
      setSuccess(true);
    } catch (err) {
      setError("An error occurred while updating your profile");
      console.error("Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // This is a mock implementation - in a real app, you would call an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success simulation
      setSuccess(true);
      setFormData((prevData) => ({
        ...prevData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      setError("An error occurred while updating your password");
      console.error("Password update error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">Loading user profile...</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully!
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: "primary.main",
                  fontSize: 48,
                  mb: 2,
                }}
              >
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </Avatar>

              <Typography variant="h5">{user.fullName}</Typography>

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                {isAdmin && <Chip label="Admin" color="primary" />}
                {isManager && <Chip label="Manager" color="secondary" />}
                <Chip label="Employee" color="default" />
              </Box>

              <Box sx={{ mt: 3, width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
                  <Typography variant="body1">{user.email}</Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <WorkIcon sx={{ mr: 1, color: "text.secondary" }} />
                  <Typography variant="body1">
                    {user.department || "Not specified"}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Default Working Days:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {formData.defaultWorkDays.map((day) => {
                      const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day);
                      return dayInfo ? (
                        <Chip
                          key={day}
                          label={dayInfo.label}
                          size="small"
                          variant="outlined"
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Required Office Days / Week:
                  </Typography>
                  <Typography variant="body1">
                    {formData.requiredDaysPerWeek} days
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>

            <Box component="form" onSubmit={handleProfileUpdate}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    margin="normal"
                    required
                    type="email"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="work-days-label">
                      Default Work Days
                    </InputLabel>
                    <Select
                      labelId="work-days-label"
                      multiple
                      value={formData.defaultWorkDays}
                      onChange={handleWorkDaysChange}
                      input={<OutlinedInput label="Default Work Days" />}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selected.map((value) => {
                            const day = DAYS_OF_WEEK.find(
                              (d) => d.value === value
                            );
                            return day ? (
                              <Chip
                                key={value}
                                label={day.label}
                                size="small"
                              />
                            ) : null;
                          })}
                        </Box>
                      )}
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <MenuItem key={day.value} value={day.value}>
                          <Checkbox
                            checked={
                              formData.defaultWorkDays.indexOf(day.value) > -1
                            }
                          />
                          <ListItemText primary={day.label} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Required Office Days Per Week"
                    name="requiredDaysPerWeek"
                    value={formData.requiredDaysPerWeek}
                    onChange={handleChange}
                    margin="normal"
                    type="number"
                    InputProps={{ inputProps: { min: 0, max: 5 } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={
                        loading ? <CircularProgress size={20} /> : <SaveIcon />
                      }
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>

            <Box component="form" onSubmit={handlePasswordUpdate}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    margin="normal"
                    type="password"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    margin="normal"
                    type="password"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    margin="normal"
                    type="password"
                    required
                    error={
                      formData.newPassword !== formData.confirmPassword &&
                      formData.confirmPassword !== ""
                    }
                    helperText={
                      formData.newPassword !== formData.confirmPassword &&
                      formData.confirmPassword !== ""
                        ? "Passwords do not match"
                        : ""
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      startIcon={
                        loading ? <CircularProgress size={20} /> : <SaveIcon />
                      }
                      disabled={
                        loading ||
                        formData.newPassword !== formData.confirmPassword
                      }
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
