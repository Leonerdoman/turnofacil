output "base_url" {
  description = "URL de la API del ambiente."
  value       = aws_apigatewayv2_api.app.api_endpoint
}

output "function_name" {
  value = aws_lambda_function.app.function_name
}

output "table_name" {
  value = aws_dynamodb_table.app.name
}

output "deploy_role_arn" {
  description = "Rol que asume la Lambda step para desplegar."
  value       = aws_iam_role.deploy.arn
}

output "base_env_param" {
  description = "Parámetro que lee la plataforma en un ambiente nuestro; null con publish_param = false."
  value       = one(aws_ssm_parameter.base_env[*].name)
}

output "base_env" {
  description = "Lo mismo que publica el parámetro, en JSON. La plataforma lo lee de salidas.json en la cuenta del cliente."
  value       = jsonencode(local.base_env)
}
