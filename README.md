# OdooXAmalthea

## 📋 Problem Statement

Traditional expense management systems are often cumbersome, inefficient, and lack the flexibility needed for modern businesses. Organizations struggle with:

- **Manual Processing**: Paper-based receipts and manual data entry lead to errors and delays
- **Complex Approval Workflows**: Rigid approval processes that don't adapt to different expense types or organizational structures
- **Poor Visibility**: Lack of real-time insights into expense patterns and approval bottlenecks
- **Multi-Currency Challenges**: Difficulty handling expenses in different currencies with accurate conversion
- **Limited Automation**: Minimal use of OCR and AI for receipt processing and data extraction
- **Inconsistent Compliance**: Difficulty maintaining consistent expense policies across teams and departments

## 🎯 Project Purpose

ExpenseFlow is a comprehensive, modern expense management system designed to streamline and automate the entire expense lifecycle from submission to reimbursement. The system addresses the core challenges of expense management through:

### Core Features

- **🤖 Intelligent Receipt Processing**: OCR-powered receipt scanning and data extraction
- **🔄 Flexible Approval Workflows**: Configurable multi-step approval processes with sequential, percentage-based, and hybrid approval rules
- **💱 Multi-Currency Support**: Real-time currency conversion with exchange rate tracking
- **📊 Advanced Analytics**: Comprehensive dashboards and reporting for expense insights
- **🔐 Role-Based Access Control**: Secure user management with Admin, Manager, and Employee roles
- **📱 Modern User Interface**: Responsive design with intuitive user experience
- **⚡ Real-Time Processing**: Instant status updates and notifications
- **📈 Expense Tracking**: Complete audit trail and expense history management

### Technical Architecture

- **Frontend**: React with TypeScript, Vite, Tailwind CSS, and modern UI components
- **Backend**: Node.js with Express, TypeScript, and Prisma ORM
- **Database**: PostgreSQL with comprehensive data modeling
- **Authentication**: JWT-based authentication with role-based authorization
- **File Processing**: OCR integration for receipt and document processing
- **API Design**: RESTful APIs with proper error handling and validation

## 👥 Team Details

### Team Name
**NightOwls**



### Team Collaboration
- **Communication**: Daily standups and collaborative development
- **Version Control**: Git with feature branch workflow
- **Code Review**: Peer review process for all changes
- **Documentation**: Comprehensive documentation and inline comments

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Docker (optional, for containerized setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/0211Abhay/OdooXAmalthea.git
   cd OdooXAmalthea
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   cp .env.example .env
   # Configure your environment variables
   npm run prisma:migrate
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

4. **Database Setup**
   ```bash
   # Using Docker Compose
   docker-compose up -d postgres
   ```

### Environment Configuration

Create a `.env` file in the Backend directory with:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expense_management"
JWT_SECRET="your-jwt-secret"
FRONTEND_URL="http://localhost:5173"
```

## 📁 Project Structure

```
OdooXAmalthea/
├── Frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── contexts/       # React contexts
│   │   └── lib/           # Utility functions
├── Backend/                # Node.js backend API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── prisma/            # Database schema and migrations
└── docker-compose.yml     # Container orchestration
```

## 🔧 Key Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT, bcryptjs
- **File Processing**: Multer, OCR integration
- **Development**: ESLint, Prettier, tsx
- **Deployment**: Docker, Docker Compose

## 📈 Features Roadmap

- [x] User authentication and authorization
- [x] Expense submission with receipt upload
- [x] Multi-role dashboard (Admin, Manager, Employee)
- [x] Approval workflow system
- [x] Expense history and tracking
- [x] Multi-currency support
- [ ] Advanced OCR and AI-powered receipt processing
- [ ] Mobile application
- [ ] Advanced reporting and analytics
- [ ] Integration with accounting systems
- [ ] Automated expense categorization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For questions or support, please contact the development team:
- **Email**: team@odooxamalthea.com
- **Project Repository**: [GitHub Repository](https://github.com/your-org/OdooXAmalthea)

---

**Built with ❤️ by the Amalthea Development Team**
