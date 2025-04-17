// frontend/src/components/booking/SeatSelector.jsx
import React from "react";
import { Grid, Card, CardContent, Typography, Box, Chip } from "@mui/material";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const SeatSelector = ({ seats, selectedSeatId, onSeatSelect }) => {
  if (!seats || seats.length === 0) {
    return null;
  }

  // Group seats into rows (5 per row) instead of by zone
  const organizeSeatsIntoRows = (allSeats, itemsPerRow = 5) => {
    const rows = [];
    for (let i = 0; i < allSeats.length; i += itemsPerRow) {
      rows.push(allSeats.slice(i, i + itemsPerRow));
    }
    return rows;
  };

  const seatRows = organizeSeatsIntoRows(seats);

  return (
    <>
      {seatRows.map((row, rowIndex) => (
        <Box key={rowIndex} sx={{ mb: 4 }}>
          <Grid container spacing={2} justifyContent="center">
            {row.map((seat) => (
              <Grid item key={seat.id}>
                <Card
                  sx={{
                    cursor: "pointer",
                    borderColor:
                      selectedSeatId === seat.id
                        ? "primary.main"
                        : "transparent",
                    borderWidth: 2,
                    borderStyle: "solid",
                    transition: "all 0.2s ease",
                    height: "100%",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => onSeatSelect(seat.id)}
                  raised={selectedSeatId === seat.id}
                >
                  <CardContent sx={{ textAlign: "center", p: 2 }}>
                    <EventSeatIcon
                      color={selectedSeatId === seat.id ? "primary" : "action"}
                      sx={{ fontSize: 40, mb: 1 }}
                    />
                    <Typography variant="h6" gutterBottom>
                      Seat {seat.seatNumber}
                    </Typography>
                    {seat.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {seat.description}
                      </Typography>
                    )}
                    <Chip
                      label={
                        selectedSeatId === seat.id ? "Selected" : "Available"
                      }
                      size="small"
                      color={selectedSeatId === seat.id ? "primary" : "success"}
                      icon={<CheckCircleOutlineIcon />}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </>
  );
};

export default SeatSelector;
