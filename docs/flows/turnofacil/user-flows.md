# User Flows — TurnoFácil

> Generado por tech-emergentes-flow-mapper · Fuente: PRD `docs/PRD.md` (aprobado, sin repositorio) · 19/11/2026
> Diagramas: ver `INDEX.md`

**Marcas usadas en este documento**
- **[PENDIENTE]**: el PRD lo deja abierto. No se dibuja como algo decidido.
- **[ASUNCIÓN]**: el PRD lo define, pero no se validó en el piloto (en el PRD: [ASUNCIÓN SIN VALIDAR]).
- **[DECISIÓN DEL DIAGRAMA]**: el PRD no lo define; lo decidió el usuario en esta etapa al revisar los diagramas. Debe llevarse al PRD (ver la sección "Propuesta de actualización del PRD").

El producto no tiene pantallas: todo ocurre en un chat de WhatsApp. En lugar de "pantallas" se listan los **puntos de contacto**, es decir, los mensajes que envía o recibe cada actor.

## Actores

| Actor | Descripción | Evidencia |
|-------|-------------|-----------|
| Dueña del salón | Usuaria principal. Tiene un salón de 1 a 4 puestos en Medellín que trabaja solo con citas. Registra, cancela y pide la vista desde el número registrado del salón (un solo número por salón). | PRD §2, §6; [E:01M7RSBPYMAF3FDSW0CDTKB82M] |
| Clienta final | No es usuaria definida. Recibe los recordatorios y responde por WhatsApp. | PRD §2 |
| Número no registrado | Cualquier número distinto del registrado de la dueña. TurnoFácil no le responde. | PRD US-01 (regla de número no registrado) |

## Puntos de contacto (en lugar de pantallas)

| ID | Punto de contacto | Quién lo ve | Evidencia |
|----|-------------------|-------------|-----------|
| C1 | Chat de la dueña con TurnoFácil (registrar, cancelar, pedir la vista) | Dueña | PRD US-01, US-03 |
| C2 | Confirmación de guardado (puede incluir el aviso de que la clienta se dio de baja) | Dueña | PRD US-01, US-02 (regla de cita nueva para una clienta dada de baja) |
| C3 | Mensajes de rechazo: pide repetir · la cita ya existe · no se encontró · día no entendido · no hay citas | Dueña | PRD US-01, US-03; "no se encontró" = [DECISIÓN DEL DIAGRAMA] |
| C4 | Vista: dos listas, confirmadas y sin confirmar | Dueña | PRD US-03 · [ASUNCIÓN] |
| C5 | Aviso de cancelación | Dueña | PRD US-04 · [ASUNCIÓN] · contenido [PENDIENTE] |
| C6 | Recordatorio 1 (el día antes) y recordatorio 2 (2 horas antes) | Clienta | PRD US-02 · hora del recordatorio 1 [PENDIENTE] |
| C7 | Mensaje corto que confirma la baja | Clienta | PRD US-02 (regla de baja) |

## Flujo F1 — La dueña registra una cita

- **Actor:** Dueña
- **Trigger:** la dueña escribe al chat los datos de una cita.
- **Precondiciones:** escribe desde el número registrado del salón.
- **Diagrama:** `workflow-duena-chat/flujo-duena-chat.html`

| # | Punto de contacto | Acción | Resultado | Evidencia |
|---|-------------------|--------|-----------|-----------|
| 1 | C1 | Envía clienta, teléfono, servicio, día y hora | TurnoFácil revisa el registro | PRD US-01 (registro) |
| 2 | — | El registro está completo y es válido | La cita queda guardada | PRD US-01 (registro) |
| 3 | C2 | — | Recibe la confirmación de guardado en menos de 10 s [ASUNCIÓN] | PRD US-01 (tiempo de confirmación), §6 |

