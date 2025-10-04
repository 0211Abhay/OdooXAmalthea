import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorizeRoles, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createEmployeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  departmentId: z.string().uuid(),
  positionId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
  salary: z.number().positive(),
  joiningDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

// Get all employees with filters
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      search,
      department,
      status,
      dateFrom,
      dateTo,
      salaryMin,
      salaryMax,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const where: any = { companyId: req.companyId };

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.departmentId = department;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.joiningDate = {};
      if (dateFrom) where.joiningDate.gte = new Date(dateFrom as string);
      if (dateTo) where.joiningDate.lte = new Date(dateTo as string);
    }

    if (salaryMin || salaryMax) {
      where.salary = {};
      if (salaryMin) where.salary.gte = parseFloat(salaryMin as string);
      if (salaryMax) where.salary.lte = parseFloat(salaryMax as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      data: employees,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        user: { select: { id: true, name: true, email: true, role: true } },
        changeRequests: {
          orderBy: { submittedDate: 'desc' },
          take: 10,
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create employee (Admin/Manager only)
router.post('/', authenticate, authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const validatedData = createEmployeeSchema.parse(req.body);

    const existingEmployee = await prisma.employee.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee with this email already exists' });
    }

    // Generate employee code
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const lastEmployee = await prisma.employee.findFirst({
      where: { companyId: req.companyId! },
      orderBy: { createdAt: 'desc' },
      select: { employeeCode: true },
    });

    let nextNumber = 1;
    if (lastEmployee && lastEmployee.employeeCode) {
      const lastNumber = parseInt(lastEmployee.employeeCode.slice(-4));
      nextNumber = lastNumber + 1;
    }

    const employeeCode = `EMP${currentYear}${nextNumber.toString().padStart(4, '0')}`;

    const employee = await prisma.employee.create({
      data: {
        ...validatedData,
        employeeCode,
        companyId: req.companyId!,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        joiningDate: validatedData.joiningDate ? new Date(validatedData.joiningDate) : new Date(),
      },
      include: {
        department: true,
        position: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        action: 'CREATE',
        entityType: 'Employee',
        entityId: employee.id,
        newValue: JSON.stringify(employee),
      },
    });

    res.status(201).json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update employee (Admin/Manager only)
router.patch('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateEmployeeSchema.parse(req.body);

    const existingEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
        joiningDate: validatedData.joiningDate ? new Date(validatedData.joiningDate) : undefined,
      },
      include: {
        department: true,
        position: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        action: 'UPDATE',
        entityType: 'Employee',
        entityId: employee.id,
        oldValue: JSON.stringify(existingEmployee),
        newValue: JSON.stringify(employee),
      },
    });

    res.json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete employee (Admin only)
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await prisma.employee.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        action: 'DELETE',
        entityType: 'Employee',
        entityId: id,
        oldValue: JSON.stringify(employee),
      },
    });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee statistics
router.get('/stats/overview', authenticate, async (req: AuthRequest, res) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      departmentStats,
      salaryStats,
    ] = await Promise.all([
      prisma.employee.count({ where: { companyId: req.companyId } }),
      prisma.employee.count({ where: { companyId: req.companyId, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { companyId: req.companyId, status: 'INACTIVE' } }),
      prisma.employee.groupBy({
        by: ['departmentId'],
        where: { companyId: req.companyId },
        _count: true,
      }),
      prisma.employee.aggregate({
        where: { companyId: req.companyId },
        _avg: { salary: true },
        _max: { salary: true },
        _min: { salary: true },
      }),
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      onLeave: totalEmployees - activeEmployees - inactiveEmployees,
      departmentStats,
      salaryStats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk operations
router.post('/bulk/delete', authenticate, authorizeRoles('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid employee IDs' });
    }

    const result = await prisma.employee.deleteMany({
      where: { id: { in: ids }, companyId: req.companyId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        action: 'BULK_DELETE',
        entityType: 'Employee',
        entityId: ids.join(','),
        newValue: `Deleted ${result.count} employees`,
      },
    });

    res.json({ message: `${result.count} employees deleted successfully` });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;