variable "project_name" {
  description = "Name of the project (used for resource naming and tagging)."
  type        = string
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
}

variable "snapshot_cross_region_copy_function_arn" {
  description = "The ARN of the Lambda function that copies RDS snapshots to another AWS region for disaster recovery."
  type        = string
}

variable "snapshot_cleaner_function_arn" {
  description = "The ARN of the Lambda function that manages snapshot retention by cleaning up old snapshots."
  type        = string
}
