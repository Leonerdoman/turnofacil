# Definición de Solución — TurnoFácil

**Etapa:** 3 — Solución · **Fecha:** 2026-11-19
**Destino:** tech-emergentes-build-prd
**Insumos:** `artefacto-traspaso.md` (etapa 2, aprobado) · resultados crudos del experimento [E:01M7RXWF70H4FDZ56B2RMEMYSF] · diseño congelado en `.discovery/work/diseno-experimento-solucion.md`
**Este archivo contiene los dos documentos de cierre:** el Documento de Definición de Solución (A) y el Reporte de Evidencia de la Solución (B). No se entrega uno sin el otro.

---

## A) DOCUMENTO DE DEFINICIÓN DE SOLUCIÓN

### 1. Producto

**TurnoFácil** — confirmación de citas por WhatsApp para salones que trabajan solo con citas: la clienta confirma o cancela por chat, sin que la dueña tenga que escribirle ni perseguirla.

### 2. Buyer validado

No se redefine aquí; ver `artefacto-traspaso.md`, sección 2.

- **Perfil:** dueña de un salón de 1 a 4 puestos en Medellín que trabaja solo con citas, con servicios de 1 a 4 horas y de 110.000 a 350.000 pesos, que ya hace algo (confirmación manual, anticipo, recepcionista, lista de espera) para que las clientas lleguen.
- **Evidencia de validación:** 7/7 de la ronda 2 calificaron en el perfil [E:01M7RSBPYMAF3FDSW0CDTKB82M]; 6/7 con workaround activo y 4/7 con costo que cumple el umbral.
- **Validación parcial y acotada, no amplia:**
  - Las peluquerías de barrio por orden de llegada quedaron **descartadas** en la ronda 1 (n = 7) [E:01M7QSXY072979062E1E92PZQ6]. Los conteos de las dos rondas no se suman.
  - 3 de las 7 entrevistas de la ronda 2 salieron de cadenas de referidos.
  - Los 5 salones del experimento (S1 a S5) son entrevistadas de la ronda 2 (R2-E1, E3, E4, E6, E7), no un reclutamiento nuevo.
  - El SAM no está cuantificado: no hay cifra pública de salones solo con citas en Medellín (asunción sin evidencia de mercado).

### 3. Dolor validado

No se redefine aquí; ver `artefacto-traspaso.md`, sección 7. Resumen frente a los umbrales de `diseno-experimento-v2.md` (n = 7, ronda 2):

| # | Dolor | Observado | Umbral | Estado |
|---|---|---|---|---|
| 1 | La cita fallida en un servicio largo deja el puesto vacío y se pierde el ingreso | H2 6/7 y H3 6/7 | H2 ≥ 5, H3 ≥ 4 | Validado |
| 2 | Perseguir y confirmar cada cita consume horas o dinero y no la asegura | H4 4/7 | ≥ 4 | Validado, justo en el umbral |
| 3 | Contestar mensajes con las manos ocupadas en pleno servicio | 5/7 | Sin umbral propio | Dato adicional, no validado contra umbral |

### 4. Propuesta de valor

*Hipótesis parcialmente confirmada.* "Que cada clienta llegue a su hora y que la dueña deje de perseguir confirmaciones a mano."

- **Confirmado por comportamiento:** la confirmación redujo las citas fallidas un 33,3% frente al control y 3 de 5 salones pagaron por seguir. El margen sobre el umbral es estrecho (ver 6).
- **Declarado, no medido:** el ahorro de tiempo ("Me ahorré la media hora de todas las noches", S1). El experimento no midió minutos.
- **No resuelto:** el hueco que queda cuando una cita igual falla. La confirmación avisa, pero no llena el puesto.

### 5. Modelo MVF (6 ejes de propuesta de valor, versión testeada)

1. **A quién:** dueñas de salones que trabajan solo con citas.
2. **Segmento:** servicios de 1 h o más y de 110.000 pesos o más (color y alisados, uñas, cejas y pestañas), Medellín. Sin salones que ya cobren anticipo alto.
3. **Formato de output:** mensajes de WhatsApp a la clienta.
4. **Contenido:** dos recordatorios por cita (el día antes y 2 horas antes), con respuesta de la clienta para confirmar o cancelar. Los dos se testearon juntos, así que su efecto individual no se separó.
5. **Información a la dueña:** qué clientas respondieron y quién queda sin confirmar. No se registró un reporte formal en el piloto (asunción sin evidencia sobre la forma de entregarlo).
6. **Pricing (hipótesis):** suscripción mensual. En el cierre se probó 89.000 pesos al mes, sin descuento y con pago del primer mes antes del día 49.