- **Resultado esperado:** la cita queda guardada y lista para los recordatorios (F4).
- **Alternativos / errores** (se revisan **sin orden fijo**, [DECISIÓN DEL DIAGRAMA]; en todos los casos la cita no se guarda):
  - A1 Falta alguno de los cinco datos → pide repetir el mensaje (C3). Regla de dato faltante.
  - A2 El teléfono no tiene 10 dígitos que empiecen por 3 (con o sin +57) → pide repetir (C3). Regla de teléfono válido.
  - A3 El día y la hora ya pasaron → pide repetir (C3). Regla de fecha pasada.
  - A4 Ya hay una cita con el mismo teléfono, día y hora → avisa que ya existe (C3). Regla de cita duplicada.
  - A5 La clienta está dada de baja → **sí se guarda**, pero no se envían recordatorios y la confirmación incluye el aviso de baja (C2). Regla de cita nueva para una clienta dada de baja.
  - A6 El mensaje llega de un número no registrado → no se ejecuta nada y no se responde. Regla de número no registrado.
- **[PENDIENTE]:**
  - Qué pasa si la dueña cambia de número (PRD §6).

## Flujo F2 — La dueña cancela una cita

- **Actor:** Dueña
- **Trigger:** la dueña escribe al chat que cancela una cita.
- **Precondiciones:** escribe desde el número registrado y la cita está activa.
- **Diagrama:** `workflow-duena-chat/flujo-duena-chat.html`

| # | Punto de contacto | Acción | Resultado | Evidencia |
|---|-------------------|--------|-----------|-----------|
| 1 | C1 | Indica el nombre de la clienta y el día y la hora | TurnoFácil busca la cita | [DECISIÓN DEL DIAGRAMA] |
| 2 | — | TurnoFácil encuentra la cita | La cita queda cancelada por la dueña, aunque ya estuviera confirmada | PRD US-01 (cancelación por la dueña) + [DECISIÓN DEL DIAGRAMA] para las confirmadas |
| 3 | — | — | No salen los recordatorios que faltaban y no se avisa a la clienta | PRD US-01 (cancelación por la dueña) |

- **Resultado esperado:** la cita deja de estar en las dos listas de la vista. Queda fuera del cálculo del 70%.
- **Alternativos / errores:**
  - A1 No existe esa cita → se le avisa que no se encontró (C3). [DECISIÓN DEL DIAGRAMA]
  - A2 La cita ya estaba cancelada por la clienta → la dueña igual puede cancelarla y pasa a cancelada por la dueña (sale de la vista). [DECISIÓN DEL DIAGRAMA]
- **[PENDIENTE]:**
  - Si la dueña recibe un mensaje que confirma la cancelación (el PRD no lo define; no se dibuja).

## Flujo F3 — La dueña pide la vista

- **Actor:** Dueña
- **Trigger:** la dueña escribe al chat que quiere ver las citas, con o sin un día.
- **Precondiciones:** escribe desde el número registrado.
- **Diagrama:** `workflow-duena-chat/flujo-duena-chat.html`

| # | Punto de contacto | Acción | Resultado | Evidencia |
|---|-------------------|--------|-----------|-----------|
| 1 | C1 | Pide la vista sin indicar día, o indicando uno | TurnoFácil toma mañana o el día indicado | PRD US-03 (vista por día) |
| 2 | C4 | — | Recibe dos listas, confirmadas y sin confirmar, en menos de 10 s [ASUNCIÓN] | PRD US-03 |

- **Resultado esperado:** la dueña sabe a quién no tiene que escribirle.
- **Reglas de la vista:** una cita cancelada por la clienta aparece en "sin confirmar". Una cita con respuesta no entendida y sin una respuesta válida anterior también aparece en "sin confirmar". Una cita cancelada por la dueña no aparece en ninguna lista. TurnoFácil nunca envía la vista si la dueña no la pide.
- **Alternativos / errores:**
  - A1 El día no se entiende → pide repetirlo y no envía ninguna lista (C3).
  - A2 No hay citas ese día → recibe un mensaje que dice que no hay citas (C3).
