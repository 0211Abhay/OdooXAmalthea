import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

interface AuthRequest extends Request {
  user?: any;
}

const router = Router();

// Get company info
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
    });

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;