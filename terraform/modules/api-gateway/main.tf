resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project}-${var.environment}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Api-Key", "X-Amz-Date", "X-Amz-Security-Token"]
    max_age       = 300
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.project}-${var.environment}-cognito-authorizer"

  jwt_configuration {
    audience = [var.cognito_client_id]
    issuer   = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project}-${var.environment}"
  retention_in_days = 30

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      integrationLatency = "$context.integrationLatency"
    })
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_integration" "merchants" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.merchants_function_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "post_merchants" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /merchants"
  target    = "integrations/${aws_apigatewayv2_integration.merchants.id}"

  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "get_merchants" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /merchants"
  target    = "integrations/${aws_apigatewayv2_integration.merchants.id}"

  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "get_merchants_id" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /merchants/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.merchants.id}"

  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "put_merchants_id" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /merchants/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.merchants.id}"

  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.merchants.id}"

  authorization_type = "NONE"
}

data "aws_region" "current" {}
