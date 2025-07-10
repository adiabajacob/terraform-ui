variable "project_name" {
  description = "Name of the project (used for resource naming and tagging)."
  type        = string
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
}
variable "creator_lambda_role_arn" {
  description = "ARN of the IAM role used by the snapshot creator Lambda function"
  type        = string
}

variable "copy_lambda_role_arn" {
  description = "ARN of the IAM role used by the cross-region snapshot copy Lambda function"
  type        = string
}

variable "cleaner_lambda_role_arn" {
  description = "ARN of the IAM role used by the snapshot cleaner Lambda function"
  type        = string
}

variable "route53_update_record_lambda_role_arn" {
  description = "ARN of the IAM role used by the Route53 record updater Lambda function"
  type        = string
}

variable "restore_rds_lambda_role_arn" {
  description = "ARN of the IAM role used by the RDS restore Lambda function"
  type        = string
}
variable "rds_instance_id" {
  description = "The identifier of the primary RDS instance"
  type        = string
}

variable "primary_region" {
  description = "The AWS region where the primary/production RDS instance and resources are located"
  type        = string
}

variable "dr_region" {
  description = "The AWS region designated for disaster recovery, where backups and failover resources are maintained"
  type        = string
}

variable "dr_security_group_id" {
  description = "The ID of the security group to associate with the DR RDS instance, controlling network access"
}

variable "dr_subnet_group_name" {
  description = "The name of the DB subnet group for the DR RDS instance, defining which subnets it can be deployed in"
  type        = string
}

variable "dr_parameter_group_name" {
  description = "The name of the DB parameter group to use for the DR RDS instance, containing database configuration settings"
  type        = string
}

variable "route53_hosted_zone_id" {
  description = "The ID of the Route53 hosted zone where the database DNS record will be created/updated"
  type        = string
}

variable "route53_database_record_ttl" {
  description = "The TTL (Time To Live) in seconds for the Route53 database record"
}

variable "route53_database_record_name" {
  description = "The DNS record name (e.g., 'db.example.com') that will point to the RDS instance"
  type        = string
}
