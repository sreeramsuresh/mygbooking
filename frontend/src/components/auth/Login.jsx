// frontend/src/components/auth/Login.jsx
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
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const Login = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!login || !password) {
      setError("Please enter both username/email and password");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await authLogin(login, password);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={logoText}>
            <Typography component="span" sx={gigText}>
              Gig
            </Typography>
            <Typography component="span" sx={labzText}>
              Labz
            </Typography>
          </Box>
          <Typography
            component="h1"
            variant="h5"
            align="center"
            gutterBottom
            sx={{ color: "#666666" }}
          >
            Office Attendance Tracker
          </Typography>

          <Typography
            component="h2"
            variant="h6"
            align="center"
            gutterBottom
            sx={{ color: "#666666" }}
          >
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="login"
              label="Username or Email"
              name="login"
              autoComplete="username email"
              autoFocus
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={isSubmitting}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;

const logoText = {
  fontWeight: 700,
  fontSize: "2rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const gigText = {
  color: "#2563eb",
  fontWeight: "700",
  fontSize: "2.5rem",
};

const labzText = {
  color: "#f59e0b",
  fontWeight: "700",
  fontSize: "2.5rem",
};
