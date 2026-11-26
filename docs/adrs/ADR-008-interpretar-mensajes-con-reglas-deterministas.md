# ADR-008 · Interpretar mensajes con reglas deterministas y listas configurables

**Status:** Accepted
**Date:** 2026-11-19
**Deciders:** [Fundador de TurnoFácil, plataforma OPOS (rfc-builder)]
**RFC:** docs/RFC.md §5.8 · §4 (opciones F y G)

## Contexto

La dueña escribe texto libre y la clienta responde con palabras. El PRD fija las palabras de confirmación, cancelación y baja, las marca como provisionales, sujetas a ajuste con las respuestas reales y a la validación legal, y excluye "baja" y "para" (US-02·2.6, 2.10). La confirmación de guardado y la vista deben responderse en menos de 10 s (PRD §6, asunción sin validar).

## Decisión considerada

Opciones evaluadas:
1. **Intérprete determinista con formato guiado para la dueña y listas configurables para la clienta** · predecible, barato y auditable contra los criterios del PRD · menos tolerante con redacciones libres.
2. **Modelo de lenguaje para extraer datos** · entiende texto libre · latencia cercana a los 10 s, costo por mensaje, envío de nombre y teléfono a un tercero antes de la validación legal y resultados no deterministas.

## Decisión tomada

**Intérprete determinista: reconoce las tres acciones de la dueña y los cinco datos con un formato guiado, y si no entiende pide repetir con un ejemplo. Las respuestas de la clienta se comparan, sin importar mayúsculas, tildes ni puntuación, contra listas configurables de confirmación, cancelación y baja, sin "baja" ni "para"**, porque es la única opción que cumple los criterios del PRD de forma verificable y sin enviar datos personales a terceros.

## Consecuencias

### Positivas
- Cambiar las palabras de la clienta es un cambio de configuración y no de código. Se pueden ajustar tras las primeras semanas y tras la validación legal.
- Cada criterio Given/When/Then se puede probar con resultados repetibles.

### Negativas / trade-offs aceptados
- La dueña debe aprender un formato corto para registrar. Es justo la fricción que pone a prueba la asunción "las dueñas aceptan registrar por chat"; en el piloto, S3 prefirió su libreta [E:01M7RXWF70H4FDZ56B2RMEMYSF].
- Algunas redacciones libres de la dueña se rechazan y se le pide repetir.
- Riesgo conocido del PRD §6: una clienta que escribe "baja" o "para" no queda dada de baja.

### Acciones de mitigación
- Revisar en la revisión semanal las respuestas no entendidas y ajustar las listas por configuración.

## Necesita PoC/spike

n/a