### 6. Resultado del experimento de solución

- **Tipo:** Concierge con tres brazos (Control, Confirmación, Anticipo) y cláusula de pago. Asignación por solicitud con alternancia fija, 5 salones, 14 días de línea base y 28 de brazos.
- **Criterio de éxito congelado antes de empezar:** R1 ≥ 30% y P ≥ 3 de 5, con al menos 10 solicitudes fallidas en el Control.

| Medida | Umbral | Observado | Cumple |
|---|---|---|---|
| Mínimo de decisión: fallidas en el Control | ≥ 10 | 12 | Sí |
| R1: reducción de la tasa de fallidas con Confirmación frente al Control | ≥ 30% | **33,3%** (8/54 = 14,8% frente a 12/54 = 22,2%) | Sí, por 3,3 puntos |
| P: salones que pagaron por seguir | ≥ 3 de 5 | **3 de 5** (S1, S2, S5) | Sí, justo en el umbral |
| R2: reducción con Anticipo frente al Control | ≥ 50% para el criterio de cambio | **58,3%** (5/54 = 9,3%) | Sí |

- **Veredicto según la tabla de decisión congelada (fila 1): Perseverar con la confirmación (a).** Como R2 ≥ 50% y supera a R1, el anticipo queda registrado como **riesgo de competencia para el PRD**, tal como se definió de antemano.
- **Lo que sostiene el veredicto y lo que no:** el criterio se cumple por márgenes mínimos. La diferencia entre Control y Confirmación es de 4 casos (12 frente a 8). Si se quita S3, la reducción cae a 12,5%. Con la exclusión de los 2 casos con desvío de protocolo en S4, queda en 30,8%. Es una señal favorable, no una prueba. Detalle en el Reporte B, secciones 5 y 7.

### 7. Hipótesis de modelo de pricing

- **Estructura probada:** suscripción mensual.
- **Evidencia transaccional:** 3 de 5 salones **pagaron** el primer mes a 89.000 pesos, sin descuento (días 44, 45 y 47). S4 dijo "Sí, cuente conmigo, el lunes le transfiero" y no transfirió antes del día 49. Cuenta solo el pago hecho, no la intención.
- **Lo que no está validado:** la renovación (solo hay un primer pago), otras estructuras de cobro y el precio. **89.000 pesos es el monto del piloto, no un precio definitivo.**
- **Qué se observó sobre el motivo de pago:** las dos razones citadas por quienes pagaron son de tiempo y de personal ("Me ahorré la media hora de todas las noches", S1; "Con esto la recepcionista puede hacer otras cosas", S2), no de menos citas fallidas. Esto apunta al dolor 2 más que al dolor 1.

### 8. Riesgos críticos

- **Ajuste problema-solución:** la mejora en citas fallidas es modesta y frágil (ver 6). El anticipo redujo más las fallas (58,3%) y es un competidor directo de la propuesta. No se probó la combinación de ambos.
- **Mercado:** el SAM no está cuantificado. Existen agendas con recordatorios que ya operan en Colombia (Aura, Gestabiz, AgendApp, según el traspaso), y una herramienta de agenda fue abandonada por R2-E4 porque "las clientas viven en el chat".
- **Producto:** el dolor 1 incluye el puesto vacío. La confirmación no recupera el hueco (la lista de espera solo recuperó 1 de 3, R2-E6). S3 prefirió seguir con su libreta y no pagó.
- **Proceso del experimento:** quien envió los mensajes y midió fue la persona fundadora, y no hubo ciego. Los 5 salones eran entrevistadas previas.
- **Técnico (requiere evaluación de ingeniería):** todo el piloto fue manual. No se sabe si el efecto se mantiene con envío automatizado ni qué restricciones o costos tiene el canal de WhatsApp para mensajes iniciados por una empresa (asunción sin evidencia).
- **Regulatorio (asunción sin evidencia, a verificar):** el tratamiento de datos personales de las clientas (teléfono, citas) puede tener obligaciones en Colombia. No se evaluó.

### 9. Lo que el PRD necesita resolver

