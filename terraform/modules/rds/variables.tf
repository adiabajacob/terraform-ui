variable "primary_db_identifier" {
  description = "RDS identifier of the primary DB instance"
  type        = string
}

variable "read_replica_identifier" {
  description = "Identifier for the read replica"
  type        = string
}

variable "instance_class" {
  description = "Instance class for the read replica"
  type        = string
}

variable "security_group_id" {
  description = "ID of the security group for the read replica"
  type        = string
}

variable "subnet_group_name" {
  description = "Name of the DB subnet group"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
} 
variable "tag_name" {
  description = "Tag name for resources"
  type        = string
}