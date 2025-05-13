// frontend/src/components/booking/BookingCalendar.jsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import format from "date-fns/format";
import addDays from "date-fns/addDays";
import isSameDay from "date-fns/isSameDay";
import isWeekend from "date-fns/isWeekend";
import isAfter from "date-fns/isAfter";
import isBefore from "date-fns/isBefore";
import startOfWeek from "date-fns/startOfWeek";
import endOfWeek from "date-fns/endOfWeek";

const BookingCalendar = ({
  onDateSelect,
  minDate,
  maxDate,
  highlightedDates = [],
  disabledDates = [],
}) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewingWeekStart, setViewingWeekStart] = useState(
    startOfWeek(today, { weekStartsOn: 1 })
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // If minDate not provided, default to today
  const effectiveMinDate = minDate || today;

  // If maxDate not provided, default to 30 days from today
  const effectiveMaxDate = maxDate || addDays(today, 30);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(format(date, "yyyy-MM-dd"));
    }
  };

  const handlePreviousWeek = () => {
    setViewingWeekStart(addDays(viewingWeekStart, -7));
  };

  const handleNextWeek = () => {
    setViewingWeekStart(addDays(viewingWeekStart, 7));
  };

  const handleDatePickerChange = (date) => {
    if (date) {
      setViewingWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    }
  };

  // Generate weekdays for the current viewing week
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(viewingWeekStart, i);
    weekDays.push(date);
  }

  // Check if a date is disabled
  const isDateDisabled = (date) => {
    // Check if weekend and not explicitly enabled
    if (
      isWeekend(date) &&
      !highlightedDates.some((d) => isSameDay(new Date(d), date))
    ) {
      return true;
    }

    // Check if explicitly disabled
    if (disabledDates.some((d) => isSameDay(new Date(d), date))) {
      return true;
    }

    // Check if outside allowed range
    if (isBefore(date, effectiveMinDate) || isAfter(date, effectiveMaxDate)) {
      return true;
    }

    return false;
  };

  // Check if previous/next week buttons should be disabled
  const isPreviousWeekDisabled = isBefore(viewingWeekStart, effectiveMinDate);
  const isNextWeekDisabled = isAfter(viewingWeekStart, effectiveMaxDate);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h6">Select Booking Date</Typography>
          <DatePicker
            value={viewingWeekStart}
            onChange={handleDatePickerChange}
            minDate={effectiveMinDate}
            maxDate={effectiveMaxDate}
            label="Jump to Week"
            slotProps={{ textField: { size: "small" } }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Button
            onClick={handlePreviousWeek}
            disabled={isPreviousWeekDisabled}
            startIcon={<ArrowBackIosIcon />}
            size="small"
          >
            Previous
          </Button>
          <Typography variant="subtitle1">
            {format(viewingWeekStart, "MMM d")} -{" "}
            {format(
              endOfWeek(viewingWeekStart, { weekStartsOn: 1 }),
              "MMM d, yyyy"
            )}
          </Typography>
          <Button
            onClick={handleNextWeek}
            disabled={isNextWeekDisabled}
            endIcon={<ArrowForwardIosIcon />}
            size="small"
          >
            Next
          </Button>
        </Box>

        <Grid container spacing={1}>
          {weekDays.map((date) => {
            const formattedDate = format(date, "yyyy-MM-dd");
            const isHighlighted = highlightedDates.includes(formattedDate);
            const isDisabled = isDateDisabled(date);
            const isSelected = selectedDate && isSameDay(selectedDate, date);
            const isToday = isSameDay(date, today);

            return (
              <Grid item xs={isMobile ? 6 : true} key={formattedDate}>
                <Button
                  variant={
                    isSelected
                      ? "contained"
                      : isHighlighted
                      ? "outlined"
                      : "text"
                  }
                  color={isHighlighted ? "primary" : "inherit"}
                  disabled={isDisabled}
                  fullWidth
                  onClick={() => handleDateSelect(date)}
                  sx={{
                    p: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    borderRadius: 2,
                    height: "100%",
                    borderColor:
                      isToday && !isSelected ? "primary.main" : undefined,
                    borderWidth: isToday && !isSelected ? 1 : undefined,
                    borderStyle: isToday && !isSelected ? "solid" : undefined,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {format(date, "EEE")}
                  </Typography>
                  <Typography variant="h6">{format(date, "d")}</Typography>
                  {isToday && (
                    <Chip
                      label="Today"
                      size="small"
                      color="primary"
                      sx={{ mt: 0.5, height: 20 }}
                    />
                  )}
                </Button>
              </Grid>
            );
          })}
        </Grid>

        {selectedDate && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Selected date: {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </Alert>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

export default BookingCalendar;
