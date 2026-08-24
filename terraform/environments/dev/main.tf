module "merchants" {
  source = "../../"

  environment      = "dev"
  project          = "mini-onboarding"
  aws_region       = "us-east-1"
  ses_sender_email = "noreply@mini-onboarding.dev"

  cognito_callback_urls = ["http://localhost:3000"]
  cognito_logout_urls   = ["http://localhost:3000"]

  cors_allow_origins = ["http://localhost:3000"]

  merchants_zip_path = "build/merchants.zip"
  enricher_zip_path  = "build/enricher.zip"
}
