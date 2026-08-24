variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name used for resource tagging"
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection on the DynamoDB table"
  type        = bool
  default     = true
}
