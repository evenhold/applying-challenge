module "merchants" {
  source = "../../"

  environment      = "prod"
  project          = "mini-onboarding"
  aws_region       = "us-east-1"
  ses_sender_email = "noreply@mini-onboarding.com"

  cognito_callback_urls = ["https://mini-onboarding.com"]
  cognito_logout_urls   = ["https://mini-onboarding.com"]

  cors_allow_origins = ["https://mini-onboarding.com"]

  merchants_zip_path = "/build/merchants.zip"
  enricher_zip_path  = "/build/enricher.zip"
}
