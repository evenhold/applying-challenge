output "merchants_role_arn" {
  description = "ARN of the IAM role for the merchants Lambda"
  value       = aws_iam_role.lambda_merchants.arn
}

output "enricher_role_arn" {
  description = "ARN of the IAM role for the enricher Lambda"
  value       = aws_iam_role.lambda_enricher.arn
}
