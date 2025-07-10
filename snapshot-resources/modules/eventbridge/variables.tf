variable "project_name" {
  description = "Name of the project (used for resource naming and tagging)."
  type        = string
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
}

variable "snapshot_creator_function_arn" {
  description = "The ARN of the Lambda function responsible for creating RDS snapshots."
  type        = string
}

variable "snapshot_creator_function_name" {
  description = "The name of the Lambda function that creates RDS snapshots."
  type        = string
}

variable "snapshot_cross_region_copy_function_arn" {
  description = "The ARN of the Lambda function that copies RDS snapshots to another AWS region for disaster recovery."
  type        = string
}

variable "snapshot_cross_region_copy_function_name" {
  description = "The name of the Lambda function handling cross-region RDS snapshot copies."
  type        = string
}

variable "snapshot_cleaner_function_arn" {
  description = "The ARN of the Lambda function that manages snapshot retention by cleaning up old snapshots."
  type        = string
}

variable "snapshot_cleaner_function_name" {
  description = "The name of the Lambda function responsible for deleting outdated RDS snapshots."
  type        = string
}

variable "route53_update_record_function_arn" {
  description = "The ARN of the Lambda function that updates Route53 records during RDS failover events."
  type        = string
}

variable "route53_update_record_function_name" {
  description = "The name of the Lambda function that modifies Route53 DNS entries for DR failover."
  type        = string
}

variable "rds_instance_id" {
  description = "The identifier of the primary RDS instance"
  type        = string
}

variable "rds_failure_alarm_name" {
  description = "The name of the CloudWatch alarm that triggers on RDS instance failures."
  type        = string
}

variable "sns_rds_restore_topic_arn" {
  description = "SNS topic arn for RDS restoration"
  type = string
}