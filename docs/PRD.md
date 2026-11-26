# 📄 Product Requirements Document (PRD)
**Nombre del Producto / Módulo:** TurnoFácil — confirmación de citas por WhatsApp
**Fecha:** 19/11/2026
**Autor (Producto):** Fundador de TurnoFácil (nombre no indicado)
**Estado:** Borrador

---

## 1. Visión General y Propósito (El "Por Qué")

**Qué es.** TurnoFácil le escribe por WhatsApp a las clientas de un salón para que confirmen o cancelen su cita, de modo que la dueña deje de perseguir confirmaciones a mano.

**Cambio frente a la idea original.** La idea inicial era "reservas de turnos por WhatsApp para peluquerías de barrio". La evidencia la acotó:
- Las peluquerías de barrio que atienden por orden de llegada quedaron **descartadas** en la ronda 1 (n = 7): el hueco se llena con clientes de paso [E:01M7QSXY072979062E1E92PZQ6].
- Este PRD cubre solo **salones que trabajan solo con citas**, validados en la ronda 2 (n = 7, Medellín) [E:01M7RSBPYMAF3FDSW0CDTKB82M]. Los conteos de las dos rondas no se suman.
- No se construye un sistema de reservas: se confirman citas que la dueña ya agendó.

**Problema.** Cuando una clienta falla en un servicio largo, el puesto queda vacío y se pierde el ingreso: "Un corte se reemplaza; tres horas de color, no." (R2-E1).
- 6 de 7 salones tuvieron una cita fallida en los últimos 30 días, con un servicio perdido por episodio entre 110.000 y 350.000 pesos [E:01M7RSBPYMAF3FDSW0CDTKB82M].
- **Frecuencia medida:** en la línea base del piloto hubo 17 citas fallidas en 78 citas, en 5 salones y 14 días, es decir, unas 7 por salón al mes [E:01M7RXWF70H4FDZ56B2RMEMYSF]. Es mayor que las 2 a 4 que recordaban en las entrevistas porque el piloto cuenta como fallida también a la clienta que llega más de 15 minutos tarde o cancela con menos de 4 horas de anticipación.
- Confirmar a mano le cuesta a la dueña de 20 a 40 minutos diarios o 1.200.000 pesos al mes (recepcionista), y aun así no asegura la cita: "dicen que sí y no vienen" (R2-E1). Son valores declarados, no medidos.

**Resultado del experimento de solución** (Concierge con tres brazos, 5 salones, mensajes enviados a mano por una persona) [E:01M7RXWF70H4FDZ56B2RMEMYSF]:
- Citas fallidas: 22,2% sin intervención (12/54) frente a 14,8% con confirmación (8/54), una reducción de 33,3%. Cumple el umbral de 30% por 3,3 puntos.
- 3 de 5 salones pagaron el primer mes a 89.000 pesos (S1, S2, S5). S3 y S4 no.
- El veredicto de la etapa 3 fue **perseverar con la confirmación, con confianza baja**. El margen es estrecho: sin S3 la reducción cae a 12,5%.

**Motivo de pago.** S1 y S2 citaron ahorro de tiempo y de personal ("Me ahorré la media hora de todas las noches."; "Con esto la recepcionista puede hacer otras cosas."). S5 dijo "Funcionó, las clientas contestan rápido.", que habla de eficacia. Ninguna citó menos citas fallidas. Por eso el foco del producto es que la dueña deje de perseguir confirmaciones, con las citas fallidas como límite que no puede empeorar.

**Lo que este producto no resuelve:** el puesto vacío cuando una cita igual falla (la lista de espera solo recuperó 1 de 3 citas, R2-E6), y las interrupciones por mensajes mientras la dueña atiende.

**Competencia.** El anticipo redujo las citas fallidas un 58,3%, más que la confirmación. Queda fuera de esta versión, pero es el competidor principal y **no se probó un brazo combinado** de confirmación y anticipo. Además, el reporte de la etapa 2 registra que existen agendas con recordatorios en Colombia (Aura, Gestabiz, AgendApp). La fuente son páginas de los propios proveedores, no verificadas en este PRD: no consta que envíen por WhatsApp ni que apunten a este segmento. R2-E4 abandonó una app de agenda (no nombrada) porque "las clientas viven en el chat".

**Por qué ahora.** Señal de campo: "hoy nadie contesta una llamada" (R2-E6). No hay evidencia independiente de un cambio reciente que agrave el problema.

