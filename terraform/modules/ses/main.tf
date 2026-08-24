resource "aws_ses_email_identity" "sender" {
  email = var.sender_email
}

resource "aws_ses_configuration_set" "tracking" {
  name = "${var.project}-${var.environment}-tracking"

  delivery_options {
    tls_policy = "REQUIRE"
  }

  reputation_metrics_enabled = true

  tags = {
    Name        = "${var.project}-${var.environment}-ses-config"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "${var.project}-${var.environment}-cloudwatch"
  configuration_set_name = aws_ses_configuration_set.tracking.name
  enabled                = true

  matching_types = ["bounce", "complaint", "delivery"]

  cloudwatch_destination {
    default_value  = "false"
    dimension_name = "EmailTag"
    value_source   = "messageTag"
  }
}
