// frontend/src/pages/Admin/Users.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  InputAdornment,
  OutlinedInput,
  Divider,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import userService from "../../services/userService";

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // User Dialog
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // User Form
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    department: "",
    isActive: true,
    roles: ["employee"],
    managerId: "",
    defaultWorkDays: [1, 2, 3, 4, 5],
    requiredDaysPerWeek: 2,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await userService.getAllUsers();

      if (response.success) {
        setUsers(response.data);

        // Extract managers for dropdown
        const managerList = response.data.filter(
          (user) =>
            user.roles.includes("ROLE_MANAGER") ||
            user.roles.includes("ROLE_ADMIN")
        );
        setManagers(managerList);

        // Initial filtering
        setFilteredUsers(response.data);
      } else {
        setError(response.message || "Failed to fetch users");
      }
    } catch (err) {
      setError("An error occurred while fetching users");
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply search filter
    if (users.length > 0) {
      if (searchQuery.trim() === "") {
        setFilteredUsers(users);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = users.filter(
          (user) =>
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.fullName.toLowerCase().includes(query) ||
            (user.department && user.department.toLowerCase().includes(query))
        );
        setFilteredUsers(filtered);
      }
      setPage(0); // Reset to first page when filtering
    }
  }, [searchQuery, users]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleOpenUserDialog = (user = null) => {
    if (user) {
      // Edit mode
      setIsEditMode(true);
      setUserForm({
        username: user.username,
        email: user.email,
        password: "",
        fullName: user.fullName || "",
        department: user.department || "",
        isActive: user.isActive,
        roles: user.roles.map((role) =>
          role.replace("ROLE_", "").toLowerCase()
        ),
        managerId: user.managerId || "",
        defaultWorkDays: user.defaultWorkDays || [1, 2, 3, 4, 5],
        requiredDaysPerWeek: user.requiredDaysPerWeek || 2,
      });
      setSelectedUser(user);
    } else {
      // Create mode
      setIsEditMode(false);
      setUserForm({
        username: "",
        email: "",
        password: "",
        fullName: "",
        department: "",
        isActive: true,
        roles: ["employee"],
        managerId: "",
        defaultWorkDays: [1, 2, 3, 4, 5],
        requiredDaysPerWeek: 2,
      });
      setSelectedUser(null);
    }
    setUserDialogOpen(true);
    setDialogError("");
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
    setSelectedUser(null);
    setDialogError("");
  };

  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUserFormChange = (e) => {
    const { name, value, checked } = e.target;

    // Handle checkbox fields
    if (name === "isActive") {
      setUserForm({
        ...userForm,
        [name]: checked,
      });
      return;
    }

    setUserForm({
      ...userForm,
      [name]: value,
    });
  };

  const handleRoleChange = (e) => {
    setUserForm({
      ...userForm,
      roles: e.target.value,
    });
  };

  const handleWorkDaysChange = (e) => {
    setUserForm({
      ...userForm,
      defaultWorkDays: e.target.value,
    });
  };

  const handleToggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmitUserForm = async (e) => {
    e.preventDefault();

    setDialogLoading(true);
    setDialogError("");

    try {
      let response;

      if (isEditMode && selectedUser) {
        // Update existing user
        const userData = { ...userForm };

        // Don't send password if it's empty (no change)
        if (!userData.password) {
          delete userData.password;
        }

        response = await userService.updateUser(selectedUser.id, userData);
      } else {
        // Create new user
        response = await userService.createUser(userForm);
      }

      if (response.success) {
        handleCloseUserDialog();
        fetchUsers(); // Refresh user list
      } else {
        setDialogError(
          response.message ||
            `Failed to ${isEditMode ? "update" : "create"} user`
        );
      }
    } catch (err) {
      setDialogError(
        `An error occurred while ${
          isEditMode ? "updating" : "creating"
        } the user`
      );
      console.error(`${isEditMode ? "Update" : "Create"} user error:`, err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setDeleteLoading(true);

    try {
      const response = await userService.deleteUser(selectedUser.id);

      if (response.success) {
        handleCloseDeleteDialog();
        fetchUsers(); // Refresh user list
      } else {
        setError(response.message || "Failed to delete user");
      }
    } catch (err) {
      setError("An error occurred while deleting the user");
      console.error("Delete user error:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await userService.toggleUserStatus(
        userId,
        !currentStatus
      );

      if (response.success) {
        fetchUsers(); // Refresh user list
      } else {
        setError(response.message || "Failed to update user status");
      }
    } catch (err) {
      setError("An error occurred while updating user status");
      console.error("Toggle user status error:", err);
    }
  };

  const getUserRoleChips = (roles) => {
    return roles.map((role) => {
      const roleName = role.replace("ROLE_", "");
      let color = "default";

      if (roleName === "ADMIN") color = "primary";
      else if (roleName === "MANAGER") color = "secondary";

      return (
        <Chip
          key={roleName}
          label={roleName.charAt(0) + roleName.slice(1).toLowerCase()}
          color={color}
          size="small"
          sx={{ mr: 0.5 }}
        />
      );
    });
  };

  return (
    <Box sx={{ mt: 4, mb: 8, px: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">User Management</Typography>

        <Box>
          <Tooltip title="Refresh users">
            <IconButton onClick={fetchUsers} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenUserDialog()}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: i3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel htmlFor="search-user">Search Users</InputLabel>
            <OutlinedInput
              id="search-user"
              value={searchQuery}
              onChange={handleSearchChange}
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              }
              label="Search Users"
              placeholder="Search by name, email, username, or department"
            />
          </FormControl>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredUsers.length > 0 ? (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{getUserRoleChips(user.roles)}</TableCell>
                      <TableCell align="center">
                        {user.isActive ? (
                          <Chip label="Active" color="success" size="small" />
                        ) : (
                          <Chip label="Inactive" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Tooltip title="Edit User">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenUserDialog(user)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip
                            title={
                              user.isActive
                                ? "Deactivate User"
                                : "Activate User"
                            }
                          >
                            <IconButton
                              color={user.isActive ? "error" : "success"}
                              onClick={() =>
                                handleToggleUserStatus(user.id, user.isActive)
                              }
                              size="small"
                            >
                              {user.isActive ? (
                                <BlockIcon />
                              ) : (
                                <CheckCircleIcon />
                              )}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete User">
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDeleteDialog(user)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            No users found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchQuery
              ? "No users match your search criteria."
              : "No users have been created yet."}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenUserDialog()}
          >
            Add User
          </Button>
        </Paper>
      )}

      {/* User Dialog (Create/Edit) */}
      <Dialog
        open={userDialogOpen}
        onClose={handleCloseUserDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? "Edit User" : "Create New User"}
        </DialogTitle>

        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmitUserForm} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={userForm.fullName}
                  onChange={handleUserFormChange}
                  margin="normal"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={userForm.department}
                  onChange={handleUserFormChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={userForm.username}
                  onChange={handleUserFormChange}
                  margin="normal"
                  required
                  disabled={isEditMode} // Can't change username in edit mode
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={handleUserFormChange}
                  margin="normal"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={
                    isEditMode
                      ? "New Password (leave blank to keep current)"
                      : "Password"
                  }
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={userForm.password}
                  onChange={handleUserFormChange}
                  margin="normal"
                  required={!isEditMode}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleToggleShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select
                    multiple
                    name="roles"
                    value={userForm.roles}
                    onChange={handleRoleChange}
                    label="Role"
                  >
                    <MenuItem value="employee">Employee</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel shrink htmlFor="managerId">
                    Manager (Optional)
                  </InputLabel>
                  <Select
                    name="managerId"
                    value={userForm.managerId}
                    onChange={handleUserFormChange}
                    label="Manager (Optional)"
                    displayEmpty
                    inputProps={{
                      id: "managerId",
                    }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {managers.map((manager) => (
                      <MenuItem key={manager.id} value={manager.id}>
                        {manager.fullName} ({manager.username})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userForm.isActive}
                      onChange={handleUserFormChange}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="Active Account"
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip label="Office Attendance Settings" />
                </Divider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Default Work Days</InputLabel>
                  <Select
                    multiple
                    name="defaultWorkDays"
                    value={userForm.defaultWorkDays}
                    onChange={handleWorkDaysChange}
                    label="Default Work Days"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <MenuItem key={day.value} value={day.value}>
                        {day.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Required Office Days Per Week"
                  name="requiredDaysPerWeek"
                  type="number"
                  value={userForm.requiredDaysPerWeek}
                  onChange={handleUserFormChange}
                  margin="normal"
                  InputProps={{ inputProps: { min: 0, max: 5 } }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseUserDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitUserForm}
            variant="contained"
            disabled={dialogLoading}
            startIcon={dialogLoading ? <CircularProgress size={20} /> : null}
          >
            {dialogLoading ? "Saving..." : isEditMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the user{" "}
            <strong>{selectedUser?.fullName || selectedUser?.username}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone. All associated bookings and requests
            will also be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            startIcon={
              deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />
            }
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