**Nota de evidencia:** `diseno-experimento-v2.md` **no pasó por un gate de aprobación** (no figura entre los archivos aprobados). La evidencia de la segunda ronda (7 entrevistas en salones solo con citas) se midió con ese diseño. Los resultados que lo citan (`reporte-evidencia.md`, `artefacto-traspaso.md`) sí están aprobados.

---

## 2. Audiencia Objetivo (User Personas)

- **Dueña del salón (usuaria principal).** Dueña de un salón de 1 a 4 puestos en Medellín que trabaja solo con citas, en color y alisados, uñas, o cejas y pestañas. Sus servicios duran de 1 a 4 horas y cuestan de 110.000 a 350.000 pesos. Atiende y maneja su propia agenda, y ya hace algo para que las clientas lleguen (confirmación manual, anticipo, recepcionista o lista de espera). Las 7 entrevistadas de la ronda 2 calificaron en este perfil; 6 de 7 tienen un workaround activo [E:01M7RSBPYMAF3FDSW0CDTKB82M].
- **Clienta final (no es usuaria definida).** Recibe los recordatorios y responde por WhatsApp. No tiene historias propias en esta versión.

**Quién NO es usuaria de esta versión:**
- **Peluquerías y barberías de barrio por orden de llegada.** Descartadas por evidencia (ronda 1: H2 1/7, H3 0/7).
- **Salones con anticipo alto.** Exclusión de segmento con evidencia débil: se apoya en una sola entrevista (R2-E5, "Desde que cobro el 50%, la que reserva llega."). Umbral de "anticipo alto": [PENDIENTE — sin umbral definido; valor provisional 30.000 COP o más; responsable: fundador]. En el piloto se excluyó también a R2-E2 (anticipo de 30.000).

---

## 3. Jobs To Be Done (JTBD)

- **JTBD 1 (cubierto):** Cuando tengo la agenda armada con servicios largos, quiero que cada clienta llegue a su hora, para no perder una parte grande del ingreso del día. (6 de 7)
- **JTBD 2 (cubierto solo de forma indirecta):** Cuando reparto la agenda entre mi personal, quiero que cada una tenga sus citas cumplidas, para que no se vaya y para no pagar días flojos. (R2-E3, R2-E6)
- **JTBD 3 (no resuelto en esta versión):** Cuando estoy en pleno servicio con las manos ocupadas, quiero no tener que soltar el trabajo para responder mensajes de clientas. (5 de 7) Este producto no ataca las interrupciones, solo la confirmación: la dueña sigue contestando solicitudes y además escribe al chat para registrar, cancelar y pedir la vista. En la revisión semanal se le pregunta si siente que contesta menos mensajes, solo como observación, no como criterio de éxito.

**Evidencia:** entrevistas de problema, ronda 2, n = 7, hechas por el fundador [E:01M7RSBPYMAF3FDSW0CDTKB82M]. Limitaciones: 3 de 7 salieron de cadenas de referidos y los valores son autodeclarados.

---

## 4. Alcance del Producto (Scope)

### ✅ Qué está INCLUIDO en esta iteración (In Scope):
- **Registro de citas por chat de WhatsApp,** con versión mínima: clienta, teléfono, servicio, día y hora. Incluye que la dueña cancele una cita. **[DECISIÓN CONSCIENTE — alcance modificado respecto a lo validado: se agrega el registro de citas por WhatsApp y la cancelación por la dueña, que no se probaron en el piloto]**. No consta en la evidencia cómo registraban las citas las dueñas del piloto. R2-E4 usó una app de agenda y la dejó a los dos meses.
- **Dos recordatorios por cita** (el día antes y 2 horas antes) con respuesta de la clienta para confirmar o cancelar. Es lo único probado en el piloto, y los dos recordatorios se probaron **juntos**, enviados **por una persona**.
- **Vista de la dueña:** mensaje en el mismo chat, que la dueña pide escribiendo al chat, con las citas confirmadas y sin confirmar. [ASUNCIÓN SIN VALIDAR]: sin evidencia directa. En el piloto no se registró ningún reporte.
- **Aviso de cancelación a la dueña.** [ASUNCIÓN SIN VALIDAR] + **[DECISIÓN CONSCIENTE — alcance modificado respecto a lo validado: el documento de solución la dejó como pregunta abierta, no como función aprobada]**. Evidencia: el dolor existe (R2-E6, la lista de espera recuperó 1 de 3); no hay evidencia de que avisar ayude a llenar el hueco. R2-E2 es evidencia complementaria fuera del segmento.
- **Baja de la clienta** escribiendo "no más" o "stop". **[DECISIÓN CONSCIENTE — alcance modificado respecto a lo validado: se agrega la baja de recordatorios, que no se probó en el piloto]**. "Baja" y "para" no se reconocen como baja.

