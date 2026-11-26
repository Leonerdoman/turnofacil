# ADR-007 · Registrar sin datos personales y auditar al equipo

**Status:** Accepted
**Date:** 2026-11-19
**Deciders:** [Fundador de TurnoFácil, plataforma OPOS (rfc-builder)]
**RFC:** docs/RFC.md §5.7 · §2.2.3 · §2.2.4 · asunción A10

## Contexto

Nombre y teléfono son los datos más sensibles. El equipo accede solo cuando es necesario y ese acceso debe quedar registrado (PRD §6). En la etapa 7 el fundador pidió que los registros no guarden nombres ni teléfonos en claro y eligió el correo como canal de alertas, de forma provisional.

## Decisión considerada

Opciones evaluadas:
1. **Identificadores opacos y seudónimo HMAC en los registros, rol de soporte explícito y operaciones manuales auditadas** · cumple el pedido del fundador y deja rastro de cada acceso · depurar es más lento.
2. **Registrar el teléfono completo para depurar** · depuración rápida · viola el pedido del fundador y expone datos sensibles.
3. **Permitir que la clienta se reactive escribiendo** · menos trabajo manual · un mensaje suelto podría reactivar a quien pidió parar, con implicaciones legales.

## Decisión tomada

**Los registros usan `cita_id`, `salon_id` y, si hace falta, el seudónimo HMAC del teléfono (con la clave en Secrets Manager). El acceso del equipo a datos de clientas es solo mediante un rol de soporte que se asume de forma explícita y dispara una alerta por correo. El cambio de número, la reactivación y el borrado pasan por una Lambda de soporte que escribe un evento de auditoría**, porque es la forma de cumplir el PRD §6 y el pedido del fundador con evidencia de quién tocó qué.

## Consecuencias

### Positivas
- Ante una consulta legal o de una clienta, existe un registro de quién tocó qué.
- Meta verificable: 0 apariciones de nombre o teléfono en claro en los registros (RFC §1.3).

### Negativas / trade-offs aceptados
- Depurar exige cruzar identificadores con el almacén.
- El cambio de número y la reactivación no son inmediatos para la dueña y dependen del fundador: el riesgo de concentración en una persona sigue abierto (PRD §7).
- El correo de alertas es provisional (A10).

### Acciones de mitigación
- Revisión de registros con datos sintéticos antes del piloto (RFC §6.2).
- Confirmar la suscripción de correo del fundador antes de activar cada salón (RFC §6.3).

## Necesita PoC/spike

n/a
