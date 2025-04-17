// frontend/src/components/common/Notification.jsx
import React, { useState, useEffect, forwardRef } from "react";
import {
  Snackbar,
  Alert as MuiAlert,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Paper,
  Fade,
  Divider,
  Button,
  Popover,
} from "@mui/material";
import {
  Close as CloseIcon,
  Event as EventIcon,
  EventSeat as EventSeatIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";

// Custom Alert component
const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Notification types and their corresponding icons
const notificationIcons = {
  booking: <EventSeatIcon />,
  attendance: <EventIcon />,
  approval: <CheckCircleIcon />,
  rejection: <CancelIcon />,
  request: <AssignmentIcon />,
};

// Background colors for different notification types
const getBgColor = (type) => {
  switch (type) {
    case "booking":
      return "primary.light";
    case "attendance":
      return "info.light";
    case "approval":
      return "success.light";
    case "rejection":
      return "error.light";
    case "request":
      return "warning.light";
    default:
      return "grey.200";
  }
};

const NotificationAlert = ({ notification, open, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      TransitionComponent={Fade}
    >
      <Alert
        onClose={onClose}
        severity={notification?.severity || "info"}
        sx={{ width: "100%" }}
      >
        {notification?.message}
      </Alert>
    </Snackbar>
  );
};

const NotificationCenter = ({
  notifications = [],
  onMarkAsRead,
  onClearAll,
  anchorEl,
  open,
  onClose,
}) => {
  if (notifications.length === 0) {
    return (
      <Popover
        id="notification-popover"
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          elevation: 3,
          sx: { width: 320, maxHeight: 500 },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Notifications
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </Box>
        </Box>
      </Popover>
    );
  }

  return (
    <Popover
      id="notification-popover"
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        elevation: 3,
        sx: { width: 320, maxHeight: 500 },
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1">
          Notifications
          <Badge
            badgeContent={notifications.filter((n) => !n.read).length}
            color="error"
            sx={{ ml: 1 }}
          />
        </Typography>
        <Button size="small" onClick={onClearAll}>
          Clear All
        </Button>
      </Box>

      <Divider />

      <List sx={{ p: 0, maxHeight: 400, overflowY: "auto" }}>
        {notifications.map((notification) => (
          <ListItem
            key={notification.id}
            alignItems="flex-start"
            sx={{
              bgcolor: notification.read ? "inherit" : "action.hover",
              "&:hover": { bgcolor: "action.selected" },
            }}
            secondaryAction={
              !notification.read && (
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )
            }
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: getBgColor(notification.type) }}>
                {notificationIcons[notification.type] || <NotificationsIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={notification.message}
              secondary={
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(notification.timestamp), {
                      addSuffix: true,
                    })}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      <Divider />

      <Box sx={{ p: 1, display: "flex", justifyContent: "center" }}>
        <Button size="small" fullWidth onClick={onClose}>
          View All
        </Button>
      </Box>
    </Popover>
  );
};

const Notification = ({ enableNotificationCenter = true }) => {
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // Mock data - in a real app, these would come from an API or context
  useEffect(() => {
    // Simulate receiving notifications
    const mockNotifications = [
      {
        id: 1,
        type: "booking",
        message: "Your seat booking for tomorrow has been confirmed",
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        severity: "success",
        read: false,
      },
      {
        id: 2,
        type: "approval",
        message: "Your regularization request has been approved",
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        severity: "success",
        read: false,
      },
      {
        id: 3,
        type: "attendance",
        message: "Don't forget to check-in for today's booking",
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
        severity: "info",
        read: true,
      },
      {
        id: 4,
        type: "request",
        message: "You have 2 pending requests to review",
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
        severity: "warning",
        read: true,
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  // Show the most recent unread notification as an alert
  useEffect(() => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length > 0) {
      const latest = unreadNotifications.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )[0];

      setCurrentNotification(latest);
      setShowAlert(true);
    }
  }, [notifications]);

  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setShowAlert(false);
  };

  const handleOpenNotificationCenter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotificationCenter = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );

    // Close alert if it's the current notification
    if (currentNotification && currentNotification.id === notificationId) {
      setShowAlert(false);
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    setShowAlert(false);
    handleCloseNotificationCenter();
  };

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Notification Alert */}
      {currentNotification && (
        <NotificationAlert
          notification={currentNotification}
          open={showAlert}
          onClose={() => {
            handleMarkAsRead(currentNotification.id);
            handleCloseAlert();
          }}
        />
      )}

      {/* Notification Icon with Badge */}
      {enableNotificationCenter && (
        <>
          <IconButton
            color="inherit"
            onClick={handleOpenNotificationCenter}
            size="large"
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Notification Center Popover */}
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearAll}
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseNotificationCenter}
          />
        </>
      )}
    </>
  );
};

/**
 * This higher-order component can be used to show a notification
 * programmatically from anywhere in the application
 */
export const withNotification = (Component) => {
  return (props) => {
    const [notification, setNotification] = useState(null);
    const [open, setOpen] = useState(false);

    const showNotification = (message, severity = "info") => {
      setNotification({ message, severity });
      setOpen(true);
    };

    const closeNotification = () => {
      setOpen(false);
    };

    return (
      <>
        <Component {...props} showNotification={showNotification} />
        {notification && (
          <NotificationAlert
            notification={notification}
            open={open}
            onClose={closeNotification}
          />
        )}
      </>
    );
  };
};

export default Notification;
