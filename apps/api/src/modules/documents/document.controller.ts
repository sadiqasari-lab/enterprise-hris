/**
 * Document Controller
 * Handles HTTP requests for document management and digital signatures
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { documentService } from './document.service';
import { ApiError } from '../../middleware/errorHandler';
import multer from 'multer';
import { ApprovalChainConfig, SignDocumentData } from './document.service';

type IdParams = { id: string };

type UploadDocumentBody = {
  title?: string;
  titleAr?: string;
  category?: string;
  employeeId?: string;
  expiryDate?: string;
  requireSignature?: string | boolean;
  allowDownload?: string | boolean;
};

type InitiateSignatureBody = {
  approvalChain?: ApprovalChainConfig;
};

type SignDocumentBody = {
  signatureData?: string;
  geolocation?: SignDocumentData['geolocation'];
};

type RejectDocumentBody = {
  rejectionReason?: string;
};

type GetDocumentsQuery = {
  employeeId?: string;
  category?: string;
  status?: string;
  expiringWithinDays?: string;
};

type GetExpiringDocumentsQuery = {
  days?: string;
};

type UploadRequest = Request<{}, any, UploadDocumentBody> & {
  file?: Express.Multer.File;
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export class DocumentController {
  private parseBoolean(value: string | boolean | undefined, defaultValue: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    return defaultValue;
  }

  /**
   * File upload middleware
   */
  uploadMiddleware: RequestHandler = upload.single('file');

  /**
   * Controller method skeleton (matches documents.routes.ts)
   * - uploadMiddleware
   * - uploadDocument
   * - getDocuments
   * - getDocument
   * - downloadDocument
   * - initiateSignature
   * - signDocument
   * - rejectDocument
   * - getPendingSignatures
   * - previewDocument
   * - getVersionHistory
   * - getAuditTrail
   * - getExpiringDocuments
   * - deleteDocument
   */

  /**
   * POST /api/documents/upload
   * Upload document
   */
  async uploadDocument(req: UploadRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const {
        title,
        titleAr,
        category,
        employeeId,
        expiryDate,
        requireSignature,
        allowDownload,
      } = req.body;

      const companyId = req.companyId!;
      const createdBy = req.userId!;

      if (!title || !category) {
        throw new ApiError(400, 'Title and category are required');
      }

      const document = await documentService.uploadDocument({
        companyId,
        employeeId,
        title,
        titleAr,
        category,
        fileBuffer: req.file.buffer,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        requireSignature: this.parseBoolean(requireSignature, false),
        allowDownload: this.parseBoolean(allowDownload, true),
        createdBy,
      });

      res.status(201).json({
        success: true,
        data: { document },
        message: 'Document uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/:id/initiate-signature
   * Initiate signature workflow
   */
  async initiateSignature(
    req: Request<IdParams, any, InitiateSignatureBody>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { approvalChain } = req.body;
      const initiatedBy = req.userId!;

      if (!approvalChain || !approvalChain.steps) {
        throw new ApiError(400, 'Approval chain configuration is required');
      }

      const result = await documentService.initiateSignature(
        id,
        approvalChain,
        initiatedBy
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Signature workflow initiated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/:id/sign
   * Sign document
   */
  async signDocument(
    req: Request<IdParams, any, SignDocumentBody>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { signatureData, geolocation } = req.body;
      const signerId = req.userId!;

      if (!signatureData) {
        throw new ApiError(400, 'Signature data is required');
      }

      const result = await documentService.signDocument(id, {
        signerId,
        signatureData,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        deviceInfo: {
          // Extract from user agent
        },
        geolocation,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/:id/reject
   * Reject document
   */
  async rejectDocument(
    req: Request<IdParams, any, RejectDocumentBody>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const rejecterId = req.userId!;

      if (!rejectionReason) {
        throw new ApiError(400, 'Rejection reason is required');
      }

      const result = await documentService.rejectDocument(
        id,
        rejecterId,
        rejectionReason
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Document rejected',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents
   * Get documents with filters
   */
  async getDocuments(
    req: Request<{}, any, any, GetDocumentsQuery>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const companyId = req.companyId!;
      const { employeeId, category, status, expiringWithinDays } = req.query;

      const documents = await documentService.getDocuments(companyId, {
        employeeId: employeeId as string | undefined,
        category: category as string | undefined,
        status: status as string | undefined,
        expiringWithinDays: expiringWithinDays
          ? parseInt(expiringWithinDays as string, 10)
          : undefined,
      });

      res.status(200).json({
        success: true,
        data: { documents },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id
   * Get document by ID
   */
  async getDocument(
    req: Request<IdParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const document = await documentService.getDocument(id, userId);

      res.status(200).json({
        success: true,
        data: { document },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id/download
   * Download document
   */
  async downloadDocument(
    req: Request<IdParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const { filePath, fileName, fileType } = await documentService.downloadDocument(
        id,
        userId
      );

      res.setHeader('Content-Type', fileType);
      res.download(filePath, fileName);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id/preview
   * Preview document (secure viewer)
   */
  async previewDocument(
    req: Request<IdParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const document = await documentService.getDocument(id, userId);

      // Return document data for secure viewer
      res.status(200).json({
        success: true,
        data: {
          document,
          // Add watermark info
          watermark: {
            text: `${req.userId} - ${new Date().toISOString()}`,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id/versions
   * Get document version history
   */
  async getVersionHistory(
    req: Request<IdParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const versions = await documentService.getVersionHistory(id);

      res.status(200).json({
        success: true,
        data: { versions },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id/audit-trail
   * Get document audit trail
   */
  async getAuditTrail(
    req: Request<IdParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const auditTrail = await documentService.getAuditTrail(id);

      res.status(200).json({
        success: true,
        data: auditTrail,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/expiring
   * Get expiring documents
   */
  async getExpiringDocuments(
    req: Request<{}, any, any, GetExpiringDocumentsQuery>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const companyId = req.companyId!;
      const { days } = req.query;

      const documents = await documentService.getExpiringDocuments(
        companyId,
        days ? parseInt(days as string, 10) : 30
      );

      res.status(200).json({
        success: true,
        data: { documents },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/pending-signatures
   * Get documents pending signature by current user
   */
  async getPendingSignatures(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const pending = await documentService.getPendingSignatures(userId);

      res.status(200).json({
        success: true,
        data: { documents: pending },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/documents/:id
   * Delete document (soft delete)
   */
  async deleteDocument(
    req: Request<IdParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      await documentService.deleteDocument(id);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
