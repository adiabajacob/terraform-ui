variable "project_name" {
  description = "Name of the project (used for resource naming and tagging)."
  type        = string
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
}

variable "rds_instance_id" {
  description = "The identifier of the primary RDS instance"
  type        = string
}

variable "sns_dr_topic_arn" {
  description = "ARN of the SNS topic for disaster recovery notifications."
  type        = string
}

variable "route53_health_check_id" {
  description = "ID of the Route53 health check to associate with DNS records."
  type        = string
}