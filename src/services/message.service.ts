import { collections } from '../config/firebase.js';
import {
  Message,
  MessageStatus,
  Conversation,
  ConversationParticipant,
  MessageAttachment,
  UserRole
} from '../types/index.js';
import { generateId, parsePagination } from '../utils/helpers.js';
import { NotFoundError } from '../utils/errors.js';

export interface SendMessageData {
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  receiverId: string;
  receiverRole: UserRole;
  receiverName: string;
  content: string;
  attachments?: MessageAttachment[];
}

export interface CreateConversationData {
  participants: ConversationParticipant[];
}

export class MessageService {
  /**
   * Get or create conversation between two users
   */
  async getOrCreateConversation(
    participant1: ConversationParticipant,
    participant2: ConversationParticipant
  ): Promise<Conversation> {
    // Check if conversation already exists
    const existingSnapshot = await collections.conversations
      .where('participants', 'array-contains', { userId: participant1.userId, name: participant1.name, role: participant1.role })
      .get();

    for (const doc of existingSnapshot.docs) {
      const conv = doc.data() as Conversation;
      const hasParticipant2 = conv.participants.some(p => p.userId === participant2.userId);
      if (hasParticipant2) {
        return conv;
      }
    }

    // Create new conversation
    const conversationId = generateId();
    const now = new Date();

    const conversation: Conversation = {
      id: conversationId,
      participants: [participant1, participant2],
      unreadCount: {
        [participant1.userId]: 0,
        [participant2.userId]: 0
      },
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    await collections.conversations.doc(conversationId).set(conversation);

    return conversation;
  }

  /**
   * Send a message
   */
  async sendMessage(data: SendMessageData): Promise<Message> {
    // Get or create conversation
    const conversation = await this.getOrCreateConversation(
      { userId: data.senderId, name: data.senderName, role: data.senderRole },
      { userId: data.receiverId, name: data.receiverName, role: data.receiverRole }
    );

    const messageId = generateId();
    const now = new Date();

    const message: Message = {
      id: messageId,
      conversationId: conversation.id,
      senderId: data.senderId,
      senderRole: data.senderRole,
      senderName: data.senderName,
      receiverId: data.receiverId,
      receiverRole: data.receiverRole,
      content: data.content,
      attachments: data.attachments,
      status: MessageStatus.SENT,
      createdAt: now,
      updatedAt: now
    };

    await collections.messages.doc(messageId).set(message);

    // Update conversation
    const currentUnread = conversation.unreadCount[data.receiverId] || 0;
    await collections.conversations.doc(conversation.id).update({
      lastMessage: data.content,
      lastMessageAt: now,
      [`unreadCount.${data.receiverId}`]: currentUnread + 1,
      updatedAt: now
    });

    return message;
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: string): Promise<Message> {
    const doc = await collections.messages.doc(messageId).get();

    if (!doc.exists) {
      throw new NotFoundError('Message not found');
    }

    return doc.data() as Message;
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(
    conversationId: string,
    page?: number,
    limit?: number
  ): Promise<{ messages: Message[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    const countSnapshot = await collections.messages
      .where('conversationId', '==', conversationId)
      .count()
      .get();
    const total = countSnapshot.data().count;

    const snapshot = await collections.messages
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const messages = snapshot.docs.map(doc => doc.data() as Message);

    return { messages, total };
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const snapshot = await collections.conversations
      .where('isActive', '==', true)
      .orderBy('lastMessageAt', 'desc')
      .get();

    const conversations = snapshot.docs
      .map(doc => doc.data() as Conversation)
      .filter(conv => conv.participants.some(p => p.userId === userId));

    return conversations;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    // Get unread messages for this user
    const snapshot = await collections.messages
      .where('conversationId', '==', conversationId)
      .where('receiverId', '==', userId)
      .where('status', '!=', MessageStatus.READ)
      .get();

    const batch = collections.messages.firestore.batch();
    const now = new Date();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: MessageStatus.READ,
        readAt: now,
        updatedAt: now
      });
    });

    await batch.commit();

    // Reset unread count for user
    await collections.conversations.doc(conversationId).update({
      [`unreadCount.${userId}`]: 0,
      updatedAt: now
    });
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const snapshot = await collections.messages
      .where('receiverId', '==', userId)
      .where('status', '!=', MessageStatus.READ)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId: string): Promise<void> {
    await collections.messages.doc(messageId).update({
      content: '[Message deleted]',
      attachments: [],
      updatedAt: new Date()
    });
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: string): Promise<Conversation> {
    const doc = await collections.conversations.doc(conversationId).get();

    if (!doc.exists) {
      throw new NotFoundError('Conversation not found');
    }

    return doc.data() as Conversation;
  }
}

export const messageService = new MessageService();
