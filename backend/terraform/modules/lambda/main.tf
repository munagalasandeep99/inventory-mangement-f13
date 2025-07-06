locals {
  lambda_functions = {
    create_item           = "create_item.py"
    get_items             = "get_items.py"
    update_item           = "update_item.py"
    delete_item           = "delete_item.py"
  }
}


data "archive_file" "lambda_packages" {
  for_each = local.lambda_functions

  type        = "zip"
  source_file = "src/${each.value}"
  output_path = "${replace(each.value, ".py", ".zip")}"
}

resource "aws_lambda_function" "inventory_functions" {
  for_each = local.lambda_functions

  function_name = each.key
  handler       = "${replace(each.value, ".py", "")}.lambda_handler"
  runtime       = "python3.9"
  role          = var.lambda_role_arn
  filename      = data.archive_file.lambda_packages[each.key].output_path
  source_code_hash = data.archive_file.lambda_packages[each.key].output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
      
    }
}

}

resource "aws_lambda_function_url" "urls" {
  for_each = aws_lambda_function.inventory_functions

  function_name      = each.value.function_name
  authorization_type = "NONE"
}
