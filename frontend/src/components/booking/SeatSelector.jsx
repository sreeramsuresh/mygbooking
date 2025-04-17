// frontend/src/components/booking/SeatSelector.jsx
import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const SeatSelector = ({ seats, selectedSeatId, onSeatSelect }) => {
  if (!seats || seats.length === 0) {
    return null;
  }

  // Group seats by area/zone if that information exists
  const seatsByZone = seats.reduce((zones, seat) => {
    const zone = seat.zone || 'Office'; // Default zone if none exists
    if (!zones[zone]) {
      zones[zone] = [];
    }
    zones[zone].push(seat);
    return zones;
  }, {});

  return (
    <>
      {Object.entries(seatsByZone).map(([zone, zoneSeats]) => (
        <Box key={zone} sx={{ mb: 4 }}>
          {Object.keys(seatsByZone).length > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocationOnIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">{zone}</Typography>
            </Box>
          )}
          
          <Grid container spacing={2}>
            {zoneSeats.map((seat) => (
              <Grid item xs={6} sm={4} md={3} key={seat.id}>
                <Card
                  sx={{
                    cursor: "pointer",
                    borderColor: selectedSeatId === seat.id ? "primary.main" : "transparent",
                    borderWidth: 2,
                    borderStyle: "solid",
                    transition: "all 0.2s ease",
                    height: '100%',
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
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {seat.description}
                      </Typography>
                    )}
                    <Chip
                      label={selectedSeatId === seat.id ? "Selected" : "Available"}
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