1. **Anticipo y confirmación:** ¿competidores, complementos o una sola oferta? No existe un brazo combinado.
2. **Precio definitivo y estructura de cobro:** el monto de 89.000 pesos no es definitivo. ¿Qué hacer con S4 y S3? ¿La renovación del segundo mes se sostiene?
3. **Cadencia de mensajes:** ¿el recordatorio del día antes y el de 2 horas antes aportan por separado?
4. **Qué pasa con una cita cancelada con tiempo:** ¿hay algo que ofrecer a la dueña para llenar el hueco? Es una pregunta abierta, no una función aprobada.
5. **Qué información necesita ver la dueña** y cómo se entrega.
6. **Automatización:** ¿se mantiene el efecto cuando los mensajes ya no los envía una persona? (evaluación de ingeniería).
7. **Alcance del segmento:** ¿solo color, uñas y cejas y pestañas? ¿Se puede ampliar sin evidencia nueva? ¿Cómo se cuantifica el SAM?
8. **Regulatorio y canal:** datos personales y condiciones del canal de WhatsApp.

### Anexo: Elevator pitch (30 s) y roadmap de validación a 90 días

**Elevator pitch:** "Si tienes un salón donde nadie entra sin cita, cada clienta que no llega te deja un puesto vacío de 110.000 a 350.000 pesos. TurnoFácil les escribe a tus clientas por WhatsApp para que confirmen o cancelen, así dejas de perseguir confirmaciones a mano. En un piloto con 5 salones las citas fallidas bajaron un tercio y 3 de los 5 pagaron para seguir."

**Roadmap de validación (no de producto), en semanas contadas desde la decisión de perseverar:**

| Semanas | Qué se valida | Criterio que debe definirse antes de empezar |
|---|---|---|
| 1-2 | Cobro del segundo mes de los 3 salones que pagaron y seguimiento de S4 por comportamiento | Renuevan sin descuento: a definir con el fundador |
| 2-8 | Réplica con salones nuevos (no entrevistadas previas), mismo diseño por citas | Mismo umbral de 30%, con al menos 10 fallidas en el control |
| 4-10 | Brazo combinado Confirmación + Anticipo, para decidir si compiten o se complementan | A definir |
| 8-12 | Cierre con comparación de resultados y decisión para el PRD | — |

---

## B) REPORTE DE EVIDENCIA DE LA SOLUCIÓN

### 1. MVF testeado

Los 6 ejes en su versión final son los de la sección 5 del Documento A. Tal como se testeó, la persona fundadora enviaba los mensajes a mano y la dueña confirmaba solo en el brazo Control.

### 2. Alternativas consideradas y justificación

| Opción | Tipo | Qué habría validado | Qué no habría validado |
|---|---|---|---|
| A | Landing o Fake Door | Interés por clics. Umbral sugerido: ≥ 5% con ≥ 200 vistas únicas | Si reduce citas fallidas. El pago |
| B | Entrevistas de solución con mockup | Resonancia con un dolor del top-3. Umbral sugerido: ≥ 6 de 8 | Si reduce citas fallidas. El pago |
| **C** | **Concierge con tres brazos y cláusula de pago (elegida)** | Efecto sobre citas fallidas frente a lo que hacen hoy y frente al anticipo, y pago real | Escala y automatización. Muestra pequeña |

**Por qué se eligió C:** la persona fundadora quería un experimento capaz de demostrar que la confirmación no funciona, y comparado con lo que ya hacen las dueñas y con el anticipo. Solo C mide resultados y no interés. Tradeoff aceptado: más de 6 semanas, trabajo manual y una muestra de 5 salones.

### 3. Diseño del experimento ejecutado

- **Hipótesis falsable:** la confirmación por WhatsApp reduce al menos un 30% la tasa de solicitudes fallidas frente al control, y al menos 3 de 5 salones aceptan pagar para seguir. Si no, queda refutada.
- **Metodología:** 5 salones del segmento. 14 días de línea base sin brazos (días 1-14), luego 28 días de brazos (días 15-42) con asignación por solicitud en orden fijo Control → Confirmación → Anticipo. Cierre de la cláusula de pago en los días 43 a 49.
- **Brazos:** Control (lo que la dueña ya hacía), Confirmación (WhatsApp el día antes y 2 horas antes, sin la confirmación manual de la dueña), Anticipo (40.000 pesos al agendar, sin mensajes).
- **Medida:** solicitudes fallidas / solicitudes con cupo ofrecido, igual en los tres brazos. Cuenta como fallida: no llegó, llegó tarde (más de 15 minutos), canceló con menos de 4 horas de anticipación, o abandonó al conocer la condición de su brazo. Se excluyen las solicitudes sin cupo por agenda llena (3).
- **Criterio de éxito congelado:** R1 ≥ 30%, P ≥ 3 de 5, mínimo de 10 fallidas en el control. Fila de decisión 4: cambio a (b) si R1 < 30% y R2 ≥ 50%.
- **Canal y periodo:** reclutamiento entre las entrevistadas de la ronda 2; ejecución de 49 días en Medellín. Fecha de calendario no registrada.
- **Fuente del resultado:** la agenda de cada dueña.

