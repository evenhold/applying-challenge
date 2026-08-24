variable "queue_name" {
  description = "Name of the SQS queue"
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

variable "max_receive_count" {
  description = "Number of times a message can be received before moving to DLQ"
  type        = number
  default     = 3
}

variable "retention_seconds" {
  description = "Message retention period in seconds"
  type        = number
  default     = 1209600
}
