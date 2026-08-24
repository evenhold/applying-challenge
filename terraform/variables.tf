variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "mini-onboarding"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "ses_sender_email" {
  description = "Verified email address used as the SES sender for transactional emails"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.ses_sender_email))
    error_message = "Must be a valid email address."
  }
}

variable "cognito_callback_urls" {
  description = "List of allowed callback URLs for the Cognito OAuth flow"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "cognito_logout_urls" {
  description = "List of allowed logout URLs after Cognito sign-out"
  type        = list(string)
  default     = ["http://localhost:3000/logout"]
}

variable "cors_allow_origins" {
  description = "List of origins allowed by CORS (reserved for future API Gateway module)"
  type        = list(string)
  default     = []
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection on resources that support it"
  type        = bool
  default     = true
}

variable "dynamodb_deletion_protection" {
  description = "Enable deletion protection on DynamoDB table"
  type        = bool
  default     = true
}

variable "merchants_zip_path" {
  description = "Local file path or S3 bucket/key for the merchants Lambda deployment package"
  type        = string
}

variable "enricher_zip_path" {
  description = "Local file path or S3 bucket/key for the enricher Lambda deployment package"
  type        = string
}
