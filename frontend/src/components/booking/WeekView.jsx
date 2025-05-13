// frontend/src/components/booking/WeekView.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Tooltip,
  IconButton,
  Stack,
  Card,
  CardContent,
  CardActionArea,
  Badge,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  EventSeat as EventSeatIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
  Today as TodayIcon,
} from "@mui/icons-material";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isPast,
  isWeekend,
} from "date-fns";
import useBookings from "../../hooks/useBookings";

const WeekView = ({
  onDateSelect,
  selectedDate,
  disabledDates = [],
  highlightedDates = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const today = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(today, { weekStartsOn: 1 })
  );

  const { myBookings, loading } = useBookings();
  const [bookedDates, setBookedDates] = useState([]);

  // Get days of current week
  const daysOfWeek = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  });

  // Extract dates from bookings
  useEffect(() => {
    if (myBookings && myBookings.length > 0) {
      const dates = myBookings
        .filter((booking) => booking.status !== "cancelled")
        .map((booking) => booking.bookingDate);
      setBookedDates(dates);
    }
  }, [myBookings]);

  // Navigate to previous week
  const handlePreviousWeek = () => {
    setCurrentWeekStart((prevStart) => addDays(prevStart, -7));
  };

  // Navigate to next week
  const handleNextWeek = () => {
    setCurrentWeekStart((prevStart) => addDays(prevStart, 7));
  };

  // Go to current week
  const handleCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
  };

  // Is a date selectable
  const isDateSelectable = (date) => {
    // Not selectable if weekend, in the past, or explicitly disabled
    return (
      !isWeekend(date) &&
      !isPast(date) &&
      !disabledDates.some((disabledDate) =>
        isSameDay(new Date(disabledDate), date)
      )
    );
  };

  // Is a date already booked
  const isDateBooked = (date) => {
    return bookedDates.some((bookedDate) =>
      isSameDay(new Date(bookedDate), date)
    );
  };

  // Is a date highlighted (for events, etc.)
  const isDateHighlighted = (date) => {
    return highlightedDates.some((highlightedDate) =>
      isSameDay(new Date(highlightedDate), date)
    );
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">
          {format(currentWeekStart, "MMM d")} -{" "}
          {format(
            endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
            "MMM d, yyyy"
          )}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Previous Week">
            <IconButton onClick={handlePreviousWeek} size="small">
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Current Week">
            <IconButton
              onClick={handleCurrentWeek}
              size="small"
              color="primary"
            >
              <TodayIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Next Week">
            <IconButton onClick={handleNextWeek} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Grid container spacing={1}>
        {daysOfWeek.map((day) => {
          const formattedDate = format(day, "yyyy-MM-dd");
          const dayIsToday = isToday(day);
          const dayIsSelected =
            selectedDate && isSameDay(new Date(selectedDate), day);
          const dayIsSelectable = isDateSelectable(day);
          const dayIsBooked = isDateBooked(day);
          const dayIsHighlighted = isDateHighlighted(day);
          const dayIsWeekend = isWeekend(day);

          return (
            <Grid
              item
              xs={isMobile ? 6 : "auto"}
              key={formattedDate}
              sx={{ flex: 1 }}
            >
              <Card
                variant={dayIsSelected ? "elevation" : "outlined"}
                elevation={dayIsSelected ? 3 : 0}
                sx={{
                  height: "100%",
                  bgcolor: dayIsSelected
                    ? "primary.light"
                    : dayIsToday
                    ? "action.selected"
                    : dayIsWeekend
                    ? "action.disabledBackground"
                    : "background.paper",
                  borderColor:
                    dayIsToday && !dayIsSelected ? "primary.main" : undefined,
                  transition: "all 0.2s ease",
                  borderRadius: 2,
                  overflow: "hidden",
                  opacity: !dayIsSelectable && !dayIsSelected ? 0.6 : 1,
                }}
              >
                <CardActionArea
                  onClick={() => dayIsSelectable && onDateSelect(formattedDate)}
                  disabled={!dayIsSelectable || dayIsBooked}
                  sx={{
                    height: "100%",
                    p: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    align="center"
                    color={
                      dayIsSelected ? "primary.contrastText" : "text.primary"
                    }
                    sx={{
                      fontWeight:
                        dayIsToday || dayIsSelected ? "bold" : "regular",
                    }}
                  >
                    {format(day, "EEE")}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      bgcolor: dayIsToday ? "primary.main" : "transparent",
                      my: 0.5,
                    }}
                  >
                    <Typography
                      variant="h6"
                      align="center"
                      color={
                        dayIsToday
                          ? "primary.contrastText"
                          : dayIsSelected
                          ? "primary.contrastText"
                          : "text.primary"
                      }
                    >
                      {format(day, "d")}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      mt: "auto",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {dayIsBooked && (
                      <Chip
                        icon={<EventSeatIcon />}
                        label="Booked"
                        size="small"
                        color="primary"
                        sx={{
                          height: 24,
                          "& .MuiChip-label": {
                            px: 1,
                            fontSize: "0.7rem",
                          },
                        }}
                      />
                    )}

                    {dayIsHighlighted && !dayIsBooked && (
                      <Chip
                        icon={<EventIcon />}
                        label="Available"
                        size="small"
                        color="success"
                        sx={{
                          height: 24,
                          "& .MuiChip-label": {
                            px: 1,
                            fontSize: "0.7rem",
                          },
                        }}
                      />
                    )}

                    {dayIsWeekend && (
                      <Typography variant="caption" color="text.secondary">
                        Weekend
                      </Typography>
                    )}
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mt: 2,
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "primary.main",
              mr: 0.5,
            }}
          />
          <Typography variant="caption">Booked</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "success.main",
              mr: 0.5,
            }}
          />
          <Typography variant="caption">Available</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "action.disabledBackground",
              mr: 0.5,
            }}
          />
          <Typography variant="caption">Unavailable</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default WeekView;
