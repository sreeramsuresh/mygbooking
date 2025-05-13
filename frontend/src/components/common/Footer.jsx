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
      sx={{
        ...footerContainer,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Box sx={footerWrap}>
        <Box sx={footerContent}>
          <Box sx={footerLogo}>
            <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 500 }}>
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
  backgroundColor: "#f8fafc",
  borderTop: "1px solid #e5e7eb",
  padding: "1rem 0",
  marginTop: "auto",
  boxShadow: "0 2px 16px 0 rgba(0,0,0,0.03)",
  borderBottomLeftRadius: "12px",
  borderBottomRightRadius: "12px",
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
   gap: "0.75rem",
  },
};

const footerLogo = {
  display: "flex",
  alignItems: "center",
  gap: "0.2rem",
};

const logoText = {
  fontWeight: 700,
  fontSize: "1.1rem",
  display: "flex",
  alignItems: "center",
  ml: 0.5,
};

const gigText = {
  color: "#2563eb",
  fontWeight: 700,
  fontSize: "1.1rem",
  letterSpacing: "0.5px",
};

const labzText = {
  color: "#f59e0b",
  fontWeight: 700,
  fontSize: "1.1rem",
  letterSpacing: "0.5px",
};

const footerLinks = {
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
  flexWrap: "wrap",
  "@media (max-width: 768px)": {
    flexDirection: "column",
    gap: "0.75rem",
  },
};

const footerLink = {
  color: "#6b7280",
  textDecoration: "none",
  fontSize: "1rem",
  fontWeight: 500,
  transition: "color 0.2s",
  "&:hover": {
    color: "#2563eb",
    textDecoration: "underline",
  },
};

const copyright = {
  color: "#6b7280",
  fontSize: "1rem",
  fontWeight: 400,
};

export default Footer;