### ❌ Qué queda FUERA de esta iteración (Out of Scope):
- **Reprogramar por chat:** descartado por el fundador.
- **Cobro de la suscripción dentro del producto:** descartado por el fundador; en el piloto se pagó por transferencia.
- **Cobro de anticipo a la clienta:** queda fuera, pero es el competidor principal y no se probó un brazo combinado (riesgo, §7).
- **Ofrecer el hueco de una cita cancelada a otras clientas o a una lista de espera:** el aviso solo avisa a la dueña.
- **Peluquerías de barrio y salones con anticipo alto:** ver §2.
- **Cualquier reporte de la dueña distinto a la vista.**
- **Clientas con un número sin WhatsApp:** limitación conocida (§7).

### 🐇 Rabbit Holes (No perfeccionar en esta versión):
- **Respuestas libres de la clienta:** una respuesta que no se entienda cuenta como "sin confirmar", sin reenviarla ni avisar aparte.
- **Cadencia de mensajes:** se mantienen los 2 recordatorios probados, sin ajustar horarios ni cantidad.
- **Formas de registrar la cita:** solo chat de WhatsApp.
- **Vista de la dueña:** solo confirmadas y sin confirmar.
- **Alcance geográfico y de rubros:** solo Medellín y los 4 rubros del piloto.

### 📅 Timeline y Equipo

**Timeline:** [PENDIENTE — no existe fecha de lanzamiento; sin ella el equipo no puede evaluar si las decisiones de arquitectura caben en el plazo].
**Piloto:** 8 semanas de uso con 5 salones de capacidad, no necesariamente los mismos de la etapa 3.

---

## 4B. Prioridad de Alcance (Scope Hammer)

### Funcionalidad core (no negociable):
Los **dos recordatorios con respuesta de la clienta** (US-02). Es lo único probado y lo que mueve la métrica principal.

### Funcionalidades que se cortarían primero (orden de sacrificio):
1. **Aviso de cancelación (US-04):** evidencia más débil y única función que depende de una hipótesis no probada. **Consecuencia aceptada:** sin el aviso, una cita cancelada por la clienta aparece como "sin confirmar" en la vista, igual que una clienta que no respondió.
2. **Vista de la dueña (US-03):** no se probó. Si se corta, la dueña pierde la lista de quién confirmó; esto puede afectar la métrica principal, que depende de que ella no tenga que escribir.
3. **Cancelación por la dueña (criterio 1.3, dentro de US-01):** sale antes que el registro.

### Funcionalidades candidatas a versión reducida:
- **Registro por chat:** versión completa: el mismo registro | **versión mínima (la que se lanza):** solo clienta, teléfono, servicio, día y hora, porque US-02 depende de él.

---

## 5. Requerimientos Funcionales (User Stories)

**Trazabilidad:** todas las historias se derivan del JTBD 1. La vista y el registro no se derivan del JTBD 3, que queda sin resolver en esta versión.

### US-01: Registrar y cancelar una cita por chat

**Como** dueña de un salón
**Quiero** registrar cada cita por un chat de WhatsApp con TurnoFácil (clienta, teléfono, servicio, día y hora) y poder cancelarla
**Para** que los recordatorios salgan sin que yo le escriba a cada clienta

**Prioridad:** Alta. US-02 depende de este. Si hay que recortar dentro de US-01, el criterio 1.3 sale antes que el registro.

**Criterios de Aceptación:**

#### Caminos Felices (Happy Paths):
1.1 **Given** la dueña envía por el chat un mensaje con clienta, teléfono, servicio, día y hora
   **When** TurnoFácil lo recibe
   **Then** la cita queda guardada y la dueña recibe la confirmación de que quedó guardada.

1.2 **Given** la dueña envía un mensaje de registro completo
   **When** TurnoFácil lo recibe
   **Then** le envía la confirmación de guardado en menos de 10 segundos. [ASUNCIÓN SIN VALIDAR: no medido en el piloto]

1.3 **Given** una cita guardada
   **When** la dueña escribe al chat que la cancela
   **Then** la cita queda cancelada, TurnoFácil no envía a la clienta los recordatorios que faltaban y no se le avisa a la clienta. **[DECISIÓN CONSCIENTE — alcance modificado respecto a lo validado: la dueña puede cancelar una cita por chat, función no probada en el piloto]**

