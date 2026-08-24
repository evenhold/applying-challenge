variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name used for resource tagging"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table (including trailing /*)"
  type        = string
}

variable "sqs_queue_arn" {
  description = "ARN of the SQS enrichment queue"
  type        = string
}
