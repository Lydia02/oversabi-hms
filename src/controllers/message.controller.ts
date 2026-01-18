import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service.js';
import { UserRole } from '../types/index.js';
import { getString, getOptionalString } from '../utils/helpers.js';

export class MessageController {
  /**
   * Send a message
   */
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { receiverId, receiverRole, receiverName, content, attachments } = req.body;

      const message = await messageService.sendMessage({
        senderId: user.userId,
        senderRole: user.role as UserRole,
        senderName: req.body.senderName || 'User',
        receiverId,
        receiverRole,
        receiverName,
        content,
        attachments
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversationId = getString(req.params.conversationId);
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '50');

      const result = await messageService.getConversationMessages(conversationId, page, limit);

      res.json({
        success: true,
        message: 'Messages retrieved successfully',
        data: result.messages,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's conversations
   */
  async getMyConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const conversations = await messageService.getUserConversations(user.userId);

      res.json({
        success: true,
        message: 'Conversations retrieved successfully',
        data: conversations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const conversationId = getString(req.params.conversationId);

      await messageService.markMessagesAsRead(conversationId, user.userId);

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const count = await messageService.getUnreadCount(user.userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messageId = getString(req.params.messageId);
      await messageService.deleteMessage(messageId);

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversationId = getString(req.params.conversationId);
      const conversation = await messageService.getConversationById(conversationId);

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
