variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
}

variable "project" {
  description = "Project name for resource tagging"
  type        = string
}

variable "merchants_function_name" {
  description = "Name of the merchants Lambda function"
  type        = string
}

variable "enricher_function_name" {
  description = "Name of the enricher Lambda function"
  type        = string
}
