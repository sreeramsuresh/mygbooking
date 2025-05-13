// frontend/src/components/common/Sidebar.jsx
import React, { useState } from "react";
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
  IconButton,
  Tooltip,
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
  Computer as ComputerIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const { isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
    if (!isDesktop) {
      onMobileClose();
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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

  const ListItemComponent = ({ item }) => (
    <Tooltip title={isCollapsed ? item.text : ""} placement="right" arrow>
      <ListItem
        button
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
          minHeight: 48,
          justifyContent: isCollapsed ? "center" : "initial",
        }}
      >
        <ListItemIcon
          sx={{
            color: isActive(item.path)
              ? theme.palette.primary.contrastText
              : "inherit",
            minWidth: isCollapsed ? 0 : 40,
            mr: isCollapsed ? 0 : 2,
            justifyContent: "center",
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!isCollapsed && <ListItemText primary={item.text} />}
      </ListItem>
    </Tooltip>
  );

  const drawerContent = (
    <div>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          px: [1],
          pt: 10, // Added margin top
        }}
      >
        <IconButton onClick={toggleCollapse}>
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {/* Common menu items */}
        {commonMenuItems.map((item) => (
          <ListItemComponent key={item.text} item={item} />
        ))}

        {/* Employee-specific menu items */}
        {!isAdmin &&
          employeeMenuItems.map((item) => (
            <ListItemComponent key={item.text} item={item} />
          ))}

        {/* Managers and Admin items */}
        {(isManager || isAdmin) && (
          <>
            <Divider sx={{ my: 2 }} />
            {managerMenuItems.map((item) => (
              <ListItemComponent key={item.text} item={item} />
            ))}
          </>
        )}

        {/* Admin only items */}
        {isAdmin && (
          <>
            <Divider sx={{ my: 2 }} />
            {adminMenuItems.map((item) => (
              <ListItemComponent key={item.text} item={item} />
            ))}
          </>
        )}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { md: isCollapsed ? 73 : 240 },
        flexShrink: { md: 0 },
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={isMobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
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
            overflowX: "hidden",
            width: isCollapsed ? 73 : 240,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
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
