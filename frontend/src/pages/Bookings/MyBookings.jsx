// frontend/src/pages/Bookings/MyBookings.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Breadcrumbs,
  Divider,
  Grid,
  MenuItem,
  Menu,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import {
  format,
  isAfter,
  isBefore,
  startOfToday,
  addDays,
  getDay,
} from "date-fns";
import useBookings from "../../hooks/useBookings";
import SeatSelector from "../../components/booking/SeatSelector";
import BookingCalendar from "../../components/booking/BookingCalendar";

const MyBookings = () => {
  const {
    myBookings,
    loading,
    error,
    fetchMyBookings,
    cancelBooking,
    updateBooking,
    getAvailableSeats,
    resetAndAutoBook,
    changeWorkDay,
  } = useBookings();

  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editSeatDialogOpen, setEditSeatDialogOpen] = useState(false);
  const [changeWorkDayDialogOpen, setChangeWorkDayDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeatId, setSelectedSeatId] = useState("");
  const [selectedBookingDate, setSelectedBookingDate] = useState("");
  const [isDateChanging, setIsDateChanging] = useState(false);
  const [seatsError, setSeatsError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [changeWorkDayDate, setChangeWorkDayDate] = useState("");
  const [availableWorkDays, setAvailableWorkDays] = useState([]);
  const [isChangingWorkDay, setIsChangingWorkDay] = useState(false);
  const [workDayChangeError, setWorkDayChangeError] = useState("");
  const [workDayChangeSeats, setWorkDayChangeSeats] = useState([]);
  const [workDayChangeBookedSeats, setWorkDayChangeBookedSeats] = useState([]);
  const [isLoadingWorkDaySeats, setIsLoadingWorkDaySeats] = useState(false);
  const [selectedWorkDaySeatId, setSelectedWorkDaySeatId] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  useEffect(() => {
    console.log("Fetching bookings...");
    fetchMyBookings();
  }, [fetchMyBookings]);

  useEffect(() => {
    if (myBookings) {
      filterBookings();
    }
  }, [myBookings, tabValue]);

  const filterBookings = () => {
    const today = startOfToday();

    if (tabValue === 0) {
      // Upcoming (including suggested)
      setFilteredBookings(
        myBookings.filter(
          (booking) =>
            (booking.status !== "cancelled" ||
              booking.status === "suggested") &&
            !isBefore(new Date(booking.bookingDate), today)
        )
      );
    } else if (tabValue === 1) {
      // Past
      setFilteredBookings(
        myBookings.filter((booking) =>
          isBefore(new Date(booking.bookingDate), today)
        )
      );
    } else if (tabValue === 2) {
      // Cancelled
      setFilteredBookings(
        myBookings.filter((booking) => booking.status === "cancelled")
      );
    } else {
      setFilteredBookings(myBookings);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenCancelDialog = (booking) => {
    setSelectedBooking(booking);
    setCancelReason("");
    setCancelError("");
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedBooking(null);
    setCancelReason("");
    setCancelError("");
  };

  const handleOpenEditSeatDialog = async (booking) => {
    setSelectedBooking(booking);
    setSelectedSeatId(booking.seat.id);
    setSelectedBookingDate(booking.bookingDate);
    setIsDateChanging(false);
    setSeatsError("");
    setUpdateError("");
    setEditSeatDialogOpen(true);

    await loadAvailableSeats(booking.bookingDate);
  };

  const loadAvailableSeats = async (date) => {
    try {
      setIsLoadingSeats(true);
      const response = await getAvailableSeats(date);

      if (response.success) {
        if (
          response.data &&
          typeof response.data === "object" &&
          response.data.availableSeats
        ) {
          setAvailableSeats(response.data.availableSeats || []);
          setBookedSeats(response.data.bookedSeats || []);

          // If we're editing an existing booking, add current seat to available seats for selection
          if (selectedBooking && date === selectedBooking.bookingDate) {
            const currentSeat = {
              id: selectedBooking.seat.id,
              seatNumber: selectedBooking.seat.seatNumber,
              description: selectedBooking.seat.description || "",
            };

            // Check if the current seat is already in available seats
            const seatExists = response.data.availableSeats.some(
              (seat) => seat.id === currentSeat.id
            );

            if (!seatExists) {
              setAvailableSeats((prevSeats) => [...prevSeats, currentSeat]);
            }
          }
        } else {
          setAvailableSeats(response.data || []);
        }
      } else {
        setSeatsError(response.message || "Failed to load available seats");
      }
    } catch (err) {
      setSeatsError("An error occurred while fetching available seats");
      console.error("Fetch seats error:", err);
    } finally {
      setIsLoadingSeats(false);
    }
  };

  const handleCloseEditSeatDialog = () => {
    setEditSeatDialogOpen(false);
    setSelectedBooking(null);
    setSelectedSeatId("");
    setSelectedBookingDate("");
    setIsDateChanging(false);
    setAvailableSeats([]);
    setBookedSeats([]);
    setSeatsError("");
    setUpdateError("");
  };

  const handleSeatSelect = (seatId) => {
    setSelectedSeatId(seatId);
  };

  const handleWorkDaySeatSelect = (seatId) => {
    setSelectedWorkDaySeatId(seatId);
  };

  const handleDateChange = (dateString) => {
    setSelectedBookingDate(dateString);
    setIsDateChanging(true);
    setSelectedSeatId(""); // Clear selected seat when date changes
    loadAvailableSeats(dateString);
  };

  const handleMenuOpen = (event, bookingId) => {
    setAnchorEl(event.currentTarget);
    setSelectedBookingId(bookingId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBookingId(null);
  };

  const handleOpenChangeWorkDayDialog = (booking) => {
    setSelectedBooking(booking);
    setWorkDayChangeError("");
    setChangeWorkDayDate("");
    setIsChangingWorkDay(false);

    // Get current user preferences
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const defaultWorkDays = user.defaultWorkDays || [1, 2, 3, 4, 5]; // Default to weekdays

    // Filter available work days (exclude the current booking day)
    const currentBookingDayOfWeek = getDay(new Date(booking.bookingDate));
    const workDays = defaultWorkDays.filter(
      (day) => day !== currentBookingDayOfWeek
    );

    setAvailableWorkDays(workDays);
    setChangeWorkDayDialogOpen(true);
  };

  const handleCloseChangeWorkDayDialog = () => {
    setChangeWorkDayDialogOpen(false);
    setSelectedBooking(null);
    setChangeWorkDayDate("");
    setWorkDayChangeError("");
    setWorkDayChangeSeats([]);
    setWorkDayChangeBookedSeats([]);
    setIsLoadingWorkDaySeats(false);
    setSelectedWorkDaySeatId("");
  };

  const handleChangeWorkDayDateSelect = async (date) => {
    // Reset any previously selected seat
    setSelectedWorkDaySeatId("");

    // Check if date is a string or Date object and handle appropriately
    let formattedDate;
    if (typeof date === "string") {
      formattedDate = date;
      setChangeWorkDayDate(date);
    } else if (date instanceof Date) {
      formattedDate = format(date, "yyyy-MM-dd");
      setChangeWorkDayDate(formattedDate);
    } else {
      console.error("Invalid date format received:", date);
      return;
    }

    // If we have a valid date, load available seats
    if (formattedDate) {
      try {
        setIsLoadingWorkDaySeats(true);
        setWorkDayChangeError("");

        const response = await getAvailableSeats(formattedDate);

        if (response.success) {
          if (response.data && typeof response.data === "object") {
            setWorkDayChangeSeats(response.data.availableSeats || []);
            setWorkDayChangeBookedSeats(response.data.bookedSeats || []);

            // If there are no available seats, show an error
            if ((response.data.availableSeats || []).length === 0) {
              setWorkDayChangeError(
                "No seats available for this date. Please select another date."
              );
            }
          } else {
            setWorkDayChangeSeats(response.data || []);
            setWorkDayChangeBookedSeats([]);
          }
        } else {
          setWorkDayChangeError(
            response.message || "Failed to load available seats"
          );
        }
      } catch (err) {
        setWorkDayChangeError(
          "An error occurred while fetching available seats"
        );
        console.error("Fetch seats error:", err);
      } finally {
        setIsLoadingWorkDaySeats(false);
      }
    }
  };

  const handleChangeWorkDay = async () => {
    try {
      setIsChangingWorkDay(true);
      setWorkDayChangeError("");

      if (!changeWorkDayDate) {
        setWorkDayChangeError("Please select a new date");
        setIsChangingWorkDay(false);
        return;
      }

      // Check if seat selection is required (if we have seats loaded)
      if (workDayChangeSeats.length > 0 && !selectedWorkDaySeatId) {
        setWorkDayChangeError("Please select a seat for the new date");
        setIsChangingWorkDay(false);
        return;
      }

      // Call API to change workday with the selected seat
      const response = await changeWorkDay(
        selectedBooking.id,
        changeWorkDayDate,
        selectedWorkDaySeatId
      );

      if (response.success) {
        // Close dialog and refresh bookings
        handleCloseChangeWorkDayDialog();
        await fetchMyBookings();
      } else {
        setWorkDayChangeError(response.message || "Failed to change workday");
      }
    } catch (err) {
      console.error("Error changing workday:", err);
      setWorkDayChangeError("An unexpected error occurred");
    } finally {
      setIsChangingWorkDay(false);
    }
  };

  const handleUpdateSeat = async () => {
    if (!selectedBooking || !selectedSeatId) {
      setUpdateError("Please select a seat");
      return;
    }

    // If nothing has changed, no need to update
    if (
      selectedSeatId === selectedBooking.seat.id &&
      selectedBookingDate === selectedBooking.bookingDate
    ) {
      handleCloseEditSeatDialog();
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateError("");

      const updates = {
        seatId: selectedSeatId,
      };

      // Add booking date to updates if it has changed
      if (selectedBookingDate !== selectedBooking.bookingDate) {
        updates.bookingDate = selectedBookingDate;
      }

      const response = await updateBooking(selectedBooking.id, updates);

      if (response.success) {
        handleCloseEditSeatDialog();
        await fetchMyBookings();
      } else {
        setUpdateError(response.message || "Failed to update booking");
      }
    } catch (err) {
      setUpdateError("An error occurred while updating the booking");
      console.error("Update booking error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      setCancelling(true);
      setCancelError("");

      const result = await cancelBooking(selectedBooking.id, cancelReason);

      if (result.success) {
        // Close dialog and refresh bookings
        handleCloseCancelDialog();
        await fetchMyBookings();
      } else {
        setCancelError(result.message || "Failed to cancel booking");
      }
    } catch (err) {
      setCancelError("An error occurred while cancelling the booking");
      console.error("Cancel booking error:", err);
    } finally {
      setCancelling(false);
    }
  };

  const canCancelBooking = (booking) => {
    // Only allow cancellation for upcoming bookings with confirmed status
    const today = startOfToday();
    return (
      booking.status === "confirmed" &&
      !isBefore(new Date(booking.bookingDate), today)
    );
  };

  const canEditBooking = (booking) => {
    // Only allow edits for upcoming bookings with confirmed status
    const today = startOfToday();
    return (
      booking.status === "confirmed" &&
      !isBefore(new Date(booking.bookingDate), today)
    );
  };

  return (
    <Box sx={{ mt: 4, mb: 8, px: 3 }}>
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <Button
          component={RouterLink}
          to="/dashboard"
          startIcon={<HomeIcon />}
          size="small"
        >
          Dashboard
        </Button>
        <Typography color="text.primary">My Bookings</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">My Bookings</Typography>

        <Box>
          <Tooltip title="Back to Dashboard">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outlined"
              startIcon={<HomeIcon />}
              sx={{ mr: 1 }}
            >
              Dashboard
            </Button>
          </Tooltip>

          <Tooltip title="Refresh bookings">
            <IconButton onClick={fetchMyBookings} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {/* <Button
            variant="contained"
            component={RouterLink}
            to="/bookings/new"
            startIcon={<AddIcon />}
          >
            New Booking
          </Button> */}
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="booking status tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Upcoming" />
          <Tab label="Past" />
          <Tab label="Cancelled" />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {tabValue === 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            {/* <Paper sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Book a seat
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Create a new booking for a specific date and select your
                    preferred seat.
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">
                    Your preferred days:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      justifyContent: "flex-end",
                      mt: 1,
                    }}
                  >
                    {(() => {
                      const user =
                        JSON.parse(localStorage.getItem("user")) || {};
                      const days = user.defaultWorkDays || [1, 2, 3, 4, 5];
                      const dayNames = [
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ];

                      return days.map((day) => (
                        <Chip
                          key={day}
                          label={dayNames[day]}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ));
                    })()}
                  </Box>
                </Box>
              </Box>

              <Button
                variant="contained"
                component={RouterLink}
                to="/bookings/new"
                startIcon={<AddIcon />}
                fullWidth
                sx={{ mt: 2 }}
              >
                New Booking
              </Button>
            </Paper> */}
          </Grid>
        </Grid>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredBookings.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Seat</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check-in</TableCell>
                <TableCell>Check-out</TableCell>
                {tabValue === 0 && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1">
                        {format(
                          new Date(booking.bookingDate),
                          "EEE, MMM d, yyyy"
                        )}
                      </Typography>
                      {booking.isAutoBooked && (
                        <Tooltip title="Auto-booked">
                          <Chip
                            label="Auto"
                            size="small"
                            color="info"
                            sx={{ ml: 1 }}
                          />
                        </Tooltip>
                      )}
                      {booking.isSuggested && (
                        <Tooltip title="Based on your preferences">
                          <Chip
                            label="Preferred Day"
                            size="small"
                            color="secondary"
                            sx={{ ml: 1 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {booking.isSuggested ? (
                      <Button
                        variant="contained"
                        size="small"
                        component={RouterLink}
                        to={`/bookings/new?date=${booking.bookingDate}`}
                      >
                        Book This Day
                      </Button>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <EventSeatIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body1">
                          {booking.seat?.seatNumber || "No seat"}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {booking.isSuggested ? (
                      <Chip label="Suggested" color="secondary" size="small" />
                    ) : (
                      <Chip
                        label={
                          booking.status === "confirmed"
                            ? "Confirmed"
                            : booking.status === "cancelled"
                            ? "Cancelled"
                            : "Pending"
                        }
                        color={
                          booking.status === "confirmed"
                            ? "success"
                            : booking.status === "cancelled"
                            ? "error"
                            : "warning"
                        }
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {booking.isSuggested ? (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    ) : booking.checkInTime ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AccessTimeIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {format(new Date(booking.checkInTime), "h:mm a")}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not checked in
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {booking.isSuggested ? (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    ) : booking.checkOutTime ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AccessTimeFilledIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {format(new Date(booking.checkOutTime), "h:mm a")}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not checked out
                      </Typography>
                    )}
                  </TableCell>
                  {tabValue === 0 && (
                    <TableCell>
                      {booking.isSuggested ? (
                        <Button
                          variant="outlined"
                          size="small"
                          component={RouterLink}
                          to={`/bookings/new?date=${booking.bookingDate}`}
                        >
                          Book
                        </Button>
                      ) : (
                        <>
                          {canEditBooking(booking) && (
                            <>
                              <IconButton
                                color="primary"
                                onClick={(e) => handleMenuOpen(e, booking.id)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                              <Menu
                                anchorEl={anchorEl}
                                open={
                                  Boolean(anchorEl) &&
                                  selectedBookingId === booking.id
                                }
                                onClose={handleMenuClose}
                              >
                                <MenuItem
                                  onClick={() => {
                                    handleMenuClose();
                                    handleOpenEditSeatDialog(booking);
                                  }}
                                >
                                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                  Change Seat
                                </MenuItem>
                                {booking.isAutoBooked && (
                                  <MenuItem
                                    onClick={() => {
                                      handleMenuClose();
                                      handleOpenChangeWorkDayDialog(booking);
                                    }}
                                  >
                                    <SwapHorizIcon
                                      fontSize="small"
                                      sx={{ mr: 1 }}
                                    />
                                    Change Workday
                                  </MenuItem>
                                )}
                                <MenuItem
                                  onClick={() => {
                                    handleMenuClose();
                                    handleOpenCancelDialog(booking);
                                  }}
                                >
                                  <CancelIcon
                                    fontSize="small"
                                    sx={{ mr: 1 }}
                                    color="error"
                                  />
                                  Cancel Booking
                                </MenuItem>
                              </Menu>
                            </>
                          )}
                          {/* Legacy actions below - keeping for now */}
                          {false && canEditBooking(booking) && (
                            <Tooltip title="Modify Booking">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  handleOpenEditSeatDialog(booking)
                                }
                                sx={{ mr: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canCancelBooking(booking) && (
                            <Tooltip title="Cancel Booking">
                              <IconButton
                                color="error"
                                onClick={() => handleOpenCancelDialog(booking)}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            No bookings found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {tabValue === 0
              ? "You don't have any upcoming bookings."
              : tabValue === 1
              ? "You don't have any past bookings."
              : "You don't have any cancelled bookings."}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/dashboard"
              startIcon={<HomeIcon />}
            >
              Back to Dashboard
            </Button>
            {tabValue === 0 && (
              <Button
                variant="contained"
                component={RouterLink}
                to="/bookings/new"
                startIcon={<AddIcon />}
              >
                Create a Booking
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Are you sure you want to cancel your booking for{" "}
                {format(
                  new Date(selectedBooking.bookingDate),
                  "EEEE, MMMM d, yyyy"
                )}
                ?
              </Typography>

              <Typography variant="body2" paragraph>
                Seat: {selectedBooking.seat.seatNumber}
              </Typography>

              {cancelError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {cancelError}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Reason for Cancellation (Optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                multiline
                rows={2}
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>Keep Booking</Button>
          <Button
            onClick={handleCancelBooking}
            variant="contained"
            color="error"
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={24} /> : "Cancel Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog
        open={editSeatDialogOpen}
        onClose={handleCloseEditSeatDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Change Booking</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Current Booking:
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <CalendarMonthIcon color="primary" />
                  <Typography variant="body1">
                    {format(
                      new Date(selectedBooking.bookingDate),
                      "EEEE, MMMM d, yyyy"
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EventSeatIcon color="primary" />
                  <Typography variant="body1">
                    Seat: {selectedBooking.seat.seatNumber}
                  </Typography>
                </Box>
              </Box>

              {updateError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {updateError}
                </Alert>
              )}

              {seatsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {seatsError}
                </Alert>
              )}

              <Divider sx={{ my: 2 }}>
                <Chip label="Select New Date and/or Seat" />
              </Divider>

              {/* Date Selection */}
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Select Date:
              </Typography>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ mb: 3 }}>
                  <BookingCalendar
                    onDateSelect={handleDateChange}
                    minDate={startOfToday()}
                    maxDate={addDays(startOfToday(), 30)}
                    selectedDate={selectedBookingDate}
                  />
                </Box>
              </LocalizationProvider>

              {/* Seat Selection */}
              <Typography variant="subtitle1" gutterBottom>
                Select Seat:
              </Typography>

              {isLoadingSeats ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : availableSeats.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <SeatSelector
                      seats={availableSeats}
                      bookedSeats={bookedSeats}
                      selectedSeatId={selectedSeatId}
                      onSeatSelect={handleSeatSelect}
                    />
                  </Paper>
                </Box>
              ) : (
                <Alert severity="warning" sx={{ my: 2 }}>
                  No seats are available for this date.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditSeatDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateSeat}
            variant="contained"
            color="primary"
            disabled={isUpdating || !selectedSeatId}
          >
            {isUpdating ? <CircularProgress size={24} /> : "Update Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Workday Dialog */}
      <Dialog
        open={changeWorkDayDialogOpen}
        onClose={handleCloseChangeWorkDayDialog}
        aria-labelledby="change-workday-dialog-title"
        fullWidth
        maxWidth="md"
      >
        <DialogTitle id="change-workday-dialog-title">
          Change Workday
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Current Workday:
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <CalendarMonthIcon color="primary" />
                  <Typography variant="body1">
                    {format(
                      new Date(selectedBooking.bookingDate),
                      "EEEE, MMMM d, yyyy"
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EventSeatIcon color="primary" />
                  <Typography variant="body1">
                    Seat: {selectedBooking.seat.seatNumber}
                  </Typography>
                </Box>
              </Box>

              {workDayChangeError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {workDayChangeError}
                </Alert>
              )}

              <Divider sx={{ my: 2 }}>
                <Chip label="Step 1: Select New Workday" />
              </Divider>

              <Typography variant="subtitle1" gutterBottom>
                Your other preferred days:
              </Typography>

              <Box sx={{ mb: 3 }}>
                {(() => {
                  // Get days of week names
                  const dayNames = [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ];

                  // Find next occurrence of each day
                  const today = new Date();
                  const currentDay = getDay(today);
                  const selectedDay = getDay(
                    new Date(selectedBooking.bookingDate)
                  );

                  return (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <BookingCalendar
                        onDateSelect={(date) =>
                          handleChangeWorkDayDateSelect(date)
                        }
                        minDate={addDays(new Date(), 1)}
                        maxDate={addDays(new Date(), 30)}
                        selectedDate={changeWorkDayDate}
                        highlightedDates={availableWorkDays.map((day) => {
                          // Find next occurrence of each day
                          const date = new Date();
                          // If today is already that day, add 7 to get to next week
                          const daysToAdd = (day - date.getDay() + 7) % 7 || 7;
                          const targetDate = new Date(date);
                          targetDate.setDate(date.getDate() + daysToAdd);
                          return format(targetDate, "yyyy-MM-dd");
                        })}
                      />
                    </LocalizationProvider>
                  );
                })()}
              </Box>

              {/* Seat Selection Section */}
              {changeWorkDayDate && (
                <>
                  <Divider sx={{ my: 2 }}>
                    <Chip label="Step 2: Select A Seat" />
                  </Divider>

                  <Typography variant="subtitle1" gutterBottom>
                    Available seats for{" "}
                    {format(new Date(changeWorkDayDate), "EEEE, MMMM d, yyyy")}:
                  </Typography>

                  {isLoadingWorkDaySeats ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : workDayChangeSeats.length > 0 ? (
                    <Box sx={{ mt: 2 }}>
                      <Paper sx={{ p: 2 }}>
                        <SeatSelector
                          seats={workDayChangeSeats}
                          bookedSeats={workDayChangeBookedSeats}
                          selectedSeatId={selectedWorkDaySeatId}
                          onSeatSelect={handleWorkDaySeatSelect}
                        />
                      </Paper>
                    </Box>
                  ) : (
                    <Alert severity="warning" sx={{ my: 2 }}>
                      No seats are available for this date. Please select a
                      different date.
                    </Alert>
                  )}
                </>
              )}

              <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
                <Typography variant="body2">
                  To change your workday, please select a date and an available
                  seat. You can only change your workday if there are seats
                  available on the new date. The booking will be confirmed
                  immediately once you select a seat and click "Change Workday".
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChangeWorkDayDialog}>Cancel</Button>
          <Button
            onClick={handleChangeWorkDay}
            variant="contained"
            color="primary"
            disabled={
              isChangingWorkDay ||
              !changeWorkDayDate ||
              (workDayChangeSeats.length > 0 && !selectedWorkDaySeatId) ||
              isLoadingWorkDaySeats
            }
          >
            {isChangingWorkDay ? (
              <CircularProgress size={24} />
            ) : (
              "Change Workday"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyBookings;
