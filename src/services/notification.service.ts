import { collections } from '../config/firebase.js';
import { Notification, NotificationType, UserRole } from '../types/index.js';
import { generateId } from '../utils/helpers.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

interface CreateNotificationData {
  userId: string;
  userUniqueId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedReportId?: string;
  relatedDocumentId?: string;
  actionUrl?: string;
  senderId?: string;
  senderName?: string;
  senderRole?: UserRole;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const now = new Date();
    const notificationId = generateId();

    const notification: Notification = {
      id: notificationId,
      userId: data.userId,
      userUniqueId: data.userUniqueId,
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: false,
      relatedReportId: data.relatedReportId,
      relatedDocumentId: data.relatedDocumentId,
      actionUrl: data.actionUrl,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      createdAt: now,
      updatedAt: now
    };

    await collections.notifications.doc(notificationId).set(notification);
    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const offset = (page - 1) * limit;

    let query = collections.notifications
      .where('userId', '==', userId);

    if (unreadOnly) {
      query = query.where('isRead', '==', false);
    }

    query = query.orderBy('createdAt', 'desc');

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Get unread count
    const unreadSnapshot = await collections.notifications
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();
    const unreadCount = unreadSnapshot.size;

    // Get paginated results
    const snapshot = await query
      .limit(limit)
      .offset(offset)
      .get();

    const notifications = snapshot.docs.map(doc => doc.data() as Notification);

    return { notifications, total, unreadCount };
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(notificationId: string, userId: string): Promise<Notification> {
    const notifSnapshot = await collections.notifications.doc(notificationId).get();

    if (!notifSnapshot.exists) {
      throw new NotFoundError('Notification not found');
    }

    const notification = notifSnapshot.data() as Notification;

    // Check if notification belongs to user
    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this notification');
    }

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notifSnapshot = await collections.notifications.doc(notificationId).get();

    if (!notifSnapshot.exists) {
      throw new NotFoundError('Notification not found');
    }

    const notification = notifSnapshot.data() as Notification;

    // Check if notification belongs to user
    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this notification');
    }

    await collections.notifications.doc(notificationId).set({
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    const updatedNotif = await collections.notifications.doc(notificationId).get();
    return updatedNotif.data() as Notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const snapshot = await collections.notifications
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();

    const batch = collections.notifications.firestore.batch();
    const now = new Date();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: now,
        updatedAt: now
      });
    });

    await batch.commit();
    return snapshot.size;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notifSnapshot = await collections.notifications.doc(notificationId).get();

    if (!notifSnapshot.exists) {
      throw new NotFoundError('Notification not found');
    }

    const notification = notifSnapshot.data() as Notification;

    // Check if notification belongs to user
    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this notification');
    }

    await collections.notifications.doc(notificationId).delete();
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<number> {
    const snapshot = await collections.notifications
      .where('userId', '==', userId)
      .get();

    const batch = collections.notifications.firestore.batch();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  }

  /**
   * Create notification when a new medical report is created
   */
  async notifyNewReport(
    patientId: string,
    patientUniqueId: string,
    reportId: string,
    doctorName: string,
    reportTitle: string
  ): Promise<Notification> {
    return await this.createNotification({
      userId: patientId,
      userUniqueId: patientUniqueId,
      type: NotificationType.NEW_REPORT,
      title: 'New Medical Report',
      message: `Dr. ${doctorName} has created a new report: ${reportTitle}`,
      relatedReportId: reportId,
      actionUrl: `/patient-reports/${reportId}`
    });
  }

  /**
   * Create notification when a medical report is updated
   */
  async notifyReportUpdated(
    patientId: string,
    patientUniqueId: string,
    reportId: string,
    doctorName: string,
    reportTitle: string
  ): Promise<Notification> {
    return await this.createNotification({
      userId: patientId,
      userUniqueId: patientUniqueId,
      type: NotificationType.REPORT_UPDATED,
      title: 'Medical Report Updated',
      message: `Dr. ${doctorName} has updated your report: ${reportTitle}`,
      relatedReportId: reportId,
      actionUrl: `/patient-reports/${reportId}`
    });
  }

  /**
   * Create notification when a document is uploaded
   */
  async notifyDocumentUploaded(
    patientId: string,
    patientUniqueId: string,
    documentId: string,
    uploaderName: string,
    documentTitle: string
  ): Promise<Notification> {
    return await this.createNotification({
      userId: patientId,
      userUniqueId: patientUniqueId,
      type: NotificationType.DOCUMENT_UPLOADED,
      title: 'New Document Uploaded',
      message: `${uploaderName} has uploaded a new document: ${documentTitle}`,
      relatedDocumentId: documentId,
      actionUrl: `/documents/${documentId}`
    });
  }
}

export const notificationService = new NotificationService();
