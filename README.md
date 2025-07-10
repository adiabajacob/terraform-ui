# Terraform DR Manager

A modern, multi-tenant SaaS application for automating AWS RDS Disaster Recovery configuration and deployment using Terraform. This platform allows companies to choose between different DR solutions, configure their setup via a beautiful web UI, and deploy infrastructure with real-time monitoring.

## 🎨 Brand Identity

This application features a cohesive brand design using:

- **Primary Color**: `#08283B` (Dark Blue) - Used for main actions and navigation
- **Secondary Color**: `#CC3F02` (Orange) - Used for accents and highlights

## 🚀 Features

### Multi-Solution Disaster Recovery

- **Read Replica Solution**: Real-time replication with automatic failover for high availability
- **Snapshot-based Solution**: Automated snapshots with cross-region backup for cost-effective DR
- **Dynamic Configuration Forms**: Solution-specific input fields and validation
- **Separate Terraform Workspaces**: Isolated state management for each solution type

### Multi-Tenant Architecture

- **Admin Users**: Manage companies and view all deployments across solutions
- **Company Users**: Configure DR setups and manage their own deployments
- **Role-based Access Control**: Secure separation between admin and company users

### Core Functionality

- **Dynamic DR Configuration Form**: Intuitive web interface with solution selection
- **Real-time Deployment Logs**: Live WebSocket updates during Terraform execution
- **Secure AWS Integration**: Uses IAM roles with External ID for secure access
- **Deployment History**: Track all deployments with solution-specific details
- **Automated Terraform Execution**: Backend handles infrastructure provisioning
- **Infrastructure Destruction**: Safe cleanup of deployed resources

### Security Features

- JWT-based authentication with secure token management
- bcrypt password hashing for user credentials
- AWS IAM role assumption with External ID validation
- Temporary credential management with automatic rotation
- Role-based access control with company isolation

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS with custom brand colors
- **Backend**: Node.js + Express with TypeScript support
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: WebSockets for live deployment updates
- **Infrastructure**: Terraform for AWS resource management
- **Authentication**: JWT tokens with role-based access

### Project Structure

```
terraform-ui/
├── client/                    # Frontend React application
│   ├── components/           # Reusable UI components
│   │   ├── DRConfigForm.tsx  # Dynamic DR configuration form
│   │   ├── DeploymentList.tsx # Deployment history with solution icons
│   │   ├── StatusBadge.tsx   # Status indicators with brand colors
│   │   ├── Layout.tsx        # Main layout with navigation
│   │   ├── NotificationToast.tsx # Toast notifications
│   │   └── CompanyManagement.tsx # Admin company management
│   ├── contexts/             # React contexts (Auth, WebSocket, Notifications)
│   ├── pages/                # Page components
│   │   ├── LoginPage.tsx     # Authentication with brand styling
│   │   ├── CompanyDashboard.tsx # Company user dashboard
│   │   └── AdminDashboard.tsx # Admin dashboard
│   ├── tailwind.config.js    # Tailwind config with brand colors
│   └── main.tsx              # Application entry point
├── server/                   # Backend Node.js application
│   ├── routes/               # API route handlers
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── companies.js      # Company management
│   │   └── deployments.js    # Deployment management
│   ├── services/             # Business logic services
│   │   ├── deployment.js     # Multi-solution deployment logic
│   │   ├── aws.js            # AWS credential management
│   │   └── websocket.js      # Real-time communication
│   ├── middleware/           # Express middleware
│   └── index.js              # Server entry point
├── prisma/                   # Database schema and migrations
│   └── schema.prisma         # Database schema with solution types
├── terraform/                # Read Replica solution Terraform files
├── snapshot-resources/       # Snapshot solution Terraform files
└── README.md                 # This file
```

### Database Schema

```sql
User
├── id (String, Primary Key)
├── email (String, Unique)
├── passwordHash (String)
├── role (ADMIN | COMPANY)
├── companyId (String, Optional)
└── company (Relation)

Company
├── id (String, Primary Key)
├── name (String)
├── contactEmail (String)
├── users (Relation)
├── deployments (Relation)
└── credentials (Relation)

Deployment
├── id (String, Primary Key)
├── companyId (String)
├── solutionType (READ_REPLICA | SNAPSHOT)  -- NEW: Solution type
├── terraformVarsJson (JSON)
├── status (PENDING | RUNNING | SUCCEEDED | FAILED)
├── logs (Text)
└── timestamps

CompanyCredential
├── id (String, Primary Key)
├── companyId (String, Unique)
├── iamRoleArn (String)
└── externalId (String)
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Terraform CLI
- AWS CLI (configured)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd terraform-ui

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Configuration

Create a `.env` file in the server directory:

```bash
cd server
cp .env.example .env
```

Configure the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/terraform_dr"

# JWT Secret (Change in production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# AWS Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"

# Server Configuration
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 3. Database Setup

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed admin user
npm run seed
```

### 4. Terraform Setup

