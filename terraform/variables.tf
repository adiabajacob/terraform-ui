variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  
  validation {
    condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be in the format like 'us-east-1', 'eu-west-1', etc."
  }
}

variable "aws_read_replica_region" {
  description = "Source AWS region for replication"
  type        = string
  
  validation {
    condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_read_replica_region))
    error_message = "AWS region must be in the format like 'us-east-1', 'eu-west-1', etc."
  }
  
  validation {
    condition = var.aws_read_replica_region != var.aws_region
    error_message = "Read replica region must be different from the primary region."
  }
}

variable "primary_db_identifier" {
  description = "RDS identifier of the primary DB instance"
  type        = string
  
  validation {
    condition = can(regex("^[a-z][a-z0-9-]*[a-z0-9]$", var.primary_db_identifier)) && length(var.primary_db_identifier) >= 1 && length(var.primary_db_identifier) <= 63
    error_message = "DB identifier must be 1-63 characters, start with a letter, contain only lowercase letters, numbers, and hyphens, and end with a letter or number."
  }
}

variable "read_replica_identifier" {
  description = "Identifier for the read replica"
  type        = string
  
  validation {
    condition = can(regex("^[a-z][a-z0-9-]*[a-z0-9]$", var.read_replica_identifier)) && length(var.read_replica_identifier) >= 1 && length(var.read_replica_identifier) <= 63
    error_message = "DB identifier must be 1-63 characters, start with a letter, contain only lowercase letters, numbers, and hyphens, and end with a letter or number."
  }
  
  validation {
    condition = var.read_replica_identifier != var.primary_db_identifier
    error_message = "Read replica identifier must be different from the primary DB identifier."
  }
}

variable "instance_class" {
  description = "Instance class for the read replica"
  type        = string
  
  validation {
    condition = can(regex("^db\\.(t2|t3|t4g|m5|m6i|r5|r6i|x1e)\\.(nano|micro|small|medium|large|xlarge|2xlarge|4xlarge|8xlarge|12xlarge|16xlarge|24xlarge)$", var.instance_class))
    error_message = "Instance class must be a valid RDS instance type (e.g., db.t3.micro, db.r5.large)."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  
  validation {
    condition = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block (e.g., 10.0.0.0/16)."
  }
  
  validation {
    condition = split("/", var.vpc_cidr)[1] >= "16" && split("/", var.vpc_cidr)[1] <= "28"
    error_message = "VPC CIDR block must have a netmask between /16 and /28."
  }
}

variable "public_subnet_cidrs" {
  description = "List of public subnet CIDRs"
  type        = list(string)
  
  validation {
    condition = length(var.public_subnet_cidrs) >= 2
    error_message = "At least 2 public subnets are required for high availability."
  }
  
  validation {
    condition = alltrue([
      for cidr in var.public_subnet_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All subnet CIDRs must be valid IPv4 CIDR blocks."
  }
  
  validation {
    condition = length(var.public_subnet_cidrs) <= 6
    error_message = "Maximum of 6 public subnets allowed."
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  
  validation {
    condition = contains(["dev", "development", "test", "testing", "stage", "staging", "prod", "production","dr"], lower(var.environment))
    error_message = "Environment must be one of: dev, development, test, testing, stage, staging, prod, production,dr."
  }
}

variable "tag_name" {
  description = "Name tag for the resources"
  type        = string
  
  validation {
    condition = length(var.tag_name) >= 1 && length(var.tag_name) <= 128
    error_message = "Tag name must be between 1 and 128 characters."
  }
  
  validation {
    condition = can(regex("^[a-zA-Z0-9\\s\\-_\\.]+$", var.tag_name))
    error_message = "Tag name can only contain letters, numbers, spaces, hyphens, underscores, and periods."
  }
}

variable "notification_email" {
  description = "Email to receive SNS notifications"
  type        = string
  
  validation {
    condition = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Notification email must be a valid email address."
  }
}