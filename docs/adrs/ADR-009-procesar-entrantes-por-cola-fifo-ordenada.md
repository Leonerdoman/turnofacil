# ADR-009 · Procesar entrantes por cola FIFO ordenada por remitente

**Status:** Accepted
**Date:** 2026-11-19
**Deciders:** [Fundador de TurnoFácil, plataforma OPOS (rfc-builder)]
**RFC:** docs/RFC.md §5.9 · §2.1.2 · §3.4 · asunción A5

## Contexto

Meta reintenta el webhook y puede entregar duplicados. Las reglas de "vale la última respuesta válida" y de estados finales a la hora de la cita (US-02·2.3, 2.4, 2.7, A5) dependen de procesar los mensajes en orden y de no aplicar ninguno dos veces.

## Decisión considerada

Opciones evaluadas:
1. **Receptor que responde de inmediato y cola FIFO agrupada por teléfono del remitente, con DLQ y procesador idempotente** · orden garantizado por persona y sin duplicados · una cola y una DLQ más que operar, y latencia extra.
2. **Procesar dentro del webhook** · menos piezas · riesgo de superar el tiempo de respuesta de Meta y de procesar dos veces.
3. **Cola estándar sin orden** · más simple · podría aplicar "cancelo" antes que un "sí" anterior.

## Decisión tomada

**Cola FIFO agrupada por teléfono del remitente, con un procesador idempotente por identificador de mensaje de Meta. La cita guarda la última respuesta válida y un evento programado la fija a la hora de la cita; una respuesta posterior se registra pero no cambia el estado. El aviso a la dueña (US-04) se genera en la misma transición que cancela**, porque es la única opción que garantiza que vale lo último que dijo la clienta.

## Consecuencias

### Positivas
- Comportamiento consistente para la dueña y la clienta: vale lo último que dijo la clienta antes de la cita.
- El aviso de cancelación (lo primero que se corta según el PRD §4B) se puede quitar sin tocar el resto del flujo.

### Negativas / trade-offs aceptados
- Una cola y una DLQ más que operar, con su alarma.
- La respuesta a la dueña suma el paso por la cola y debe seguir por debajo de 10 s.

### Acciones de mitigación
- Alarma si la DLQ tiene mensajes.
- Métrica de latencia de respuesta a la dueña, medida por evento desde el primer día (RFC §2.2.3).

## Necesita PoC/spike

n/a · la latencia de 10 s se verifica con la métrica del RFC §2.2.3 durante la validación técnica.
