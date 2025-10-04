import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorizeRoles, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createDepartmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

// Get all departments
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: { companyId: req.companyId },
      include: {
        _count: {
          select: { employees: true, positions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create department
router.post('/', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const validatedData = createDepartmentSchema.parse(req.body);

    const department = await prisma.department.create({
      data: {
        ...validatedData,
        companyId: req.companyId!,
      },
    });

    res.status(201).json(department);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update department
router.patch('/:id', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = createDepartmentSchema.partial().parse(req.body);

    const department = await prisma.department.update({
      where: { id },
      data: validatedData,
    });

    res.json(department);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete department
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.department.delete({ where: { id } });

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
