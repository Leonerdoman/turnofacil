# Diseño del experimento de solución — TurnoFácil (opción C: Concierge con tres brazos y cláusula de pago)

**Estado:** diseño congelado por el fundador. Sin resultados todavía.
**Ejecutor y medidor:** el fundador. La fuente del resultado es la agenda de la dueña.

## Hipótesis falsable
Dentro del segmento de salones solo con citas, la confirmación por WhatsApp reduce al menos un 30% la tasa de solicitudes fallidas frente al control, y al menos 3 de 5 salones aceptan pagar para seguir usándola. Si no, la hipótesis queda refutada.

## Fases
1. **Línea base (2 semanas):** todas las solicitudes elegibles se registran sin intervención. Mide la tasa real de solicitudes fallidas. Se reporta, no es una compuerta.
2. **Asignación por cita (mínimo 4 semanas, y hasta alcanzar el mínimo de decisión):** cada solicitud elegible se asigna a un brazo al momento de agendar con una regla fija (alternancia o sorteo), no por el criterio del fundador.
3. **Cláusula de pago:** al cierre, cada salón decide si paga para continuar.

## Brazos (un solo elemento cambia a la vez)
| Brazo | Qué recibe la clienta |
|---|---|
| Control | Lo que la dueña ya hace hoy |
| Confirmación | Mensajes de WhatsApp del fundador en lugar de la confirmación manual de la dueña |
| Anticipo | Anticipo fijo al agendar, más la práctica habitual de la dueña. Sin mensajes del fundador |

Elegibles: servicios de 1 h o más y de 110.000 pesos o más. Se excluyen los salones que ya cobran un anticipo alto.

## Medida y denominador (iguales en los tres brazos)
- **Denominador:** solicitudes con cupo ofrecido (la clienta pidió hora para un servicio elegible y se le ofreció un cupo).
- **Solicitud fallida:** la clienta no llega, llega tarde, cancela sobre la hora, o abandona la solicitud después de conocer la condición de su brazo.
- **Tasa de solicitudes fallidas** = fallidas / solicitudes con cupo ofrecido. Se excluyen solo las solicitudes sin cupo por agenda llena.
- **R1** = reducción de la tasa del brazo Confirmación frente al Control. **R2** = reducción de la tasa del brazo Anticipo frente al Control. **P** = salones que pagan, de 5.

## Mínimo para decidir
Al menos **10 solicitudes fallidas en el brazo Control**. No se mide en solicitudes totales. Si no se alcanzan, se extiende la fase 2. Se procura que los tres brazos tengan un número similar de solicitudes.

## Criterios congelados
| # | Resultado | Decisión |
|---|---|---|
| 1 | R1 ≥ 30% y P ≥ 3 | Perseverar con (a). Si R2 ≥ 50% y supera a R1, el anticipo queda como riesgo de competencia para el PRD |
| 2 | R1 ≥ 30% y P entre 1 y 2 | La confirmación funciona, el cobro no está validado. Segunda ronda de 4 semanas con otra estructura de cobro |
| 3 | R1 ≥ 30% y P = 0 | Funciona pero nadie paga. Se revisa propuesta y modelo de cobro. No se avanza al PRD |
| 4 | R1 < 30% y R2 ≥ 50% | Cambiar a (b) |
| 5 | R1 < 30% y R2 entre 30% y 50% | Sin cambio automático. Segunda ronda de 4 semanas comparando variantes del anticipo |
| 6 | R1 < 30% y R2 < 30% | Ninguna funciona. Brief de retorno a la etapa del problema |

Los umbrales de 30%, 50% y P ≥ 3 de 5 son asunciones sin evidencia, confirmadas por el fundador. No se cambian después de ver datos.

## Límites conocidos
- Con 10 fallidas en el control, el resultado es una señal, no una prueba estadística.
- Mide el fundador, que quiere que funcione. Mitigación: la agenda de la dueña es la fuente y cada solicitud queda como fila cruda.
- 3 de las 7 entrevistas de la etapa 2 salieron de referidos, lo que puede sesgar el reclutamiento.
- Una solicitud que abandona por la condición de su brazo cuenta como fallida, también en Control y Confirmación, para que el denominador sea simétrico.

## Pendiente
- Monto mensual no promocional de la cláusula de pago. Es de la hipótesis de pricing, no el precio definitivo.
