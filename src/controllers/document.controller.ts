import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service.js';
import { DocumentType, UserRole } from '../types/index.js';
import { getString, getOptionalString } from '../utils/helpers.js';

export class DocumentController {
  /**
   * Create a new document record
   */
  async createDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        patientId,
        hospitalId,
        visitId,
        documentType,
        title,
        description,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        isConfidential
      } = req.body;

      const user = (req as any).user;

      const document = await documentService.createDocument({
        patientId,
        uploadedBy: user.userId,
        uploadedByRole: user.role as UserRole,
        hospitalId,
        visitId,
        documentType,
        title,
        description,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        isConfidential
      });

      res.status(201).json({
        success: true,
        message: 'Document created successfully',
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const documentId = getString(req.params.id);
      const document = await documentService.getDocumentById(documentId);

      res.json({
        success: true,
        message: 'Document retrieved successfully',
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const documentId = getString(req.params.id);
      const { title, description, documentType, isConfidential } = req.body;

      const document = await documentService.updateDocument(documentId, {
        title,
        description,
        documentType,
        isConfidential
      });

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const documentId = getString(req.params.id);
      await documentService.deleteDocument(documentId);

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all documents for a patient
   */
  async getPatientDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const documentType = getOptionalString(req.query.type) as DocumentType | undefined;
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await documentService.getPatientDocuments(patientId, documentType, page, limit);

      res.json({
        success: true,
        message: 'Patient documents retrieved successfully',
        data: result.documents,
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
   * Get documents for a visit
   */
  async getVisitDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const visitId = getString(req.params.visitId);
      const documents = await documentService.getVisitDocuments(visitId);

      res.json({
        success: true,
        message: 'Visit documents retrieved successfully',
        data: documents
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent documents for a patient
   */
  async getRecentDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const limit = parseInt(getOptionalString(req.query.limit) || '10');
      const documents = await documentService.getRecentDocuments(patientId, limit);

      res.json({
        success: true,
        message: 'Recent documents retrieved successfully',
        data: documents
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document counts by type for a patient
   */
  async getDocumentCountsByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const counts = await documentService.getDocumentCountsByType(patientId);

      res.json({
        success: true,
        message: 'Document counts retrieved successfully',
        data: counts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get documents uploaded by the current user
   */
  async getMyUploadedDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await documentService.getDocumentsUploadedBy(user.userId, page, limit);

      res.json({
        success: true,
        message: 'Uploaded documents retrieved successfully',
        data: result.documents,
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
}

export const documentController = new DocumentController();
