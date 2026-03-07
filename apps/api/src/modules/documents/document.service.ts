/**
 * Document Service
 * Handles document management with digital signature workflow (DocuSign-like)
 * 
 * Features:
 * - Document upload with version control
 * - Configurable approval chains
 * - Digital signature capture
 * - Secure document viewer
 * - Access control and audit trail
 */

import { PrismaClient } from '@hris/database';
import { ApiError, forbidden } from '../../middleware/errorHandler';
import { notificationService } from '../notifications/notification.service';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface UploadDocumentData {
  companyId: string;
  employeeId?: string;
  title: string;
  titleAr?: string;
  category: string;
  fileBuffer: Buffer;
  fileName: string;
  fileType: string;
  expiryDate?: Date;
  requireSignature: boolean;
  allowDownload: boolean;
  createdBy: string;
}

export interface ApprovalChainConfig {
  steps: {
    order: number;
    approverId: string;
    approverRole: string;
  }[];
}

export interface SignDocumentData {
  signerId: string;
  signatureData: string; // Base64 signature image
  ipAddress: string;
  userAgent: string;
  deviceInfo?: any;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}

export class DocumentService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_PATH || './uploads/documents';
  }

  /**
   * Upload document
   */
  async uploadDocument(data: UploadDocumentData): Promise<any> {
    // Generate unique file name
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(data.fileName);
    const uniqueFileName = `${timestamp}-${randomStr}${extension}`;
    const filePath = path.join(this.uploadDir, uniqueFileName);

    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Save file
    await fs.writeFile(filePath, data.fileBuffer);

    // Create document record
    const document = await prisma.document.create({
      data: {
        company_id: data.companyId,
        employee_id: data.employeeId,
        title: data.title,
        title_ar: data.titleAr,
        category: data.category,
        file_path: filePath,
        file_type: data.fileType,
        file_size: data.fileBuffer.length,
        current_version: 1,
        expiry_date: data.expiryDate,
        status: data.requireSignature ? 'PENDING_SIGNATURE' : 'DRAFT',
        allow_download: data.allowDownload,
        require_signature: data.requireSignature,
        created_by: data.createdBy,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        employee: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    // Create initial version
    await prisma.documentVersion.create({
      data: {
        document_id: document.id,
        version_number: 1,
        file_path: filePath,
        file_size: data.fileBuffer.length,
        created_by: data.createdBy,
      },
    });

    return document;
  }

  /**
   * Initiate signature workflow
   */
  async initiateSignature(
    documentId: string,
    approvalChainConfig: ApprovalChainConfig,
    initiatedBy: string
  ): Promise<any> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    if (document.status === 'SIGNED') {
      throw new ApiError(400, 'Document is already signed');
    }

    // Create approval chain
    const approvalChain = await prisma.documentApprovalChain.create({
      data: {
        document_id: documentId,
        status: 'PENDING',
        current_step: 1,
      },
    });

    // Create approval steps
    const steps = await Promise.all(
      approvalChainConfig.steps.map((step) =>
        prisma.documentApprovalStep.create({
          data: {
            chain_id: approvalChain.id,
            step_order: step.order,
            approver_id: step.approverId,
            approver_role: step.approverRole,
            status: step.order === 1 ? 'PENDING' : 'PENDING',
          },
        })
      )
    );

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'PENDING_SIGNATURE',
      },
    });

    // TODO: Send notification to first approver
    await notificationService.notifyUsers({
      companyId: document.company_id,
      userIds: [approvalChainConfig.steps[0].approverId],
      title: 'Document awaiting approval',
      message: `Document "${document.title}" requires your approval.`,
      type: 'DOCUMENT',
      channel: 'BOTH',
      metadata: { documentId: document.id },
    });

    return {
      approvalChain,
      steps,
    };
  }

  /**
   * Sign document (digital signature)
   */
  async signDocument(
    documentId: string,
    signData: SignDocumentData
  ): Promise<any> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        approval_chain: {
          include: {
            steps: {
              orderBy: {
                step_order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    if (!document.approval_chain) {
      throw new ApiError(400, 'No approval chain found for this document');
    }

    const approvalChain = document.approval_chain;

    // Find current step
    const currentStep = approvalChain.steps.find(
      (step) => step.step_order === approvalChain.current_step
    );

    if (!currentStep) {
      throw new ApiError(400, 'Invalid approval step');
    }

    // Verify signer is the current approver
    if (currentStep.approver_id !== signData.signerId) {
      throw forbidden('You are not the current approver for this document');
    }

    if (currentStep.status !== 'PENDING') {
      throw new ApiError(400, 'This step has already been processed');
    }

    // Save signature image
    const signatureFileName = `signature-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.png`;
    const signaturePath = path.join(this.uploadDir, 'signatures', signatureFileName);

    await fs.mkdir(path.dirname(signaturePath), { recursive: true });

    // Decode base64 signature
    const signatureBuffer = Buffer.from(
      signData.signatureData.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );
    await fs.writeFile(signaturePath, signatureBuffer);

    // Create signature record
    const signature = await prisma.documentSignature.create({
      data: {
        document_id: documentId,
        signer_id: signData.signerId,
        signature_data: signaturePath,
        signature_type: 'DIGITAL',
        signed_at: new Date(),
        ip_address: signData.ipAddress,
        user_agent: signData.userAgent,
        device_info: signData.deviceInfo,
        geolocation: signData.geolocation,
        order_in_chain: currentStep.step_order,
      },
    });

    // Update approval step
    await prisma.documentApprovalStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'APPROVED',
        approved_at: new Date(),
      },
    });

    // Check if all steps are completed
    const allSteps = approvalChain.steps;
    const completedSteps = allSteps.filter((s) => s.status === 'APPROVED').length + 1; // +1 for current

    if (completedSteps >= allSteps.length) {
      // All signatures collected - mark as signed
      await prisma.documentApprovalChain.update({
        where: { id: approvalChain.id },
        data: {
          status: 'APPROVED',
        },
      });

      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'SIGNED',
        },
      });

      await notificationService.notifyUsers({
        companyId: document.company_id,
        userIds: [document.created_by],
        title: 'Document fully signed',
        message: `Document "${document.title}" has been fully signed.`,
        type: 'DOCUMENT',
        channel: 'BOTH',
        metadata: { documentId: document.id },
      });

      return {
        signature,
        message: 'Document fully signed by all approvers',
        isComplete: true,
      };
    } else {
      // Move to next step
      const nextStep = approvalChain.current_step + 1;

      await prisma.documentApprovalChain.update({
        where: { id: approvalChain.id },
        data: {
          status: 'IN_PROGRESS',
          current_step: nextStep,
        },
      });

      const nextApprover = approvalChain.steps.find((step) => step.step_order === nextStep);
      if (nextApprover) {
        await notificationService.notifyUsers({
          companyId: document.company_id,
          userIds: [nextApprover.approver_id],
          title: 'Document awaiting approval',
          message: `Document "${document.title}" requires your approval.`,
          type: 'DOCUMENT',
          channel: 'BOTH',
          metadata: { documentId: document.id },
        });
      }

      return {
        signature,
        message: 'Signature recorded. Document sent to next approver.',
        isComplete: false,
        nextStep,
      };
    }
  }

  /**
   * Reject document (by any approver in chain)
   */
  async rejectDocument(
    documentId: string,
    rejecterId: string,
    rejectionReason: string
  ): Promise<any> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        approval_chain: {
          include: {
            steps: true,
          },
        },
      },
    });

    if (!document || !document.approval_chain) {
      throw new ApiError(404, 'Document or approval chain not found');
    }

    const approvalChain = document.approval_chain;
    const currentStep = approvalChain.steps.find(
      (step) => step.step_order === approvalChain.current_step
    );

    if (!currentStep || currentStep.approver_id !== rejecterId) {
      throw forbidden('You are not authorized to reject this document');
    }

    // Update step as rejected
    await prisma.documentApprovalStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'REJECTED',
        approved_at: new Date(),
        rejection_reason: rejectionReason,
      },
    });

    // Update approval chain
    await prisma.documentApprovalChain.update({
      where: { id: approvalChain.id },
      data: {
        status: 'REJECTED',
      },
    });

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
      },
    });

    // TODO: Notify document creator
    await notificationService.notifyUsers({
      companyId: document.company_id,
      userIds: [document.created_by],
      title: 'Document rejected',
      message: `Document "${document.title}" was rejected.`,
      type: 'DOCUMENT',
      channel: 'BOTH',
      metadata: { documentId: document.id },
    });

    return {
      message: 'Document rejected',
      rejectionReason,
    };
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string, userId: string): Promise<any> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_number: true,
          },
        },
        versions: {
          orderBy: {
            version_number: 'desc',
          },
        },
        signatures: {
          orderBy: {
            order_in_chain: 'asc',
          },
        },
        approval_chain: {
          include: {
            steps: {
              orderBy: {
                step_order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    // Log access
    await this.logDocumentAccess(documentId, userId, 'VIEW');

    return document;
  }

  /**
   * Get documents with filters
   */
  async getDocuments(
    companyId: string,
    filters?: {
      employeeId?: string;
      category?: string;
      status?: string;
      expiringWithinDays?: number;
    }
  ): Promise<any> {
    const where: any = {
      company_id: companyId,
      deleted_at: null,
    };

    if (filters?.employeeId) {
      where.employee_id = filters.employeeId;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.expiringWithinDays);

      where.expiry_date = {
        lte: futureDate,
        gte: new Date(),
      };
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_number: true,
          },
        },
        signatures: {
          select: {
            id: true,
            signer_id: true,
            signed_at: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return documents;
  }

  /**
   * Download document
   */
  async downloadDocument(
    documentId: string,
    userId: string
  ): Promise<{ filePath: string; fileName: string; fileType: string }> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    if (!document.allow_download) {
      throw forbidden('Document download is not allowed');
    }

    // Log download
    await this.logDocumentAccess(documentId, userId, 'DOWNLOAD');

    return {
      filePath: document.file_path,
      fileName: document.title,
      fileType: document.file_type,
    };
  }

  /**
   * Get document version history
   */
  async getVersionHistory(documentId: string): Promise<any> {
    const versions = await prisma.documentVersion.findMany({
      where: { document_id: documentId },
      orderBy: {
        version_number: 'desc',
      },
    });

    return versions;
  }

  /**
   * Get document audit trail
   */
  async getAuditTrail(documentId: string): Promise<any> {
    const accessLogs = await prisma.documentAccessLog.findMany({
      where: { document_id: documentId },
      orderBy: {
        accessed_at: 'desc',
      },
    });

    const signatures = await prisma.documentSignature.findMany({
      where: { document_id: documentId },
      orderBy: {
        order_in_chain: 'asc',
      },
    });

    return {
      accessLogs,
      signatures,
    };
  }

  /**
   * Get expiring documents
   */
  async getExpiringDocuments(
    companyId: string,
    days: number = 30
  ): Promise<any> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const documents = await prisma.document.findMany({
      where: {
        company_id: companyId,
        expiry_date: {
          lte: futureDate,
          gte: new Date(),
        },
        deleted_at: null,
      },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_number: true,
          },
        },
      },
      orderBy: {
        expiry_date: 'asc',
      },
    });

    return documents;
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: string): Promise<void> {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  /**
   * Helper: Log document access
   */
  private async logDocumentAccess(
    documentId: string,
    userId: string,
    action: 'VIEW' | 'DOWNLOAD' | 'PRINT'
  ): Promise<void> {
    await prisma.documentAccessLog.create({
      data: {
        document_id: documentId,
        user_id: userId,
        action,
        ip_address: 'unknown', // Will be set by controller
        user_agent: 'unknown', // Will be set by controller
      },
    });
  }

  /**
   * Get pending signatures for user
   */
  async getPendingSignatures(userId: string): Promise<any> {
    const pendingSteps = await prisma.documentApprovalStep.findMany({
      where: {
        approver_id: userId,
        status: 'PENDING',
      },
      include: {
        chain: {
          include: {
            document: {
              include: {
                employee: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Filter to only show documents where this is the current step
    const currentPending = pendingSteps.filter(
      (step) => step.chain.current_step === step.step_order
    );

    return currentPending.map((step) => ({
      document: step.chain.document,
      stepOrder: step.step_order,
      approverRole: step.approver_role,
    }));
  }
}

export const documentService = new DocumentService();
