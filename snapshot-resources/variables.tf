variable "primary_region" {
  description = "Primary AWS region where your RDS instance is located"
  default     = "eu-central-1"
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  default     = "eu-west-1"
}

variable "primary_db_identifier" {
  description = "Identifier of the primary RDS instance"
  type        = string
  default     = "primary-db"
}

variable "project_name" {
  description = "Project name for resource naming"
  default     = "rds-dr"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {
    Environment = "DR"
    ManagedBy   = "Terraform"
  }
}

variable "sns_email" {
  description = "SNS topic email for notifications"
  type        = string
}

