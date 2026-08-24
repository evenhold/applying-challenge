output "sender_email" {
  description = "Verified sender email address"
  value       = aws_ses_email_identity.sender.email
}

output "configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = aws_ses_configuration_set.tracking.name
}

output "identity_arn" {
  description = "ARN of the SES email identity"
  value       = aws_ses_email_identity.sender.arn
}