- **[ASUNCIÓN]:** la vista no se probó en el piloto [E:01M7RXWF70H4FDZ56B2RMEMYSF].

## Flujo F4 — La clienta recibe recordatorios y responde

- **Actor:** Clienta
- **Trigger:** hay una cita guardada.
- **Precondiciones:** la clienta está activa (no se dio de baja) y su número tiene WhatsApp.
- **Diagrama:** `workflow-clienta-recordatorios/flujo-clienta-recordatorios.html` · secuencia A

| # | Punto de contacto | Acción | Resultado | Evidencia |
|---|-------------------|--------|-----------|-----------|
| 1 | C6 | Recibe el recordatorio 1 el día antes, con la fecha y la hora de su cita | — | PRD US-02 · hora [PENDIENTE] |
| 2 | C6 | Recibe el recordatorio 2, dos horas antes | — | PRD US-02 · [PENDIENTE] si sale después de que respondió |
| 3 | — | Responde "sí", "confirmo", "listo", "ok" o 👍 | La cita queda confirmada | PRD US-02 · palabras provisionales [ASUNCIÓN] |

- **Resultado esperado:** la cita queda confirmada sin que la dueña escriba. Los dos recordatorios juntos, enviados por una persona, son lo único probado en el piloto [E:01M7RXWF70H4FDZ56B2RMEMYSF]. El envío automático no se probó.
- **Alternativos / errores:**
  - A1 Responde "cancelo", "cancelar" o "no puedo" → la cita queda cancelada por la clienta y se avisa a la dueña (C5).
  - A2 Cambia su respuesta (de confirmar a cancelar o al revés) → vale la última respuesta válida. [DECISIÓN DEL DIAGRAMA]
  - A2b Si una cita cancelada vuelve a confirmarse, se avisa a la dueña como parte del aviso de cancelación; si se corta el aviso de cancelación, se corta también este. [DECISIÓN DEL DIAGRAMA]
  - A2c Al llegar la hora de la cita, la última respuesta válida queda fija: una respuesta posterior no cambia el estado. [DECISIÓN DEL DIAGRAMA]
  - A3 Responde algo que no se entiende (incluye "baja" y "para") → si todavía no había una respuesta válida, la cita queda "sin confirmar", sin reenvío ni aviso a la dueña. Si ya había una, esa se mantiene. [DECISIÓN DEL DIAGRAMA]
  - A4 No responde y pasa la hora de la cita → "sin confirmar".
  - A5 El recordatorio 1 ya pasó cuando se registró la cita → solo se envía el que falta.
  - A6 Su número no tiene WhatsApp → el recordatorio no llega y la cita queda "sin confirmar" (limitación conocida, PRD §7).
  - A7 La clienta está dada de baja → no recibe ningún recordatorio y la cita queda "sin confirmar".
- **[PENDIENTE]:**
  - Hora del recordatorio 1.
  - Si el recordatorio 2 sale cuando ya confirmó o canceló.
  - Contenido y anticipación mínima del aviso de cancelación.

## Flujo F5 — La clienta se da de baja

- **Actor:** Clienta
- **Trigger:** la clienta responde "no más" o "stop" a un recordatorio.
- **Precondiciones:** la clienta está activa.
- **Diagrama:** `lifecycle-condicion-clienta/condicion-clienta.html` · secuencia B

| # | Punto de contacto | Acción | Resultado | Evidencia |
|---|-------------------|--------|-----------|-----------|
| 1 | C6 | Escribe "no más" o "stop", con cualquier mayúscula, tilde o puntuación | Queda dada de baja por teléfono, en todos los salones | PRD US-02 (regla de baja y de variantes de escritura) |
| 2 | C7 | — | Recibe un mensaje corto que confirma la baja | PRD US-02 (regla de baja) |
| 3 | — | — | Sus citas, ya registradas o nuevas, no reciben recordatorios y quedan "sin confirmar" | PRD US-02 (reglas de citas de una clienta dada de baja) |
| 4 | — | — | Una cita que ya estaba confirmada sigue confirmada | [DECISIÓN DEL DIAGRAMA] |

