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
const createExpenseSchema = z.object({
  amount: z.number().positive(),
  originalAmount: z.number().positive().optional(),
  originalCurrency: z.string().optional(),
  categoryId: z.string().uuid(),
  description: z.string().min(1),
  expenseDate: z.string().transform((str) => new Date(str)),
  receiptUrl: z.string().url().optional(),
  merchantName: z.string().optional(),
});

const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  originalAmount: z.number().positive().optional(),
  originalCurrency: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().min(1).optional(),
  expenseDate: z.string().transform((str) => new Date(str)).optional(),
  receiptUrl: z.string().url().optional(),
  merchantName: z.string().optional(),
});

const approveRejectSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().optional(),
});

// Helper function to convert currency
async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    
    if (data.rates && data.rates[toCurrency]) {
      return amount * data.rates[toCurrency];
    }
    
    return amount;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount;
  }
}

// Get all expenses with filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      status, 
      category, 
      startDate, 
      endDate, 
      userId,
      page = '1', 
      limit = '10' 
    } = req.query;

    const user = req.user!;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filters
    const where: any = {
      companyId: user.companyId,
    };

    // Role-based filtering
    if (user.role === 'EMPLOYEE') {
      where.userId = user.id;
    } else if (user.role === 'MANAGER') {
      // Managers can see their own expenses and their team's expenses
      const teamMembers = await prisma.user.findMany({
        where: { managerId: user.id },
        select: { id: true }
      });
      const teamIds = teamMembers.map((member: any) => member.id);
      where.userId = { in: [...teamIds, user.id] };
    }
    // Admins can see all expenses (no additional filter)

    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (userId && user.role !== 'EMPLOYEE') where.userId = userId;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate as string);
      if (endDate) where.expenseDate.lte = new Date(endDate as string);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          category: true,
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, role: true }
              }
            },
            orderBy: { step: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      expenses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Create expense (Employee)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const validatedData = createExpenseSchema.parse(req.body);

    // Calculate exchange rate if needed
    let exchangeRate = 1;
    let finalAmount = validatedData.amount;

    if (validatedData.originalCurrency && validatedData.originalAmount) {
      // Get company currency
      const company = await prisma.company.findUnique({
        where: { id: user.companyId! },
        select: { currency: true }
      });

      if (company && validatedData.originalCurrency !== company.currency) {
        // Convert currency
        finalAmount = await convertCurrency(
          validatedData.originalAmount,
          validatedData.originalCurrency,
          company.currency
        );
        exchangeRate = finalAmount / validatedData.originalAmount;
      }
    }

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        amount: finalAmount,
        userId: user.id,
        companyId: user.companyId!,
        exchangeRate: exchangeRate !== 1 ? exchangeRate : undefined,
        status: 'PENDING',
        currentStep: 1,
        totalSteps: 1, // Will be updated based on approval rules
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        category: true,
      },
    });

    // Initialize approval workflow
    await initializeApprovalWorkflow(expense.id, user.companyId!);

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Get expense by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        category: true,
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { step: 'asc' }
        }
      },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Check permissions
    if (user.role === 'EMPLOYEE' && expense.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (user.role === 'MANAGER') {
      const teamMembers = await prisma.user.findMany({
        where: { managerId: user.id },
        select: { id: true }
      });
      const teamIds = teamMembers.map((member: any) => member.id);
      if (expense.userId !== user.id && !teamIds.includes(expense.userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Approve/Reject expense
router.post('/:id/approve', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { action, comments } = approveRejectSchema.parse(req.body);

    // Get the expense with current approvals
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        approvals: {
          where: { approverId: user.id },
          orderBy: { step: 'asc' }
        }
      },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Check if user has permission to approve/reject this expense
    const currentApproval = expense.approvals.find(
      (approval: any) => approval.step === expense.currentStep && approval.status === 'PENDING'
    );

    if (!currentApproval) {
      return res.status(403).json({ error: 'You are not authorized to approve this expense at this step' });
    }

    // Update the approval
    await prisma.expenseApproval.update({
      where: { id: currentApproval.id },
      data: {
        status: action,
        comments,
        approvedAt: new Date(),
      },
    });

    // Process the approval workflow
    await processApprovalWorkflow(expense.id, action === 'APPROVED');

    res.json({ message: `Expense ${action.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Approve/reject expense error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

// Submit expense for approval
router.post('/:id/submit', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (expense.status !== 'PENDING') {
      return res.status(400).json({ error: 'Expense already submitted' });
    }

    // Initialize approval workflow
    await initializeApprovalWorkflow(expense.id, user.companyId!);

    const updatedExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
        approvals: {
          include: { approver: { select: { id: true, name: true, role: true } } },
          orderBy: { step: 'asc' }
        }
      }
    });

    res.json(updatedExpense);
  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({ error: 'Failed to submit expense' });
  }
});

// Get expenses for approval (Manager/Admin view)
router.get('/pending/approvals', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    if (!user.isApprover) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId! },
      select: { sequentialApproval: true, currency: true }
    });

    let whereCondition: any = {
      approverId: user.id,
      status: 'PENDING',
    };

    if (company?.sequentialApproval) {
      // In sequential mode, only show approvals for current step
      whereCondition.expense = {
        approvals: {
          some: {
            step: { lte: { expense: { currentStep: true } } }
          }
        }
      };
    }

    const pendingApprovals = await prisma.expenseApproval.findMany({
      where: whereCondition,
      include: {
        expense: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            category: true,
            company: { select: { currency: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
    });

    // Convert amounts to company currency for display
    const approvals = await Promise.all(
      pendingApprovals.map(async (approval) => {
        const expense = approval.expense;
        let displayAmount = expense.amount;
        
        if (expense.originalCurrency && expense.originalAmount && company) {
          displayAmount = await convertCurrency(
            expense.originalAmount,
            expense.originalCurrency,
            company.currency
          );
        }

        return {
          ...approval,
          expense: {
            ...expense,
            displayAmount,
            displayCurrency: company?.currency || 'USD'
          }
        };
      })
    );

    res.json(approvals);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

// Get expense statistics for dashboard
router.get('/stats/dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { timeframe = '30' } = req.query;
    const days = parseInt(timeframe as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let baseWhere: any = {
      companyId: user.companyId,
      createdAt: { gte: startDate }
    };

    // Role-based filtering
    if (user.role === 'EMPLOYEE') {
      baseWhere.userId = user.id;
    }

    const [
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmount,
      pendingApprovals
    ] = await Promise.all([
      prisma.expense.count({ where: baseWhere }),
      prisma.expense.count({ where: { ...baseWhere, status: 'PENDING' } }),
      prisma.expense.count({ where: { ...baseWhere, status: 'APPROVED' } }),
      prisma.expense.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      prisma.expense.aggregate({
        where: baseWhere,
        _sum: { amount: true }
      }),
      user.isApprover ? prisma.expenseApproval.count({
        where: {
          approverId: user.id,
          status: 'PENDING'
        }
      }) : 0
    ]);

    res.json({
      totalExpenses,
      pendingExpenses,
      approvedExpenses, 
      rejectedExpenses,
      totalAmount: totalAmount._sum.amount || 0,
      pendingApprovals
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Helper function to initialize approval workflow
async function initializeApprovalWorkflow(expenseId: string, companyId: string) {
  try {
    const [expense, company, approvers] = await Promise.all([
      prisma.expense.findUnique({
        where: { id: expenseId },
        include: { user: true, category: true }
      }),
      prisma.company.findUnique({
        where: { id: companyId },
        select: { 
          sequentialApproval: true, 
          minimumApprovalPercent: true,
          currency: true 
        }
      }),
      prisma.user.findMany({
        where: { 
          companyId,
          isApprover: true,
          role: { in: ['MANAGER', 'ADMIN'] }
        },
        orderBy: { approverLevel: 'asc' }
      })
    ]);

    if (!expense || !company || approvers.length === 0) {
      // No approvers found, auto-approve or keep pending
      if (approvers.length === 0) {
        await prisma.expense.update({
          where: { id: expenseId },
          data: { status: 'APPROVED' }
        });
      }
      return;
    }

    // Calculate currency conversion if needed
    let convertedAmount = expense.amount;
    if (expense.originalCurrency && expense.originalAmount && expense.originalCurrency !== company.currency) {
      convertedAmount = await convertCurrency(expense.originalAmount, expense.originalCurrency, company.currency);
      await prisma.expense.update({
        where: { id: expenseId },
        data: { 
          amount: convertedAmount,
          exchangeRate: convertedAmount / expense.originalAmount 
        }
      });
    }

    if (company.sequentialApproval) {
      // Sequential approval - create approval records in order
      for (let i = 0; i < approvers.length; i++) {
        await prisma.expenseApproval.create({
          data: {
            expenseId,
            approverId: approvers[i].id,
            step: i + 1,
            status: 'PENDING',
          }
        });
      }
    } else {
      // Parallel approval - create all approval records at once
      const approvalPromises = approvers.map((approver, index) =>
        prisma.expenseApproval.create({
          data: {
            expenseId,
            approverId: approver.id,
            step: 1, // All at same step for parallel
            status: 'PENDING',
          }
        })
      );
      await Promise.all(approvalPromises);
    }

    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        status: 'IN_PROGRESS',
        totalSteps: company.sequentialApproval ? approvers.length : 1,
        submittedAt: new Date(),
        isReadonly: true
      }
    });

  } catch (error) {
    console.error('Initialize approval workflow error:', error);
  }
}

// Helper function to process approval workflow
async function processApprovalWorkflow(expenseId: string, approved: boolean) {
  try {
    const [expense, company] = await Promise.all([
      prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
          approvals: {
            include: { approver: true },
            orderBy: { step: 'asc' }
          }
        }
      }),
      prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
          company: {
            select: { 
              sequentialApproval: true, 
              minimumApprovalPercent: true 
            }
          }
        }
      })
    ]);

    if (!expense || !company?.company) return;

    if (!approved) {
      // If rejected in sequential mode or any rejection, auto-reject
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: 'REJECTED' }
      });
      return;
    }

    const { sequentialApproval, minimumApprovalPercent } = company.company;

    if (sequentialApproval) {
      // Sequential approval logic
      const currentStepApprovals = expense.approvals.filter(a => a.step === expense.currentStep);
      const approvedCount = currentStepApprovals.filter(a => a.status === 'APPROVED').length;
      
      if (approvedCount > 0 && expense.currentStep < expense.totalSteps) {
        // Move to next step
        await prisma.expense.update({
          where: { id: expenseId },
          data: { currentStep: expense.currentStep + 1 }
        });
      } else if (expense.currentStep >= expense.totalSteps) {
        // Final step completed
        await prisma.expense.update({
          where: { id: expenseId },
          data: { status: 'APPROVED' }
        });
      }
    } else {
      // Parallel approval logic - check percentage
      const totalApprovers = expense.approvals.length;
      const approvedCount = expense.approvals.filter(a => a.status === 'APPROVED').length;
      const rejectedCount = expense.approvals.filter(a => a.status === 'REJECTED').length;
      
      const approvedPercentage = (approvedCount / totalApprovers) * 100;
      const remainingApprovals = totalApprovers - approvedCount - rejectedCount;
      const maxPossiblePercentage = ((approvedCount + remainingApprovals) / totalApprovers) * 100;

      if (approvedPercentage >= minimumApprovalPercent) {
        // Minimum approval threshold met
        await prisma.expense.update({
          where: { id: expenseId },
          data: { status: 'APPROVED' }
        });
      } else if (maxPossiblePercentage < minimumApprovalPercent) {
        // Cannot reach minimum threshold even if all remaining approve
        await prisma.expense.update({
          where: { id: expenseId },
          data: { status: 'REJECTED' }
        });
      }
      // Otherwise, keep waiting for more approvals
    }

  } catch (error) {
    console.error('Process approval workflow error:', error);
  }
}

export default router;