1.4 **Given** el número registrado de la dueña
   **When** envía una de las acciones registrar, cancelar o pedir la vista
   **Then** la acción se ejecuta.

#### Casos Extremos (Edge Cases / Manejo de Errores):
1.5 **Given** el mensaje llega sin alguno de los cinco datos
   **When** TurnoFácil lo recibe
   **Then** le pide a la dueña que lo repita y no guarda la cita.

1.6 **Given** el mensaje trae un día y hora que ya pasaron
   **When** TurnoFácil lo recibe
   **Then** no guarda la cita y pide repetir el mensaje.

1.7 **Given** ya existe una cita con el mismo teléfono, día y hora
   **When** la dueña registra otra igual
   **Then** no la guarda y le avisa que ya existe.

1.8 **Given** el mensaje trae un teléfono que no son 10 dígitos que empiezan por 3 (con o sin +57)
   **When** TurnoFácil lo recibe
   **Then** pide repetir el mensaje y no guarda la cita.

1.9 **Given** un mensaje pide registrar, cancelar o pedir la vista
   **When** llega de un número que no es el registrado de la dueña de ese salón
   **Then** la acción no se ejecuta y el sistema no responde nada.

**Medición en el piloto (no es criterio de aceptación):** se observa cuánto tarda la dueña en registrar una cita y se compara con el tiempo actual de confirmar a mano. Referencia provisional: menos de 1 minuto [ASUNCIÓN SIN VALIDAR]. [PENDIENTE: qué pasa si la dueña cambia de número; responsable: fundador, antes de construir]

---

### US-02: Recordatorios y respuesta de la clienta

**Como** dueña de un salón
**Quiero** que la clienta reciba un recordatorio el día antes y otro 2 horas antes de su cita, y que pueda responder para confirmar o cancelar
**Para** que llegue a su hora sin que yo tenga que escribirle

**Prioridad:** Alta. Es el corazón del producto y lo único probado.

**Probado en el piloto:** los dos recordatorios juntos, enviados por una persona. No se probó el envío automático ni el efecto de cada recordatorio por separado.

**Palabras reconocidas** (provisionales, [ASUNCIÓN SIN VALIDAR], se revisan con las respuestas reales de las primeras semanas): confirma con "sí", "confirmo", "listo", "ok" o 👍; cancela con "cancelo", "cancelar" o "no puedo"; cualquier otra respuesta es "sin confirmar".

**Criterios de Aceptación:**

#### Caminos Felices (Happy Paths):
2.1 **Given** una cita guardada
   **When** llega el momento del primer recordatorio (el día antes; hora [PENDIENTE])
   **Then** la clienta recibe un mensaje de WhatsApp con la fecha y hora de su cita.

2.2 **Given** una cita guardada
   **When** faltan 2 horas para la cita
   **Then** la clienta recibe el segundo recordatorio. [PENDIENTE: si se envía cuando ya confirmó o canceló]

2.3 **Given** la clienta recibió un recordatorio
   **When** responde con una palabra de confirmación
   **Then** la cita queda confirmada.

2.4 **Given** la clienta recibió un recordatorio
   **When** responde con una palabra de cancelación
   **Then** la cita queda cancelada.

2.5 **Given** una clienta recibió un recordatorio
   **When** responde "no más" o "stop"
   **Then** deja de recibir recordatorios de TurnoFácil de **todos** los salones (la baja vale por teléfono) y recibe un mensaje corto que confirma la baja. **[DECISIÓN CONSCIENTE — alcance modificado respecto a lo validado: se agrega la baja de recordatorios, que no se probó en el piloto]**

#### Casos Extremos (Edge Cases / Manejo de Errores):
2.6 **Given** la clienta responde algo que no está en la lista
   **When** TurnoFácil lo recibe
   **Then** la cita queda "sin confirmar", sin reenviar el mensaje y sin avisar a la dueña aparte. "Baja" y "para" caen aquí: la clienta no queda dada de baja y sigue recibiendo mensajes.

2.7 **Given** la clienta no responde a ningún recordatorio
   **When** pasa la hora de la cita
   **Then** la cita queda "sin confirmar".

2.8 **Given** la dueña registra una cita cuyo momento de recordatorio ya pasó
   **When** la guarda
   **Then** no se envía ese recordatorio y se envía solo el que aún falta, si falta alguno. [PENDIENTE: depende de la hora del primer recordatorio]

