output "merchants_function_name" {
  description = "Name of the merchants Lambda function"
  value       = aws_lambda_function.merchants.function_name
}

output "merchants_function_arn" {
  description = "ARN of the merchants Lambda function"
  value       = aws_lambda_function.merchants.arn
}

output "enricher_function_name" {
  description = "Name of the enricher Lambda function"
  value       = aws_lambda_function.enricher.function_name
}

output "enricher_function_arn" {
  description = "ARN of the enricher Lambda function"
  value       = aws_lambda_function.enricher.arn
}