### 4. Bitácora de ejecución

Datos crudos completos, solicitud por solicitud (IDs 1 a 243): [E:01M7RXWF70H4FDZ56B2RMEMYSF]. Aquí se resumen por unidad de prueba (salón y brazo), con fallidas / solicitudes.

| Salón | Perfil | Línea base | Control | Confirmación | Anticipo |
|---|---|---|---|---|---|
| S1 | Color, Laureles (R2-E1) | 2/16 | 1/11 | 2/11 | 3/11 |
| S2 | Uñas, El Poblado (R2-E3) | 3/18 | 2/11 | 1/11 | 1/11 |
| S3 | Color y alisados, La América (R2-E4) | 2/14 | 4/11 | 1/11 | 0/11 |
| S4 | Cejas y pestañas, Buenos Aires (R2-E6) | 4/16 | 2/11 | 2/11 | 1/11 |
| S5 | Color, El Poblado (R2-E7) | 6/14 | 3/10 | 2/10 | 0/10 |
| **Total** | | **17/78 (21,8%)** | **12/54 (22,2%)** | **8/54 (14,8%)** | **5/54 (9,3%)** |

**Tipo de falla por brazo:**

| Brazo | No llegó | Llegó tarde | Canceló sobre la hora | Abandonó por la condición | Total |
|---|---|---|---|---|---|
| Control | 5 | 3 | 4 | 0 | 12 |
| Confirmación | 3 | 3 | 2 | 0 | 8 |
| Anticipo | 1 | 0 | 2 | 2 | 5 |

**Cláusula de pago (89.000 pesos al mes, sin descuento, primer mes antes del día 49):**

| Salón | Qué dijo | Qué hizo |
|---|---|---|
| S1 | "Me ahorré la media hora de todas las noches." | Pagó (día 44) |
| S2 | "Con esto la recepcionista puede hacer otras cosas." | Pagó (día 45) |
| S3 | "Prefiero seguir con mi libreta, ya me acostumbré." | No pagó |
| S4 | "Sí, cuente conmigo, el lunes le transfiero." | No transfirió antes del día 49 |
| S5 | "Funcionó, las clientas contestan rápido." | Pagó (día 47) |

**Observaciones de campo:** la mayoría de las clientas respondió al mensaje del día anterior, varias con un emoji o "listo" (sin conteo). En S4 la dueña confirmó además a mano 2 citas del brazo Confirmación (IDs 179 y 182), ambas con resultado "Llegó". Dos clientas del brazo Anticipo no tenían cómo transferir y no reservaron (IDs 81 y 186). Las dueñas de S1 y S5 comentaron que la línea base les mostró "más fallas de las que creía".

### 5. Análisis vs. criterio de éxito

| Criterio | Umbral | Observado | Resultado |
|---|---|---|---|
| Fallidas en el Control | ≥ 10 | 12 | Cumple |
| R1 | ≥ 30% | 33,3% | Cumple por 3,3 puntos |
| P | ≥ 3 de 5 | 3 de 5 | Cumple en el límite |
| R2 (para el criterio de cambio) | ≥ 50% | 58,3% | Supera el umbral, pero no activa el cambio porque R1 ≥ 30% |

**Comportamiento y opinión se separan así:**
- **Comportamiento:** las solicitudes marcadas por la dueña en su agenda y los pagos hechos.
- **Opinión:** las frases de la tabla de pago y la mayoría de los comentarios de campo. S4 es el único caso donde la opinión favorable no se convirtió en pago.

**Pruebas de sensibilidad (no estaban en el diseño; se reportan para leer el margen):**

| Variante | Control | Confirmación | Reducción |
|---|---|---|---|
| Análisis pre-registrado | 12/54 | 8/54 | 33,3% |
| Sin las 2 citas con desvío de protocolo (S4) | 12/54 | 8/52 | 30,8% |
| Sin S3 | 8/43 | 7/43 | 12,5% |
| Sin S1 | 11/43 | 6/43 | 45,5% |

