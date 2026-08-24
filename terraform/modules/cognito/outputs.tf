output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.merchants_sellers.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.merchants_sellers.arn
}

output "client_id" {
  description = "Client ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.merchants_sellers_app.id
}

output "domain" {
  description = "Hosted UI domain for the Cognito User Pool"
  value       = aws_cognito_user_pool_domain.merchants_sellers.domain
}
