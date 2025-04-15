// backend/utils/dateUtils.js
/**
 * Date utility functions for scheduling and booking operations
 */

// Format date as YYYY-MM-DD 
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Get current week number (ISO week number, 1-53)
const getCurrentWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000; // ms in one week
  return Math.ceil((diff + start.getDay() * 86400000) / oneWeek);
};

// Get start date of current week (Sunday)
const getStartOfWeek = (date = new Date()) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day); // Set to Sunday
  result.setHours(0, 0, 0, 0);
  return result;
};

// Get end date of current week (Saturday)
const getEndOfWeek = (date = new Date()) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (6 - day)); // Set to Saturday
  result.setHours(23, 59, 59, 999);
  return result;
};

// Get dates for next week (Sunday to Saturday)
const getNextWeekDates = () => {
  const today = new Date();
  const nextWeekStart = new Date(today);
  nextWeekStart.setDate(today.getDate() + (7 - today.getDay())); // Next Sunday
  nextWeekStart.setHours(0, 0, 0, 0);
  
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // Next Saturday
  nextWeekEnd.setHours(23, 59, 59, 999);
  
  return {
    startDate: nextWeekStart,
    endDate: nextWeekEnd
  };
};

// Get a specific day in the next week
// dayOfWeek: 0 = Sunday, 1 = Monday, etc.
const getDayInNextWeek = (dayOfWeek) => {
  const { startDate } = getNextWeekDates();
  const result = new Date(startDate);
  result.setDate(startDate.getDate() + dayOfWeek);
  return result;
};

// Get an array of dates between start and end (inclusive)
const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  const currentDate = new Date(startDate);
  
  // Strip time information
  currentDate.setHours(0, 0, 0, 0);
  const endDateNoTime = new Date(endDate);
  endDateNoTime.setHours(0, 0, 0, 0);
  
  while (currentDate <= endDateNoTime) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Check if date is in the past
const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Check if date is a weekday (Monday-Friday)
const isWeekday = (date) => {
  const day = date.getDay();
  return day > 0 && day < 6; // 0 = Sunday, 6 = Saturday
};

// Get today's date formatted as YYYY-MM-DD
const getToday = () => {
  return formatDate(new Date());
};

module.exports = {
  formatDate,
  getCurrentWeekNumber,
  getStartOfWeek,
  getEndOfWeek,
  getNextWeekDates,
  getDayInNextWeek,
  getDatesBetween,
  isPastDate,
  isWeekday,
  getToday
};