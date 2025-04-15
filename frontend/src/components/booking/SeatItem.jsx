import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { EventSeat as SeatIcon } from '@mui/icons-material';

const SeatItem = ({ seat, selectedSeat, onSeatSelect }) => {
  const isSelected = selectedSeat && selectedSeat.id === seat.id;
  
  const handleClick = () => {
    if (seat.available) {
      onSeatSelect(seat);
    }
  };
  
  // Determine style based on seat status
  const getSeatStyle = () => {
    if (!seat.available) {
      return {
        color: 'text.disabled',
        opacity: 0.7,
        cursor: 'not-allowed'
      };
    }
    
    if (isSelected) {
      return {
        color: 'primary.main',
        transform: 'scale(1.1)',
        cursor: 'pointer'
      };
    }
    
    return {
      color: 'success.main',
      cursor: 'pointer',
      '&:hover': {
        transform: 'scale(1.1)',
      }
    };
  };
  
  // Determine tooltip text
  const getTooltipText = () => {
    if (!seat.available) {
      return 'This seat is already booked';
    }
    
    if (isSelected) {
      return 'Your selected seat';
    }
    
    return `Seat #${seat.number} - Available`;
  };
  
  return (
    <Tooltip title={getTooltipText()}>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          ...getSeatStyle()
        }}
      >
        <SeatIcon sx={{ fontSize: 48 }} />
        <Typography variant="caption">
          Seat {seat.number}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default SeatItem;