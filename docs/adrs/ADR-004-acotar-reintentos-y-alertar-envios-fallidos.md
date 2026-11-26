# ADR-004 · Acotar reintentos y alertar cada envío fallido

**Status:** Accepted
**Date:** 2026-11-19
**Deciders:** [Fundador de TurnoFácil, plataforma OPOS (rfc-builder)]
**RFC:** docs/RFC.md §5.4 · §2.1.4 (tabla "Qué pasa si un envío falla")

## Contexto

El PRD §6 exige que el equipo se entere cuando un recordatorio no sale o sale tarde y cuando un mensaje no se entrega. Reintentar sin límite puede mandar un recordatorio de 2 horas que ya no sirve. No reintentar puede costar una cita por un fallo momentáneo: el servicio perdido vale entre 110.000 y 350.000 pesos [E:01M7RSBPYMAF3FDSW0CDTKB82M].

## Decisión considerada

Opciones evaluadas:
1. **Reintentos acotados por tipo de error, con una alarma por fallo** · respeta la ventana de 5 minutos y ningún fallo pasa inadvertido · hay que mantener la clasificación de errores en el adaptador.
2. **Reintentar sin límite** · máxima probabilidad de entrega · puede enviar tarde y sin sentido.
3. **No reintentar** · simple · un error transitorio deja una cita sin recordatorio.
4. **Reenviar tras un estado de entrega fallido informado por Meta** · más entregas · puede repetir un mensaje que a la clienta sí le llegó.

## Decisión tomada

**Ante errores transitorios, reintentar a los 10 y 30 segundos y luego cada minuto mientras el retraso sea menor a 5 minutos. Pasado ese límite, el recordatorio 2 queda "incumplido" y el 1 se reintenta cada 5 minutos hasta la hora del 2. Los errores permanentes y los estados de entrega fallidos no se reintentan. Cada fallo genera su métrica y su alarma por correo**, porque es la única política que respeta los 5 minutos sin ocultar fallos.

## Consecuencias

### Positivas
- El fundador se entera por correo de cada fallo mientras dure el piloto.
- Cada recordatorio guarda intentos, hora de envío, retraso y resultado, lo que permite reconstruir cada cita (RF-12) sin buscar en los registros.

### Negativas / trade-offs aceptados
- La cita de una clienta con un número sin WhatsApp queda "sin confirmar" (limitación conocida, PRD §7).
- Una cita sin recordatorio no cuenta como cerrada en el 70% (PRD §8): un fallo de envío baja directamente la métrica principal.
- La clasificación transitorio/permanente depende del adaptador (ADR-002) y cambia si cambia el proveedor.

### Acciones de mitigación
- Simular un error transitorio, un error permanente y un estado de entrega fallido, y verificar el estado y la alarma de cada caso (RFC §6.2).

## Necesita PoC/spike

n/a
