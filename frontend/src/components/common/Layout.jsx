// frontend/src/components/common/Layout.jsx
import React, { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header onMobileMenuToggle={handleDrawerToggle} />
        <Box sx={{ display: "flex", flex: 1 }}>
          <Sidebar
            isMobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { md: `calc(100% - 240px)` },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Toolbar /> {/* Offset for fixed app bar */}
            <Outlet />
          </Box>
        </Box>
        <Footer />
      </Box>
    </>
  );
};

export default Layout;
