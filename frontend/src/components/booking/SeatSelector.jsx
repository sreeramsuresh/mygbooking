// frontend/src/components/booking/SeatSelector.jsx
import React from "react";
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Badge,
  Tooltip
} from "@mui/material";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import PersonIcon from "@mui/icons-material/Person";

const SeatSelector = ({ seats, bookedSeats = [], selectedSeatId, onSeatSelect }) => {
  // Combine available and booked seats
  const allSeats = [...seats];
  
  // Add booked seats that might not be in the available seats list
  bookedSeats.forEach(bookedSeat => {
    if (!allSeats.some(seat => seat.id === bookedSeat.id)) {
      allSeats.push(bookedSeat);
    }
  });
  
  if (allSeats.length === 0) {
    return null;
  }
  
  // Create a map of booked seat IDs for quick lookup
  const bookedSeatMap = bookedSeats.reduce((map, seat) => {
    map[seat.id] = seat;
    return map;
  }, {});
  
  // Organize seats into rows (5 per row)
  const organizeSeatsIntoRows = (allSeats, itemsPerRow = 5) => {
    // Sort seats by seat number for consistent display
    const sortedSeats = [...allSeats].sort((a, b) => a.seatNumber - b.seatNumber);
    
    const rows = [];
    for (let i = 0; i < sortedSeats.length; i += itemsPerRow) {
      rows.push(sortedSeats.slice(i, i + itemsPerRow));
    }
    return rows;
  };

  const seatRows = organizeSeatsIntoRows(allSeats);
  
  // Check if a seat is booked
  const isSeatBooked = (seatId) => {
    return bookedSeatMap[seatId] !== undefined;
  };
  
  // Get information about who booked the seat
  const getBookedByInfo = (seatId) => {
    const seat = bookedSeatMap[seatId];
    return seat && seat.bookedBy ? seat.bookedBy : 'Another employee';
  };

  return (
    <>
      {seatRows.map((row, rowIndex) => (
        <Box key={rowIndex} sx={{ mb: 4 }}>
          <Grid container spacing={2} justifyContent="center">
            {row.map((seat) => {
              const isBooked = isSeatBooked(seat.id);
              const isSelected = selectedSeatId === seat.id;
              
              return (
                <Grid item key={seat.id}>
                  <Tooltip
                    title={isBooked ? `Booked by ${getBookedByInfo(seat.id)}` : ''}
                    placement="top"
                    arrow
                  >
                    <Card
                      sx={{
                        cursor: isBooked ? "default" : "pointer",
                        borderColor: isSelected ? "primary.main" : "transparent",
                        borderWidth: 2,
                        borderStyle: "solid",
                        transition: "all 0.2s ease",
                        height: "100%",
                        opacity: 1,
                        backgroundColor: isBooked ? 'rgba(244, 67, 54, 0.15)' : 'white',
                        "&:hover": {
                          transform: isBooked ? "none" : "translateY(-4px)",
                          boxShadow: isBooked ? 1 : 3,
                        },
                      }}
                      onClick={() => !isBooked && onSeatSelect(seat.id)}
                      raised={isSelected && !isBooked}
                    >
                      <CardContent sx={{ textAlign: "center", p: 2 }}>
                        {isBooked ? (
                          <Badge
                            badgeContent={<PersonIcon fontSize="small" />}
                            color="error"
                            overlap="circular"
                            anchorOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                            }}
                          >
                            <EventSeatIcon
                              color="error"
                              sx={{ fontSize: 40, mb: 1 }}
                            />
                          </Badge>
                        ) : (
                          <EventSeatIcon
                            color={isSelected ? "primary" : "action"}
                            sx={{ fontSize: 40, mb: 1 }}
                          />
                        )}
                        
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
                          label={isBooked ? "Booked" : isSelected ? "Selected" : "Available"}
                          size="small"
                          color={isBooked ? "error" : isSelected ? "primary" : "success"}
                          icon={isBooked ? <BlockIcon /> : <CheckCircleOutlineIcon />}
                        />
                      </CardContent>
                    </Card>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </>
  );
};

export default SeatSelector;