The application supports two separate Terraform configurations:

- **Read Replica Solution**: Located in `terraform/` directory
- **Snapshot Solution**: Located in `snapshot-resources/` directory

Each solution has its own state file and configuration.

### 5. Start the Application

```bash
# Start backend server (from server directory)
cd server
npm start

# In another terminal, start frontend (from client directory)
cd client
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🔐 Default Admin Access

After running the seed script, you can log in with:

- **Email**: `admin@rds-dr.com`
- **Password**: `admin123`

⚠️ **Important**: Change the default password immediately after first login!

## 📋 Usage Guide

### For Admin Users

1. **Login** with admin credentials
2. **Manage Companies**: Create and manage client companies
3. **Monitor Deployments**: View all deployments across all companies and solutions
4. **System Overview**: Access comprehensive dashboard with statistics

### For Company Users

1. **Register** your company or login with existing credentials
2. **Choose DR Solution**:
   - **Read Replica**: For high availability with real-time replication
   - **Snapshot**: For cost-effective cross-region backup
3. **Configure DR Setup**:
   - Fill out the solution-specific configuration form
   - Provide AWS IAM Role ARN and External ID
   - Specify database identifiers and regions
   - Set notification preferences
4. **Deploy Infrastructure**: Submit configuration to trigger Terraform deployment
5. **Monitor Progress**: Watch real-time logs during deployment
6. **View History**: Access all previous deployments with solution details
7. **Destroy Infrastructure**: Safely remove deployed resources when needed

### DR Configuration Parameters

#### Read Replica Solution

| Parameter               | Description                   | Example                |
| ----------------------- | ----------------------------- | ---------------------- |
| Primary AWS Region      | Main region for your database | `eu-central-1`         |
| Read Replica Region     | DR region for read replica    | `eu-west-1`            |
| Primary DB Identifier   | Name for primary database     | `company-primary-db`   |
| Read Replica Identifier | Name for read replica         | `company-read-replica` |
| Instance Class          | RDS instance type             | `db.t3.micro`          |
| VPC CIDR                | Network range for VPC         | `172.16.0.0/16`        |
| Public Subnet CIDRs     | Subnet ranges                 | `["172.16.1.0/24"]`    |
| Notification Email      | Alert email address           | `admin@company.com`    |
| Environment             | Deployment environment        | `production`           |
| Tag Name                | Resource tag identifier       | `CompanyDR`            |

#### Snapshot Solution

| Parameter             | Description                   | Example              |
| --------------------- | ----------------------------- | -------------------- |
| Primary Region        | Main region for your database | `eu-central-1`       |
| DR Region             | Backup region for snapshots   | `eu-west-1`          |
| Primary DB Identifier | Name for primary database     | `company-primary-db` |
| Project Name          | Project identifier            | `rds-dr`             |
| SNS Email             | Notification email            | `admin@company.com`  |

#### Common Parameters

| Parameter    | Description         | Example                    |
| ------------ | ------------------- | -------------------------- |
| IAM Role ARN | AWS role for access | `arn:aws:iam::123:role/DR` |
| External ID  | Security identifier | `unique-external-id`       |

## 🔒 AWS IAM Setup

### Customer AWS Account Setup

1. **Create IAM Role** in your AWS account:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR-SAAS-ACCOUNT:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "your-unique-external-id"
        }
      }
    }
  ]
}
```

2. **Attach Required Policies**:

   - `AmazonRDSFullAccess`
   - `AmazonVPCFullAccess`
   - `AmazonSNSFullAccess`
   - Custom policies as needed

3. **Generate External ID**: Use a unique, random string for security

### SaaS Platform Integration

The platform uses AWS STS to assume the customer's role:

1. Customer provides IAM Role ARN and External ID
2. Platform validates credentials before saving
3. During deployment, platform assumes role to get temporary credentials
4. Terraform executes with temporary credentials in the appropriate workspace

## 🚀 Deployment Process

### Multi-Solution Workflow

1. **Solution Selection**: User chooses between Read Replica or Snapshot solution
2. **Configuration Submission**: User submits solution-specific DR configuration form
3. **Credential Validation**: System validates AWS IAM role access
4. **File Generation**: Creates company-specific `.tfvars` file in appropriate directory
5. **Terraform Execution**:
   - Assumes AWS role with External ID
   - Exports temporary credentials
   - Navigates to solution-specific Terraform directory
   - Runs `terraform init`
   - Runs `terraform apply` with auto-approve
6. **Real-time Logging**: Streams stdout/stderr to frontend via WebSocket
7. **Status Updates**: Updates deployment status in database
8. **Log Storage**: Stores complete logs for future reference

### File Structure

