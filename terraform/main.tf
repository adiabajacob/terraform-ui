
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}


provider "aws" {
  region = var.aws_region
  alias  = "primary"
}

provider "aws" {
  region = var.aws_read_replica_region
  alias  = "secondary"
}

provider "aws" {
  alias  = "useast1"
  region = "us-east-1"
}

module "networking" {
  source = "./modules/networking"
  providers = {
    aws = aws.secondary
  }

  environment        = var.environment
  vpc_cidr          = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  tag_name           = var.tag_name
}

module "rds" {
  source = "./modules/rds"
  providers = {
    aws        = aws.secondary
    aws.source = aws.primary
  }
  environment            = var.environment
  primary_db_identifier  = var.primary_db_identifier
  read_replica_identifier = var.read_replica_identifier
  instance_class         = var.instance_class
  security_group_id      = module.networking.security_group_id
  subnet_group_name      = module.networking.subnet_group_name
  tag_name               = var.tag_name
} 

