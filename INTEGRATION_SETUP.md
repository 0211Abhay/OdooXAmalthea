// Frontend Development Setup Instructions

## Backend Setup (Required for Frontend Integration)

### 1. Navigate to Backend Directory
```bash
cd /home/blink/Development/Oddo\ -\ Main/OdooXAmalthea/Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the Backend directory with:
```env
PORT=3001
DATABASE_URL="your_postgres_connection_string"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"
BCRYPT_ROUNDS=12
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Optional: Seed database with sample data
npx prisma db seed
```

### 5. Start Backend Server
```bash
npm run dev
```
The backend will run on http://localhost:5000

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd /home/blink/Development/Oddo\ -\ Main/OdooXAmalthea/Frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create a `.env` file in the Frontend directory with:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=10000
```

### 4. Start Frontend Development Server
```bash
npm run dev
```
The frontend will run on http://localhost:5173

## Testing Integration

### 1. User Registration
- Go to http://localhost:5173/signup
- Fill out the form with country and currency selection
- Submit to create a new user account

### 2. User Login
- Go to http://localhost:5173/login
- Use the credentials from registration
- Login to access the dashboard

### 3. Expense Management
- Create new expenses from the dashboard
- Upload receipts (if supported)
- View expense lists with filtering
- Test approval workflows (if manager/admin user)

## API Endpoints Available

### Authentication
- POST /api/auth/signup - Create new user account
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout  
- GET /api/auth/me - Get current user

### Users
- GET /api/users - List users (with filtering)
- GET /api/users/me - Get current user profile
- PATCH /api/users/me - Update user profile
- GET /api/users/stats - User statistics

### Expenses
- GET /api/expenses - List expenses (with filtering)
- POST /api/expenses - Create new expense
- GET /api/expenses/:id - Get expense by ID
- PATCH /api/expenses/:id - Update expense
- DELETE /api/expenses/:id - Delete expense
- POST /api/expenses/:id/submit - Submit expense for approval
- POST /api/expenses/:id/approve - Approve/reject expense

### Categories
- GET /api/categories - List expense categories
- POST /api/categories - Create new category
- PATCH /api/categories/:id - Update category
- DELETE /api/categories/:id - Delete category

## Features Implemented

### ✅ Country & Currency Selection
- REST Countries API integration
- Multi-currency support with exchange rates
- Visual country selection with flags and names
- Currency validation and conversion

### ✅ Authentication Integration  
- JWT token-based authentication
- Automatic token refresh
- Protected routes
- User profile management

### ✅ API Client Layer
- Centralized API configuration
- Error handling and retries
- File upload support
- Type-safe request/response handling

### ✅ Expense Management
- Full CRUD operations
- File upload for receipts
- Status tracking and approval workflows
- Advanced filtering and pagination

### ✅ State Management
- React Context for authentication
- Custom hooks for data fetching
- Real-time updates
- Loading and error states

## Next Steps

1. Start both backend and frontend servers
2. Test user registration with country/currency
3. Verify login functionality
4. Test expense creation and management
5. Implement additional features as needed

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend allows frontend origin
2. **Database Connection**: Verify PostgreSQL is running and connection string is correct
3. **Port Conflicts**: Check if ports 5000 and 5173 are available
4. **Environment Variables**: Ensure all required env vars are set

### Debug Steps
1. Check browser console for frontend errors
2. Check backend logs for API errors  
3. Verify network requests in browser dev tools
4. Test API endpoints directly with curl/Postman
