output "queue_url" {
  description = "URL of the main SQS queue"
  value       = aws_sqs_queue.enrichment.id
}

output "queue_arn" {
  description = "ARN of the main SQS queue"
  value       = aws_sqs_queue.enrichment.arn
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.enrichment_dlq.id
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.enrichment_dlq.arn
}
