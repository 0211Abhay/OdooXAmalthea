import * as nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface WelcomeEmailData {
  name: string;
  email: string;
  password: string;
  role: string;
  companyName: string;
  loginUrl: string;
}

interface ApprovalNotificationData {
  employeeName: string;
  employeeEmail: string;
  approverName: string;
  expenseTitle: string;
  expenseAmount: number;
  expenseDate: string;
  status: 'APPROVED' | 'REJECTED';
  comments?: string;
  companyName: string;
  dashboardUrl: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  private generateApprovalNotificationTemplate(data: ApprovalNotificationData): string {
    const isApproved = data.status === 'APPROVED';
    const statusColor = isApproved ? '#10b981' : '#ef4444';
    const statusIcon = isApproved ? '✅' : '❌';
    const statusText = isApproved ? 'Approved' : 'Rejected';
    const actionText = isApproved ? 'approved' : 'rejected';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense ${statusText} - ${data.companyName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid ${statusColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .status-badge {
            display: inline-block;
            background: ${statusColor};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 16px;
            font-weight: 600;
            margin: 10px 0;
        }
        .expense-details {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        .detail-value {
            font-weight: 500;
            color: #1f2937;
        }
        .amount {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
        }
        .comments-section {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .dashboard-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ExpenseFlow</div>
            <h1>Expense ${statusText}</h1>
            <div class="status-badge">
                ${statusIcon} ${statusText}
            </div>
        </div>

        <p>Hello <strong>${data.employeeName}</strong>,</p>
        
        <p>Your expense request has been <strong>${actionText}</strong> by <strong>${data.approverName}</strong>.</p>

        <div class="expense-details">
            <h3 style="margin-top: 0; color: #1f2937;">Expense Details</h3>
            <div class="detail-row">
                <span class="detail-label">Title:</span>
                <span class="detail-value">${data.expenseTitle}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount">$${data.expenseAmount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(data.expenseDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
            </div>
        </div>

        ${data.comments ? `
        <div class="comments-section">
            <h4 style="margin-top: 0; color: #92400e;">Comments from ${data.approverName}:</h4>
            <p style="margin-bottom: 0; color: #92400e; font-style: italic;">"${data.comments}"</p>
        </div>
        ` : ''}

        <div style="text-align: center;">
            <a href="${data.dashboardUrl}" class="dashboard-button">View Dashboard</a>
        </div>

        <p>If you have any questions about this decision, please contact your manager or the approver directly.</p>

        <div class="footer">
            <p>This notification was sent by ExpenseFlow - Smart expense management for modern teams</p>
            <p>© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateWelcomeEmailTemplate(data: WelcomeEmailData): string {
    const roleDescription = this.getRoleDescription(data.role);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${data.companyName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .welcome-title {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .credentials-box {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .credential-item:last-child {
            border-bottom: none;
        }
        .credential-label {
            font-weight: 600;
            color: #374151;
        }
        .credential-value {
            font-family: 'Courier New', monospace;
            background: #1f2937;
            color: #10b981;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
        }
        .role-badge {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .login-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .security-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ExpenseFlow</div>
            <h1 class="welcome-title">Welcome to ${data.companyName}!</h1>
        </div>

        <p>Hello <strong>${data.name}</strong>,</p>
        
        <p>Welcome to <strong>${data.companyName}</strong>! We're excited to have you join our team. Your account has been created and you can now access our expense management system.</p>

        <div class="credentials-box">
            <h3 style="margin-top: 0; color: #1f2937;">Your Account Details</h3>
            <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${data.email}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${data.password}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Role:</span>
                <span class="role-badge">${data.role}</span>
            </div>
        </div>

        <p><strong>Your Role:</strong> ${roleDescription}</p>

        <div style="text-align: center;">
            <a href="${data.loginUrl}" class="login-button">Login to Your Account</a>
        </div>

        <div class="security-note">
            <strong>🔒 Security Note:</strong> Please change your password after your first login for security purposes.
        </div>

        <p>If you have any questions or need assistance, please don't hesitate to contact your administrator.</p>

        <div class="footer">
            <p>This email was sent by ExpenseFlow - Smart expense management for modern teams</p>
            <p>© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getRoleDescription(role: string): string {
    const descriptions = {
      'ADMIN': 'You have full administrative access to the system, including user management, approval rules, and company settings.',
      'MANAGER': 'You can manage your team\'s expenses, approve expense requests, and view team analytics.',
      'EMPLOYEE': 'You can submit expense requests, track your expenses, and view your expense history.'
    };
    return descriptions[role as keyof typeof descriptions] || 'You have access to the expense management system.';
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${data.companyName}" <${process.env.SMTP_USER}>`,
        to: data.email,
        subject: `Welcome to ${data.companyName} - Your Account Details`,
        html: this.generateWelcomeEmailTemplate(data),
        text: `
Welcome to ${data.companyName}!

Hello ${data.name},

Your account has been created successfully. Here are your login details:

Email: ${data.email}
Password: ${data.password}
Role: ${data.role}

Please login at: ${data.loginUrl}

Important: Please change your password after your first login for security purposes.

Best regards,
${data.companyName} Team
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent successfully to ${data.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async sendApprovalNotification(data: ApprovalNotificationData): Promise<boolean> {
    try {
      const statusText = data.status === 'APPROVED' ? 'Approved' : 'Rejected';
      const subject = `Expense ${statusText} - ${data.expenseTitle}`;
      
      const mailOptions = {
        from: `"${data.companyName}" <${process.env.SMTP_USER}>`,
        to: data.employeeEmail,
        subject: subject,
        html: this.generateApprovalNotificationTemplate(data),
        text: `
Expense ${statusText}

Hello ${data.employeeName},

Your expense request has been ${data.status.toLowerCase()} by ${data.approverName}.

Expense Details:
- Title: ${data.expenseTitle}
- Amount: $${data.expenseAmount.toFixed(2)}
- Date: ${new Date(data.expenseDate).toLocaleDateString()}
- Status: ${statusText}

${data.comments ? `Comments from ${data.approverName}: "${data.comments}"` : ''}

View your dashboard: ${data.dashboardUrl}

Best regards,
${data.companyName} Team
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Approval notification sent successfully to ${data.employeeEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send approval notification:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
