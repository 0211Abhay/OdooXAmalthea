import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import expenseRoutes from './routes/expense.routes';
import categoryRoutes from './routes/category.routes';
import approvalRuleRoutes from './routes/approvalRule.routes';
import companyRoutes from './routes/company.routes';
import utilityRoutes from './routes/utility.routes';
import ocrRoutes from './routes/ocr.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/approval-rules', approvalRuleRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/utils', utilityRoutes);
app.use('/api/ocr', ocrRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
