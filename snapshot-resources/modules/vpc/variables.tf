variable "project_name" {
  description = "Name of the project (used for resource naming and tagging)."
  type        = string
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
}

variable "dr_availability_zones" {
  description = "List of Availability Zones (AZs) to use for disaster recovery (DR) resources, ensuring high availability across isolated locations."
}
