// frontend/src/components/booking/SeatSelector.jsx
import React from "react";
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Badge,
  Tooltip,
  Stack
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
  
  // Sort seats by seat number for consistent display
  const sortedSeats = [...allSeats].sort((a, b) => a.seatNumber - b.seatNumber);
  
  // Split the seats for two rows (fixed layout)
  const firstRowSeats = sortedSeats.slice(0, 5);
  const secondRowSeats = sortedSeats.slice(5, 10);
  
  // Check if a seat is booked
  const isSeatBooked = (seatId) => {
    return bookedSeatMap[seatId] !== undefined;
  };
  
  // Get information about who booked the seat
  const getBookedByInfo = (seatId) => {
    const seat = bookedSeatMap[seatId];
    return seat && seat.bookedBy ? seat.bookedBy : 'Another employee';
  };

  const SeatItem = ({ seat }) => {
    const isBooked = isSeatBooked(seat.id);
    const isSelected = selectedSeatId === seat.id;
    
    return (
      <Box 
        sx={{ 
          flex: '0 0 20%', // Fixed width: 20% (5 seats per row)
          display: 'flex',
          justifyContent: 'center',
          p: 1,
          minWidth: 0, // Allow shrinking below content size
          maxWidth: '20%' // Ensure it never takes more than 20%
        }}
      >
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
              width: '100%',
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
            <CardContent sx={{ 
              textAlign: "center", 
              p: { xs: 0.5, sm: 1, md: 2 },
              '&:last-child': { pb: { xs: 0.5, sm: 1, md: 2 } } // Override MUI's default padding
            }}>
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
                    sx={{ fontSize: { xs: 24, sm: 30, md: 40 }, mb: 0.5 }}
                  />
                </Badge>
              ) : (
                <EventSeatIcon
                  color={isSelected ? "primary" : "action"}
                  sx={{ fontSize: { xs: 24, sm: 30, md: 40 }, mb: 0.5 }}
                />
              )}
              
              <Typography variant="body1" sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.85rem', md: '1rem' },
                mb: { xs: 0.25, sm: 0.5, md: 1 }
              }}>
                Seat {seat.seatNumber}
              </Typography>
              
              {seat.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ 
                    mb: 1,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {seat.description}
                </Typography>
              )}
              
              <Chip
                label={isBooked ? "Booked" : isSelected ? "Selected" : "Available"}
                size="small"
                color={isBooked ? "error" : isSelected ? "primary" : "success"}
                icon={isBooked ? <BlockIcon /> : <CheckCircleOutlineIcon />}
                sx={{ 
                  height: { xs: '22px', sm: '26px', md: '32px' },
                  '& .MuiChip-label': { 
                    fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8125rem' },
                    padding: { xs: '0 4px', sm: '0 8px' }
                  },
                  '& .MuiChip-icon': {
                    fontSize: { xs: '0.75rem', sm: '1rem' }
                  }
                }}
              />
            </CardContent>
          </Card>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box>
      {/* First Row */}
      <Stack 
        direction="row" 
        sx={{ 
          mb: 3,
          flexWrap: 'nowrap' // Never wrap to maintain 5 items per row
        }}
      >
        {firstRowSeats.map(seat => (
          <SeatItem key={seat.id} seat={seat} />
        ))}
      </Stack>
      
      {/* Second Row */}
      <Stack 
        direction="row" 
        sx={{ 
          mb: 3,
          flexWrap: 'nowrap' // Never wrap to maintain 5 items per row
        }}
      >
        {secondRowSeats.map(seat => (
          <SeatItem key={seat.id} seat={seat} />
        ))}
      </Stack>
    </Box>
  );
};

export default SeatSelector;