resource "aws_sqs_queue" "enrichment_dlq" {
  name                      = "${var.project}-${var.environment}-enrichment-dlq"
  message_retention_seconds = var.retention_seconds

  tags = {
    Name        = "${var.project}-${var.environment}-enrichment-dlq"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_sqs_queue" "enrichment" {
  name                       = "${var.project}-${var.environment}-enrichment"
  visibility_timeout_seconds = 300
  message_retention_seconds  = var.retention_seconds
  receive_wait_time_seconds  = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.enrichment_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = {
    Name        = "${var.project}-${var.environment}-enrichment"
    Environment = var.environment
    Project     = var.project
  }
}
