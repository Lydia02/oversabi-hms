import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Send message
router.post(
  '/',
  messageController.sendMessage.bind(messageController)
);

// Get my conversations
router.get(
  '/conversations',
  messageController.getMyConversations.bind(messageController)
);

// Get unread count
router.get(
  '/unread-count',
  messageController.getUnreadCount.bind(messageController)
);

// Get conversation by ID
router.get(
  '/conversations/:conversationId',
  messageController.getConversation.bind(messageController)
);

// Get conversation messages
router.get(
  '/conversations/:conversationId/messages',
  messageController.getConversationMessages.bind(messageController)
);

// Mark messages as read
router.post(
  '/conversations/:conversationId/read',
  messageController.markAsRead.bind(messageController)
);

// Delete message
router.delete(
  '/:messageId',
  messageController.deleteMessage.bind(messageController)
);

export default router;
