variable "project_name" {
  description = "Name of the project (used for resource naming and tagging)."
  type        = string
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
}

variable "primary_region" {
  description = "The AWS region where the primary/production RDS instance and resources are located"
  type        = string
}

variable "dr_region" {
  description = "The AWS region designated for disaster recovery, where backups and failover resources are maintained"
  type        = string
}

variable "primary_vpc_id" {
  description = "The VPC ID in the primary region where the production RDS instance is deployed."
  type        = string
}

variable "dr_vpc_id" {
  description = "The VPC ID in the DR region where standby/recovery resources are provisioned."
  type        = string
}

variable "rds_instance_address" {
  description = "The DNS endpoint or connection address of the primary RDS instance"
  type        = string
}