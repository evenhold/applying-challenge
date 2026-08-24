variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name used for resource naming and tagging"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool, used as the issuer for JWT validation"
  type        = string
}

variable "cognito_client_id" {
  description = "Client ID of the Cognito User Pool, used as audience for JWT validation"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool, used in JWT issuer URL"
  type        = string
}

variable "merchants_function_invoke_arn" {
  description = "Invoke ARN of the merchants Lambda function"
  type        = string
}

variable "cors_allow_origins" {
  description = "List of allowed origins for CORS configuration"
  type        = list(string)
  default     = ["*"]
}
