import { collections } from '../config/firebase.js';
import { Document, DocumentType, UserRole } from '../types/index.js';
import { generateId } from '../utils/helpers.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';

interface CreateDocumentData {
  userId: string;
  userUniqueId: string;
  uploadedBy: string;
  uploadedByUniqueId: string;
  uploadedByName: string;
  uploadedByRole: UserRole;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  relatedReportId?: string;
  isPublic?: boolean;
  sharedWith?: string[];
}

export class DocumentService {
  /**
   * Create a new document
   */
  async createDocument(data: CreateDocumentData): Promise<Document> {
    const now = new Date();
    const documentId = generateId();

    const document: Document = {
      id: documentId,
      userId: data.userId,
      userUniqueId: data.userUniqueId,
      uploadedBy: data.uploadedBy,
      uploadedByUniqueId: data.uploadedByUniqueId,
      uploadedByName: data.uploadedByName,
      uploadedByRole: data.uploadedByRole,
      fileName: data.fileName,
      originalFileName: data.originalFileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      fileUrl: data.fileUrl,
      documentType: data.documentType,
      title: data.title,
      description: data.description,
      relatedReportId: data.relatedReportId,
      isPublic: data.isPublic || false,
      sharedWith: data.sharedWith || [],
      createdAt: now,
      updatedAt: now
    };

    await collections.documents.doc(documentId).set(document);
    return document;
  }

  /**
   * Get documents for a user
   */
  async getUserDocuments(
    userId: string,
    role: UserRole,
    page: number = 1,
    limit: number = 10
  ): Promise<{ documents: Document[]; total: number }> {
    const offset = (page - 1) * limit;

    let query = collections.documents
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Get paginated results
    const snapshot = await query
      .limit(limit)
      .offset(offset)
      .get();

    const documents = snapshot.docs.map(doc => doc.data() as Document);

    return { documents, total };
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(documentId: string, requestingUserId: string, requestingUserRole: UserRole): Promise<Document> {
    const docSnapshot = await collections.documents.doc(documentId).get();

    if (!docSnapshot.exists) {
      throw new NotFoundError('Document not found');
    }

    const document = docSnapshot.data() as Document;

    // Check access permissions
    const hasAccess = 
      document.userId === requestingUserId || // Owner
      document.uploadedBy === requestingUserId || // Uploader
      document.isPublic || // Public document
      document.sharedWith.includes(requestingUserId) || // Shared with user
      requestingUserRole === UserRole.DOCTOR; // Doctors can view all documents

    if (!hasAccess) {
      throw new ForbiddenError('You do not have permission to access this document');
    }

    return document;
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string, role: UserRole): Promise<void> {
    const docSnapshot = await collections.documents.doc(documentId).get();

    if (!docSnapshot.exists) {
      throw new NotFoundError('Document not found');
    }

    const document = docSnapshot.data() as Document;

    // Only the uploader or document owner can delete
    if (document.uploadedBy !== userId && document.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this document');
    }

    await collections.documents.doc(documentId).delete();
  }

  /**
   * Get documents by type
   */
  async getDocumentsByType(
    userId: string,
    documentType: DocumentType,
    page: number = 1,
    limit: number = 10
  ): Promise<{ documents: Document[]; total: number }> {
    const offset = (page - 1) * limit;

    let query = collections.documents
      .where('userId', '==', userId)
      .where('documentType', '==', documentType)
      .orderBy('createdAt', 'desc');

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Get paginated results
    const snapshot = await query
      .limit(limit)
      .offset(offset)
      .get();

    const documents = snapshot.docs.map(doc => doc.data() as Document);

    return { documents, total };
  }

  /**
   * Share document with users
   */
  async shareDocument(documentId: string, requestingUserId: string, userIdsToShareWith: string[]): Promise<Document> {
    const docSnapshot = await collections.documents.doc(documentId).get();

    if (!docSnapshot.exists) {
      throw new NotFoundError('Document not found');
    }

    const document = docSnapshot.data() as Document;

    // Only owner or uploader can share
    if (document.userId !== requestingUserId && document.uploadedBy !== requestingUserId) {
      throw new ForbiddenError('You do not have permission to share this document');
    }

    // Add new users to sharedWith array (avoid duplicates)
    const updatedSharedWith = Array.from(new Set([...document.sharedWith, ...userIdsToShareWith]));

    await collections.documents.doc(documentId).set({
      sharedWith: updatedSharedWith,
      updatedAt: new Date()
    }, { merge: true });

    const updatedDoc = await collections.documents.doc(documentId).get();
    return updatedDoc.data() as Document;
  }

  /**
   * Get documents shared with a user
   */
  async getSharedDocuments(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ documents: Document[]; total: number }> {
    const offset = (page - 1) * limit;

    let query = collections.documents
      .where('sharedWith', 'array-contains', userId)
      .orderBy('createdAt', 'desc');

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Get paginated results
    const snapshot = await query
      .limit(limit)
      .offset(offset)
      .get();

    const documents = snapshot.docs.map(doc => doc.data() as Document);

    return { documents, total };
  }
}

export const documentService = new DocumentService();
