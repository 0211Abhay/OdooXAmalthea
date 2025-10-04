import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

interface AuthRequest extends Request {
  user?: any;
}

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createApprovalRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  categoryIds: z.array(z.string().uuid()).optional().default([]),
  ruleType: z.enum(['SEQUENTIAL', 'PERCENTAGE', 'SPECIFIC_APPROVER', 'HYBRID']),
  isManagerApprover: z.boolean().default(true),
  requiredPercentage: z.number().min(1).max(100).optional(),
  autoApproverIds: z.array(z.string().uuid()).optional().default([]),
  approverSteps: z.array(z.object({
    userId: z.string().uuid(),
    step: z.number().min(1),
  })).optional().default([]),
});

const updateApprovalRuleSchema = createApprovalRuleSchema.partial();

// Get all approval rules
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const rules = await prisma.approvalRule.findMany({
      where: {
        companyId: user.companyId,
      },
      include: {
        steps: {
          orderBy: { step: 'asc' }
        },
        approvers: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rules);
  } catch (error) {
    console.error('Get approval rules error:', error);
    res.status(500).json({ error: 'Failed to fetch approval rules' });
  }
});

// Get approval rule by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const rule = await prisma.approvalRule.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        steps: {
          orderBy: { step: 'asc' }
        },
        approvers: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Approval rule not found' });
    }

    res.json(rule);
  } catch (error) {
    console.error('Get approval rule error:', error);
    res.status(500).json({ error: 'Failed to fetch approval rule' });
  }
});

// Create approval rule (Admin only)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const validatedData = createApprovalRuleSchema.parse(req.body);

    const rule = await prisma.$transaction(async (tx) => {
      // Create the approval rule
      const newRule = await tx.approvalRule.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          companyId: user.companyId!,
          minAmount: validatedData.minAmount,
          maxAmount: validatedData.maxAmount,
          categoryIds: validatedData.categoryIds,
          ruleType: validatedData.ruleType,
          isManagerApprover: validatedData.isManagerApprover,
          requiredPercentage: validatedData.requiredPercentage,
          autoApproverIds: validatedData.autoApproverIds,
        },
      });

      // Create approval steps
      if (validatedData.approverSteps && validatedData.approverSteps.length > 0) {
        for (const step of validatedData.approverSteps) {
          await tx.approvalStep.create({
            data: {
              ruleId: newRule.id,
              userId: step.userId,
              step: step.step,
            },
          });
        }

        // Connect approvers to the rule
        const approverIds = validatedData.approverSteps.map(step => step.userId);
        await tx.approvalRule.update({
          where: { id: newRule.id },
          data: {
            approvers: {
              connect: approverIds.map(id => ({ id }))
            }
          }
        });
      }

      return newRule;
    });

    // Fetch the created rule with relations
    const createdRule = await prisma.approvalRule.findUnique({
      where: { id: rule.id },
      include: {
        steps: {
          orderBy: { step: 'asc' }
        },
        approvers: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
    });

    res.status(201).json(createdRule);
  } catch (error) {
    console.error('Create approval rule error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create approval rule' });
  }
});

// Update approval rule (Admin only)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const validatedData = updateApprovalRuleSchema.parse(req.body);

    const rule = await prisma.approvalRule.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Approval rule not found' });
    }

    const updatedRule = await prisma.$transaction(async (tx) => {
      // Update the approval rule
      const updated = await tx.approvalRule.update({
        where: { id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          minAmount: validatedData.minAmount,
          maxAmount: validatedData.maxAmount,
          categoryIds: validatedData.categoryIds,
          ruleType: validatedData.ruleType,
          isManagerApprover: validatedData.isManagerApprover,
          requiredPercentage: validatedData.requiredPercentage,
          autoApproverIds: validatedData.autoApproverIds,
        },
      });

      // If approverSteps are provided, replace existing steps
      if (validatedData.approverSteps) {
        // Delete existing steps
        await tx.approvalStep.deleteMany({
          where: { ruleId: id }
        });

        // Clear existing approver connections
        await tx.approvalRule.update({
          where: { id },
          data: {
            approvers: {
              set: []
            }
          }
        });

        // Create new steps
        if (validatedData.approverSteps.length > 0) {
          for (const step of validatedData.approverSteps) {
            await tx.approvalStep.create({
              data: {
                ruleId: id,
                userId: step.userId,
                step: step.step,
              },
            });
          }

          // Connect new approvers to the rule
          const approverIds = validatedData.approverSteps.map(step => step.userId);
          await tx.approvalRule.update({
            where: { id },
            data: {
              approvers: {
                connect: approverIds.map(userId => ({ id: userId }))
              }
            }
          });
        }
      }

      return updated;
    });

    // Fetch the updated rule with relations
    const result = await prisma.approvalRule.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { step: 'asc' }
        },
        approvers: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
    });

    res.json(result);
  } catch (error) {
    console.error('Update approval rule error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update approval rule' });
  }
});

// Delete approval rule (Admin only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const rule = await prisma.approvalRule.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Approval rule not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Delete approval steps first
      await tx.approvalStep.deleteMany({
        where: { ruleId: id }
      });

      // Delete the rule
      await tx.approvalRule.delete({
        where: { id }
      });
    });

    res.json({ message: 'Approval rule deleted successfully' });
  } catch (error) {
    console.error('Delete approval rule error:', error);
    res.status(500).json({ error: 'Failed to delete approval rule' });
  }
});

export default router;