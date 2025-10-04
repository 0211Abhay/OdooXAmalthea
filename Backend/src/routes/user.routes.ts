import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authenticate, authorizeRoles, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  isApprover: z.boolean().optional().default(false),
  approverLevel: z.number().optional(),
});

const updateUserSchema = z.object({
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional(),
  isApprover: z.boolean().optional(),
  approverLevel: z.number().optional(),
});

// Get all users in company (Admin only)
router.get('/', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApprover: true,
        approverLevel: true,
        createdAt: true,
        _count: {
          select: {
            expenses: true,
            approvedExpenses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get managers (for assignment)
router.get('/managers', authenticate, async (req: AuthRequest, res) => {
  try {
    const managers = await prisma.user.findMany({
      where: {
        companyId: req.companyId,
        role: { in: ['MANAGER', 'ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json(managers);
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (Admin only)
router.post('/', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        isApprover: validatedData.isApprover,
        approverLevel: validatedData.approverLevel,
        companyId: req.companyId!,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApprover: true,
        approverLevel: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin only)
router.patch('/:id', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApprover: true,
        approverLevel: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get approvers list
router.get('/approvers', authenticate, async (req: AuthRequest, res) => {
  try {
    const approvers = await prisma.user.findMany({
      where: { 
        companyId: req.companyId,
        isApprover: true,
        role: { in: ['MANAGER', 'ADMIN'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approverLevel: true,
      },
      orderBy: { approverLevel: 'asc' }
    });

    res.json(approvers);
  } catch (error) {
    console.error('Get approvers error:', error);
    res.status(500).json({ error: 'Failed to fetch approvers' });
  }
});

// Update company approval settings (Admin only)
router.put('/company/approval-settings', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { sequentialApproval, minimumApprovalPercent } = req.body;

    const updatedCompany = await prisma.company.update({
      where: { id: req.companyId! },
      data: {
        sequentialApproval: Boolean(sequentialApproval),
        minimumApprovalPercent: parseInt(minimumApprovalPercent) || 50,
      },
      select: {
        id: true,
        name: true,
        currency: true,
        sequentialApproval: true,
        minimumApprovalPercent: true,
      }
    });

    res.json(updatedCompany);
  } catch (error) {
    console.error('Update approval settings error:', error);
    res.status(500).json({ error: 'Failed to update approval settings' });
  }
});

// Get company settings
router.get('/company/settings', authenticate, async (req: AuthRequest, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.companyId! },
      select: {
        id: true,
        name: true,
        currency: true,
        sequentialApproval: true,
        minimumApprovalPercent: true,
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company settings error:', error);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

export default router;
