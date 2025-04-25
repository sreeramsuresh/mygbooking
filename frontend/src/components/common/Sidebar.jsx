// frontend/src/components/common/Sidebar.jsx
import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  BarChart as ReportIcon,
  SupervisorAccount as UsersIcon,
  FormatListBulleted as RequestsIcon,
  Settings as SettingsIcon,
  AutoAwesome as AutoBookingIcon,
  Computer as ComputerIcon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const { isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const handleNavigation = (path) => {
    navigate(path);
    if (!isDesktop) {
      onMobileClose();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Common menu items for all users
  const commonMenuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "Profile",
      icon: <PersonIcon />,
      path: "/profile",
    },
  ];
  
  // Menu items for regular employees and managers (not admins)
  const employeeMenuItems = [
    {
      text: "New Booking",
      icon: <CalendarIcon />,
      path: "/bookings/new",
    },
    {
      text: "My Bookings",
      icon: <EventIcon />,
      path: "/bookings/my",
    },
    {
      text: "My Requests",
      icon: <RequestsIcon />,
      path: "/requests/my",
    },
  ];

  // Menu items for managers and admins
  const managerMenuItems = [
    {
      text: "Pending Requests",
      icon: <DescriptionIcon />,
      path: "/requests/pending",
    },
  ];

  // Menu items for admins only
  const adminMenuItems = [
    {
      text: "Users",
      icon: <UsersIcon />,
      path: "/admin/users",
    },
    {
      text: "Reports",
      icon: <ReportIcon />,
      path: "/admin/reports",
    },
    {
      text: "Auto-Booking",
      icon: <AutoBookingIcon />,
      path: "/admin/auto-booking",
    },
    {
      text: "Desktop Sessions",
      icon: <ComputerIcon />,
      path: "/admin/desktop-sessions",
    },
  ];

  const drawerContent = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {/* Common menu items */}
        {commonMenuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={isActive(item.path)}
            sx={{
              "&.Mui-selected": {
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
                "& .MuiListItemIcon-root": {
                  color: theme.palette.primary.contrastText,
                },
                "&:hover": {
                  backgroundColor: theme.palette.primary.main,
                },
              },
              borderRadius: 1,
              my: 0.5,
              mx: 1,
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive(item.path)
                  ? theme.palette.primary.contrastText
                  : "inherit",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        
        {/* Employee-specific menu items (not for admins) */}
        {!isAdmin && employeeMenuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={isActive(item.path)}
            sx={{
              "&.Mui-selected": {
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
                "& .MuiListItemIcon-root": {
                  color: theme.palette.primary.contrastText,
                },
                "&:hover": {
                  backgroundColor: theme.palette.primary.main,
                },
              },
              borderRadius: 1,
              my: 0.5,
              mx: 1,
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive(item.path)
                  ? theme.palette.primary.contrastText
                  : "inherit",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}

        {/* Managers and Admin items */}
        {(isManager || isAdmin) && (
          <>
            <Divider sx={{ my: 2 }} />
            {managerMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                    "& .MuiListItemIcon-root": {
                      color: theme.palette.primary.contrastText,
                    },
                    "&:hover": {
                      backgroundColor: theme.palette.primary.main,
                    },
                  },
                  borderRadius: 1,
                  my: 0.5,
                  mx: 1,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path)
                      ? theme.palette.primary.contrastText
                      : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </>
        )}

        {/* Admin only items */}
        {isAdmin && (
          <>
            <Divider sx={{ my: 2 }} />
            {adminMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                    "& .MuiListItemIcon-root": {
                      color: theme.palette.primary.contrastText,
                    },
                    "&:hover": {
                      backgroundColor: theme.palette.primary.main,
                    },
                  },
                  borderRadius: 1,
                  my: 0.5,
                  mx: 1,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path)
                      ? theme.palette.primary.contrastText
                      : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </>
        )}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={isMobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 240,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 240,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;