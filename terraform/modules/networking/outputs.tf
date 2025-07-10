output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "subnet_group_name" {
  description = "The name of the DB subnet group"
  value       = aws_db_subnet_group.replica.name
}

output "security_group_id" {
  description = "The ID of the security group for the read replica"
  value       = aws_security_group.read_replica_sg.id
} 