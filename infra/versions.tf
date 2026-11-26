terraform {
  required_version = ">= 1.10" # use_lockfile en el backend s3

  # Un backend no admite variables: bucket, key y region llegan con
  # -backend-config. En la cuenta del cliente los pone el ejecutor de la
  # plataforma (infra/runner); en dev-ing, el README dice el comando. Sin
  # profile: las credenciales salen del entorno (AWS_PROFILE o el perfil del
  # ejecutor).
  backend "s3" {
    encrypt      = true
    use_lockfile = true
  }

  # Sin el provider archive: la plantilla no genera archivos durante el plan
  # (placeholder.zip va hecho en esta carpeta; ver main.tf).
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = merge(
      {
        Project         = "opos-platform"
        Component       = "base-env"
        ManagedBy       = "terraform"
        "opos:base-env" = "${var.stage}-${var.suffix}"
      },
      # En la cuenta del cliente, el proyecto: con esta etiqueta se encuentra
      # todo lo que creó la plataforma (Tag Editor).
      var.project_tag == "" ? {} : { "opos:proyecto" = var.project_tag },
    )
  }
}
