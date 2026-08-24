resource "aws_cloudwatch_log_group" "merchants_lambda" {
  name              = "/aws/lambda/${var.merchants_function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project}-${var.environment}-merchants-logs"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_group" "enricher_lambda" {
  name              = "/aws/lambda/${var.enricher_function_name}"
  retention_in_days = 14

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

resource "aws_cloudwatch_metric_alarm" "enricher_duration" {
  alarm_name          = "${var.project}-${var.environment}-enricher-duration"
  alarm_description   = "Enricher Lambda duration exceeds p90 threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 30000
  alarm_actions       = []
  ok_actions          = []
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "duration"
    return_data = true

    metric {
      metric_name = "Duration"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "p90"
      dimensions = {
        FunctionName = var.enricher_function_name
      }
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-enricher-duration"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.project}-${var.environment}-api-5xx"
  alarm_description   = "API Gateway 5XX error rate exceeds threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  alarm_actions       = []
  ok_actions          = []
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(errors / requests) * 100"
    label       = "5XX Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"

    metric {
      metric_name = "5XXError"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiId = var.api_id
      }
    }
  }

  metric_query {
    id = "requests"

    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiId = var.api_id
      }
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-api-5xx"
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
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiId", var.api_id],
            [".", "5XXError", ".", "."],
            [".", "4XXError", ".", "."],
            [".", "Latency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "API Gateway"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", var.sqs_queue_name],
            [".", "NumberOfMessagesReceived", ".", "."],
            [".", "ApproximateNumberOfMessagesVisible", ".", "."],
            [".", "ApproximateAgeOfOldestMessage", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "SQS Enrichment Queue"
          period  = 300
        }
      }
    ]
  })
}

data "aws_region" "current" {}