2.9 **Given** una clienta se dio de baja
   **When** la dueña registra una cita nueva con ese teléfono
   **Then** la cita se guarda, no se envía ningún recordatorio y la respuesta al registro incluye el aviso de que esa clienta se dio de baja.

2.10 **Given** la clienta escribe "no más" o "stop" con otras mayúsculas, tildes o puntuación
   **When** TurnoFácil lo recibe
   **Then** se toma como baja. Cualquier otra frase no se entiende y cuenta como "sin confirmar". La lista final queda sujeta a la validación legal.

2.11 **Given** una clienta dada de baja tiene citas ya registradas
   **When** pasa el momento de sus recordatorios
   **Then** no recibe ninguno y esas citas aparecen en "sin confirmar".

---

### US-03: Vista de la dueña

**Como** dueña de un salón
**Quiero** pedir por el chat qué clientas confirmaron y cuáles quedan sin confirmar
**Para** saber a quién no tengo que escribirle

[ASUNCIÓN SIN VALIDAR: no se probó en el piloto]

**Prioridad:** Media. Sin ella la dueña no sabe a quién escribirle, pero no se probó y es lo segundo que se recorta.

**Criterios de Aceptación:**

#### Caminos Felices (Happy Paths):
3.1 **Given** hay citas guardadas
   **When** la dueña escribe al chat para pedir la vista sin indicar un día
   **Then** recibe, en menos de 10 segundos, las dos listas (confirmadas y sin confirmar) con las citas de mañana. [10 s: ASUNCIÓN SIN VALIDAR]

3.2 **Given** hay citas guardadas
   **When** la dueña pide la vista indicando un día
   **Then** recibe las dos listas con las citas de ese día.

#### Casos Extremos (Edge Cases / Manejo de Errores):
3.3 **Given** una clienta canceló
   **When** la dueña pide la vista
   **Then** esa cita aparece en "sin confirmar".

3.4 **Given** la respuesta de una clienta no se entendió
   **When** la dueña pide la vista
   **Then** esa cita aparece en "sin confirmar".

3.5 **Given** no hay citas para el día pedido
   **When** la dueña pide la vista
   **Then** recibe un mensaje que dice que no hay citas.

3.6 **Given** la dueña no escribió al chat para pedirla
   **When** pasa cualquier momento del día
   **Then** TurnoFácil no le envía la vista.

3.7 **Given** la dueña indica un día que el sistema no entiende
   **When** TurnoFácil recibe el mensaje
   **Then** le pide que lo repita y no envía ninguna lista.

3.8 **Given** la dueña canceló una cita
   **When** pide la vista
   **Then** esa cita no aparece en ninguna de las dos listas.

---

### US-04: Aviso de cancelación

**Como** dueña de un salón
**Quiero** recibir un aviso cuando una clienta cancela
**Para** intentar llenar el hueco por mi cuenta

[ASUNCIÓN SIN VALIDAR] + **[DECISIÓN CONSCIENTE — alcance modificado respecto a lo validado: el documento de solución la dejó como pregunta abierta, no como función aprobada]**

**Prioridad:** Baja. Es lo primero que se corta.

**Criterios de Aceptación:**

#### Caminos Felices (Happy Paths):
4.1 **Given** una cita guardada
   **When** la clienta responde cancelando
   **Then** la dueña recibe un aviso con ese hecho. [PENDIENTE: contenido del aviso y anticipación mínima; responsable: fundador, antes de construir esta historia]

---

## 6. Atributos de Calidad / Requisitos No Funcionales

- **Rendimiento:** confirmación de guardado en menos de 10 segundos; vista en menos de 10 segundos; recordatorio con un retraso máximo de 5 minutos. Los tres son [ASUNCIÓN SIN VALIDAR]: no se midieron en el piloto, donde enviaba una persona. Capacidad al lanzar: **5 salones** (de capacidad, no necesariamente los del piloto). Más de 5: [PENDIENTE — sin datos de demanda ni fecha el equipo no puede dimensionar el crecimiento].
- **Seguridad y privacidad:**
  - Un salón no puede ver las citas ni los datos de las clientas de otro salón.
  - Nombre y teléfono de las clientas solo los ve la dueña de su salón. Son los datos más sensibles.
  - El equipo de TurnoFácil accede solo cuando es necesario para resolver un problema, y **ese acceso queda registrado**.
  - La clienta solo ve en el recordatorio los datos de su propia cita.
  - La dueña puede borrar los datos de una clienta si esta se lo pide.
  - Solo el número registrado de la dueña puede registrar, cancelar o pedir la vista (un solo número por salón; el salón de uñas del piloto tiene 4 manicuristas y solo operaría la dueña).
  - La clienta puede darse de baja con "no más" o "stop".
  - **Riesgo conocido:** una clienta que escriba "baja" o "para" para dejar de recibir mensajes **no queda dada de baja** y seguirá recibiéndolos (cuenta como respuesta no entendida). La lista final de palabras queda sujeta a la validación legal.
  - [PENDIENTE — tiempo de conservación de los datos; se define junto con la validación legal].
  - [PENDIENTE — validar con un abogado las obligaciones de datos personales en Colombia antes de lanzar; responsable: fundador].
  - [PENDIENTE — qué pasa si la dueña cambia de número; responsable: fundador, antes de construir].
