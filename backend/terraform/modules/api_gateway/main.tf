locals {
  api_routes = {
    "GET /items"                  = "get_items"
    "POST /items"                 = "create_item"
    "PUT /items"                  = "update_item"
    "DELETE /items"               = "delete_item"
  }
}
resource "aws_apigatewayv2_api" "http_api" {
  name          = "inventory-http-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "api_lambda_integrations" {
  for_each = local.api_routes

  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = var.inventory_functions_invoke_arns[each.value]
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = local.api_routes

  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.api_lambda_integrations[each.key].id}"
}


resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway_permissions" {
  for_each = local.api_routes

  statement_id  = "AllowAPIGatewayInvoke-${each.value}"
  action        = "lambda:InvokeFunction"
  function_name = var.inventory_functions_names[each.value]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
