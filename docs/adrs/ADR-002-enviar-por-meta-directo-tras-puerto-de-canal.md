# ADR-002 · Enviar por Meta directo tras un puerto de canal

**Status:** Proposed
**Date:** 2026-11-19
**Deciders:** [Fundador de TurnoFácil, plataforma OPOS (rfc-builder)]
**RFC:** docs/RFC.md §5.2 · §2.1.3 · §4 (opciones A y B) · asunciones A1, A2

> ⚠️ **Revisión requerida** — este ADR está Proposed y requiere spike/PoC antes de
> aceptar. Ver sección "Necesita PoC/spike" abajo. **NO implementar** nada que dependa
> de esta decisión hasta que el spike confirme la viabilidad. El status acá DEBE
> coincidir con el `ADR-INDEX.md` (si hay duda, mantener Proposed).

## Contexto

El fundador eligió WhatsApp Business Platform de Meta directo. El costo por mensaje y el tiempo de aprobación de plantillas siguen sin validar: el PRD §7 los marca como bloqueantes "antes de construir", con el fundador como responsable. El fundador confirmó el 2026-11-19 que todavía no tiene esos datos. El costo por mensaje es el principal costo variable del producto frente a un precio de piloto de 89.000 COP por salón al mes [E:01M7RXWF70H4FDZ56B2RMEMYSF].

## Decisión considerada

Opciones evaluadas:
1. **Meta directo detrás de un puerto `CanalWhatsApp`, con Twilio como segunda implementación posible** · sin intermediario, en principio mejor precio, control de plantillas, cambiar de proveedor es cambiar un adaptador · integración propia de webhook y firma, una capa más de código.
2. **Twilio como primera opción** · integración más rápida y soporte propio · sobreprecio por mensaje y un intermediario más entre el sistema y Meta.
3. **Acoplar el dominio a la API de Meta** · menos código al inicio · cambiar de proveedor obligaría a reescribir las reglas del negocio.

## Decisión tomada

**Meta directo detrás del puerto `CanalWhatsApp`, con tres plantillas para los mensajes iniciados por la empresa (recordatorio del día antes, recordatorio de 2 horas antes y aviso de cancelación) y respuestas dentro de la ventana de atención para el resto**, porque es la elección del fundador y el puerto deja a Twilio como salida si el spike de costo o plantillas falla.

## Consecuencias

### Positivas
- Si la validación del PRD §7 resulta adversa, cambiar de proveedor es cambiar un adaptador, sin tocar el dominio.
- El precio del piloto se puede contrastar contra un tope explícito de costo de mensajes.

### Negativas / trade-offs aceptados
- Las plantillas deben estar aprobadas antes de lanzar: el tiempo de aprobación marca la fecha más temprana del piloto.
- Si el costo por mensaje no cabe en el tope, cambia el precio o el proveedor (decisión de producto, no técnica).
- A1 (qué mensajes exigen plantilla y cuáles no) es una asunción sin evidencia hasta el spike.

### Acciones de mitigación
- Spike de costo y plantillas antes de construir el adaptador (ver abajo).
- Mantener el contrato del puerto independiente de Meta (enviar plantilla, enviar texto en ventana, interpretar evento entrante, interpretar estado de entrega).

## Necesita PoC/spike

**Spike de costo y plantillas de Meta** (responsable: fundador; antes de construir, PRD §7).

1. **Costo.** Con la tarifa vigente de Meta para Colombia, calcular el costo mensual de **todos** los mensajes de un salón con unas 34 citas al mes (PRD §7): recordatorios 1 y 2, confirmaciones de guardado y de cancelación a la dueña, vistas, avisos de cancelación y confirmaciones de baja. El costo de AWS no entra en este cálculo y se mide aparte.
   - **Métrica de éxito:** costo de mensajes ≤ **20.000 COP por salón al mes**. Tope fijado por el fundador el 2026-11-19 como asunción sin evidencia.
   - **Si falla:** se revisa el precio de 89.000 COP o se evalúa Twilio como segundo adaptador.
2. **Plantillas.** Enviar a aprobación las tres plantillas y medir los días hasta su aprobación.
   - **Métrica de éxito:** 3 de 3 plantillas aprobadas en ≤ **10 días hábiles** desde el envío. Plazo aceptado por el fundador el 2026-11-19 como asunción sin evidencia.
   - **Si falla:** se activa la evaluación de Twilio.
3. **Ventana de atención (A1).** Confirmar que la confirmación de guardado, la cancelación, la vista y la confirmación de baja se pueden enviar sin plantilla dentro de la ventana de atención.
   - **Métrica de éxito:** 4 de 4 tipos de respuesta enviados sin plantilla en un número de prueba.

Al cerrar el spike, el status pasa a Accepted, o a Superseded por un ADR que elija Twilio.
