# AWS RDS Disaster Recovery SaaS

A multi-tenant SaaS application for automating AWS RDS Disaster Recovery configuration and deployment using Terraform. This platform allows companies to configure their DR setup via a web UI, store configurations securely, and trigger Terraform deployments with real-time log monitoring.

## 🚀 Features

### Multi-Tenant Architecture
- **Admin Users**: Manage companies and view all deployments
- **Company Users**: Configure DR setups and manage their own deployments

### Core Functionality
- **DR Configuration Form**: Intuitive web interface for setting up disaster recovery
- **Real-time Deployment Logs**: Live WebSocket updates during Terraform execution
- **Secure AWS Integration**: Uses IAM roles with External ID for secure access
- **Deployment History**: Track all deployments with detailed logs
- **Automated Terraform Execution**: Backend handles infrastructure provisioning

### Security Features
- JWT-based authentication
- bcrypt password hashing
- AWS IAM role assumption with External ID
- Temporary credential management
- Role-based access control

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: WebSockets for live updates
- **Infrastructure**: Terraform for AWS resource management
- **Authentication**: JWT tokens

### Database Schema
```
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
cd aws-rds-dr-saas
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Configure the following variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rds_dr_saas"

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
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed admin user
npm run db:seed
```

### 4. Terraform Setup
Ensure your Terraform configuration is in the `terraform/` directory. The application will execute Terraform commands from this location.

### 5. Start the Application
```bash
# Start backend server
npm run server

# In another terminal, start frontend
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
3. **Monitor Deployments**: View all deployments across all companies
4. **System Overview**: Access comprehensive dashboard with statistics

### For Company Users

1. **Register** your company or login with existing credentials
2. **Configure DR Setup**:
   - Fill out the DR configuration form
   - Provide AWS IAM Role ARN and External ID
   - Specify database identifiers and regions
   - Set notification preferences
3. **Deploy Infrastructure**: Submit configuration to trigger Terraform deployment
4. **Monitor Progress**: Watch real-time logs during deployment
5. **View History**: Access all previous deployments and their logs

### DR Configuration Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| Primary AWS Region | Main region for your database | `eu-central-1` |
| Read Replica Region | DR region for read replica | `eu-west-1` |
| Primary DB Identifier | Name for primary database | `company-primary-db` |
| Read Replica Identifier | Name for read replica | `company-read-replica` |
| Instance Class | RDS instance type | `db.t3.micro` |
| VPC CIDR | Network range for VPC | `172.16.0.0/16` |
| Public Subnet CIDRs | Subnet ranges | `["172.16.1.0/24"]` |
| Notification Email | Alert email address | `admin@company.com` |
| Environment | Deployment environment | `production` |
| Tag Name | Resource tag identifier | `CompanyDR` |
| IAM Role ARN | AWS role for access | `arn:aws:iam::123:role/DR` |
| External ID | Security identifier | `unique-external-id` |

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
4. Terraform executes with temporary credentials

## 🚀 Deployment Process

### Automated Workflow

1. **Configuration Submission**: User submits DR configuration form
2. **Credential Validation**: System validates AWS IAM role access
3. **File Generation**: Creates company-specific `.tfvars` file
4. **Terraform Execution**:
   - Assumes AWS role with External ID
   - Exports temporary credentials
   - Runs `terraform init`
   - Runs `terraform apply` with auto-approve
5. **Real-time Logging**: Streams stdout/stderr to frontend via WebSocket
6. **Status Updates**: Updates deployment status in database
7. **Log Storage**: Stores complete logs for future reference

### File Structure
```
tfvars/
├── company_123.tfvars
├── company_456.tfvars
└── ...

terraform/
├── main.tf
├── variables.tf
├── outputs.tf
└── ... (your terraform configuration)
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
- `POST /api/deployments` - Create new deployment
- `GET /api/deployments/:id/logs` - Get deployment logs

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

### Project Structure
```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React contexts (Auth, WebSocket)
│   ├── pages/             # Page components
│   └── main.tsx           # Application entry point
├── server/                # Backend Node.js application
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── middleware/        # Express middleware
│   └── index.js           # Server entry point
├── prisma/                # Database schema and migrations
├── terraform/             # Terraform configuration files
├── tfvars/                # Generated tfvars files
└── public/                # Static assets
```

### Available Scripts
```bash
npm run dev          # Start frontend development server
npm run server       # Start backend server
npm run build        # Build frontend for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database with admin user
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

## 🛡️ Security Considerations

### Authentication & Authorization
- JWT tokens with expiration
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Protected API routes with middleware

### AWS Security
- No static AWS credentials stored
- IAM role assumption with External ID
- Temporary credential usage
- Principle of least privilege

### Data Protection
- Environment variable configuration
- Secure credential storage
- Input validation and sanitization
- Rate limiting on API endpoints

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
- Ensure External ID matches
- Review Terraform configuration syntax

**WebSocket Connection Issues**
- Check proxy configuration in vite.config.ts
- Verify WebSocket URL in frontend
- Ensure backend server is running

**Authentication Problems**
- Verify JWT_SECRET is set
- Check token expiration
- Ensure admin user exists (run seed)

### Logs and Debugging
- Backend logs: Check console output from `npm run server`
- Frontend logs: Open browser developer tools
- Database logs: Check PostgreSQL logs
- Terraform logs: Available in deployment logs section

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Consult the AWS IAM setup guide

---

**⚠️ Production Deployment Notes:**
- Change default admin password
- Use strong JWT secrets
- Configure proper SSL/TLS
- Set up monitoring and logging
- Review and harden security settings
- Use environment-specific configurations# terraform-ui
# terraform-ui
# terraform-ui
# terraform-ui
