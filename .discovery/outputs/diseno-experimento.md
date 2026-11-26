# Diseño de Experimento — TurnoFácil

**Fecha:** 2026-11-18
**Etapa:** 1 — Espacio del Problema
**Experimento del catálogo:** Entrevistas de Problema (Mom Test)
**Documento base:** `mapa-asunciones.md` (asunciones críticas A3, B2, B3, C3)

---

## 1. Hipótesis falsables

Todas las hipótesis son sobre **comportamiento y dolor del peluquero**, no sobre adopción
de ninguna solución. La creencia del fundador de que "los recordatorios bajarían las
cancelaciones" **no se testea aquí**: proponer el remedio antes de medir el problema es
lo que este experimento busca evitar.

| ID | Hipótesis | Asunción que cubre |
|---|---|---|
| **H1** | El peluquero de barrio gestiona una agenda de citas pactadas de antemano, no solo atención por orden de llegada. | A3 |
| **H2** | Tuvo al menos un episodio concreto de cita fallida (cliente que no llegó, llegó tarde o canceló sobre la hora) en los últimos 30 días. | B3 |
| **H3** | Ese hueco **no** se llena solo con clientes de paso: implica tiempo muerto pagado con ingreso perdido. | B2 |
| **H4** | Ya invierte tiempo o dinero en paliar el problema (confirmar a mano, pedir seña, re-agendar, alguien que atiende el teléfono). | C3 |

**Hipótesis nula a aceptar si falla:** la cita fallida es un costo tolerado y absorbido por
el flujo de clientes de paso; el problema existe pero no tiene precio para el peluquero.

---

## 2. Objetivo de aprendizaje

Pasar de la observación del fundador **como cliente** (espera pese a tener cita,
interrupciones en pleno corte, cancelaciones por olvido) a evidencia medida **del lado del
local**: saber si esas tres cosas le cuestan algo cuantificable al peluquero, y cuál de las
tres le duele más cuando las nombra él, sin que nadie se las sugiera.

---

## 3. Metodología

- **Técnica:** entrevista de problema (Mom Test estricto), presencial en el local.
- **Muestra:** 7 peluquerías de barrio independientes (mínimo del catálogo: 5).
- **Perfil:** local de 1 a 4 sillones, sin personal administrativo dedicado; entrevistado =
  dueño que además atiende sillón.
- **Duración:** 15 a 20 minutos por entrevista.
- **Canal:** presencial, en horario valle (p. ej. media mañana entre semana).
- **Ciudad:** Medellín, Colombia.
- **Reclutamiento (ruta en dos tramos, acordada con el fundador):** el fundador tiene varios
  conocidos peluqueros en su propio barrio. Se aprovechan, pero **no se concluye con ellos**:
  - **Entrevistas 1-3 — barrio propio, con conocidos.** Función: calibrar el guion y detectar
    preguntas que no funcionan. Se cuentan como ronda de ensayo.
  - **Entrevistas 4-7 — mínimo 2 comunas distintas donde no lo conozcan.** Función: generar
    el dato que cuenta contra los umbrales de la sección 4.
  - **Referidos:** usar P11 con los conocidos para que presenten peluqueros de otros barrios.
    Un referido de otro barrio cuenta como entrevista del segundo tramo.
- **Regla de validez:** si al cerrar las 7 hay menos de 4 entrevistas fuera del círculo
  cercano, el criterio de éxito **no se puede declarar cumplido** y hay que completar la muestra.
- **Incentivo:** pagar un corte, o café. Nada que condicione la respuesta.
- **Registro:** notas en el momento + volcado completo dentro de las 2 horas.
- **Regla de oro:** no se menciona la idea, ni WhatsApp, ni recordatorios, ni ninguna app.
  Si el entrevistado pregunta "¿y vos qué vendés?", la respuesta es: *"Nada todavía, estoy
  entendiendo cómo trabajan."*

### 3.1 Screener (antes de invertir los 20 minutos)

| # | Pregunta | Califica si… |
|---|---|---|
| S1 | ¿Cuántas personas atienden sillón acá? | Entre 1 y 4 |
| S2 | ¿Quién maneja la agenda del día a día? | El propio entrevistado |
| S3 | ¿Cómo sabe un cliente a qué hora venir? | Describe citas pactadas, no solo orden de llegada |
| S4 | ¿Cuándo fue la última vez que organizó el día de mañana? | Lo hizo esta semana |