- **Disponibilidad:** [PENDIENTE — no se definió; sin una expectativa de disponibilidad el equipo no puede diseñar para ella. No bloquea el piloto de 5 salones].
- **Observabilidad:**
  - El equipo debe enterarse cuando: un recordatorio no sale o sale con más de 5 minutos de retraso; un mensaje no se pudo entregar; un registro o cancelación no se guardó; alguien del equipo accede a datos de clientas.
  - Debe poder reconstruirse, por cada cita: cuándo se registró, qué recordatorios salieron, qué respondió la clienta y en qué estado quedó.
  - [PENDIENTE — quién recibe los avisos al equipo y por qué canal; responsable: fundador, antes de construir].
  - Resultado de cada cita (llegó, tarde más de 15 minutos, no llegó, canceló con menos de 4 horas) y si la dueña le escribió a la clienta por fuera: **no son funciones del producto**. Se miden en el piloto con la revisión semanal (ver §8). [ASUNCIÓN SIN VALIDAR]: depende de que las dueñas cooperen y lo que declaran no se verifica. Esta medición solo cubre el piloto con 5 salones.
- **Presupuesto:** [SIN RESTRICCIÓN DE PRESUPUESTO DECLARADA]

---

## 7. Supuestos y Dependencias

### Dependencias externas:
- **WhatsApp como canal.** Debe incluir el costo actual por mensaje y el tiempo de aprobación de plantillas. No hay evidencia sobre las condiciones para mensajes iniciados por una empresa.
  **Owner:** fundador
  **Timeline:** antes de construir
  **Bloqueante:** Sí

- **Validación legal de datos personales de las clientas.**
  **Owner:** fundador
  **Timeline:** antes del lanzamiento
  **Bloqueante:** del lanzamiento, no de la construcción

- **Las 5 dueñas del piloto,** dispuestas a cooperar con la revisión semanal.
  **Owner:** fundador
  **Timeline:** antes de empezar el piloto
  **Bloqueante:** Sí, del piloto

- **Quien construya el producto.** No hay información sobre quién es.
  **Owner:** fundador
  **Timeline:** definido antes de la etapa de RFC
  **Bloqueante:** Sí

⚠️ **Riesgo de concentración:** casi todo depende de una sola persona, el fundador. Además de las dependencias, es responsable de la hora del primer recordatorio, de los avisos al equipo, de la validación legal y de la revisión semanal que mide el 70% y el 22%. No hay suplente definido.

### Supuestos (todos [ASUNCIÓN SIN VALIDAR]):

| Supuesto | Evidencia que lo cerraría | Cuándo se mide |
|---|---|---|
| Registrar por chat toma bastante menos que confirmar a mano | Tiempo observado de registrar frente al tiempo actual de confirmar (20 a 40 min diarios declarados) y criterio provisional de menos de 1 minuto | Primera semana con cada salón |
| Las cifras de 70%, 10 s y 5 min | 70% a las 8 semanas; 10 s y 5 min con los eventos registrados | Eventos desde el primer día, revisión semanal |
| Las dueñas cooperan y lo que declaran es veraz | 4 de 5 dueñas completan las revisiones; la veracidad no se verifica | Semanal |
| La vista y el aviso son útiles | Veces que la dueña pide la vista y si declara que le sirvió; si recibió un aviso, si llenó el hueco | Revisión semanal |
| Las dueñas aceptan registrar por chat en vez de su libreta (S3 prefirió la libreta y no pagó) | Al menos 4 de las 5 siguen registrando por chat hasta la semana 8 | Semanal |
| Las clientas contestan a mensajes automáticos | Meta de 75% de respuesta (propuesta sin respaldo del piloto) | Semanal; la línea base se fija en las primeras 2 semanas |
| Los salones que pagaron el primer mes pagan el segundo (solo hay primeros pagos: 3 de 5) | Al menos 60% paga el segundo mes | Al vencer el primer mes |
| El costo por mensaje de WhatsApp cabe en 89.000 COP al mes (incluye recordatorios, confirmaciones de guardado y mensajes de la vista; referencia: ~34 citas por salón al mes en el piloto) | Costo por mensaje × mensajes por salón | Antes de construir; gasto real al cerrar el primer mes |
| Las dueñas prefieren confirmación sobre anticipo (el anticipo redujo más las fallas y nunca se les ofreció pagar por él) | Ofrecer ambas y ver cuál eligen y pagan, o el brazo combinado | **No se mide en el piloto definido** |
| [PENDIENTE] El segmento existe en cantidad suficiente (sin cifra de salones solo con citas en Medellín) | Una cifra de mercado | Después del veredicto de las 8 semanas; no afecta el piloto |

