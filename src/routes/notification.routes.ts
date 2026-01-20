import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', notificationController.getMyNotifications);
router.get('/:notificationId', notificationController.getNotificationById);
router.put('/read-all', notificationController.markAllNotificationsAsRead);
router.put('/:notificationId/read', notificationController.markNotificationAsRead);
router.delete('/', notificationController.deleteAllNotifications);
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;
