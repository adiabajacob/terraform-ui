module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.21.0"
  providers = {
    aws = aws.dr
  }

  name                 = "${var.project_name}-secondary-vpc"
  cidr                 = "10.0.0.0/16"
  azs                  = var.dr_availability_zones
  public_subnets       = ["10.0.1.0/24", "10.0.2.0/24"]
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-secondary-vpc"
    }
  )
}

resource "aws_db_subnet_group" "secondary_subnet_group" {
  provider   = aws.dr
  name       = "${var.project_name}-secondary-db-subnet-group"
  subnet_ids = module.vpc.public_subnets
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-secondary-db-subnet-group"
    }
  )
}

resource "aws_security_group" "secondary_db_sg" {
  provider = aws.dr
  name     = "${var.project_name}-secondary-db-sg"
  vpc_id   = module.vpc.vpc_id

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

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-secondary-db-sg"
    }
  )
}

resource "aws_db_parameter_group" "secondary_db_parameter_group" {
  provider = aws.dr
  name     = "${var.project_name}-secondary-db-parameter-group"
  family   = "postgres17"

  parameter {
    name  = "log_connections"
    value = "1"
  }
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-secondary-db-parameter-group"
    }
  )
}
