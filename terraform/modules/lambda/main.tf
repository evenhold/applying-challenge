locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
  }
}

# ---------------------------------------------------------------------------
# Merchants Lambda — createMerchant handler
# ---------------------------------------------------------------------------
resource "aws_lambda_function" "merchants" {
  function_name = "${var.project}-${var.environment}-merchants"
  description   = "Handles merchant creation requests"

  filename         = var.merchants_zip_path
  source_code_hash = filebase64sha256(var.merchants_zip_path)

  handler = "index.handler"
  runtime = var.node_runtime
  role    = var.merchants_role_arn

  memory_size = 128
  timeout     = 10

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
      SQS_QUEUE_URL  = var.sqs_queue_url
      AUTH_MOCK      = "false"
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.project}-${var.environment}-merchants"
  })
}

# ---------------------------------------------------------------------------
# Enricher Lambda — enrichment processor
# ---------------------------------------------------------------------------
resource "aws_lambda_function" "enricher" {
  function_name = "${var.project}-${var.environment}-enricher"
  description   = "Processes SQS messages for SUNAT enrichment and email notification"

  filename         = var.enricher_zip_path
  source_code_hash = filebase64sha256(var.enricher_zip_path)

  handler = "index.handler"
  runtime = var.node_runtime
  role    = var.enricher_role_arn

  memory_size = 256
  timeout     = 60

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE   = var.dynamodb_table_name
      SES_SENDER_EMAIL = var.ses_sender_email
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.project}-${var.environment}-enricher"
  })
}

# ---------------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------------
resource "aws_lambda_permission" "api_gateway_merchants" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.merchants.function_name
  principal     = "apigateway.amazonaws.com"
}

resource "aws_lambda_permission" "sqs_enricher" {
  statement_id  = "AllowSQSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.enricher.function_name
  principal     = "sqs.amazonaws.com"
}

# ---------------------------------------------------------------------------
# Event Source Mapping — SQS -> Enricher Lambda
# ---------------------------------------------------------------------------
resource "aws_lambda_event_source_mapping" "enricher" {
  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.enricher.arn
  batch_size       = 10
  enabled          = true

  function_response_types = ["ReportBatchItemFailures"]
}
