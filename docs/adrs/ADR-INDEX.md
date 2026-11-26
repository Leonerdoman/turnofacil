# ADR Index · TurnoFácil

**Última actualización:** 2026-11-19
**RFC base:** [docs/RFC.md](../RFC.md) (RFC-001 · decisiones §5.1 a §5.9)

## Tabla de decisiones

| ADR | Título | Status | Necesita PoC | Impacto downstream |
|---|---|---|---|---|
| [ADR-001](ADR-001-usar-typescript-sobre-lambda-con-terraform.md) | Usar TypeScript sobre AWS Lambda con Terraform | Accepted | No | Todas las Lambdas, módulos Terraform, plan de despliegue y planes de ingeniería (story-to-plan) |
| [ADR-002](ADR-002-enviar-por-meta-directo-tras-puerto-de-canal.md) | Enviar por Meta directo tras un puerto de canal | Proposed | Sí | Adaptador `CanalWhatsApp`, plantillas, contrato del webhook (contract-define), precio del piloto y fecha de inicio |
| [ADR-003](ADR-003-programar-recordatorios-por-evento-exacto-con-vigilante.md) | Programar recordatorios por evento exacto con vigilante | Accepted | No | Emisor, vigilante, EventBridge Scheduler, estados del Recordatorio (domain-modeler), alarmas de puntualidad (observability-design) |
| [ADR-004](ADR-004-acotar-reintentos-y-alertar-envios-fallidos.md) | Acotar reintentos y alertar cada envío fallido | Accepted | No | Clasificación de errores del adaptador, estados finales del Recordatorio, alarmas por correo (observability-design) |
| [ADR-005](ADR-005-aislar-persistencia-y-diferir-almacen-y-region.md) | Aislar la persistencia y diferir almacén y región | Accepted | No | Puerto `Repositorio`, variable de región en Terraform, uso de datos sintéticos, ADR futuro del almacén (security-design, domain-modeler) |
| [ADR-006](ADR-006-identificar-por-numero-y-deducir-salon-del-remitente.md) | Identificar por número y deducir el salón del remitente | Accepted | No | Procesador, aislamiento entre salones (security-design), historias US-01·1.4 y 1.9 (user-story-builder) |
| [ADR-007](ADR-007-registrar-sin-datos-personales-y-auditar-soporte.md) | Registrar sin datos personales y auditar al equipo | Accepted | No | Formato de registros, rol y Lambda de soporte, alerta de acceso (security-design, observability-design) |
| [ADR-008](ADR-008-interpretar-mensajes-con-reglas-deterministas.md) | Interpretar mensajes con reglas deterministas y listas configurables | Accepted | No | Intérprete del dominio, configuración de palabras, historias US-01, US-02 y US-03 (user-story-builder) |
| [ADR-009](ADR-009-procesar-entrantes-por-cola-fifo-ordenada.md) | Procesar entrantes por cola FIFO ordenada por remitente | Accepted | No | Receptor, cola FIFO con DLQ, máquina de estados de la Cita (domain-modeler), aviso US-04 |

> Status enum: `Accepted | Proposed | Open | Rejected | Superseded`.

## Resumen por status

| Status | N |
|---|---:|
| Accepted | 8 |
| Proposed | 1 |
| Open | 0 |
| Rejected | 0 |
| Superseded | 0 |

## PoCs / spikes requeridos

| ADR | Spike | Métrica de éxito | Timeline |
|---|---|---|---|
| ADR-002 | Costo de **todos** los mensajes de un salón (recordatorios, confirmaciones, vista, aviso de cancelación y baja) con unas 34 citas al mes, con la tarifa vigente de Meta para Colombia, sin incluir AWS | Costo de mensajes ≤ 20.000 COP por salón al mes (tope del fundador, asunción sin evidencia) | Antes de construir (PRD §7) · responsable: fundador |
| ADR-002 | Aprobación de las 3 plantillas (recordatorio del día antes, recordatorio de 2 horas antes, aviso de cancelación) | 3 de 3 aprobadas en ≤ 10 días hábiles desde el envío (asunción sin evidencia) | 2026-12-04 si las plantillas se envían el 2026-11-20 · responsable: fundador |
| ADR-002 | Respuestas sin plantilla dentro de la ventana de atención (asunción A1) | 4 de 4 tipos de respuesta (guardado, cancelación, vista, baja) enviados sin plantilla en un número de prueba | Junto con el spike de plantillas |

Si alguna métrica falla, se revisa el precio de 89.000 COP o se evalúa Twilio como segundo adaptador. Esa elección sería un ADR nuevo que reemplaza a ADR-002.

## Decisiones que requieren revisión de arquitectos

| ADR | Motivo de revisión | Arquitecto sugerido |
|---|---|---|
| ADR-002 | Proposed: elección de proveedor sujeta al spike de costo y plantillas, con impacto directo en el precio y en la fecha del piloto | Fundador con el arquitecto de integraciones de OPOS |
| ADR-005 | Impacto fuera del equipo: el almacén, la región y la retención dependen de la validación legal (abogado) y bloquean el primer salón con datos reales | Fundador con el abogado de datos personales y el arquitecto de datos de OPOS |

## Cross-ref con RFC

| Sección RFC | ADRs relacionados |
|---|---|
| § 1.3 NFRs | ADR-003 (5 min), ADR-007 (privacidad), ADR-009 (10 s), ADR-002 (costo) |
| § 1.4 Asunciones | ADR-002 (A1, A2), ADR-005 (A3, A4), ADR-009 (A5), ADR-007 (A10) |
| § 2.1 Aplicación | ADR-002, ADR-003, ADR-004, ADR-008, ADR-009 |
| § 2.2 Infra | ADR-001, ADR-005, ADR-006, ADR-007 |
| § 3 Dominio | ADR-008, ADR-009 |
| § 4 Alternativas | ADR-001 (C, D), ADR-002 (A, B), ADR-003 (E), ADR-008 (F, G) |
