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

      // Create default expense categories
      const defaultCategories = [
        { name: 'Travel', description: 'Travel related expenses including flights, hotels, and transportation' },
        { name: 'Meals & Entertainment', description: 'Business meals and entertainment expenses' },
        { name: 'Office Supplies', description: 'Office supplies and equipment' },
        { name: 'Software & Subscriptions', description: 'Software licenses and subscription services' },
        { name: 'Training & Education', description: 'Professional development and training expenses' },
        { name: 'Marketing', description: 'Marketing and advertising expenses' },
        { name: 'Utilities', description: 'Office utilities and services' },
        { name: 'Other', description: 'Other business expenses' },
      ];

      for (const category of defaultCategories) {
        await tx.expenseCategory.create({
          data: {
            ...category,
            companyId: company.id,
          },
        });
      }

      return { user, company };
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

export default router;
