import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorizeRoles, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createChangeRequestSchema = z.object({
  requestType: z.enum(['PERSONAL_INFO', 'CONTACT_INFO', 'SALARY_REVIEW', 'POSITION_CHANGE', 'DEPARTMENT_TRANSFER', 'LEAVE_REQUEST', 'OTHER']),
  title: z.string().min(5),
  description: z.string().min(10),
  previousValue: z.string().optional(),
  requestedValue: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

const reviewRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'UNDER_REVIEW']),
  reviewComments: z.string().optional(),
});

// Get all change requests (with filters)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      status,
      requestType,
      priority,
      employeeId,
      page = '1',
      limit = '10',
    } = req.query;

    const where: any = {};

    // Filter based on role
    if (req.userRole === 'EMPLOYEE' && req.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { employeeId: true },
      });
      if (user?.employeeId) {
        where.employeeId = user.employeeId;
      }
    } else if (req.userRole === 'MANAGER') {
      // Managers see requests from their department employees
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { employee: { select: { departmentId: true } } },
      });
      if (user?.employee?.departmentId) {
        where.employee = {
          departmentId: user.employee.departmentId,
        };
      }
    }

    if (status) where.status = status;
    if (requestType) where.requestType = requestType;
    if (priority) where.priority = priority;
    if (employeeId) where.employeeId = employeeId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [requests, total] = await Promise.all([
      prisma.changeRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { name: true } },
              position: { select: { title: true } },
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take,
        orderBy: [
          { priority: 'desc' },
          { submittedDate: 'desc' },
        ],
      }),
      prisma.changeRequest.count({ where }),
    ]);

    res.json({
      data: requests,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    console.error('Get change requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending requests count
router.get('/pending/count', authenticate, authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const where: any = { status: 'PENDING' };

    if (req.userRole === 'MANAGER') {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { employee: { select: { departmentId: true } } },
      });
      if (user?.employee?.departmentId) {
        where.employee = {
          departmentId: user.employee.departmentId,
        };
      }
    }

    const count = await prisma.changeRequest.count({ where });

    res.json({ count });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single change request
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.changeRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Change request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get change request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create change request
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const validatedData = createChangeRequestSchema.parse(req.body);

    // Get user's employee ID
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return res.status(400).json({ error: 'User is not linked to an employee' });
    }

    const request = await prisma.changeRequest.create({
      data: {
        ...validatedData,
        employeeId: user.employeeId,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    res.status(201).json(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create change request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Review change request (Admin/Manager only)
router.post('/:id/review', authenticate, authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = reviewRequestSchema.parse(req.body);

    const request = await prisma.changeRequest.update({
      where: { id },
      data: {
        ...validatedData,
        reviewedBy: req.userId,
        reviewedDate: new Date(),
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        action: 'REVIEW_CHANGE_REQUEST',
        entityType: 'ChangeRequest',
        entityId: id,
        newValue: JSON.stringify({ status: validatedData.status, comments: validatedData.reviewComments }),
      },
    });

    res.json(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Review change request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk review
router.post('/bulk/review', authenticate, authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { ids, status, reviewComments } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid request IDs' });
    }

    const result = await prisma.changeRequest.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        reviewComments,
        reviewedBy: req.userId,
        reviewedDate: new Date(),
      },
    });

    res.json({ message: `${result.count} requests reviewed successfully` });
  } catch (error) {
    console.error('Bulk review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete change request
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Only allow deleting own requests or admin
    const request = await prisma.changeRequest.findUnique({
      where: { id },
      include: { employee: { select: { user: { select: { id: true } } } } },
    });

    if (!request) {
      return res.status(404).json({ error: 'Change request not found' });
    }

    if (req.userRole !== 'ADMIN' && request.employee.user?.id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.changeRequest.delete({ where: { id } });

    res.json({ message: 'Change request deleted successfully' });
  } catch (error) {
    console.error('Delete change request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
