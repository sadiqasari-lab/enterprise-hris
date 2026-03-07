/**
 * Document Routes
 * Routes for document management and digital signatures
 */

import { Router } from 'express';
import { documentController } from './document.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireHRAdmin } from '../../middleware/rbac.middleware';

const router = Router();

/**
 * Upload document (HR Admin, Employees for own documents)
 */
router.post(
  '/upload',
  authenticate,
  documentController.uploadMiddleware,
  documentController.uploadDocument.bind(documentController)
);

/**
 * Initiate signature workflow (Document creator or HR Admin)
 */
router.post(
  '/:id/initiate-signature',
  authenticate,
  documentController.initiateSignature.bind(documentController)
);

/**
 * Sign document (Approvers in chain)
 */
router.post(
  '/:id/sign',
  authenticate,
  documentController.signDocument.bind(documentController)
);

/**
 * Reject document (Approvers in chain)
 */
router.post(
  '/:id/reject',
  authenticate,
  documentController.rejectDocument.bind(documentController)
);

/**
 * Get all documents (with filters)
 */
router.get(
  '/',
  authenticate,
  documentController.getDocuments.bind(documentController)
);

/**
 * Get specific document
 */
router.get(
  '/:id',
  authenticate,
  documentController.getDocument.bind(documentController)
);

/**
 * Download document
 */
router.get(
  '/:id/download',
  authenticate,
  documentController.downloadDocument.bind(documentController)
);

/**
 * Preview document (secure viewer)
 */
router.get(
  '/:id/preview',
  authenticate,
  documentController.previewDocument.bind(documentController)
);

/**
 * Get version history
 */
router.get(
  '/:id/versions',
  authenticate,
  documentController.getVersionHistory.bind(documentController)
);

/**
 * Get audit trail
 */
router.get(
  '/:id/audit-trail',
  authenticate,
  documentController.getAuditTrail.bind(documentController)
);

/**
 * Get expiring documents (HR Admin)
 */
router.get(
  '/expiring/list',
  authenticate,
  requireHRAdmin,
  documentController.getExpiringDocuments.bind(documentController)
);

/**
 * Get pending signatures (for current user)
 */
router.get(
  '/pending-signatures/my',
  authenticate,
  documentController.getPendingSignatures.bind(documentController)
);

/**
 * Delete document (HR Admin)
 */
router.delete(
  '/:id',
  authenticate,
  requireHRAdmin,
  documentController.deleteDocument.bind(documentController)
);

export default router;
