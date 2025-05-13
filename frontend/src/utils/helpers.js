// frontend/src/utils/helpers.js

/**
 * Format date to a string
 * @param {Date|string} date - Date object or string to format
 * @param {string} formatStr - Format string (default: yyyy-MM-dd)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = "yyyy-MM-dd") => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Simple date formatter for common formats
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");

    return formatStr
      .replace("yyyy", year)
      .replace("MM", month)
      .replace("dd", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Get week number from date
 * @param {Date|string} date - Date to get week number from
 * @returns {number} Week number (1-53)
 */
export const getWeekNumber = (date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Create a copy of the date
  const target = new Date(dateObj.valueOf());

  // ISO week starts on Monday
  const dayNumber = (dateObj.getDay() + 6) % 7;

  // Set target to the Thursday of this week
  target.setDate(target.getDate() - dayNumber + 3);

  // Get first Thursday of the year
  const firstThursday = new Date(target.getFullYear(), 0, 1);

  if (firstThursday.getDay() !== 4) {
    firstThursday.setMonth(0, 1 + ((4 - firstThursday.getDay() + 7) % 7));
  }

  // Calculate week number: 1 + number of weeks between target and first Thursday
  const weekDiff = target - firstThursday;
  const weekNumber = 1 + Math.floor(weekDiff / 604800000); // 7 * 24 * 3600 * 1000

  return weekNumber;
};

/**
 * Get human-readable time ago string
 * @param {Date|string} date - Date to get time ago from
 * @returns {string} Time ago string
 */
export const timeAgo = (date) => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const secondsAgo = Math.floor((now - dateObj) / 1000);

  if (secondsAgo < 60) {
    return "just now";
  }

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return `${minutesAgo} minute${minutesAgo !== 1 ? "s" : ""} ago`;
  }

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `${hoursAgo} hour${hoursAgo !== 1 ? "s" : ""} ago`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) {
    return `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
  }

  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo < 12) {
    return `${monthsAgo} month${monthsAgo !== 1 ? "s" : ""} ago`;
  }

  const yearsAgo = Math.floor(monthsAgo / 12);
  return `${yearsAgo} year${yearsAgo !== 1 ? "s" : ""} ago`;
};

/**
 * Truncate text to a specific length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add when truncated (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 100, suffix = "...") => {
  if (!text) return "";

  if (text.length <= length) {
    return text;
  }

  return text.substring(0, length) + suffix;
};

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header objects with title and key props
 * @returns {string} CSV string
 */
export const convertToCSV = (data, headers) => {
  if (!data || !data.length || !headers || !headers.length) {
    return "";
  }

  // Create header row
  const headerRow = headers.map((header) => `"${header.title}"`).join(",");

  // Create data rows
  const rows = data.map((item) => {
    return headers
      .map((header) => {
        const value =
          item[header.key] !== undefined && item[header.key] !== null
            ? item[header.key].toString()
            : "";
        // Escape double quotes and wrap in quotes
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  return [headerRow, ...rows].join("\n");
};

/**
 * Download data as a file
 * @param {string} content - File content
 * @param {string} fileName - File name
 * @param {string} contentType - Content type (default: 'text/csv')
 */
export const downloadFile = (content, fileName, contentType = "text/csv") => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
};

/**
 * Generate a random ID
 * @returns {string} Random ID
 */
export const generateId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Create an array of numbers in a range
 * @param {number} start - Start of range
 * @param {number} end - End of range
 * @returns {Array} Array of numbers
 */
export const range = (start, end) => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * Group array of objects by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};
