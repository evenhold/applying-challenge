locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# ---------- Cognito ----------

module "cognito" {
  source = "./modules/cognito"

  project       = var.project
  environment   = var.environment
  callback_urls = var.cognito_callback_urls
  logout_urls   = var.cognito_logout_urls
}

# ---------- DynamoDB ----------

module "dynamodb" {
  source = "./modules/dynamodb"

  table_name                = "${var.project}-${var.environment}-merchants"
  project                   = var.project
  environment               = var.environment
  enable_deletion_protection = var.environment == "prod" ? true : false
  enable_pitr               = var.environment == "prod" ? true : false
}

# ---------- SQS ----------

module "sqs" {
  source = "./modules/sqs"

  queue_name = "${var.project}-${var.environment}-enrichment"
  project    = var.project
  environment = var.environment
}

# ---------- SES ----------

module "ses" {
  source = "./modules/ses"

  project      = var.project
  environment  = var.environment
  sender_email = var.ses_sender_email
}

# ---------- IAM ----------

module "iam" {
  source = "./modules/iam"

  project            = var.project
  environment        = var.environment
  dynamodb_table_arn = module.dynamodb.table_arn
  sqs_queue_arn      = module.sqs.queue_arn
}

# ---------- Lambda ----------

module "lambda" {
  source = "./modules/lambda"

  project             = var.project
  environment         = var.environment
  merchants_role_arn  = module.iam.merchants_role_arn
  enricher_role_arn   = module.iam.enricher_role_arn
  dynamodb_table_name = module.dynamodb.table_name
  sqs_queue_url       = module.sqs.queue_url
  sqs_queue_arn       = module.sqs.queue_arn
  ses_sender_email    = var.ses_sender_email
  merchants_zip_path  = var.merchants_zip_path
  enricher_zip_path   = var.enricher_zip_path
}

# ---------- API Gateway ----------

module "api_gateway" {
  source = "./modules/api-gateway"

  project                    = var.project
  environment                = var.environment
  cognito_user_pool_arn      = module.cognito.user_pool_arn
  cognito_user_pool_id       = module.cognito.user_pool_id
  cognito_client_id          = module.cognito.client_id
  merchants_function_invoke_arn = module.lambda.merchants_function_arn
  cors_allow_origins         = var.cors_allow_origins
}

# ---------- S3 + CloudFront ----------

module "s3_cloudfront" {
  source = "./modules/s3-cloudfront"

  project     = var.project
  environment = var.environment
  bucket_name = "frontend"
}

# ---------- WAF (disabled — REGIONAL WAF incompatible with CloudFront) ----------
# To enable: create separate CLOUDFRONT scope WAF in us-east-1 for CloudFront
# and keep REGIONAL scope WAF for API Gateway

# module "waf" {
#   source = "./modules/waf"
#
#   project                = var.project
#   environment            = var.environment
#   api_gateway_stage_arn  = module.api_gateway.api_execution_arn
# }

# ---------- Observability ----------

module "observability" {
  source = "./modules/observability"

  project                  = var.project
  environment              = var.environment
  merchants_function_name  = module.lambda.merchants_function_name
  enricher_function_name   = module.lambda.enricher_function_name
}