> ⚠️ **Asunción de alto riesgo:** el efecto sobre las citas se mantiene cuando los mensajes los envía el sistema y no una persona. Si es falso, la dueña vuelve a escribir, no ahorra tiempo y se cae el foco. En el piloto, en S4 la dueña confirmó a mano 2 citas del brazo de confirmación.
> **Nivel de Confianza:** 4/10
> **Estado de validación:** **[RIESGO CRÍTICO]** Validar con una primera construcción mínima dentro del piloto; decisión de continuar a las 8 semanas, con revisión intermedia a la semana 4. Se cierra con citas fallidas de no más de 18% con envío automático (aspiración 15%).

### Riesgos conocidos:
- **Anticipo:** competidor principal (redujo las fallas un 58,3% frente al 33,3% de la confirmación); no se probó un brazo combinado.
- **Margen del piloto:** el efecto observado es frágil (3,3 puntos sobre el umbral; sin S3 cae a 12,5%) y los 5 salones eran entrevistadas previas.
- **Mercado:** SAM sin cuantificar. Existen agendas con recordatorios en Colombia (Aura, Gestabiz y AgendApp); fuente: páginas de proveedores citadas en el reporte de la etapa 2, no verificadas aquí; no consta que envíen por WhatsApp ni que apunten a este segmento.
- **Cruce que afecta la métrica principal:** una cita cancelada por la clienta aparece como "sin confirmar" en la vista y puede llevar a la dueña a escribirle para aclarar. Esa cita deja de contar como cerrada y baja el 70%.
- **Número sin WhatsApp:** limitación conocida de esta versión; el recordatorio no llega y la cita queda "sin confirmar".

### Plan B si dependencias fallan:
- Si WhatsApp no cumple en costo o en plantillas: [PENDIENTE — ver §9].
- Si la validación legal no está lista: **BLOQUEANTE — no se puede lanzar sin esto**.

---

## 8. Métricas de Éxito (KPIs)

⭐ **North Star Metric:** al menos **70% de las citas se cierran sin que la dueña escriba**, a las 8 semanas de uso. [ASUNCIÓN SIN VALIDAR]
- **Cita cerrada:** la clienta confirmó o canceló respondiendo al recordatorio, y la dueña declara en la revisión semanal que no le escribió por esa cita.
- **No cerrada:** la clienta no respondió, la respuesta no se entendió, o se dio de baja.
- **Entran al cálculo** las citas registradas con al menos un recordatorio enviado. Quedan fuera las canceladas por la dueña (criterio 1.3).
- **Cada reporte del 70% informa cuántas citas quedaron fuera del cálculo y por qué.**
- **Depende del 75%:** una cita sin respuesta nunca cuenta como cerrada, así que **el 70% no puede superar la tasa de respuesta**. Si la línea base de respuesta queda por debajo de 70%, la meta es inalcanzable y se ajusta junto con el 75%. Las dos metas se revisan juntas.
- **Unidad distinta:** el 75% se definió por clientas y el 70% por citas. Para compararlos hay que medir ambos por cita. [PENDIENTE: unificar la unidad; responsable: fundador, primeras 2 semanas del piloto]
- **Cruce conocido:** una cita cancelada por la clienta cuenta como cerrada solo si la dueña no le escribe, pero la vista la muestra como "sin confirmar".

