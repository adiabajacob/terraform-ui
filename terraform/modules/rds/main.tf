terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version              = "~> 5.0"
      configuration_aliases = [aws.source]
    }
  }
}

data "aws_db_instance" "primary" {
  provider               = aws.source
  db_instance_identifier = var.primary_db_identifier
}

resource "aws_db_instance" "read_replica" {
  provider               = aws
  identifier             = var.read_replica_identifier
  instance_class         = var.instance_class
  replicate_source_db    = data.aws_db_instance.primary.db_instance_arn
  vpc_security_group_ids = [var.security_group_id]
  db_subnet_group_name   = var.subnet_group_name
  publicly_accessible    = true
  skip_final_snapshot    = true

  tags = {
    Name        = var.read_replica_identifier
    Environment = var.tag_name
    Terraform   = "true"
  }
} 