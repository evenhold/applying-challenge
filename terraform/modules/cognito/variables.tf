variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name used for resource naming and tagging"
  type        = string
}

variable "callback_urls" {
  description = "List of allowed callback URLs for the OAuth flow"
  type        = list(string)
}

variable "logout_urls" {
  description = "List of allowed logout URLs after sign-out"
  type        = list(string)
}
