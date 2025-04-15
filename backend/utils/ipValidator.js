// backend/utils/ipValidator.js
/**
 * Validates if the IP address belongs to the office network (192.168.1.x)
 * @param {string} ipAddress - IP address to validate
 * @returns {boolean} - True if IP is from office network
 */
const isOfficeNetwork = (ipAddress) => {
  // Handle IPv6 format that Node.js might return
  if (ipAddress.includes("::ffff:")) {
    ipAddress = ipAddress.split("::ffff:")[1];
  }

  // Check if IP starts with 192.168.1.
  return ipAddress.startsWith("192.168.1.");
};

/**
 * Validates if the SSID matches the office network
 * @param {string} ssid - Network SSID
 * @returns {boolean} - True if SSID matches office network
 */
const isOfficeSSID = (ssid) => {
  return ssid === "GigLabz";
};

module.exports = {
  isOfficeNetwork,
  isOfficeSSID,
};
