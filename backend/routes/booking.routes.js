// backend/routes/booking.routes.js
const express = require("express");
const controller = require("../controllers/booking.controller");
const { authJwt } = require("../middleware");

const router = express.Router();

// Apply middleware to all routes
router.use(authJwt.verifyToken);
router.use(authJwt.isActiveUser);

// Employee routes
router.post("/", controller.createBooking);
router.get("/my", controller.getMyBookings);
router.get("/my-weekly-status", controller.getMyWeeklyStatus);
router.get("/available-seats", controller.getAvailableSeats);
router.put("/:bookingId", controller.updateBooking);
router.delete("/:bookingId", controller.cancelBooking);
router.post("/:bookingId/check-in", controller.checkIn);
router.post("/:bookingId/check-out", controller.checkOut);
router.post("/ensure-auto-bookings", controller.ensureUserAutoBookings); // New endpoint for ensuring user auto-bookings

// Manager/Admin routes
router.get("/by-date", [authJwt.isManager], controller.getBookingsByDate);
router.post("/auto-bookings", [authJwt.isAdmin], controller.createAutoBookings);
// Only admins can create auto-bookings
router.post("/reset-auto-book", [authJwt.isAdmin], controller.resetAndAutoBook);

module.exports = router;