### 3.2 Guion

**Frame (sin mencionar la idea):** *"Estoy entendiendo cómo trabajan las peluquerías del
barrio. No vendo nada. ¿Me regala 15 minutos?"*

| # | Pregunta |
|---|---|
| P1 | Lléveme por el día de ayer, desde que abrió hasta que cerró. ¿Qué pasó? |
| P2 | ¿Cuáles fueron las 3 cosas que más le complicaron el día ayer, en orden? |
| P3 | ¿Cómo decide a quién atiende a qué hora? Muéstreme dónde lo anota. |
| P4 | Cuénteme qué pasó la última vez que el día no salió como lo había organizado. |
| P5 | ¿Qué hizo usted cuando pasó eso? |
| P6 | ¿Qué pasó con ese rato? ¿Qué estuvo haciendo? |
| P7 | ¿Cuántas veces le pasó algo así en el último mes? |
| P8 | ¿Ha intentado hacer algo para que no vuelva a pasar? ¿Qué probó? |
| P9 | ¿Qué pasó con eso que probó? ¿Lo sigue haciendo? |
| P10 | De todo lo que me contó, ¿qué es lo que más lo descompone? |
| P11 | ¿Conoce otro peluquero del barrio con quien pueda hablar? |

**Follow-ups condicionales** (solo si el entrevistado abrió el tema por su cuenta):
- Si menciona tiempo muerto → *"¿Cuánto rato fue? ¿Cuántos cortes caben ahí?"*
- Si menciona que gasta en algo → *"¿Cuánto le representa eso al mes?"*
- Si menciona interrupciones → *"¿Cuántas veces pasó ayer?"*

### 3.3 Self-Check Mom Test del guion

| # | ¿Nombra el dolor? | ¿Asume que existe? | ¿Pide cuantificar algo no mencionado? | ¿Sugiere la respuesta? | ¿Intención futura? | Veredicto |
|---|---|---|---|---|---|---|
| P1 | No | No | No | No | No | ✅ |
| P2 | No | No | No | No | No | ✅ |
| P3 | No | No | No | No | No | ✅ |
| P4 | No | No | No | No | No | ✅ |
| P5 | No | No | No | No | No | ✅ |
| P6 | No | No | No | No | No | ✅ |
| P7 | No | No ("algo así" = lo que él narró en P4) | No | No | No | ✅ |
| P8 | No | No | No | No | No | ✅ |
| P9 | No | No | No | No | No | ✅ |
| P10 | No | No | No | No | No | ✅ |
| P11 | No | No | No | No | No | ✅ |

**Preguntas rechazadas y reescritas** (quedan documentadas para que no vuelvan a colarse):

| Versión rechazada | Por qué falla | Versión aprobada |
|---|---|---|
| "¿Cuánto le cuesta al mes que le cancelen las citas?" | Nombra el dolor y asume que existe | P4 + P7 (que el episodio surja solo) |
| "¿Le molesta que lo interrumpan mientras corta?" | Sugiere la respuesta deseada | P2 (frustraciones espontáneas sin anclar) |
| "¿Usaría recordatorios automáticos para sus clientes?" | Intención futura sobre una solución | P8 (qué ya probó en el pasado) |
| "¿Estaría dispuesto a pagar por una agenda?" | Fuera de fase + intención futura | Eliminada |

---

## 4. Criterios de éxito (umbrales numéricos)

Sobre **7 entrevistas**:

| Hipótesis | Criterio de validación | Se considera invalidada si |
|---|---|---|
| **H1** | ≥ 6 de 7 pasan el screener S3 (agenda con citas pactadas) | ≤ 4 de 7 |
| **H2** | ≥ 5 de 7 relatan **espontáneamente** un episodio de cita fallida en los últimos 30 días, sin que el entrevistador nombre el tema | ≤ 3 de 7 |
| **H3** | ≥ 4 de 7 describen que el hueco quedó vacío (≥ 1 corte perdido) y no se llenó con cliente de paso | ≤ 2 de 7 |
| **H4** | ≥ 4 de 7 describen un workaround activo que ya les cuesta tiempo o dinero (≥ 2 h/mes o ≥ gasto mensual declarado) | ≤ 2 de 7 |

