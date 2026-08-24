output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "log_group_arns" {
  description = "ARNs of the CloudWatch log groups"
  value = {
    merchants = aws_cloudwatch_log_group.merchants_lambda.arn
    enricher  = aws_cloudwatch_log_group.enricher_lambda.arn
  }
}
