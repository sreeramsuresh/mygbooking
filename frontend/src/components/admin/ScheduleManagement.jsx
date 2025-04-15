// frontend/src/components/admin/ScheduleManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search as SearchIcon, Edit as EditIcon } from "@mui/icons-material";
import userService from "../../services/userService";
import scheduleService from "../../services/scheduleService";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const ScheduleManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDays, setSelectedDays] = useState({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
  });
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.first_name.toLowerCase().includes(query) ||
          user.last_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const usersResponse = await userService.getAllUsers();

      // For each user, fetch their schedule
      const usersWithSchedule = await Promise.all(
        usersResponse.data.map(async (user) => {
          const scheduleResponse = await scheduleService.getUserScheduleById(
            user.id
          );
          return {
            ...user,
            schedule: scheduleResponse.data,
            scheduleDays: scheduleResponse.data.map((s) => s.day_of_week),
          };
        })
      );

      setUsers(usersWithSchedule);
      setFilteredUsers(usersWithSchedule);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users with schedules:", error);
      setAlert({
        show: true,
        message: "Failed to load users and schedules",
        severity: "error",
      });
      setLoading(false);
    }
  };

  const handleOpenDialog = (user) => {
    setSelectedUser(user);

    // Initialize selected days based on user's current schedule
    const days = {
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
    };

    user.scheduleDays.forEach((day) => {
      days[day] = true;
    });

    setSelectedDays(days);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleDayChange = (day) => {
    setSelectedDays({
      ...selectedDays,
      [day]: !selectedDays[day],
    });
  };

  const handleSaveSchedule = async () => {
    try {
      setLoading(true);

      // Convert selected days to array
      const scheduleDays = Object.keys(selectedDays).filter(
        (day) => selectedDays[day]
      );

      // Update user schedule
      await scheduleService.updateUserSchedule(selectedUser.id, scheduleDays);

      // Update local state
      const updatedUsers = users.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            scheduleDays,
            schedule: scheduleDays.map((day) => ({ day_of_week: day })),
          };
        }
        return user;
      });

      setUsers(updatedUsers);
      setAlert({
        show: true,
        message: "Schedule updated successfully",
        severity: "success",
      });

      handleCloseDialog();
      setLoading(false);
    } catch (error) {
      console.error("Error updating schedule:", error);
      setAlert({
        show: true,
        message: "Failed to update schedule",
        severity: "error",
      });
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Schedule Management
      </Typography>

      {alert.show && (
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, show: false })}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.scheduleDays?.length > 0
                      ? user.scheduleDays.join(", ")
                      : "No schedule set"}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(user)}
                    >
                      Edit Schedule
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Schedule Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Schedule for {selectedUser?.first_name} {selectedUser?.last_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select working days:
            </Typography>
            <FormGroup>
              {weekdays.map((day) => (
                <FormControlLabel
                  key={day}
                  control={
                    <Checkbox
                      checked={selectedDays[day] || false}
                      onChange={() => handleDayChange(day)}
                    />
                  }
                  label={day}
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveSchedule}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Save Schedule"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleManagement;
