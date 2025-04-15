// frontend/src/components/booking/BookingCalendar.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { CalendarMonth as CalendarIcon } from "@mui/icons-material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { scheduleService, bookingService } from "../../services";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isWeekend,
  isSameDay,
} from "date-fns";

const BookingCalendar = ({ onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [userSchedule, setUserSchedule] = useState([]);
  const [weekDates, setWeekDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set current week dates
    const currentDate = new Date();
    const firstDayOfWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday as week start
    const lastDayOfWeek = endOfWeek(currentDate, { weekStartsOn: 1 });

    const daysOfWeek = eachDayOfInterval({
      start: firstDayOfWeek,
      end: lastDayOfWeek,
    }).filter((date) => !isWeekend(date)); // Filter out weekends

    setWeekDates(daysOfWeek);

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's schedule
      const scheduleRes = await scheduleService.getUserSchedule();
      setUserSchedule(scheduleRes.data.map((day) => day.day_of_week));

      // Fetch available dates for booking
      const availableRes = await bookingService.getAvailableDates();
      setAvailableDates(availableRes.data.map((date) => new Date(date)));

      setLoading(false);
    } catch (err) {
      setError("Failed to load booking data");
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleDayButtonClick = (date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Format day name
  const formatDayName = (date) => {
    return format(date, "EEE");
  };

  // Format day number
  const formatDayNumber = (date) => {
    return format(date, "d");
  };

  // Check if date is in user's schedule
  const isScheduledDay = (date) => {
    const dayName = format(date, "EEEE");
    return userSchedule.includes(dayName);
  };

  // Check if date is available for booking
  const isDateAvailable = (date) => {
    return availableDates.some((availableDate) =>
      isSameDay(availableDate, date)
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <CalendarIcon sx={{ mr: 1 }} color="primary" />
          <Typography variant="h6">Select a Date</Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            {/* Weekly view for quick selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                This Week
              </Typography>
              <ToggleButtonGroup
                value={selectedDate}
                exclusive
                onChange={(e, value) => value && handleDayButtonClick(value)}
                sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
              >
                {weekDates.map((date) => {
                  const isScheduled = isScheduledDay(date);
                  const isAvailable = isDateAvailable(date);

                  return (
                    <ToggleButton
                      key={date.toISOString()}
                      value={date}
                      disabled={!isAvailable}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        height: 80,
                        width: 65,
                        border: isScheduled ? "2px solid" : "1px solid",
                        borderColor: isScheduled ? "primary.main" : "divider",
                      }}
                    >
                      <Typography variant="caption">
                        {formatDayName(date)}
                      </Typography>
                      <Typography variant="h6">
                        {formatDayNumber(date)}
                      </Typography>
                      {isScheduled && (
                        <Typography variant="caption" color="primary">
                          Scheduled
                        </Typography>
                      )}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
            </Box>

            {/* Calendar for selecting other dates */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Or Select Another Date
              </Typography>
              <DateCalendar
                value={selectedDate}
                onChange={handleDateChange}
                disablePast
                sx={{ width: "100%" }}
                shouldDisableDate={(date) =>
                  !isDateAvailable(date) || isWeekend(date)
                }
              />
            </Box>
          </>
        )}

        {selectedDate && (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography>
              Selected Date: {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={() => onDateSelect(selectedDate)}
              sx={{ mt: 1 }}
            >
              Continue to Seat Selection
            </Button>
          </Box>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

export default BookingCalendar;
