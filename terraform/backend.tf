terraform {
  backend "s3" {
    bucket         = "mini-onboarding-tfstate"
    key            = "infra/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "mini-onboarding-tflock"
    encrypt        = true
  }
}