- **Control frente a línea base:** 22,2% frente a 21,8%. No hay deriva evidente entre las dos fases.
- **Por salón:** la Confirmación fue mejor en 3 salones (S2, S3, S5), igual en 1 (S4) y peor en 1 (S1, 2 frente a 1).
- **Concentración:** el efecto depende bastante de S3 (4 fallidas en el Control, 1 en Confirmación), que no pagó.

### 6. Citas y observaciones más reveladoras

| # | Fuente | Cita u observación | Señal |
|---|---|---|---|
| 1 | S1 (R2-E1), cierre | "Me ahorré la media hora de todas las noches." | A favor |
| 2 | S2 (R2-E3), cierre | "Con esto la recepcionista puede hacer otras cosas." | A favor |
| 3 | S5 (R2-E7), cierre | "Funcionó, las clientas contestan rápido." | A favor |
| 4 | S3 (R2-E4), cierre | "Prefiero seguir con mi libreta, ya me acostumbré." | En contra |
| 5 | S4 (R2-E6), cierre | "Sí, cuente conmigo, el lunes le transfiero." Sin transferencia antes del día 49 | Opinión sin pago |
| 6 | S1 y S5, campo | La línea base les mostró "más fallas de las que creía" | Revela el dolor 1, a favor |
| 7 | Brazo Anticipo, campo | Dos clientas no tenían cómo transferir y no reservaron | En contra del anticipo |
| 8 | Brazo Anticipo, datos | 5 fallidas frente a 8 en Confirmación y 12 en Control | En contra de la propuesta de confirmación |
| 9 | S4, campo | La dueña confirmó a mano 2 citas del brazo Confirmación | Desvío de protocolo |
| 10 | S1, datos | En S1 la Confirmación tuvo más fallidas que el Control (2 frente a 1) | En contra |

### 7. Sesgos y limitaciones

- **Muestra pequeña:** 5 salones y 54 solicitudes por brazo. La diferencia entre Control y Confirmación es de 4 casos. Puede ser azar.
- **Umbrales en el límite:** R1 y P cumplen por muy poco. Un salón que pagara distinto o 1 o 2 casos distintos cambiarían el veredicto.
- **Relación con la persona fundadora:** los 5 salones eran entrevistadas previas y ya habían declarado el dolor; el efecto de su interés o cortesía es posible.
- **Quien ejecuta es quien mide:** la persona fundadora envió los mensajes y quería que funcionara. Mitigado con la agenda de la dueña como fuente, pero no hubo ciego.
- **Asignación por orden fijo, no sorteo:** el personal podía saber qué brazo seguía y eso puede influir en a quién se le ofrece qué.
- **Confirmación manual:** el efecto de mensajes enviados por una persona puede no replicarse con envío automatizado.
- **Dos mensajes en paquete:** no se separó el efecto del recordatorio del día antes y el de 2 horas antes.
- **Anticipo de un solo monto (40.000 pesos):** no se sabe si otros montos cambian el resultado. Tampoco se probó si las dueñas lo adoptarían ni pagarían por una herramienta de anticipo.
- **Pago de un solo mes:** no hay evidencia de renovación.
- **Geografía:** solo Medellín, barrios acotados y 4 rubros.
- **Desvío de protocolo en S4:** 2 citas de Confirmación con confirmación manual adicional (ver pruebas de sensibilidad).
- **Ahorro de tiempo declarado, no medido.**

### 8. Decisión final

**Perseverar con la confirmación (a), con confianza baja.**

- **Razón anclada a los datos:** se cumplieron los tres criterios congelados: 12 fallidas en el Control (umbral 10), R1 de 33,3% (umbral 30%) y P de 3 de 5 (umbral 3). Por la fila 1 de la tabla de decisión corresponde perseverar.
- **Qué impide leerlo como confirmación sólida:** margen de 3,3 puntos en R1, P exactamente en el umbral, dependencia de S3 y muestra de 5 salones, todos entrevistadas previas.
- **Registrado por regla previa:** el anticipo redujo las fallas un 58,3%, más que la confirmación, y queda como riesgo de competencia para el PRD.
- **Siguiente paso:** replicar con salones nuevos y probar la renovación y el brazo combinado antes de comprometer construcción (ver el roadmap del Documento A).
