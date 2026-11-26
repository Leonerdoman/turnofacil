# ADR-006 · Identificar por número y deducir el salón del remitente

**Status:** Accepted
**Date:** 2026-11-19
**Deciders:** [Fundador de TurnoFácil, plataforma OPOS (rfc-builder)]
**RFC:** docs/RFC.md §5.6 · §2.2.4

## Contexto

Solo el número registrado de la dueña puede registrar, cancelar o pedir la vista (US-01·1.4, 1.9), con un solo número por salón (PRD §6), y un salón no puede ver los datos de otro. No hay cuentas ni contraseñas: todo ocurre en chats de WhatsApp.

## Decisión considerada

Opciones evaluadas:
1. **El número remitente identifica a la dueña y a su salón, y la firma del webhook de Meta da la autenticidad** · sin fricción, el alta de un salón es registrar un número · quien tenga el teléfono de la dueña actúa como ella.
2. **Pedir un código o una contraseña** · un segundo factor · el PRD no lo pide y añade fricción a cada mensaje.
3. **Deducir el salón del texto del mensaje** · flexible · permite suplantar a otro salón.

## Decisión tomada

**El procesador busca el número remitente entre los números registrados de dueñas. Si coincide, ese es el salón de todas las consultas; si no, es una clienta. Un no-dueño que pide registrar, cancelar o la vista no recibe respuesta. Cada mensaje se autentica con la firma del webhook y los duplicados se descartan por su identificador**, porque cumple US-01·1.4 y 1.9 sin agregar fricción.

## Consecuencias

### Positivas
- Sin cuentas ni aplicaciones, el alta de un salón es registrar un número, lo que reduce la fricción de entrada.
- El aislamiento entre salones no depende del texto que escribe nadie: toda consulta lleva `salon_id`.

### Negativas / trade-offs aceptados
- Un teléfono robado o perdido permite actuar como la dueña hasta que se cambie el número.
- Una dueña opera un solo salón y un número pertenece a un solo salón.

### Acciones de mitigación
- Cambio de número por operación manual con identidad confirmada por el fundador por otro medio (ADR-007). Esto cierra el pendiente del PRD §6 "qué pasa si la dueña cambia de número".

## Necesita PoC/spike

n/a
