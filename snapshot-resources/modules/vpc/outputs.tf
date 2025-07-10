output "dr_vpc_id" {
  description = "VPC ID of the DR region"
  value       = module.vpc.vpc_id
}

output "dr_parameter_group_name" {
  description = ""
  value       = aws_db_parameter_group.secondary_db_parameter_group.name

}

output "dr_subnet_group_name" {
    description = ""
    value       = aws_db_subnet_group.secondary_subnet_group.name
}

output "dr_security_group_id" {
    description = ""
    value = aws_security_group.secondary_db_sg.id
}