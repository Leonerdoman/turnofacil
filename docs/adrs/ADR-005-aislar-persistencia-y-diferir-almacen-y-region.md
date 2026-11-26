# ADR-005 · Aislar la persistencia y diferir almacén y región

**Status:** Accepted
**Date:** 2026-11-19
**Deciders:** [Fundador de TurnoFácil, plataforma OPOS (rfc-builder)]
**RFC:** docs/RFC.md §5.5 · §2.1.2 (puerto `Repositorio`) · §2.2.2 · asunciones A3, A4

## Contexto

El PRD deja abiertos el tiempo de conservación de los datos y la validación legal de datos personales en Colombia. Esa validación bloquea el lanzamiento, no la construcción (PRD §7). El fundador pidió no fijar dónde se guardan los datos hasta tenerla. Nombre y teléfono de las clientas son los datos más sensibles (PRD §6).

## Decisión considerada

Opciones evaluadas:
1. **Puerto `Repositorio` con requisitos fijos, sin tecnología ni región hasta la validación legal** · se construye ya y el costo de rehacer queda acotado al adaptador · no se pueden cargar datos reales antes de la validación.
2. **Elegir ya un almacén y una región de AWS** · se avanza con la implementación definitiva · arriesga rehacer si la validación pide otro lugar o otra retención.
3. **Puerto sin requisitos definidos** · máxima libertad · el puerto quedaría sin un contrato verificable.

## Decisión tomada

**La persistencia se accede solo por el puerto `Repositorio`, con escritura condicional atómica, unicidad por (salón, teléfono, inicio), consulta por (estado, hora programada), borrado por clienta y cifrado en reposo. La región de AWS es una variable de Terraform sin valor por defecto. Hasta la validación legal solo se usan datos sintéticos**, porque así la construcción avanza sin comprometer una ubicación que la validación legal podría invalidar.

## Consecuencias

### Positivas
- Si la validación exige otro lugar o una retención corta, el costo queda acotado al adaptador.
- Los requisitos del puerto sostienen ADR-003 (reserva atómica) y RF-01 (rechazo de citas duplicadas).

### Negativas / trade-offs aceptados
- La validación legal pasa a ser una dependencia de calendario del piloto, además de un requisito para lanzar.
- No hay purga automática ni respaldo definidos hasta esa validación (A4).

### Acciones de mitigación
- Emitir un ADR nuevo con el almacén, la región, la retención y el respaldo apenas exista la validación legal, y siempre antes del primer salón con datos reales (RFC §6.3).

## Necesita PoC/spike

n/a · la decisión de diferir está cerrada. El ADR futuro del almacén depende de la validación legal (responsable: fundador), no de un spike técnico.
