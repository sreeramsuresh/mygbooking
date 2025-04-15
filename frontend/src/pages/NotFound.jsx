// frontend/src/pages/NotFound.jsx
import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Link } from "react-router-dom";
import { SentimentDissatisfied as SadIcon } from "@mui/icons-material";

const NotFound = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 500,
        }}
      >
        <SadIcon sx={{ fontSize: 100, color: "text.secondary", mb: 2 }} />

        <Typography variant="h4" component="h1" gutterBottom>
          404 - Page Not Found
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: 4 }}
        >
          The page you are looking for doesn't exist or has been moved.
        </Typography>

        <Button variant="contained" color="primary" component={Link} to="/">
          Go to Home
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;
