data "aws_db_instance" "primary_db" {
  provider               = aws.primary
  db_instance_identifier = var.primary_db_identifier
}

data "aws_db_subnet_group" "primary" {
  name = data.aws_db_instance.primary_db.db_subnet_group
}

data "aws_subnet" "db_subnet" {
  id = tolist(data.aws_db_subnet_group.primary.subnet_ids)[0]
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "dr_availability_zones" {
  provider = aws.dr
  state    = "available"
}