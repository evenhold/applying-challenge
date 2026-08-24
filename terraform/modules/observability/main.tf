resource "aws_cloudwatch_log_group" "merchants_lambda" {
  name              = "/aws/lambda/${var.merchants_function_name}"
  retention_in_days = 7

  tags = {
    Name        = "${var.project}-${var.environment}-merchants-logs"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_group" "enricher_lambda" {
  name              = "/aws/lambda/${var.enricher_function_name}"
  retention_in_days = 7

  tags = {
    Name        = "${var.project}-${var.environment}-enricher-logs"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "enricher_errors" {
  alarm_name          = "${var.project}-${var.environment}-enricher-errors"
  alarm_description   = "Enricher Lambda error count exceeds threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  alarm_actions       = []
  ok_actions          = []
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "errors"
    return_data = true

    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = var.enricher_function_name
      }
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-enricher-errors"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-${var.environment}-main"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.merchants_function_name],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Merchants Lambda"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.enricher_function_name],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Enricher Lambda"
          period  = 300
        }
      }
    ]
  })
}

data "aws_region" "current" {}
