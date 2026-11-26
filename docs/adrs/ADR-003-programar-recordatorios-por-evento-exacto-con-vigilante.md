# ADR-003 · Programar recordatorios por evento exacto con vigilante

**Status:** Accepted
**Date:** 2026-11-19
**Deciders:** [Fundador de TurnoFácil, plataforma OPOS (rfc-builder)]
**RFC:** docs/RFC.md §5.3 · §2.1.4 · §4 (opción E)

## Contexto

El recordatorio debe salir con un retraso máximo de 5 minutos (PRD §6, asunción sin validar), y los dos recordatorios son la única función probada en el piloto [E:01M7RXWF70H4FDZ56B2RMEMYSF]. Un programador puede fallar o no crear un evento, y ese fallo pasaría inadvertido. La hora del primer recordatorio era un pendiente del PRD (§9) que el fundador cerró en la etapa 7: 18:00 hora de Colombia del día anterior.

## Decisión considerada

Opciones evaluadas:
1. **Un evento programado por recordatorio, a la hora exacta, más un vigilante cada minuto y alarmas** · retraso típico de segundos, los eventos perdidos se recuperan · dos caminos de envío que hay que coordinar.
2. **Solo un recorrido cada minuto sobre todas las citas** · un solo mecanismo · lee todo el almacén cada minuto, cuesta más y expone más datos personales al proceso.
3. **Solo eventos programados** · simple · un evento perdido pasa inadvertido.

## Decisión tomada

**Un evento programado de una sola ejecución por recordatorio (nombre determinista `rec-<cita>-<tipo>`, carga solo con identificadores opacos), un vigilante cada minuto que envía los vencidos y una reserva atómica `reservarEnvio` contra duplicados**, porque es la única opción que cumple los 5 minutos y además deja ver cuándo no se cumplen. Recordatorio 1 a las 18:00 (America/Bogotá) del día anterior; recordatorio 2 a la hora de inicio menos 2 horas.

## Consecuencias

### Positivas
- Peor caso sin fallos del canal: unos 60 s más el tiempo de envío, muy por debajo de los 300 s.
- La puntualidad se mide desde el primer día (métrica de retraso por envío) y se puede demostrar con evidencia en las 8 semanas del piloto.
- A las 18:00 la clienta ya terminó su jornada y puede responder.

### Negativas / trade-offs aceptados
- Emisor y vigilante pueden coincidir sobre el mismo recordatorio; depende de la escritura condicional del almacén (requisito de ADR-005).
- Una pieza más que operar (vigilante con latido y alarma propia).

### Acciones de mitigación
- Tres alarmas: retraso máximo > 300 s en un minuto, recordatorios vencidos sin enviar durante 2 minutos y falta de latido del vigilante.
- Verificación justo antes de enviar: cita cancelada o clienta dada de baja → "omitido". El recordatorio 2 sí sale si la clienta ya confirmó (decisión del fundador sobre US-02·2.2).
- Validación técnica (RFC §6.2): borrar a propósito un evento y comprobar que el vigilante lo envía dentro de 300 s.

## Necesita PoC/spike

n/a · el mecanismo usa servicios administrados con comportamiento documentado. La meta de 5 minutos se verifica con la prueba de puntualidad del RFC §6.2, no con un spike previo.
