output "creator_lambda_role_arn" {
  description = "IAM Role ARN for the Lambda function that creates RDS snapshots in the primary region."
  value       = aws_iam_role.creator_lambda_role.arn
}

output "copy_lambda_role_arn" {
  description = "IAM Role ARN for the Lambda function that copies RDS snapshots to the disaster recovery (DR) region."
  value       = aws_iam_role.copy_lambda_role.arn
}

output "cleaner_lambda_role_arn" {
  description = "IAM Role ARN for the Lambda function that deletes old RDS snapshots in the DR region based on retention policy."
  value       = aws_iam_role.cleaner_lambda_role.arn
}

output "restore_rds_lambda_role_arn" {
  description = "IAM Role ARN for the Lambda function that restores RDS in the DR region from the latest snapshot in the dr region."
  value       = aws_iam_role.restore_rds_lambda_role.arn
}

output "route53_update_record_lambda_role_arn" {
  description = "IAM Role ARN for the Lambda function that updates route53 DNS records"
  value       = aws_iam_role.route53_update_record_lambda_role.arn
}
