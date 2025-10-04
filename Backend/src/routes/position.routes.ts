import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorizeRoles, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createPositionSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  departmentId: z.string(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
});

// Get all positions
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { departmentId } = req.query;

    const where: any = { companyId: req.companyId };
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const positions = await prisma.position.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { title: 'asc' },
    });

    res.json(positions);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create position
router.post('/', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const validatedData = createPositionSchema.parse(req.body);

    const position = await prisma.position.create({
      data: {
        ...validatedData,
        companyId: req.companyId!,
      },
      include: {
        department: true,
      },
    });

    res.status(201).json(position);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create position error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update position
router.patch('/:id', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = createPositionSchema.partial().parse(req.body);

    const position = await prisma.position.update({
      where: { id },
      data: validatedData,
      include: {
        department: true,
      },
    });

    res.json(position);
  } catch (error) {
    console.error('Update position error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete position
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.position.delete({ where: { id } });

    res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    console.error('Delete position error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;