- **Resultado esperado:** la clienta deja de recibir mensajes de TurnoFácil.
- **Alternativos / errores:**
  - A1 Escribe "baja" o "para" → no se reconoce como baja y sigue recibiendo mensajes (riesgo conocido, PRD §6).
- **[PENDIENTE]:**
  - Cómo vuelve la clienta a estar activa.
  - Lista final de palabras de baja, sujeta a la validación legal.

## Estados

**Cita** (`lifecycle-cita/ciclo-de-vida-cita.html`):
- **Guardada** es el estado inicial (sin respuesta válida todavía). Desde ahí pasa a **Confirmada**, **Cancelada por la clienta**, **Cancelada por la dueña** o **Sin confirmar** (cuando llega la hora sin una respuesta válida).
- Confirmada ↔ Cancelada por la clienta: vale la última respuesta válida. [DECISIÓN DEL DIAGRAMA]
- Al llegar la hora: Confirmada → **Confirmada · cerrada** y Cancelada por la clienta → **Cancelada por la clienta · cerrada**. Ambos son finales; una respuesta posterior no cambia el estado. [DECISIÓN DEL DIAGRAMA]
- La dueña puede cancelar desde Guardada, Confirmada o Cancelada por la clienta → **Cancelada por la dueña**. [DECISIÓN DEL DIAGRAMA]
- Estados finales: Confirmada · cerrada, Cancelada por la clienta · cerrada, Cancelada por la dueña y Sin confirmar.
- No incluye estados de resultado ("llegó", "no llegó", etc.). Esos se miden en el piloto, no en el producto (PRD §6).

**Condición de la clienta** (`lifecycle-condicion-clienta/condicion-clienta.html`): **Activa** → **Dada de baja**. Vale por teléfono y bloquea sus recordatorios. Volver a activa: [PENDIENTE].

## Propuesta de actualización del PRD

El PRD está aprobado y no se modifica en esta etapa. Estas decisiones salen de los diagramas y se proponen para la próxima versión del PRD:

| Decisión | Historia afectada |
|----------|-------------------|
| Para cancelar, la dueña indica el nombre de la clienta y el día y la hora | US-01, cancelación por la dueña |
| Si la cita a cancelar no existe, se le avisa a la dueña que no se encontró | US-01, nuevo caso extremo |
| La dueña puede cancelar cualquier cita activa, también una ya confirmada o ya cancelada por la clienta (pasa a cancelada por la dueña) | US-01, cancelación por la dueña |
| La clienta puede cambiar su respuesta y vale la última respuesta válida | US-02, respuestas de la clienta |
| Un mensaje no entendido no cambia la última respuesta válida; "sin confirmar" aplica solo mientras no haya ninguna respuesta válida | US-02, regla de respuesta no entendida; US-03, vista |
| Los rechazos del registro no tienen un orden definido | US-01, casos extremos |
| Al llegar la hora, Confirmada y Cancelada por la clienta quedan finales; una respuesta posterior no cambia el estado | US-02, respuestas de la clienta |
| El aviso cuando una cita cancelada vuelve a confirmarse es parte del aviso de cancelación y se corta con él | US-04, aviso de cancelación |
| Una cita confirmada sigue confirmada si la clienta se da de baja después | US-02, regla de baja |

## Hallazgos

| Tipo | Detalle | Evidencia |
|------|---------|-----------|
| Ambigüedad en la vista | Una cita cancelada por la clienta aparece como "sin confirmar", igual que una sin respuesta. Esto puede llevar a la dueña a escribirle y bajar el 70%. | PRD §7, riesgo de cruce con la métrica principal |
| Mensaje sin definir | El PRD no define si la dueña recibe confirmación cuando cancela una cita | PRD US-01 |
| Aviso de baja | El PRD no avisa a la dueña cuando una clienta se da de baja; solo se entera al registrarle una cita nueva | PRD US-02 |
