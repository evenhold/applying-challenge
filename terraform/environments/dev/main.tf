module "merchants" {
  source = "../../"

  environment      = "dev"
  project          = "mini-onboarding"
  aws_region       = "us-east-1"
  ses_sender_email = "noreply@mini-onboarding.dev"

  cognito_callback_urls = ["https://d1vazin5v6ecqg.cloudfront.net"]
  cognito_logout_urls   = ["https://d1vazin5v6ecqg.cloudfront.net"]

  cors_allow_origins = ["https://d1vazin5v6ecqg.cloudfront.net"]

  merchants_zip_path = "/build/merchants.zip"
  enricher_zip_path  = "/build/enricher.zip"
}

output "api_url" {
  value = module.merchants.api_url
}

output "cognito_user_pool_id" {
  value = module.merchants.cognito_user_pool_id
}

output "cognito_client_id" {
  value     = module.merchants.cognito_client_id
  sensitive = true
}

output "dynamodb_table_name" {
  value = module.merchants.dynamodb_table_name
}

output "sqs_queue_url" {
  value = module.merchants.sqs_queue_url
}

output "cloudfront_domain" {
  value = module.merchants.cloudfront_domain
}
