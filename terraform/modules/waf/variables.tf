variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
}

variable "project" {
  description = "Project name for resource tagging"
  type        = string
}

variable "api_gateway_stage_arn" {
  description = "ARN of the API Gateway stage to associate with the WAF"
  type        = string
}

variable "rate_limit" {
  description = "Maximum number of requests per IP in a 5-minute period"
  type        = number
  default     = 1000
}
