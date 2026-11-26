# ADR-001 · Usar TypeScript sobre AWS Lambda con Terraform

**Status:** Accepted
**Date:** 2026-11-19
**Deciders:** [Fundador de TurnoFácil, plataforma OPOS (rfc-builder)]
**RFC:** docs/RFC.md §5.1 · §2.2.1 · §4 (opciones C y D)

## Contexto

TurnoFácil es un proyecto nuevo, sin `CLAUDE.md` ni `arch/drivers.yaml`, así que no hay lenguaje ni patrón impuestos (RFC §1.0). El fundador fijó en la etapa 7 que OPOS construye y despliega con Terraform en la cuenta AWS del cliente. El volumen es mínimo: 5 salones, unas 170 citas y 340 recordatorios al mes (RFC §1.3, PRD §6), con cargas cortas y disparadas por eventos.

## Decisión considerada

Opciones evaluadas:
1. **TypeScript sobre AWS Lambda, descrito con Terraform** · pago por uso, sin servidores, todo en código de infraestructura · ejecuciones cortas y sin estado, límites propios de cada servicio.
2. **Contenedores permanentes (por ejemplo, ECS)** · procesos de larga vida y más control · costo fijo con tráfico casi nulo y más piezas que operar para un piloto de 5 salones.
3. **Otro lenguaje sobre Lambda** · posible · ninguna ventaja que justifique cambiar lo que pidió el fundador.

## Decisión tomada

**TypeScript para todas las funciones, desplegadas como Lambdas y descritas con Terraform en la cuenta AWS del cliente, con el dominio como módulo sin dependencias de AWS**, porque es la elección del fundador y encaja con un volumen de unos 340 recordatorios al mes sin costo fijo.

## Consecuencias

### Positivas
- Casi no hay costo en reposo ni servidores que mantener. El costo de infraestructura por salón es marginal frente a los 89.000 COP del piloto [E:01M7RXWF70H4FDZ56B2RMEMYSF], lo que hace viable el precio con 5 salones.
- Todo el sistema queda descrito en Terraform y se puede revertir por versión (RFC §6.3).
- El dominio puro permite cambiar de proveedor de WhatsApp o de almacén sin tocar las reglas (base de ADR-002 y ADR-005).

### Negativas / trade-offs aceptados
- Cada ejecución es corta y sin estado: todo el estado va al repositorio (ADR-005).
- Escalar más allá de 5 salones no exige rediseño, pero el PRD no define esa meta (PRD §6, [PENDIENTE]); no se dimensiona para ella.

### Acciones de mitigación
- Un rol con permisos mínimos por Lambda (RFC §2.2.1).
- Costo de AWS medido aparte del costo de mensajes (ver ADR-002).

## Necesita PoC/spike

n/a
