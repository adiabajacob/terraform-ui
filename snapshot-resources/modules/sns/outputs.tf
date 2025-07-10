output "sns_dr_topic_arn" {
  description = "Arn of the disaster recovery SNS topic"
  value       = aws_sns_topic.sns_dr_notification.arn
}

output "sns_rds_restore_topic_arn" {
  description = "Arn of the RDS restoration SNS topic"
  value       = aws_sns_topic.sns_rds_restore_notification.arn
}