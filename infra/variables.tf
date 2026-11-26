variable "region" {
  description = "Región del proyecto de AWS."
  type        = string
  default     = "us-east-2"
}

variable "stage" {
  description = "Etapa del despliegue de la plataforma (dev o prod)."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "prod"], var.stage)
    error_message = "stage debe ser dev o prod."
  }
}

variable "suffix" {
  description = "Sufijo del despliegue de la plataforma. Con stage forma <stage>-<suffix>, igual que en infra/cdk/shared/utils/stage.ts."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]{1,20}$", var.suffix))
    error_message = "suffix admite minúsculas, números y guion, hasta 20 caracteres."
  }
}

variable "deploy_principals" {
  description = "ARN de los roles que pueden asumir el rol de despliegue: el de la Lambda step del despliegue (admite * como en ArnLike). Ningún usuario."
  type        = list(string)

  validation {
    condition     = length(var.deploy_principals) > 0 && alltrue([for arn in var.deploy_principals : can(regex("^arn:aws:iam::[0-9]{12}:role/[A-Za-z0-9+=,.@/*_-]+$", arn))])
    error_message = "deploy_principals necesita al menos un ARN de rol (arn:aws:iam::<cuenta>:role/...). No se admiten usuarios."
  }
}

variable "infra_sha" {
  description = "Huella de infra/ del andamiaje de la plantilla (tree_sha de agent/gates.py). Se calcula fuera de Terraform: ver README."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{64}$", var.infra_sha))
    error_message = "infra_sha debe ser un sha256 en hexadecimal (64 caracteres). El README dice cómo obtenerlo."
  }
}

# --- Lo que fija la plataforma en la cuenta del cliente -------------------------
# El modelo no puede darlas (spec de las etapas 14 y 15, sección 8). Con sus
# valores por defecto la plantilla se comporta como en un ambiente nuestro.

variable "permissions_boundary" {
  description = "ARN del boundary que llevan todos los roles que crea la plantilla. En la cuenta del cliente, opos-<p>-boundary; null en un ambiente nuestro."
  type        = string
  default     = null

  validation {
    condition     = var.permissions_boundary == null || can(regex("^arn:aws:iam::[0-9]{12}:policy/[A-Za-z0-9+=,.@_-]+$", var.permissions_boundary))
    error_message = "permissions_boundary debe ser el ARN de una política administrada (arn:aws:iam::<cuenta>:policy/<nombre>) o null."
  }
}

variable "publish_param" {
  description = "Si se publica el parámetro /opos/<stage>-<suffix>/base-env. Solo en un ambiente nuestro: en la cuenta del cliente la plataforma lee la salida base_env."
  type        = bool
  default     = true
}

variable "project_tag" {
  description = "Proyecto de la plataforma (los 12 últimos caracteres de su id). Si no está vacío, va como etiqueta opos:proyecto en todos los recursos."
  type        = string
  default     = ""

  validation {
    condition     = can(regex("^([0-9a-z]{12})?$", var.project_tag))
    error_message = "project_tag debe estar vacío o tener 12 minúsculas o números."
  }
}

# --- Lo que varía entre proyectos ----------------------------------------------

variable "log_retention_days" {
  description = "Días que se guardan los logs de la función en CloudWatch."
  type        = number
  default     = 90

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653], var.log_retention_days)
    error_message = "log_retention_days debe ser un valor que admita CloudWatch: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288 o 3653."
  }
}

variable "point_in_time_recovery" {
  description = "Recuperación a un punto en el tiempo (PITR) de la tabla."
  type        = bool
  default     = true
}

variable "allow_delete_item" {
  description = "Si el rol de la función puede dynamodb:DeleteItem sobre la tabla."
  type        = bool
  default     = false
}

variable "timezone" {
  description = "Zona horaria IANA en la que corre la función (variable de entorno TZ), por ejemplo America/Argentina/Buenos_Aires."
  type        = string
  default     = "UTC"

  validation {
    condition     = can(regex("^(UTC|[A-Z][A-Za-z_]+(/[A-Za-z0-9_+-]+){1,2})$", var.timezone))
    error_message = "timezone debe ser UTC o un nombre IANA como America/Bogota o America/Argentina/Buenos_Aires."
  }
}
