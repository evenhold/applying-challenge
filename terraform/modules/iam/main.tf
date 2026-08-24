data "aws_iam_policy" "lambda_basic_execution" {
  name = "AWSLambdaBasicExecutionRole"
}

# ---------- Merchant Lambda ----------

data "aws_iam_policy_document" "lambda_merchants_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_merchants" {
  name               = "${var.project}-${var.environment}-lambda-merchants"
  assume_role_policy = data.aws_iam_policy_document.lambda_merchants_trust.json

  tags = {
    Name        = "${var.project}-${var.environment}-lambda-merchants"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "lambda_merchants_basic" {
  role       = aws_iam_role.lambda_merchants.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

data "aws_iam_policy_document" "lambda_merchants_permissions" {
  # DynamoDB — table + all GSIs
  statement {
    sid    = "DynamoDBMerchants"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*",
    ]
  }

  # SQS — send messages to enrichment queue
  statement {
    sid    = "SQSSendEnrichment"
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
    ]
    resources = [var.sqs_queue_arn]
  }

  # X-Ray tracing
  statement {
    sid    = "XRayTracing"
    effect = "Allow"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "lambda_merchants_permissions" {
  name   = "${var.project}-${var.environment}-merchants-permissions"
  role   = aws_iam_role.lambda_merchants.id
  policy = data.aws_iam_policy_document.lambda_merchants_permissions.json
}

# ---------- Enricher Lambda ----------

data "aws_iam_policy_document" "lambda_enricher_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_enricher" {
  name               = "${var.project}-${var.environment}-lambda-enricher"
  assume_role_policy = data.aws_iam_policy_document.lambda_enricher_trust.json

  tags = {
    Name        = "${var.project}-${var.environment}-lambda-enricher"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "lambda_enricher_basic" {
  role       = aws_iam_role.lambda_enricher.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

data "aws_iam_policy_document" "lambda_enricher_permissions" {
  # DynamoDB — table + all GSIs
  statement {
    sid    = "DynamoDBEnricher"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
    ]
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*",
    ]
  }

  # SQS — receive and delete messages from enrichment queue
  statement {
    sid    = "SQSReceiveEnrichment"
    effect = "Allow"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]
    resources = [var.sqs_queue_arn]
  }

  # SES — send emails
  statement {
    sid    = "SESSendEmail"
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]
    resources = ["*"]
  }

  # X-Ray tracing
  statement {
    sid    = "XRayTracing"
    effect = "Allow"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "lambda_enricher_permissions" {
  name   = "${var.project}-${var.environment}-enricher-permissions"
  role   = aws_iam_role.lambda_enricher.id
  policy = data.aws_iam_policy_document.lambda_enricher_permissions.json
}
