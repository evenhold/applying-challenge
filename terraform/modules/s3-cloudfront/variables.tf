variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name used for resource naming and tagging"
  type        = string
}

variable "bucket_name" {
  description = "Name of the S3 bucket for the frontend"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_100, PriceClass_200, PriceClass_All)"
  type        = string
  default     = "PriceClass_100"
}

variable "geo_restrictions" {
  description = "List of country codes for geo restrictions (empty = no restrictions)"
  type = object({
    restriction_type = string
    locations        = list(string)
  })
  default = {
    restriction_type = "none"
    locations        = []
  }
}

variable "web_acl_id" {
  description = "ARN of the WAF Web ACL to associate with the distribution (empty = no WAF)"
  type        = string
  default     = ""
}

variable "aliases" {
  description = "List of CNAME aliases for the CloudFront distribution"
  type        = list(string)
  default     = []
}
