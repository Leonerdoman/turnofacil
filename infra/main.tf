# Ambiente base de la plantilla 4 (API sin servidor): una API HTTP, una
# función y una tabla. Es fijo: la plataforma solo cambia el código de la
# función, con el rol de despliegue, desde la compuerta y el rollback. Lo que
# varía entre proyectos va en variables (retención, recuperación, permisos y
# zona horaria), nunca en el texto de estos archivos.

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  env        = "${var.stage}-${var.suffix}"
  name       = "opos-base-${local.env}-app"

  # Código inicial: responde 404 hasta que se verifique la primera historia.
  # Por debajo de 500, para que el rollback a este código lo dé por vivo.
  # El mismo texto va en initialArtifact, con la ruta relativa a la raíz del paquete.
  placeholder_file = "index.mjs"
  placeholder_code = "export const handler = async () => ({ statusCode: 404, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'sin implementar' }) });\n"

  # El zip va hecho en esta carpeta, no con data "archive_file": un archivo que
  # se escribe durante el plan no viaja en el plan guardado (spike de la cuenta
  # AWS, R10). Es el mismo que el de la plantilla 5 (mismo código, mismo
  # hacer-zips.mjs). Su sha256 queda escrito aquí, así que infra_sha también lo
  # cubre; si cambia placeholder_code, el README dice cómo rehacerlo.
  placeholder_zip        = "${path.module}/placeholder.zip"
  placeholder_zip_sha256 = "c0cc1944e170e2e50ee95c658f15a04a921fb2d7fadff2f2466b6284b47a043c"
}

# --- Datos ---------------------------------------------------------------------

resource "aws_dynamodb_table" "app" {
  name         = local.name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.point_in_time_recovery
  }
}

# --- Función -------------------------------------------------------------------

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "function" {
  name                 = "${local.name}-function"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume.json
  permissions_boundary = var.permissions_boundary
}

data "aws_iam_policy_document" "function" {
  statement {
    actions = concat(
      ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"],
      var.allow_delete_item ? ["dynamodb:DeleteItem"] : [],
    )
    resources = [aws_dynamodb_table.app.arn]
  }
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.function.arn}:*"]
  }
}

resource "aws_iam_role_policy" "function" {
  role   = aws_iam_role.function.id
  policy = data.aws_iam_policy_document.function.json
}

resource "aws_cloudwatch_log_group" "function" {
  name              = "/aws/lambda/${local.name}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "app" {
  function_name = local.name
  role          = aws_iam_role.function.arn
  runtime       = "nodejs22.x"
  handler       = "index.handler"
  architectures = ["arm64"]
  memory_size   = 256
  timeout       = 10
  filename      = local.placeholder_zip

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.app.name
      TZ         = var.timezone
    }
  }

  depends_on = [aws_cloudwatch_log_group.function]

  # El código lo cambia la plataforma (compuerta y rollback), no Terraform.
  # La configuración (environment incluido) sí la gestiona Terraform.
  lifecycle {
    ignore_changes = [filename, source_code_hash]

    precondition {
      condition     = filesha256(local.placeholder_zip) == local.placeholder_zip_sha256
      error_message = "placeholder.zip no es el que fija main.tf. Rehacerlo y actualizar placeholder_zip_sha256 (README)."
    }
  }
}

# --- API -----------------------------------------------------------------------

resource "aws_apigatewayv2_api" "app" {
  name          = local.name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "app" {
  api_id                 = aws_apigatewayv2_api.app.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.app.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.app.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.app.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.app.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 20
    throttling_rate_limit  = 10
  }
}

resource "aws_lambda_permission" "api" {
  statement_id  = "AllowApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.app.execution_arn}/*"
}

# --- Rol de despliegue ---------------------------------------------------------

# Lo asume la Lambda step de la plataforma (StsDeployCredentials). El nombre
# cumple el patrón opos-*-deploy* que el módulo increments permite asumir.
# La confianza va por condición sobre aws:PrincipalArn, como el rol por turno
# de agent/infra: sigue valiendo si CloudFormation reemplaza el rol de step.
data "aws_iam_policy_document" "deploy_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.account_id}:root"]
    }

    condition {
      test     = "ArnLike"
      variable = "aws:PrincipalArn"
      values   = var.deploy_principals
    }
  }
}

resource "aws_iam_role" "deploy" {
  name                 = "opos-base-${local.env}-deploy"
  assume_role_policy   = data.aws_iam_policy_document.deploy_assume.json
  max_session_duration = 3600
  permissions_boundary = var.permissions_boundary
}

# Lo que usa agent/deployers/api_serverless.py: update_function_code y el
# waiter function_updated_v2 (GetFunction). Solo sobre esta función.
data "aws_iam_policy_document" "deploy" {
  statement {
    actions   = ["lambda:UpdateFunctionCode", "lambda:GetFunction"]
    resources = [aws_lambda_function.app.arn]
  }
}

resource "aws_iam_role_policy" "deploy" {
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}

# --- Configuración para la plataforma ------------------------------------------

# Lo que necesita la plataforma para desplegar en este ambiente. target es lo
# que pide el desplegador del agente: function_name y region. Sale siempre como
# la salida base_env (la lee la plataforma en la cuenta del cliente) y, en un
# ambiente nuestro, también como el parámetro que lee SsmBaseEnv
# (infra/cdk/modules/increments/src/adapters/ssm-base-env.ts).
locals {
  base_env = {
    template = "api-serverless"
    target = {
      function_name = aws_lambda_function.app.function_name
      region        = var.region
    }
    baseUrl         = aws_apigatewayv2_api.app.api_endpoint
    deployRoleArn   = aws_iam_role.deploy.arn
    infraSha        = var.infra_sha
    initialArtifact = { (local.placeholder_file) = local.placeholder_code }
  }
}

resource "aws_ssm_parameter" "base_env" {
  count = var.publish_param ? 1 : 0

  name        = "/opos/${local.env}/base-env"
  description = "Ambiente base de los incrementos de opos-platform ${local.env} (plantilla api-serverless)."
  type        = "String"
  value       = jsonencode(local.base_env)
}

# El parámetro de los ambientes que ya existen (dev-ing) pasa a ser el [0] sin
# borrarse ni crearse de nuevo.
moved {
  from = aws_ssm_parameter.base_env
  to   = aws_ssm_parameter.base_env[0]
}
