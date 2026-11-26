# Mapa de Asunciones — TurnoFácil

**Fecha:** 2026-11-18
**Etapa:** 1 — Espacio del Problema
**Idea inicial (palabras del fundador):** "Reservas de turnos por WhatsApp para peluquerías de barrio."

> ⚠️ **Estado de la evidencia:** el origen de la idea es **observación directa del fundador
> en su rol de cliente** (no entrevistas al segmento todavía). Esa observación es evidencia
> real pero de **una sola fuente y desde el lado equivocado del mostrador**: describe lo que
> el cliente ve, no lo que el peluquero mide. Ninguna asunción está validada con el segmento.
> El propósito del mapa es decidir **qué se testea primero**.

---

## 1. Qué dijo el fundador (insumo crudo)

Origen: el fundador es cliente habitual de peluquerías de barrio y describe lo que vivió
y observó en el local mientras lo atendían.

| # | Afirmación (observada por el fundador como cliente) | Estado |
|---|---|---|
| F1 | "Siempre me toca esperar a pesar de haber citado con anticipación" | Observado en primera persona — falta medir del lado del local |
| F2 | "Cuando me están motilando, el peluquero interrumpe constantemente para agendar citas" | Observado en primera persona — falta medir frecuencia real |
| F3 | "Le cancelan mucho, porque se les olvidó" | Reportado por el peluquero al fundador — falta cuantificar |
| F4 | "Si el agendamiento incluye recordatorio, se disminuirían mucho las cancelaciones" | ❌ **Hipótesis de solución** — fuera de alcance en esta etapa, se traslada a la sección 4 |

**Nota de disciplina de fase:** F4 propone un remedio (recordatorios) antes de haber medido
el problema. Se registra como creencia del fundador, no como asunción a validar aquí.

**Nota de disciplina de fase:** la idea nombra un canal (WhatsApp) y un producto (reservas).
Eso es *solución*. En esta etapa se deja de lado y se investiga únicamente el problema:
cómo gestiona hoy sus turnos una peluquería de barrio y qué le cuesta hacerlo así.

---

## 2. Asunciones desagregadas

Clasificadas en cinco familias. Cada una se escribe como afirmación falsable sobre
**comportamiento o dolor del cliente**, nunca sobre adopción de un producto.

### A. Asunciones de Persona (¿quién sufre?)

| ID | Asunción | Riesgo si es falsa |
|---|---|---|
| A1 | El que sufre el dolor es el dueño-peluquero que además atiende sillón (no un recepcionista dedicado) | Si hay recepción dedicada, el dolor lo absorbe un tercero y pierde intensidad |
| A2 | Es un local de 1 a 4 sillones, sin personal administrativo | Cambia por completo el segmento, el canal de contacto y el dolor |
| A3 | Ya gestiona turnos por mensajería de texto hoy (no solo walk-in ni libreta) | Si trabaja por orden de llegada, no hay agenda que coordinar y el problema no existe |
| A4 | El dueño es quien decide y paga las herramientas del local | Si decide otro (socio, contador, franquicia), el journey de decisión es otro |

### B. Asunciones de Problema / Dolor (¿duele de verdad?)

| ID | Asunción | Riesgo si es falsa |
|---|---|---|
| B1 | Coordinar turnos interrumpe el trabajo en el sillón varias veces por día | Si contesta cómodo entre cliente y cliente, el dolor es menor |
| B2 | Los no-shows y cancelaciones de último momento son frecuentes y generan pérdida de ingreso medible | Sin pérdida medible, no hay dolor con precio |
| B3 | Hay errores de agenda concretos (sobreturno, turno olvidado, cliente plantado) en los últimos 30 días | Si no hay episodios recientes, el dolor es anecdótico |
| B4 | El dolor tiene carga emocional (vergüenza frente al cliente, estrés al cerrar el día) y no solo financiera | Si es puramente operativo y liviano, la urgencia de resolverlo baja |

### C. Asunciones de Status Quo / Workarounds (¿qué hace hoy?)

