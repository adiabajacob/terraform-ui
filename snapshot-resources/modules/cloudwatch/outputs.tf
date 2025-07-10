output "rds_failure_alarm_name" {
  description = "Alarm name for RDS failure"
  value       = aws_cloudwatch_metric_alarm.rds_failure.alarm_name
}