**Resultado global:**
- **Perseverar** → H2 y H3 validadas (el dolor existe, es reciente y tiene costo medible).
- **Perseverar con ajuste de hipótesis** → H2 validada pero H3 no (molesta, pero el hueco
  se llena: el dolor es de carga mental y no de ingreso; hay que re-caracterizarlo).
- **Pivotar** → H2 invalidada (sin episodios recientes espontáneos no hay problema que resolver).

**Dato adicional a capturar aunque no sea criterio:** cuántos de los 7 nombran
espontáneamente la **interrupción durante el corte** (F2) y cuántos nombran la
**espera del cliente con cita** (F1). Sirve para rankear los tres dolores observados
por el fundador según lo que el peluquero prioriza por su cuenta.

---

## 5. Plantilla de notas (una por entrevista)

```
Entrevista #__ | Fecha __/__ | Barrio ____ | Sillones __ | Duración __ min
Perfil: dueño que atiende sillón  Sí / No

Job (qué estaba haciendo cuando aparece el problema):
Obstáculo (qué le impide resolverlo hoy):
Solución actual / workaround:
Episodio concreto narrado (fecha aprox., qué pasó):
¿El hueco se llenó?  Sí / No   → cortes perdidos: __
Costo declarado (tiempo / dinero / otro):
Emoción observada (literal, no interpretada):
Orden de los 3 dolores que él mismo nombró en P2: 1.__ 2.__ 3.__
Citas textuales:
  "..."
  "..."
Mencionó espontáneamente: no-show ☐ | interrupciones ☐ | espera del cliente ☐
```

---

## 6. Timeline

| Día | Actividad |
|---|---|
| 1 | Imprimir screener y guion. Definir los 2-3 barrios. |
| 2-3 | Entrevistas 1 a 3. Volcado de notas el mismo día. |
| 4 | Revisión intermedia: ¿el guion está funcionando? ¿aparecen episodios espontáneos? |
| 5-6 | Entrevistas 4 a 7, en un barrio distinto al de las primeras. |
| 7 | Codificación cruzada (patrones × entrevistas) y veredicto contra los umbrales. |

**Esfuerzo estimado:** ~6 horas totales. **Costo:** el de los cortes/cafés.

---

## 7. Sesgos a vigilar durante la ejecución

- **Sesgo de confort (el riesgo principal de este experimento):** el fundador arranca con
  conocidos de su barrio. Un conocido tiende a darle la razón, lo que produce falsos
  positivos. Mitigación: las 3 primeras son ronda de ensayo y **al menos 4 de las 7 deben
  venir de comunas donde no lo conozcan**; si no, el criterio no se declara cumplido.
- **Fuga de la idea:** con conocidos la tentación de contar el proyecto es máxima. Si en una
  entrevista se menciona la idea, una app o los recordatorios, **esa entrevista se descarta**
  y no cuenta para los umbrales.
- **Confirmation bias:** el fundador ya tiene una creencia formada (recordatorios). El
  riesgo de empujar al entrevistado hacia ella es alto. Mitigación: no pronunciar nunca las
  palabras "recordatorio", "app", "WhatsApp" ni "cancelación" antes que el entrevistado.
- **Sesgo de rol:** el fundador es cliente de estos locales. Existe el riesgo de que el
  peluquero responda para quedar bien con su cliente. Mitigación: la peluquería propia
  cuenta como máximo 1 de las 7.
- **Order bias:** alternar el orden de P4 y P8 entre entrevistas.

---

## 8. Qué queda pendiente de confirmar con el fundador

- Ciudad / país donde se ejecuta el trabajo de campo (necesario para dimensionar el
  segmento y elegir los barrios).
- Si 7 entrevistas en 7 días es factible con su disponibilidad real.

---

📊 Progreso: Etapa 1 — Diseño de experimento completo con Self-Check Mom Test aprobado | Siguiente hito: ejecutar las 7 entrevistas y codificar resultados
