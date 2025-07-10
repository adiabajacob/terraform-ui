output "snapshot_creator_function" {
  value       = aws_lambda_function.snapshot_creator
  description = "The Lambda function responsible for creating RDS snapshots according to the defined backup schedule."
}

output "snapshot_cross_region_copy_function" {
  value       = aws_lambda_function.snapshot_cross_region_copy
  description = "The Lambda function that handles copying RDS snapshots to a secondary AWS region for disaster recovery purposes."
}

output "snapshot_cleaner_function" {
  value       = aws_lambda_function.snapshot_cleaner
  description = "The Lambda function that manages snapshot lifecycle by removing outdated snapshots based on retention policies."
}

output "restore_rds_function" {
  value       = aws_lambda_function.restore_rds
  description = "The Lambda function that automates the restoration process of RDS instances from available snapshots."
}

output "route53_update_record_function" {
  value       = aws_lambda_function.route53_update_record
  description = "The Lambda function that updates Route53 DNS records, typically used during restoration to point to the newly restored database instance."
}