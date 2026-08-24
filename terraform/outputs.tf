output "api_url" {
  description = "Invoke URL of the HTTP API Gateway"
  value       = module.api_gateway.api_url
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool for merchant authentication"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Client ID of the Cognito User Pool Client"
  value       = module.cognito.client_id
  sensitive   = true
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB merchants table"
  value       = module.dynamodb.table_name
}

output "sqs_queue_url" {
  description = "URL of the SQS enrichment queue"
  value       = module.sqs.queue_url
}

output "cloudfront_domain" {
  description = "Domain name of the CloudFront distribution for frontend hosting"
  value       = module.s3_cloudfront.distribution_domain
}
