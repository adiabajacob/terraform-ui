variable "project_name" {
  description = "Name of the project (used for resource naming and tagging)."
  type        = string
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
}

variable "restore_rds_function_arn" {
  description = "The ARN of the Lambda function responsible for restoring RDS instances from snapshots during disaster recovery scenarios."
}

variable "restore_rds_function_name" {
  description = "The name of the Lambda function that handles RDS instance restoration from backups/snapshots."
}

variable "notification_email_address" {
  description = "The email address to receive notifications for backup, restore, and disaster recovery operations."
}