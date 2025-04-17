// frontend/src/components/common/Header.jsx
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Button,
  Badge,
  Avatar,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const Header = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleUserMenuClose();
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const userMenuOpen = Boolean(userMenuAnchor);
  const notificationsOpen = Boolean(notificationsAnchor);

  return (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 2 }}
            onClick={onMobileMenuToggle}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component={RouterLink}
          to="/dashboard"
          sx={{
            flexGrow: 1,
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          Office Attendance Tracker
        </Typography>

        {user && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={handleNotificationsOpen}
                size="large"
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Account">
              <IconButton
                onClick={handleUserMenuOpen}
                color="inherit"
                size="large"
                sx={{ ml: 1 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.dark" }}>
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* User Menu */}
        <Menu
          anchorEl={userMenuAnchor}
          open={userMenuOpen}
          onClose={handleUserMenuClose}
          PaperProps={{
            elevation: 3,
            sx: { minWidth: 200 },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.fullName || "User"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || ""}
            </Typography>
          </Box>

          <Divider />

          <MenuItem
            onClick={() => {
              handleUserMenuClose();
              navigate("/profile");
            }}
          >
            <PersonIcon sx={{ mr: 2 }} />
            My Profile
          </MenuItem>

          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 2 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchor}
          open={notificationsOpen}
          onClose={handleNotificationsClose}
          PaperProps={{
            elevation: 3,
            sx: { minWidth: 300, maxWidth: 320 },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Notifications
            </Typography>
          </Box>

          <Divider />

          <MenuItem>
            <Typography variant="body2">
              Your booking for Friday has been confirmed.
            </Typography>
          </MenuItem>

          <MenuItem>
            <Typography variant="body2">
              Manager has approved your regularization request.
            </Typography>
          </MenuItem>

          <MenuItem>
            <Typography variant="body2">
              Don't forget to check in for today's booking.
            </Typography>
          </MenuItem>

          <Divider />

          <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
            <Button size="small">View All</Button>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
