variable "environment" {
  description = "Deployment environment name (e.g. dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project" {
  description = "Project name used for resource naming and tagging"
  type        = string
}

variable "merchants_role_arn" {
  description = "ARN of the IAM role for the merchants Lambda function"
  type        = string
}

variable "enricher_role_arn" {
  description = "ARN of the IAM role for the enricher Lambda function"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table shared by both Lambda functions"
  type        = string
}

variable "sqs_queue_url" {
  description = "URL of the SQS queue for the merchants Lambda to send messages to"
  type        = string
}

variable "sqs_queue_arn" {
  description = "ARN of the SQS queue for the Event Source Mapping"
  type        = string
}

variable "ses_sender_email" {
  description = "Verified SES email address used as sender for the enricher Lambda"
  type        = string
}

variable "merchants_zip_path" {
  description = "Local file path or S3 bucket/key for the merchants Lambda deployment package"
  type        = string
}

variable "enricher_zip_path" {
  description = "Local file path or S3 bucket/key for the enricher Lambda deployment package"
  type        = string
}

variable "node_runtime" {
  description = "Node.js runtime version for both Lambda functions"
  type        = string
  default     = "nodejs22.x"

  validation {
    condition     = contains(["nodejs20.x", "nodejs22.x"], var.node_runtime)
    error_message = "Node runtime must be nodejs20.x or nodejs22.x."
  }
}
