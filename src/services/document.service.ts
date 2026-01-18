import { collections } from '../config/firebase.js';
import {
  Document,
  DocumentType,
  UserRole
} from '../types/index.js';
import { generateId, parsePagination } from '../utils/helpers.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateDocumentData {
  patientId: string;
  uploadedBy: string;
  uploadedByRole: UserRole;
  hospitalId?: string;
  visitId?: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isConfidential?: boolean;
}

export interface UpdateDocumentData {
  title?: string;
  description?: string;
  documentType?: DocumentType;
  isConfidential?: boolean;
}

export class DocumentService {
  /**
   * Create a new document record
   */
  async createDocument(data: CreateDocumentData): Promise<Document> {
    const documentId = generateId();
    const now = new Date();

    const document: Document = {
      id: documentId,
      patientId: data.patientId,
      uploadedBy: data.uploadedBy,
      uploadedByRole: data.uploadedByRole,
      hospitalId: data.hospitalId,
      visitId: data.visitId,
      documentType: data.documentType,
      title: data.title,
      description: data.description,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      isConfidential: data.isConfidential || false,
      createdAt: now,
      updatedAt: now
    };

    await collections.documents.doc(documentId).set(document);

    return document;
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<Document> {
    const doc = await collections.documents.doc(documentId).get();

    if (!doc.exists) {
      throw new NotFoundError('Document not found');
    }

    return doc.data() as Document;
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId: string, data: UpdateDocumentData): Promise<Document> {
    const document = await this.getDocumentById(documentId);

    const updatedDocument: Document = {
      ...document,
      ...data,
      updatedAt: new Date()
    };

    await collections.documents.doc(documentId).set(updatedDocument, { merge: true });

    return updatedDocument;
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.getDocumentById(documentId); // Verify exists
    await collections.documents.doc(documentId).delete();
  }

  /**
   * Get all documents for a patient
   */
  async getPatientDocuments(
    patientId: string,
    documentType?: DocumentType,
    page?: number,
    limit?: number
  ): Promise<{ documents: Document[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    let query = collections.documents.where('patientId', '==', patientId);

    if (documentType) {
      query = query.where('documentType', '==', documentType);
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const documents = snapshot.docs.map(doc => doc.data() as Document);

    return { documents, total };
  }

  /**
   * Get documents for a visit
   */
  async getVisitDocuments(visitId: string): Promise<Document[]> {
    const snapshot = await collections.documents
      .where('visitId', '==', visitId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as Document);
  }

  /**
   * Get documents by type for a patient
   */
  async getPatientDocumentsByType(
    patientId: string,
    documentType: DocumentType
  ): Promise<Document[]> {
    const snapshot = await collections.documents
      .where('patientId', '==', patientId)
      .where('documentType', '==', documentType)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as Document);
  }

  /**
   * Get recent documents for a patient
   */
  async getRecentDocuments(patientId: string, limitCount: number = 10): Promise<Document[]> {
    const snapshot = await collections.documents
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    return snapshot.docs.map(doc => doc.data() as Document);
  }

  /**
   * Get documents uploaded by a specific user
   */
  async getDocumentsUploadedBy(
    uploadedBy: string,
    page?: number,
    limit?: number
  ): Promise<{ documents: Document[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    const query = collections.documents.where('uploadedBy', '==', uploadedBy);

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const documents = snapshot.docs.map(doc => doc.data() as Document);

    return { documents, total };
  }

  /**
   * Get confidential documents for a patient (requires special access)
   */
  async getConfidentialDocuments(patientId: string): Promise<Document[]> {
    const snapshot = await collections.documents
      .where('patientId', '==', patientId)
      .where('isConfidential', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as Document);
  }

  /**
   * Get document counts by type for a patient
   */
  async getDocumentCountsByType(patientId: string): Promise<Record<DocumentType, number>> {
    const snapshot = await collections.documents
      .where('patientId', '==', patientId)
      .get();

    const counts: Record<string, number> = {};

    snapshot.docs.forEach(doc => {
      const document = doc.data() as Document;
      counts[document.documentType] = (counts[document.documentType] || 0) + 1;
    });

    return counts as Record<DocumentType, number>;
  }
}

export const documentService = new DocumentService();