```
terraform/                    # Read Replica solution
├── main.tf
├── variables.tf
├── outputs.tf
└── tfvars/
    ├── company_123.tfvars
    └── company_456.tfvars

snapshot-resources/           # Snapshot solution
├── main.tf
├── variables.tf
├── outputs.tf
└── tfvars/
    ├── company_789.tfvars
    └── company_012.tfvars
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Companies (Admin only)

- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Deployments

- `GET /api/deployments` - List deployments (filtered by role)
- `GET /api/deployments/:id` - Get deployment details
- `POST /api/deployments` - Create new deployment with solution type
- `GET /api/deployments/:id/logs` - Get deployment logs
- `POST /api/deployments/:id/destroy` - Destroy infrastructure

### Health Check

- `GET /health` - Application health status

## 🔌 WebSocket Events

### Client to Server

```javascript
{
  "type": "authenticate",
  "userId": "user-id",
  "companyId": "company-id"
}
```

### Server to Client

```javascript
// Deployment status updates
{
  "type": "deployment_status",
  "deploymentId": "deployment-id",
  "status": "RUNNING",
  "message": "Deployment started"
}

// Real-time logs
{
  "type": "deployment_log",
  "deploymentId": "deployment-id",
  "log": "terraform output line"
}
```

## 🧪 Development

### Available Scripts

```bash
# Backend (from server directory)
npm start              # Start backend server
npm run dev            # Start backend with nodemon
npm run db:migrate     # Run database migrations
npm run db:generate    # Generate Prisma client
npm run seed           # Seed database with admin user

# Frontend (from client directory)
npm run dev            # Start frontend development server
npm run build          # Build frontend for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `AWS_REGION`: Default AWS region
- `AWS_ACCESS_KEY_ID`: AWS access key for SaaS account
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for SaaS account
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS

## 🎨 UI/UX Features

### Brand Integration

- **Consistent Color Scheme**: Primary dark blue (#08283B) and secondary orange (#CC3F02)
- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Intuitive Navigation**: Clear separation between admin and company user interfaces

### User Experience

- **Dynamic Forms**: Solution-specific configuration forms with real-time validation
- **Real-time Updates**: Live deployment status and log streaming
- **Solution Icons**: Visual indicators for different DR solutions
- **Status Badges**: Color-coded deployment status indicators
- **Toast Notifications**: User-friendly success and error messages

## 🛡️ Security Considerations

### Authentication & Authorization

- JWT tokens with expiration and secure storage
- Role-based access control (RBAC) with company isolation
- Password hashing with bcrypt
- Protected API routes with middleware validation

### AWS Security

- No static AWS credentials stored in application
- IAM role assumption with External ID validation
- Temporary credential usage with automatic rotation
- Principle of least privilege for all AWS permissions

### Data Protection

- Environment variable configuration for sensitive data
- Secure credential storage with encryption
- Input validation and sanitization on all endpoints
- Rate limiting on API endpoints to prevent abuse

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection string in .env
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
```

**Terraform Execution Failures**

- Verify AWS credentials and permissions
- Check IAM role trust relationship
- Ensure External ID matches exactly
- Review Terraform configuration syntax
- Check solution-specific Terraform directory

**WebSocket Connection Issues**

- Check proxy configuration in vite.config.ts
- Verify WebSocket URL in frontend
- Ensure backend server is running on correct port

**Authentication Problems**

- Verify JWT_SECRET is set correctly
- Check token expiration settings
- Ensure admin user exists (run seed script)
- Clear browser cache and local storage

**Frontend Performance Issues**

- Tailwind CSS configuration optimized to exclude node_modules
- Check for large bundle sizes
- Verify Vite configuration

### Logs and Debugging

- **Backend logs**: Check console output from `npm run server`
- **Frontend logs**: Open browser developer tools
- **Database logs**: Check PostgreSQL logs
- **Terraform logs**: Available in deployment logs section
- **WebSocket logs**: Check browser network tab

## 📝 Recent Updates

### Version 2.0 - Multi-Solution DR System

- ✅ **Multi-Solution Support**: Added Read Replica and Snapshot-based DR solutions
- ✅ **Dynamic Forms**: Solution-specific configuration forms with validation
- ✅ **Separate Terraform Workspaces**: Isolated state management for each solution
- ✅ **Brand Integration**: Implemented custom brand colors throughout the UI
- ✅ **Project Restructuring**: Separated frontend and backend into distinct directories
- ✅ **Performance Optimization**: Fixed Tailwind CSS configuration for faster builds
- ✅ **Enhanced UI/UX**: Modern design with consistent branding
- ✅ **TypeScript Improvements**: Better type safety and error handling
- ✅ **Infrastructure Destruction**: Added safe cleanup functionality

### Version 1.0 - Initial Release

- ✅ **Multi-tenant Architecture**: Admin and company user roles
- ✅ **Real-time Deployment Monitoring**: WebSocket-based log streaming
- ✅ **Secure AWS Integration**: IAM role assumption with External ID
- ✅ **Terraform Automation**: Automated infrastructure provisioning
- ✅ **Deployment History**: Complete audit trail of all deployments

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section above
2. Review the API documentation
3. Check the deployment logs for specific errors
4. Contact the development team

---

**Built with ❤️ using React, Node.js, and Terraform**
