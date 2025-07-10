terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "aws_availability_zones" "available" {
  provider = aws
  state    = "available"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.21.0"
  name                 = "${var.environment}-read-replica-vpc"
  cidr                 = var.vpc_cidr
  azs                  = data.aws_availability_zones.available.names
  public_subnets       = var.public_subnet_cidrs
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name        = "read-replica-vpc"
    Environment = var.tag_name
    Terraform   = "true"
  }
}

resource "aws_db_subnet_group" "replica" {
  name       = "${var.environment}-read-replica-subnet-group"
  subnet_ids = module.vpc.public_subnets

  tags = {
    Name        = "read-replica subnet group"
    Terraform   = "true"
    Environment = var.tag_name
  }
}

resource "aws_security_group" "read_replica_sg" {
  name   = "${var.environment}-read-replica-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "read-replica-sg"
    Environment = var.tag_name
    Terraform   = "true"
  }
} 