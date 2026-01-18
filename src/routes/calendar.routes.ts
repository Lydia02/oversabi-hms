import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create event
router.post(
  '/',
  calendarController.createEvent.bind(calendarController)
);

// Get my events (with date range)
router.get(
  '/my-events',
  calendarController.getMyEvents.bind(calendarController)
);

// Get today's events
router.get(
  '/today',
  calendarController.getTodaysEvents.bind(calendarController)
);

// Get upcoming events
router.get(
  '/upcoming',
  calendarController.getUpcomingEvents.bind(calendarController)
);

// Get month events
router.get(
  '/month/:year/:month',
  calendarController.getMonthEvents.bind(calendarController)
);

// Get day events
router.get(
  '/day/:date',
  calendarController.getDayEvents.bind(calendarController)
);

// Get event by ID
router.get(
  '/:id',
  calendarController.getEventById.bind(calendarController)
);

// Update event
router.patch(
  '/:id',
  calendarController.updateEvent.bind(calendarController)
);

// Delete event
router.delete(
  '/:id',
  calendarController.deleteEvent.bind(calendarController)
);

// Complete event
router.post(
  '/:id/complete',
  calendarController.completeEvent.bind(calendarController)
);

// Cancel event
router.post(
  '/:id/cancel',
  calendarController.cancelEvent.bind(calendarController)
);

// Reschedule event
router.post(
  '/:id/reschedule',
  calendarController.rescheduleEvent.bind(calendarController)
);

export default router;