**KPIs de soporte** (a las 8 semanas, salvo el pago):
- **KPI 1:** al menos **75%** de las clientas responden a uno de los dos recordatorios. Es una propuesta sin respaldo del piloto: las primeras 2 semanas fijan la línea base. [PENDIENTE — quién la confirma o ajusta; responsable: fundador]
- **KPI 2:** al menos **60%** de los salones pagan el segundo mes.
- **KPI 3:** citas fallidas de no más de **18%**, con la definición del piloto: no llegó, llegó más de 15 minutos tarde, o canceló con menos de 4 horas de anticipación. Aspiración: 15%. Referencia: 14,8% en el brazo de confirmación del piloto [E:01M7RXWF70H4FDZ56B2RMEMYSF]. (El piloto contaba también "abandonó al conocer la condición de su brazo", pero esa causa solo existía en el brazo de anticipo y no aplica a este producto.)

**Guardrails (no deben empeorar):**
- Citas fallidas: no más de **22%**. La línea base fue 21,8% y el grupo sin intervención 22,2%. Es un límite contra empeorar, no una meta de mejora.

**Frecuencia de medición:** revisión semanal del fundador con cada una de las 5 dueñas, con la agenda y la declaración de la dueña, como en el piloto. [ASUNCIÓN SIN VALIDAR]. Se espera medir unas **320** citas en 8 semanas (estimación: 240 citas en 42 días en el piloto, proyectadas a 8 semanas; no es un conteo). El margen de error es de unos 4 puntos con una meta de 15%, y puede ser mayor porque son solo 5 salones. En la revisión semanal también se le pregunta a cada dueña si siente que contesta menos mensajes, solo como observación y no como criterio de éxito.

---

## 9. Estado de Pendientes

Consolidación de todos los `[PENDIENTE]` y `[ASUNCIÓN SIN VALIDAR]` del PRD. Responsable de todos los pendientes: el fundador.

### 🚫 Bloqueantes (detienen el inicio del desarrollo):
- [ ] §7 — Costo por mensaje de WhatsApp y tiempo de aprobación de plantillas — antes de construir
- [ ] §5 US-02 — Hora del primer recordatorio y si se envía el segundo tras una confirmación — antes de construir
- [ ] §6 — Quién recibe los avisos al equipo y por qué canal — antes de construir
- [ ] §6 — Qué pasa si la dueña cambia de número — antes de construir
- [ ] §5 US-04 — Contenido del aviso de cancelación y anticipación mínima — antes de construir esa historia
- [ ] §7 — Quien construya el producto — antes de la etapa de RFC
- [ ] §7 — Las 5 dueñas dispuestas a cooperar — antes de empezar el piloto

### 🚦 Bloqueantes del lanzamiento:
- [ ] §6 — Obligaciones legales de datos personales en Colombia (abogado) y tiempo de conservación — antes de lanzar; la lista final de palabras de baja queda sujeta a esta validación

### ⚠️ No bloqueantes pero visibles:
- [ ] §7 — Plan B si WhatsApp no cumple en costo o en plantillas: sin alternativa; sin canal no se puede lanzar. Hito: sin definir
- [ ] §8 — Línea base y confirmación del 75% — primeras 2 semanas del piloto
- [ ] §8 — Unificar la unidad del 70% (citas) y del 75% (clientas) — primeras 2 semanas del piloto
- [ ] §7 — Qué se revisa en la semana 4 y con qué umbral intermedio (revisión intermedia del riesgo crítico sin criterio)
- [ ] §7 — Crecer más allá de 5 salones y tamaño del segmento — después del veredicto de las 8 semanas
- [ ] §1 — Precio definitivo y estructura de cobro (89.000 pesos es el monto del piloto), y qué hacer con S3 y S4 — después del segundo mes de pago
- [ ] §2 — Umbral de "anticipo alto" (provisional: 30.000 COP)
- [ ] §4 — No existe fecha de lanzamiento
- [ ] §6 — Disponibilidad sin definir

### 📝 Asunciones sin validar:
- [ ] §7 — El efecto se mantiene con mensajes automáticos — confianza 4/10 — falta medirlo con envío automático (RIESGO CRÍTICO)
- [ ] §8 — 70% de citas cerradas — sin confianza declarada — falta medirlo con producto funcionando
- [ ] §5 y §6 — 10 s (guardado y vista) y 5 min (recordatorio)
- [ ] §5 — Palabras de respuesta de la clienta, vista de la dueña y aviso de cancelación
- [ ] §7 — Registro por chat más rápido que confirmar a mano; las dueñas aceptan registrar por chat; las clientas contestan a mensajes automáticos; renovación del segundo mes; costo de WhatsApp dentro de 89.000 COP; preferencia de confirmación sobre anticipo
- [ ] §8 — La revisión semanal depende de la cooperación de las dueñas y lo que declaran no se verifica
