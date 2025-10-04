import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  companyName: z.string().min(1),
  country: z.string().min(1),
  currency: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Signup - Auto create company and admin user
router.post('/signup', async (req, res) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // For this demo, we'll use email-only authentication without passwords

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create company and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: validatedData.companyName,
          country: validatedData.country,
          currency: validatedData.currency,
          sequentialApproval: false, // Default to parallel approval
          minimumApprovalPercent: 50, // Default 50% minimum approval
        },
      });

      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          role: 'ADMIN',
          companyId: company.id,
          isApprover: true, // Admin is always an approver
          approverLevel: 1, // Highest level approver
        },
      });

      return { user, company };
    }, {
      timeout: 10000, // 10 second timeout
    });

    // Create default expense categories outside of transaction to avoid timeout
    const defaultCategories = [
      { name: 'Travel', description: 'Travel related expenses including flights, hotels, and transportation', companyId: result.company.id },
      { name: 'Meals & Entertainment', description: 'Business meals and entertainment expenses', companyId: result.company.id },
      { name: 'Office Supplies', description: 'Office supplies and equipment', companyId: result.company.id },
      { name: 'Software & Subscriptions', description: 'Software licenses and subscription services', companyId: result.company.id },
      { name: 'Training & Education', description: 'Professional development and training expenses', companyId: result.company.id },
      { name: 'Marketing', description: 'Marketing and advertising expenses', companyId: result.company.id },
      { name: 'Utilities', description: 'Office utilities and services', companyId: result.company.id },
      { name: 'Other', description: 'Other business expenses', companyId: result.company.id },
    ];

    // Create categories in batch
    await prisma.expenseCategory.createMany({
      data: defaultCategories,
    });

    const token = jwt.sign(
      { 
        userId: result.user.id, 
        role: result.user.role,
        companyId: result.company.id 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        companyId: result.company.id,
        isApprover: result.user.isApprover,
        approverLevel: result.user.approverLevel,
      },
      company: result.company,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login (simplified - email only for demo)
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { company: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        companyId: user.companyId 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        isApprover: user.isApprover,
        approverLevel: user.approverLevel,
      },
      company: user.company,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        isApprover: user.isApprover,
        approverLevel: user.approverLevel,
      },
      company: user.company,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
