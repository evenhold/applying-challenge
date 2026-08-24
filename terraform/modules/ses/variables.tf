variable "sender_email" {
  description = "Email address used as the sender for SES"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
}

variable "project" {
  description = "Project name for resource tagging"
  type        = string
}
