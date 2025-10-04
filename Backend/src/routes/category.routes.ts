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
const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Get all expense categories
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { includeInactive } = req.query;

    const where: any = {
      companyId: user.companyId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const categories = await prisma.expenseCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const category = await prisma.expenseCategory.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category (Admin only)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const validatedData = createCategorySchema.parse(req.body);

    const category = await prisma.expenseCategory.create({
      data: {
        ...validatedData,
        companyId: user.companyId!,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category (Admin only)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const validatedData = updateCategorySchema.parse(req.body);

    const category = await prisma.expenseCategory.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updatedCategory = await prisma.expenseCategory.update({
      where: { id },
      data: validatedData,
    });

    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (Admin only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const category = await prisma.expenseCategory.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category is being used by any expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    });

    if (expenseCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category that is being used by expenses. Deactivate it instead.' 
      });
    }

    await prisma.expenseCategory.delete({
      where: { id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;