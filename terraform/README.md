# RDS Read Replica Infrastructure

This Terraform configuration sets up a cross-region read replica for an existing RDS instance. The infrastructure is modularized for better maintainability and reuse.

## Architecture

The configuration creates:

- A VPC in the Ireland (eu-west-1) region for the read replica
- Public subnets across multiple availability zones
- Security groups for database access
- An RDS read replica instance connected to a primary database in Frankfurt (eu-central-1)

## Module Structure

```
read-replica/
├── modules/
│   ├── networking/          # VPC and network resources
│   │   ├── main.tf         # VPC, subnets, security groups
│   │   ├── variables.tf    # Input variables
│   │   └── outputs.tf      # Network resource outputs
│   └── rds/                # RDS read replica resources
│       ├── main.tf         # Read replica configuration
│       ├── variables.tf    # Input variables
│       └── outputs.tf      # Database outputs
├── main.tf                 # Root configuration
├── variables.tf            # Root input variables
├── outputs.tf             # Root outputs
└── README.md              # This file
```

## Prerequisites

- Terraform >= 1.0
- AWS provider ~> 5.0
- An existing RDS instance in the Frankfurt (eu-central-1) region
- Appropriate AWS credentials with permissions to:
  - Create VPC resources
  - Create RDS resources
  - Read source RDS instance information

## Usage

1. Initialize Terraform:

   ```bash
   terraform init
   ```

2. Configure variables in `terraform.tfvars`:

   ```hcl
   environment = "dev"
   primary_db_identifier = "your-primary-db"
   read_replica_identifier = "your-replica-name"
   vpc_cidr = "172.16.0.0/16"
   public_subnet_cidrs = ["172.16.1.0/24", "172.16.2.0/24"]
   ```

3. Review the plan:

   ```bash
   terraform plan
   ```

4. Apply the configuration:
   ```bash
   terraform apply
   ```

## Variables

### Root Level Variables

| Name                    | Description                              | Type         | Default                            |
| ----------------------- | ---------------------------------------- | ------------ | ---------------------------------- |
| aws_region              | Primary AWS region (replica destination) | string       | "eu-west-1"                        |
| aws_read_replica_region | Source AWS region for replication        | string       | "eu-central-1"                     |
| environment             | Deployment environment                   | string       | "dev"                              |
| primary_db_identifier   | RDS identifier of the primary DB         | string       | -                                  |
| read_replica_identifier | Identifier for the read replica          | string       | -                                  |
| instance_class          | Instance class for the read replica      | string       | "db.t3.micro"                      |
| vpc_cidr                | CIDR block for the VPC                   | string       | "172.16.0.0/16"                    |
| public_subnet_cidrs     | List of public subnet CIDRs              | list(string) | ["172.16.1.0/24", "172.16.2.0/24"] |

## Outputs

| Name                  | Description                                           |
| --------------------- | ----------------------------------------------------- |
| read_replica_endpoint | The endpoint of the read replica database (sensitive) |

## Security Considerations

- The configuration creates public subnets and allows public access to the RDS instance
- Security group rules are configured to allow PostgreSQL traffic (port 5432)
- Consider adjusting security group rules and subnet configuration based on your security requirements
- Sensitive outputs are marked as sensitive in Terraform

## Maintenance

### Adding New Regions

To add support for different regions:

1. Update the provider configurations in `main.tf`
2. Adjust the region-specific variables
3. Update the CIDR ranges if necessary

### Modifying Security Rules

Security group rules can be modified in the networking module:

- Update the ingress/egress rules in `modules/networking/main.tf`
- Consider your security requirements when modifying these rules

## Troubleshooting

Common issues and solutions:

1. **Provider Configuration**

   - Ensure both regions' providers are properly configured
   - Check that provider aliases match between root and modules

2. **Networking Issues**

   - Verify CIDR ranges don't overlap with existing VPCs
   - Ensure availability zones are available in the chosen region

3. **Replication Issues**
   - Verify the primary database exists and is available
   - Check that the primary database allows replication

## Contributing

When contributing to this configuration:

1. Follow the existing module structure
2. Update documentation for any changes
3. Test configurations before submitting changes
4. Follow Terraform best practices and style guides
