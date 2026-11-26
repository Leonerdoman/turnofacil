# Ambiente base

## La plantilla elegida

**API sin servidor** (plantilla 4). Una API sin servidores que administrar: una función, una tabla de datos y su dirección web.

Tu diseño no tiene pantallas ni inicio de sesión: todo pasa por WhatsApp, que le avisa a una API, y unas funciones que corren solo cuando hace falta guardan las citas y envían los recordatorios. Esta plantilla trae justo eso: una API, una función y una tabla para los datos, sin servidores que mantener. Ajustamos la hora de Colombia y permitimos borrar los datos de una clienta cuando lo pida.

## En qué se basa

- «TypeScript para todas las funciones, desplegadas como Lambdas y descritas con Terraform en la cuenta AWS del cliente» — [docs/adrs/ADR-001-usar-typescript-sobre-lambda-con-terraform.md](docs/adrs/ADR-001-usar-typescript-sobre-lambda-con-terraform.md)
- «Expone el webhook de Meta detrás de un API HTTP.» — [docs/RFC.md](docs/RFC.md)
- «No hay red privada ni servidores propios: no se justifica con 5 salones» — [docs/RFC.md](docs/RFC.md)
- «números sin WhatsApp, interfaz web para la dueña» — [docs/RFC.md](docs/RFC.md)
- «no hay proveedor de autenticación de usuarios.» — [docs/RFC.md](docs/RFC.md)
- «recordatorio 1 a las 18:00 (America/Bogotá) del día anterior» — [docs/RFC.md](docs/RFC.md)
- «Los datos de una clienta pueden borrarse a solicitud» — [docs/RFC.md](docs/RFC.md)

## Cuánto cuesta

Esta plantilla está dimensionada para costar como máximo 30 USD al mes en tu cuenta AWS. Lo paga tu cuenta.

## El plan de Terraform

Crea 12 recursos, no cambia ni borra nada.

> **Crea estos permisos:**
>
> - un rol para que la plataforma suba el código de tu aplicación (opos-base-dev-ggdgj87cfrt8-deploy)
> - un rol para que tu función guarde sus registros y use su tabla de datos (opos-base-dev-ggdgj87cfrt8-app-function)
> - los permisos de ese rol: cambiar el código de tu aplicación y nada más
> - los permisos de ese rol: escribir sus registros y leer y escribir su tabla
> - un permiso para que tu API llame a tu función (opos-base-dev-ggdgj87cfrt8-app)

---

Plan 9363cd6844e2 · preparado el 2026-11-25 15:35 UTC.
