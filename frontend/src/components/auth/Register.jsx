// frontend/src/components/auth/Register.jsx
import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Grid,
  Link,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  FormHelperText,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import authService from "../../services/authService";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    department: "",
    defaultWorkDays: [1, 2, 3, 4, 5], // Default to weekdays (Monday-Friday)
    requiredDaysPerWeek: 2,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    // Check required fields
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.fullName
    ) {
      setError("Please fill in all required fields");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Check password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = formData;

      const response = await authService.register(userData);

      if (response.success) {
        setSuccess(true);

        // Reset form
        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          fullName: "",
          department: "",
        });

        // Redirect to login after delay
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // List of sample departments
  const departments = [
    "IT",
    "HR",
    "Finance",
    "Marketing",
    "Operations",
    "Sales",
    "Engineering",
    "Research",
    "Customer Support",
    "Other",
  ];
  
  // Days of the week
  const daysOfWeek = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" }
  ];
  
  const handleWorkDayChange = (dayValue) => {
    setFormData((prevData) => {
      // Check if day is already selected
      if (prevData.defaultWorkDays.includes(dayValue)) {
        // Remove day if already selected and not going below min required days
        if (prevData.defaultWorkDays.length > prevData.requiredDaysPerWeek) {
          return {
            ...prevData,
            defaultWorkDays: prevData.defaultWorkDays.filter(day => day !== dayValue)
          };
        }
        return prevData; // Don't allow going below required days
      } else {
        // Add day if not already selected
        return {
          ...prevData,
          defaultWorkDays: [...prevData.defaultWorkDays, dayValue].sort()
        };
      }
    });
  };
  
  const handleRequiredDaysChange = (e) => {
    const newRequiredDays = parseInt(e.target.value, 10);
    setFormData((prevData) => ({
      ...prevData,
      requiredDaysPerWeek: newRequiredDays
    }));
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Office Attendance Tracker
          </Typography>

          <Typography component="h2" variant="h5" align="center" gutterBottom>
            Create an Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Registration successful! Redirecting to login page...
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="fullName"
                  label="Full Name"
                  name="fullName"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  error={
                    formData.confirmPassword !== "" &&
                    formData.password !== formData.confirmPassword
                  }
                  helperText={
                    formData.confirmPassword !== "" &&
                    formData.password !== formData.confirmPassword
                      ? "Passwords do not match"
                      : ""
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="department-label">
                    Department (Optional)
                  </InputLabel>
                  <Select
                    labelId="department-label"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    label="Department (Optional)"
                    disabled={isSubmitting}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Default Office Days
                </Typography>
                <FormHelperText sx={{ mt: -1, mb: 1 }}>
                  Select your preferred days to come to the office (min {formData.requiredDaysPerWeek} days). 
                  We'll automatically book you on these days every week.
                </FormHelperText>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {daysOfWeek.map((day) => (
                    <Chip
                      key={day.value}
                      label={day.label}
                      onClick={() => handleWorkDayChange(day.value)}
                      color={formData.defaultWorkDays.includes(day.value) ? "primary" : "default"}
                      sx={{ cursor: "pointer" }}
                      disabled={isSubmitting}
                    />
                  ))}
                </Box>
                
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="required-days-label">Required Days Per Week</InputLabel>
                  <Select
                    labelId="required-days-label"
                    id="requiredDaysPerWeek"
                    value={formData.requiredDaysPerWeek}
                    onChange={handleRequiredDaysChange}
                    label="Required Days Per Week"
                    disabled={isSubmitting}
                  >
                    <MenuItem value={1}>1 day</MenuItem>
                    <MenuItem value={2}>2 days</MenuItem>
                    <MenuItem value={3}>3 days</MenuItem>
                    <MenuItem value={4}>4 days</MenuItem>
                    <MenuItem value={5}>5 days</MenuItem>
                  </Select>
                  <FormHelperText>
                    Your organization requires you to be in the office this many days per week
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : "Sign Up"}
            </Button>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">
                Already have an account?{" "}
                <Link component={RouterLink} to="/login" variant="body2">
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