| ID | Asunción | Riesgo si es falsa |
|---|---|---|
| C1 | El workaround actual es mensajería + libreta/papel o notas del celular | Si ya usa una app de agenda, el problema está parcialmente resuelto |
| C2 | Alguna vez probó una herramienta de agenda y la abandonó | Si nunca probó nada, no hay evidencia de intento de resolver |
| C3 | Ya gasta dinero o tiempo en paliar el problema (recordatorios manuales, seña, alguien que atiende el teléfono) | Sin gasto previo, el dolor no tiene precio demostrado en el mercado |
| C4 | La inacción es una alternativa viable: convive con el problema porque "así siempre fue" | Si convive sin costo, el dolor no es prioritario |

### D. Asunciones de Mercado / Dimensión (¿cuántos sufren?)

| ID | Asunción | Riesgo si es falsa |
|---|---|---|
| D1 | Hay un volumen relevante de peluquerías independientes de barrio en el mercado objetivo | Sin volumen, el nicho no sostiene un negocio |
| D2 | Existe un sub-segmento más desesperado: el que ya intentó resolverlo y falló | Sin ese núcleo, no hay early adopter identificable |
| D3 | El segmento es alcanzable para investigar (se puede entrar al local y conversar) | Si no es accesible, no hay investigación primaria posible |

### E. Asunciones de Gatillo / "Por qué ahora"

| ID | Asunción | Riesgo si es falsa |
|---|---|---|
| E1 | El cliente final hoy espera coordinar por mensaje y ya no llama por teléfono | Si el canal no cambió, no hay gatillo temporal |
| E2 | Hubo un cambio reciente de comportamiento que agravó el problema (más mensajes, más cancelaciones) | Sin cambio, el problema es crónico y tolerado, no urgente |

---

## 3. Priorización: riesgo × incertidumbre

Eje X = qué tan incierta está la asunción hoy. Eje Y = cuánto se cae el proyecto si es falsa.

| Zona | Asunciones | Qué hacer |
|---|---|---|
| 🔴 **Testear primero** (alto riesgo + alta incertidumbre) | **B2**, **B3**, **C3**, **A3** | Experimento de campo inmediato (ver `diseno-experimento.md`) |
| 🟠 Testear en la misma ronda (barato de preguntar) | A1, A2, B1, C1, C2 | Se cubren con el mismo guion de entrevista |
| 🟡 Diferir a investigación secundaria | D1, D2, E1, E2 | Dimensionamiento y tendencias, con búsqueda web previa autorización |
| 🟢 Bajo riesgo por ahora | A4, C4, D3 | Se observan durante el trabajo de campo, sin experimento dedicado |

### Las 4 asunciones críticas (las que matan el proyecto si son falsas)

1. **B2 — Los no-shows y cancelaciones generan pérdida de ingreso medible.**
   Si los huecos se llenan solos con clientes de paso, no hay dolor económico.
2. **B3 — Hubo episodios concretos del problema en los últimos 30 días.**
   Sin episodios recientes, el dolor es recordado, no vivido.
3. **C3 — Ya gasta tiempo o dinero paliando el problema.**
   Es la prueba de que el dolor tiene precio en el mercado, sin preguntar por ninguna solución futura.
4. **A3 — Gestiona turnos agendados, no solo por orden de llegada.**
   Es el filtro de existencia del segmento: si no hay agenda, no hay problema de agenda.

---

## 4. Asunciones explícitamente fuera de alcance en esta etapa

Se registran para no perderlas, pero **no se testean aquí** (pertenecen a la etapa de solución):

- Si una peluquería pagaría una suscripción mensual, y cuánto.
- Si WhatsApp es el canal correcto para resolverlo.
- Qué funcionalidad sería la primera en construirse.
- Cómo se monetizaría.

---

## 5. Huecos de información que quedan abiertos

| Hueco | Cómo se cierra |
|---|---|
| Ningún dato de mercado citado todavía (D1, D2) | Búsqueda web de dimensionamiento del sector, previa autorización del fundador |
| Cero entrevistas realizadas | Experimento 1 del diseño adjunto |
| No hay evidencia de abandono de herramientas (C2) | Review mining sobre apps de agenda para peluquerías, previa autorización |
| Mercado/país objetivo no definido por el fundador | Pregunta directa al fundador antes de salir a campo |

---

📊 Progreso: Etapa 1 — Mapa de asunciones completo | Siguiente hito: ejecutar el experimento de campo
