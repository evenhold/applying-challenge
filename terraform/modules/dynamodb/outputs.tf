output "table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.merchants.name
}

output "table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.merchants.arn
}

output "gsi1_name" {
  description = "Name of the first Global Secondary Index"
  value       = tolist(aws_dynamodb_table.merchants.global_secondary_index)[0].name
}

output "gsi2_name" {
  description = "Name of the second Global Secondary Index"
  value       = tolist(aws_dynamodb_table.merchants.global_secondary_index)[1].name
}
