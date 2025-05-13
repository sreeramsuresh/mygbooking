// frontend/src/pages/UnauthorizedPage.jsx
import React from "react";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import BlockIcon from "@mui/icons-material/Block";

const UnauthorizedPage = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <BlockIcon sx={{ fontSize: 80, color: "error.main", mb: 2 }} />

          <Typography variant="h4" component="h1" gutterBottom>
            Access Denied
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            You don't have permission to access this page.
          </Typography>

          <Button
            variant="contained"
            component={RouterLink}
            to="/dashboard"
            size="large"
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage;
