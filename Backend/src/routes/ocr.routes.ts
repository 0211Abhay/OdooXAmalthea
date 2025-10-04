import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import fs from 'fs';

interface AuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

const router = Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = 'uploads/receipts/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

// OCR Processing function (simulated - replace with actual OCR service)
async function processOCR(filePath: string, mimeType: string) {
  // Simulate OCR processing
  // In real implementation, integrate with services like Google Vision API, Azure Computer Vision, or Tesseract
  
  // Simulated OCR results
  const ocrData = {
    totalAmount: Math.floor(Math.random() * 500) + 10, // Random amount between 10-510
    merchantName: ['Starbucks', 'McDonald\'s', 'Shell Gas Station', 'Best Buy', 'Amazon'][Math.floor(Math.random() * 5)],
    date: new Date().toISOString().split('T')[0],
    currency: ['USD', 'EUR', 'GBP'][Math.floor(Math.random() * 3)],
    items: [
      { description: 'Coffee', amount: 4.50 },
      { description: 'Sandwich', amount: 8.99 }
    ],
    confidence: 0.85 + Math.random() * 0.14 // 85-99% confidence
  };

  return ocrData;
}

// Upload receipt and create expense with OCR
router.post('/upload-receipt', authenticateToken, upload.single('receipt'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process OCR
    const ocrData = await processOCR(file.path, file.mimetype);
    
    // Get company for currency conversion
    const company = await prisma.company.findUnique({
      where: { id: user.companyId! },
      select: { currency: true }
    });

    // Convert currency if needed
    let finalAmount = ocrData.totalAmount;
    let exchangeRate = 1;
    
    if (company && ocrData.currency !== company.currency) {
      finalAmount = await convertCurrency(ocrData.totalAmount, ocrData.currency, company.currency);
      exchangeRate = finalAmount / ocrData.totalAmount;
    }

    // Create expense with OCR data
    const expense = await prisma.expense.create({
      data: {
        description: `Receipt from ${ocrData.merchantName}`,
        amount: finalAmount,
        originalAmount: ocrData.totalAmount,
        originalCurrency: ocrData.currency,
        currency: company?.currency || 'USD',
        exchangeRate: exchangeRate !== 1 ? exchangeRate : undefined,
        expenseDate: new Date(ocrData.date),
        receiptUrl: `/uploads/receipts/${file.filename}`,
        merchantName: ocrData.merchantName,
        ocrData: ocrData,
        userId: user.id,
        companyId: user.companyId!,
        status: 'PENDING'
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true
      }
    });

    res.status(201).json({
      expense,
      ocrData,
      message: 'Receipt processed successfully. Please review and edit the expense details if needed.'
    });

  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

// Helper function for currency conversion
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

export default router;