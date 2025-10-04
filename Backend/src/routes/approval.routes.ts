import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const approveRejectSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().optional(),
});

// Get pending approvals for current user
router.get('/pending', authenticate, async (req: AuthRequest, res) => {
  try {
    const approvals = await prisma.approval.findMany({
      where: {
        approverId: req.userId,
        status: 'PENDING',
      },
      include: {
        expense: {
          include: {
            employee: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter only approvals where the expense is at the current step
    const pendingApprovals = approvals.filter(
      approval => approval.expense.currentStep === approval.step
    );

    res.json(pendingApprovals);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve or Reject expense
router.post('/:approvalId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { approvalId } = req.params;
    const validatedData = approveRejectSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // Get approval
      const approval = await tx.approval.findUnique({
        where: { id: approvalId },
        include: {
          expense: {
            include: {
              approvals: {
                orderBy: { step: 'asc' },
              },
            },
          },
        },
      });

      if (!approval) {
        throw new Error('Approval not found');
      }

      if (approval.approverId !== req.userId) {
        throw new Error('Unauthorized');
      }

      if (approval.status !== 'PENDING') {
        throw new Error('Approval already processed');
      }

      // Update approval
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: validatedData.status,
          comments: validatedData.comments,
        },
      });

      // If rejected, update expense status
      if (validatedData.status === 'REJECTED') {
        await tx.expense.update({
          where: { id: approval.expenseId },
          data: { status: 'REJECTED' },
        });

        return { message: 'Expense rejected' };
      }

      // If approved, check if there are more approvers
      const approvalRule = await tx.approvalRule.findFirst({
        where: { companyId: approval.expense.companyId },
        include: {
          approverSteps: true,
          approvers: true,
        },
      });

      const allApprovals = approval.expense.approvals;
      const currentStepApprovals = allApprovals.filter(a => a.step === approval.step);
      const approvedInCurrentStep = currentStepApprovals.filter(a => 
        a.status === 'APPROVED' || (a.id === approvalId)
      ).length;

      let shouldMoveToNextStep = false;
      let shouldFinalApprove = false;

      // Check approval rule
      if (approvalRule) {
        if (approvalRule.type === 'PERCENTAGE' && approvalRule.percentage) {
          const approvalPercentage = (approvedInCurrentStep / currentStepApprovals.length) * 100;
          if (approvalPercentage >= approvalRule.percentage) {
            shouldMoveToNextStep = true;
          }
        } else if (approvalRule.type === 'SPECIFIC_APPROVER') {
          const specificApprovers = approvalRule.approvers.map(a => a.id);
          if (specificApprovers.includes(req.userId!)) {
            shouldFinalApprove = true;
          }
        } else if (approvalRule.type === 'HYBRID' && approvalRule.percentage) {
          const specificApprovers = approvalRule.approvers.map(a => a.id);
          const approvalPercentage = (approvedInCurrentStep / currentStepApprovals.length) * 100;
          
          if (specificApprovers.includes(req.userId!) || approvalPercentage >= approvalRule.percentage) {
            shouldMoveToNextStep = true;
          }
        }
      } else {
        // Default: all approvers in current step must approve
        if (approvedInCurrentStep === currentStepApprovals.length) {
          shouldMoveToNextStep = true;
        }
      }

      // Update expense
      if (shouldFinalApprove) {
        await tx.expense.update({
          where: { id: approval.expenseId },
          data: { status: 'APPROVED' },
        });
      } else if (shouldMoveToNextStep) {
        const nextStep = approval.step + 1;
        const hasNextStep = allApprovals.some(a => a.step === nextStep);

        if (hasNextStep) {
          await tx.expense.update({
            where: { id: approval.expenseId },
            data: { currentStep: nextStep },
          });
        } else {
          await tx.expense.update({
            where: { id: approval.expenseId },
            data: { status: 'APPROVED' },
          });
        }
      }

      return { message: 'Approval processed successfully' };
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Approve/Reject error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// Get approval history (Admin/Manager)
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const approvals = await prisma.approval.findMany({
      where: {
        expense: {
          companyId: req.companyId,
        },
      },
      include: {
        expense: {
          include: {
            employee: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(approvals);
  } catch (error) {
    console.error('Get approval history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
