// src/components/Footer.jsx
import React from "react";
import { Box, Link, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{ ...footerContainer, zIndex: theme.zIndex.drawer + 1 }}
    >
      <Box sx={footerWrap}>
        <Box sx={footerContent}>
          <Box sx={footerLogo}>
            <Typography variant="body2" sx={{ color: "#4a5568" }}>
              Powered by
            </Typography>
            <Box sx={logoText}>
              <Typography component="span" sx={gigText}>
                Gig
              </Typography>
              <Typography component="span" sx={labzText}>
                Labz
              </Typography>
            </Box>
          </Box>
          <Box sx={footerLinks}>
            <Link href="/terms" sx={footerLink}>
              Terms of Use
            </Link>
            <Link href="/privacy" sx={footerLink}>
              Privacy Policy
            </Link>
            <Typography component="span" sx={copyright}>
              © {currentYear} GigLabz - All Rights Reserved
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Styles as plain objects
const footerContainer = {
  backgroundColor: "#f5f6f8",
  borderTop: "1px solid #e5e7eb",
  padding: "1.5rem 0",
  marginTop: "auto",
};

const footerWrap = {
  maxWidth: "1300px",
  margin: "0 auto",
  padding: "0 2rem",
};

const footerContent = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "1rem",
  "@media (max-width: 768px)": {
    flexDirection: "column",
    textAlign: "center",
  },
};

const footerLogo = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const logoText = {
  fontWeight: 700,
  fontSize: "1.2rem",
  display: "flex",
  alignItems: "center",
};

const gigText = {
  color: "#2563eb",
  fontWeight: "700",
  fontSize: "1.2rem",
};

const labzText = {
  color: "#f59e0b",
  fontWeight: "700",
  fontSize: "1.2rem",
};

const footerLinks = {
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
  flexWrap: "wrap",
  "@media (max-width: 768px)": {
    flexDirection: "column",
    gap: "1rem",
  },
};

const footerLink = {
  color: "#4a5568",
  textDecoration: "none",
  fontSize: "0.9rem",
  transition: "color 0.2s",
  "&:hover": {
    color: "#3498db",
    textDecoration: "underline",
  },
};

const copyright = {
  color: "#6b7280",
  fontSize: "0.9rem",
};

export default Footer;
