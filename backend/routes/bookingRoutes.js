// backend/routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { verifyToken } = require("../middleware/auth");
const { validateBookingRequest } = require("../middleware/validation");

// All routes require authentication
router.use(verifyToken);

// Booking routes
router.get("/seats/:date", bookingController.getAvailableSeats);
router.post("/", validateBookingRequest, bookingController.createBooking);
router.put("/:id/cancel", bookingController.cancelBooking);
router.get("/upcoming", bookingController.getUpcomingBookings);
router.get("/history", bookingController.getBookingHistory);

module.exports = router;
