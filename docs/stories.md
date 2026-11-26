# Historias de usuario · TurnoFácil

> Generado por tech-emergentes-user-story-builder · etapa 13 · 24/11/2026
> Preflight ejecutado: `preflight-gate.sh` · exit=0 · veredicto=GENERATE (`✓ Set de diseño coherente · BACKLOG descongelado`)
> Insumos: `docs/PRD.md`, `docs/RFC.md`, `docs/adrs/` (ADR-001…009), `docs/domain-model.md`, `docs/api-contract.md`, `docs/events.md`, `docs/security-design.md`, `docs/observability-design.md`, `docs/flows/turnofacil/user-flows.md`, `ui/`, `DESIGN.md`.

TurnoFácil no tiene pantallas propias: la dueña y la clienta solo usan un chat de WhatsApp (api-contract, Resumen para decidir). Por eso cada criterio de aceptación se escribe como una conversación: alguien escribe un mensaje y recibe (o no) una respuesta. Los textos citados entre comillas son los borradores aprobados del catálogo de mensajes del contrato.

## Mapa de historias

| Historia | Épica | RF / US | Depende de | Puntos | Criterios que se comprueban tras el despliegue |
|---|---|---|---|---|---|
| H1 · Canal de WhatsApp emulado para el piloto de prueba (historia técnica) | E1 | ADR-002 · contrato §10 · sin RF propio | — | 5 | 5 de 5 |
| H2 · Registrar una cita por chat | E2 | RF-01 · US-01·1.1, 1.2 | H1 | 5 | 3 de 3 |
| H3 · Rechazar un registro incompleto o inválido | E2 | RF-01 · US-01·1.5–1.8 | H2 | 3 | 4 de 4 |
| H4 · Aclarar si la hora es de mañana o de noche | E2 | RF-01 · contrato §3.1.1.1 | H2, H3 | 3 | 3 de 3 |
| H5 · Solo la dueña da órdenes al chat | E2 | RF-03 · US-01·1.4, 1.9 | H2, H3 | 2 | 2 de 3 |
| H6 · Cancelar una cita por chat | E2 | RF-02 · US-01·1.3 | H2 | 3 | 3 de 4 |
| H7 · Pedir la vista de confirmadas y sin confirmar | E3 | RF-08 · US-03 | H2, H6 | 5 | 5 de 5 |
| H8 · Enviar los dos recordatorios a la clienta | E4 | RF-04, RF-05 · US-02·2.1, 2.2, 2.8 | H2, H6 | 8 | 1 de 6 |
| H9 · La clienta confirma o cancela respondiendo | E4 | RF-06, RF-10 · US-02·2.3, 2.4, 2.6, 2.7 | H7, H8 | 5 | 1 de 5 |
| H10 · La clienta se da de baja | E4 | RF-07 · US-02·2.5, 2.9, 2.10, 2.11 | H2, H7, H8 | 3 | 4 de 5 |
| H11 · Avisar a la dueña cuando una clienta cancela | E5 | RF-09 · US-04·4.1 | H9 | 3 | 1 de 3 |
| H12 · Operaciones de soporte del equipo | E6 | RF-11 · PRD §6 · flujo F5 | H2, H10 | 5 | 0 de 4 (vacío, ver condiciones) |

Orden de construcción: H1 → H2 → H3 → H4 → H5 → H6 → H7 → H8 → H9 → H10 → H11 → H12

**RF-12 (reconstruir la historia de cada cita) es transversal:** no tiene historia propia. Cada historia deja en su Verificación técnica los eventos que permiten reconstruir la cita (registro, recordatorios, respuestas, estado final). Cobertura: 12 de 12 RF.

## Condiciones para comprobar tras el despliegue

Hoy no hay conexión real con WhatsApp ni número de Meta aprobado (decisión de la persona en la etapa 13, 24/11/2026). Por eso la comprobación en vivo se hace así, en orden de preferencia:

1. **Primera opción · piloto de prueba con WhatsApp emulado (H1).** Se usa la Frontera E · Canal emulado del contrato (api-contract §10, versión 1.1.0), que solo existe en el ambiente de prueba. El adaptador emulado se enchufa en el puerto `CanalWhatsApp` (§4.1, §10.3), el mismo que permite cambiar Meta por Twilio (ADR-002). No envía nada a Meta.
   - **Enviar un mensaje** como dueña, clienta o número desconocido: `POST /prueba/canal-emulado/mensajes` (§10.1). El mensaje entra al mismo Procesador que los de Meta.
   - **Leer lo que el sistema respondió** a un número, incluidos recordatorios y avisos: `GET /prueba/canal-emulado/mensajes-enviados` (§10.2). Un número sin mensajes devuelve una lista vacía: así se comprueba que no se le respondió.
   - **Salón de prueba sembrado** al desplegar: "Salón de Prueba TurnoFácil", con la dueña de prueba `+573000000001`. Se consulta con `GET /prueba/canal-emulado/salon-de-prueba` (§10.4). Es el equivalente de la "sesión de usuarios de prueba".
   - **Números de prueba:** clientas de `+573000000100` a `+573000000199`; números desconocidos de `+573000000900` a `+573000000999` (§10.4). Son una convención: el sistema no los trata distinto. En el ambiente de prueba no se usan datos reales (§10.6; security-design §6.3).
   - **Clave de prueba:** todas las llamadas llevan la clave del canal emulado (§10.6; security-design §2.11, §5). En producción las rutas no existen y una entrada `emu.` dispara una alerta (observability-design D12-6).
2. **Cuando exista la cuenta de Meta · números reales de prueba.** Números de WhatsApp de prueba que escriben como dueña, como clienta o como número desconocido y leen lo que TurnoFácil les responde, con el adaptador de Meta en lugar del emulado. Sirve para comprobar el canal real; los criterios de las historias no cambian.

En los dos casos se usan **fechas lejanas con año** (`dd/mm/aaaa`, años después de 2100). El contrato no limita qué tan lejos puede estar una cita (api-contract §3.1.1), así que estas fechas sirven en todas las corridas.

**Reglas para que las corridas no se pisen:**
- **La baja es permanente por número** y no se puede deshacer desde afuera: la reactivación es una operación de soporte sin ruta pública (api-contract §5). Por eso los criterios de baja (H10) usan cada vez un número de clienta de prueba que no se haya usado antes, y los demás criterios nunca usan un número que se haya dado de baja.
- **El canal emulado no genera estados de entrega ni fallas** (§10.3). Lo que depende de ellos sigue cubierto por pruebas automatizadas.
- **Vacío para que lo decida la persona que revisa:** H12 (soporte) no tiene ningún criterio que se pueda comprobar tras el despliegue, porque las operaciones de soporte no tienen ruta pública (api-contract §5). Queda cubierta solo por pruebas automatizadas.

## Cambios pendientes del backlog

| ID | Cambio | Estado | Origen | Para aplicarlo |
|---|---|---|---|---|
| CP-01 | Cuando la dueña intenta cancelar una cita cuyo inicio ya pasó, que reciba un mensaje propio, por ejemplo "Esa cita ya pasó; no se puede cancelar", en lugar de "No encontré una cita…". | Pendiente · no forma parte de estas historias | Pedido de la persona en la etapa 13 (24/11/2026) | Reabrir Modelo de dominio (§6, punto 1, decidió "no se encontró") y Contratos (agregar un código de respuesta nuevo). Afecta a H6 |

## E1 · Canal de prueba

## H1 · Canal de WhatsApp emulado para el piloto de prueba

**Status:** Ready
**Estimación:** 5
**Tipo:** historia técnica (sin RF propio; habilita la comprobación en vivo de H2 a H11)

### Historia

**Como** equipo de TurnoFácil
**Quiero** un canal de WhatsApp emulado, enchufado en el puerto de canal, con un salón de prueba ya sembrado
**Para** comprobar el producto conversación por conversación sin conexión real con WhatsApp ni número de Meta aprobado

### Cross-references

- **PRD:** §7 (WhatsApp como canal: costo y aprobación de plantillas sin validar, bloqueante)
- **RFC:** §1.4 (sin herramientas de prueba fijadas) · A1 (plantillas de Meta)
- **ADRs aplicables:** ADR-002 (puerto de canal; Meta y Twilio como implementaciones), ADR-006 (salón deducido del número del remitente), ADR-009 (cola FIFO de entrantes)
- **Endpoints:** Frontera E · Canal emulado (api-contract §10): POST /prueba/canal-emulado/mensajes (§10.1), GET /prueba/canal-emulado/mensajes-enviados (§10.2), GET /prueba/canal-emulado/salon-de-prueba (§10.4) · puerto `CanalWhatsApp` (§4.1, §10.3) · `MensajeEntrante` (§6.2) · `alta_salon` (§5)
- **Entidades:** Salón (`numero_duena`, `nombre_salon`), mensaje entrante, respuesta (código R-01 … R-20), plantilla
- **Controles seguridad:** security-design §2.11 (canal emulado), §5 (clave de prueba), §6.1 (rutas solo en prueba), OQ-8 · api-contract §10.6
- **Observabilidad:** observability-design D12-6 y §1.2 (envíos emulados medidos igual que los reales, prefijo `emu.`, alerta si aparece en producción)

### Criterios de aceptación (funcionales)

#### AC-1 · El salón de prueba está sembrado
```gherkin
Given el ambiente de prueba está desplegado
When se consulta el salón de prueba con la clave de prueba
Then se ve "Salón de Prueba TurnoFácil" con la dueña de prueba +573000000001 y el envío activo
```

#### AC-2 · Un mensaje de la dueña de prueba recibe la respuesta del sistema
```gherkin
Given el ambiente de prueba está desplegado con el canal emulado
When se envía por el canal emulado, como dueña desde +573000000001, el mensaje "Hola"
Then entre los mensajes enviados a +573000000001 desde ese momento aparece "No entendí el mensaje. Puedes escribir: …" con los tres ejemplos de formato
And la respuesta queda guardada como texto con su código de respuesta
```

#### AC-3 · Un número desconocido no recibe nada
```gherkin
Given el ambiente de prueba está desplegado con el canal emulado
When se envía por el canal emulado, como número desconocido desde un número de prueba de la serie 900, el mensaje "Vista"
Then la lista de mensajes enviados a ese número desde ese momento está vacía
```

#### AC-4 · Sin la clave de prueba no entra nada
```gherkin
Given el ambiente de prueba está desplegado con el canal emulado
When se intenta enviar un mensaje como dueña sin la clave de prueba
Then el canal emulado lo rechaza por clave inválida
And la dueña de prueba no recibe ninguna respuesta nueva
```

#### AC-5 · El papel declarado tiene que coincidir con el número
```gherkin
Given el ambiente de prueba está desplegado con el canal emulado
When se intenta enviar un mensaje como clienta desde +573000000001, que es el número de la dueña de prueba
Then el canal emulado lo rechaza por remitente inconsistente y no se procesa
```

### Verificación técnica

- **Endpoints:** POST /prueba/canal-emulado/mensajes → 202 con `mensaje_id` `emu.<ULID>`; errores 401 `clave_invalida`, 400 `datos_invalidos`, 422 `remitente_inconsistente`, 500 `cola_no_disponible` (§10.1). GET /prueba/canal-emulado/mensajes-enviados con `telefono`, `desde`, `limite`; 200 con `mensajes: []` si no hay (§10.2). GET /prueba/canal-emulado/salon-de-prueba → 200 o 404 `salon_no_sembrado` (§10.4).
- **Entrada:** el mensaje se arma como `MensajeEntrante` (§6.2) y va a la cola FIFO de entrantes con `MessageGroupId` = `telefono_seudonimo` y `MessageDeduplicationId` = `mensaje_id` (§10.1, ADR-009). El papel declarado no decide la identidad: el Procesador clasifica por número (§3, ADR-006).
- **Adaptador emulado (§10.3):** `enviarTexto` y `enviarPlantilla` guardan el envío en el almacén del canal emulado (vence a los 7 días) en lugar de llamar a Meta; `interpretarEstado` devuelve `[]`; nunca devuelve `ErrorCanal`. Se elige con `CANAL_WHATSAPP=emulado`.
- **Siembra (§10.4):** `alta_salon` idempotente al desplegar, con evento de auditoría.
- **Seguridad (§10.6):** rutas creadas solo con `canal_emulado_habilitado = true`; en producción el Procesador, el Emisor y el Vigilante no arrancan con el adaptador emulado; clave `X-Clave-Prueba` de al menos 32 bytes, comparada en tiempo constante, nunca registrada; límite de 5 peticiones por segundo (429).
- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** que las rutas `/prueba/canal-emulado/…` no existen en producción y que las Lambdas de producción no arrancan con `CANAL_WHATSAPP=emulado`.
- **Observabilidad:** los envíos emulados producen los mismos registros y métricas que los reales, con prefijo `emu.`; en producción una entrada `emu.` dispara alerta P1 (D12-6).

### Notas

- **Out of scope:** estados de entrega emulados y simulación de fallas del canal (§10.3); las fallas siguen cubiertas por pruebas automatizadas en H8.
- **Dependencias:** ninguna.
- **Después:** cuando exista la cuenta de Meta, se comprueban las mismas historias con números reales de prueba y el adaptador de Meta.

## E2 · Registro y cancelación de citas por la dueña

## H2 · Registrar una cita por chat

**Status:** Ready
**Estimación:** 5

### Historia

**Como** dueña de un salón
**Quiero** registrar una cita escribiendo en el chat la clienta, el teléfono, el servicio, el día y la hora
**Para** que los recordatorios salgan sin que yo le escriba a cada clienta

### Cross-references

- **PRD:** §5 US-01 (criterios 1.1, 1.2)
- **RFC:** §1.2 RF-01 · §5.1, §5.8
- **ADRs aplicables:** ADR-006 (salón deducido del número), ADR-008 (intérprete determinista), ADR-009 (cola ordenada)
- **Endpoints:** POST /webhook/meta (contrato §2.2) · comando Registrar (§3.1.1) · respuesta R-01 (§3.2)
- **Entidades:** Cita, Inicio, NombreClienta, Telefono, Servicio, Salón
- **Controles seguridad:** security-design §4.2 (autorización por número de la dueña), §6.2
- **Observabilidad:** observability-design §1.2 (latencia de confirmación, evento `CitaRegistrada`)

### Criterios de aceptación (funcionales)

#### AC-1 · La cita queda guardada y la dueña recibe la confirmación
```gherkin
Given la dueña del salón de prueba escribe desde su número registrado
When envía "Cita: Laura Gómez, <número de clienta de prueba sin el +57, por ejemplo 3000000101>, tinte, <día lejano con año>, 3:00 pm"
Then recibe "Listo ✅ Cita guardada: Laura Gómez · tinte · <día abreviado y fecha> · 3:00 p. m. Le enviaremos los recordatorios."
And la respuesta llega en menos de 10 segundos
```

#### AC-2 · Se aceptan variaciones razonables de escritura
```gherkin
Given la dueña escribe desde su número registrado
When envía "CITA - Ana Ruiz, +57 300 000 0102, corte, <día lejano con año>, 15:30"
Then recibe la confirmación de cita guardada con Ana Ruiz, corte, ese día y "3:30 p. m."
```

#### AC-3 · Un dato por renglón también vale
```gherkin
Given la dueña escribe desde su número registrado
When envía "Cita:" y en renglones separados la clienta, un teléfono de 10 dígitos que empieza por 3, el servicio, un día lejano con año y "11:00 am"
Then recibe la confirmación de cita guardada que repite el día y "11:00 a. m."
```

### Verificación técnica

- **Endpoints / eventos:** POST /webhook/meta → cola FIFO de entrantes → Procesador · comando Registrar §3.1.1 · evento `CitaRegistrada` (events.md) · respuesta `R-01`.
- **ADRs:** ADR-006, ADR-008, ADR-009; ADR-007 (registros sin nombre ni teléfono, solo `telefono_seudonimo`).
- **Estados dominio:** la cita nace en `guardada` (domain-model §3.2).
- **Normalización del teléfono:** `3001234567`, `+573001234567` y `573001234567` → `+573001234567` (contrato §3.1.1).
- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** fecha `dd/mm` sin año que ya pasó y cae en los próximos 60 días del año siguiente se toma en el año siguiente; error al guardar → respuesta `R-07` y alerta al equipo (PRD §6, observability-design).
- **RF-12:** `CitaRegistrada` marca el inicio de la historia de la cita.

### Notas

- **Out of scope:** editar una cita; varias citas en un mismo mensaje.
- **Dependencias:** H1 (canal emulado y salón de prueba sembrado, ver condiciones).

## H3 · Rechazar un registro incompleto o inválido

**Status:** Ready
**Estimación:** 3

### Historia

**Como** dueña de un salón
**Quiero** que el chat me diga qué está mal cuando mi mensaje no sirve para guardar la cita
**Para** corregirlo en el momento y no quedarme con una cita que no existe

### Cross-references

- **PRD:** §5 US-01 (criterios 1.5, 1.6, 1.7, 1.8)
- **RFC:** §1.2 RF-01
- **ADRs aplicables:** ADR-008
- **Endpoints:** comando Registrar §3.1.1 (validaciones en orden) · respuestas R-02, R-03, R-04, R-05 (§3.2)
- **Entidades:** Cita, Rechazo, Telefono, Inicio
- **Controles seguridad:** security-design §6.2 (validación de entrada)
- **Observabilidad:** observability-design §1.2 (registros por resultado del comando, sin datos personales)

### Criterios de aceptación (funcionales)

#### AC-1 · Falta un dato
```gherkin
Given la dueña escribe desde su número registrado
When envía "Cita: Laura Gómez, 3000000101, <día lejano con año>, 3:00 pm" sin el servicio
Then recibe "No pude guardar la cita: falta el servicio…" con el ejemplo de cómo escribirla
And la cita no queda guardada
```

#### AC-2 · Teléfono inválido
```gherkin
Given la dueña escribe desde su número registrado
When envía una cita completa con el teléfono "12345"
Then recibe "No pude guardar la cita: el teléfono debe tener 10 dígitos y empezar por 3. Ejemplo: 3001234567"
```

#### AC-3 · Día y hora que ya pasaron
```gherkin
Given la dueña escribe desde su número registrado
When envía una cita completa para el 10/01/2020 a las 3:00 pm
Then recibe "No pude guardar la cita: … ya pasó. Revisa el día y la hora."
```

#### AC-4 · Cita repetida
```gherkin
Given la dueña registró una cita para un teléfono, un día lejano con año y las 4:00 pm, y recibió la confirmación
When envía otra vez la misma cita con el mismo teléfono, día y hora
Then recibe "Esa cita ya estaba guardada para <día> a las 4:00 p. m. No hice cambios."
```

### Verificación técnica

- **Eventos / respuestas:** `R-02`, `R-03`, `R-04`, `R-05`. Orden: datos completos → teléfono → hora sin ambigüedad → fecha futura → duplicada → guardar (contrato §3.1.1).
- **Invariantes:** Inv-CIT-03 (nunca se guarda una cita pasada), Inv-CIT-04 (única por salón, teléfono e inicio).
- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** una hora de hoy que ya pasó se rechaza con `R-04` (depende del reloj).

### Notas

- **Dependencias:** H2 (AC-4 usa una cita registrada).

## H4 · Aclarar si la hora es de mañana o de noche

**Status:** Ready
**Estimación:** 3

### Historia

**Como** dueña de un salón
**Quiero** que el chat me pregunte si las 7, las 8 o las 9 son de la mañana o de la noche cuando no lo escribí
**Para** que la cita no quede a una hora equivocada y la clienta no reciba un recordatorio errado

### Cross-references

- **PRD:** §5 US-01 (criterio 1.1)
- **RFC:** §1.2 RF-01
- **ADRs aplicables:** ADR-008
- **Endpoints:** contrato §3.1.1.1 (lectura de la hora) · respuesta R-13 (§3.2)
- **Entidades:** Cita, Inicio
- **Controles seguridad:** security-design §6.2
- **Observabilidad:** observability-design §1.2 (los 10 s se miden desde la aclaración)

### Criterios de aceptación (funcionales)

#### AC-1 · El chat pregunta antes de guardar
```gherkin
Given la dueña escribe desde su número registrado
When envía una cita completa para un día lejano con año a las "8"
Then recibe "¿A las 8 de la mañana o de la noche? Responde mañana o noche y guardo la cita."
And la cita todavía no queda guardada
```

#### AC-2 · La respuesta completa el registro
```gherkin
Given el chat le preguntó a la dueña si las 8 son de la mañana o de la noche
When responde "noche"
Then recibe la confirmación de cita guardada con la hora "8:00 p. m."
```

#### AC-3 · Las horas sin duda no se preguntan
```gherkin
Given la dueña escribe desde su número registrado
When envía una cita completa para un día lejano con año a las "3"
Then recibe la confirmación de cita guardada con la hora "3:00 p. m." sin ninguna pregunta
```

### Verificación técnica

- **Reglas:** 12 = mediodía; 1 a 6 = p. m.; 10 y 11 = a. m.; 7, 8 y 9 → `R-13` (contrato §3.1.1.1). Resultado intermedio `pendiente_aclaracion`.
- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** la aclaración se descarta sin guardar si pasan 30 minutos; un comando nuevo en lugar de la aclaración la descarta; un texto que no es ni mañana ni noche repite `R-13`.
- **Riesgo:** la lectura de 1 a 6 y de 10 y 11 es `[ASUNCIÓN SIN EVIDENCIA]`.

### Notas

- **Dependencias:** H2, H3 (tras la aclaración corren las validaciones de fecha pasada y cita repetida).

## H5 · Solo la dueña da órdenes al chat

**Status:** Ready
**Estimación:** 2

### Historia

**Como** dueña de un salón
**Quiero** que solo mi número registrado pueda registrar, cancelar o pedir la vista
**Para** que nadie más vea ni cambie las citas de mi salón

### Cross-references

- **PRD:** §5 US-01 (criterios 1.4, 1.9) · §6 Seguridad
- **RFC:** §1.2 RF-03
- **ADRs aplicables:** ADR-006 (identidad por número, salón deducido del remitente)
- **Endpoints:** POST /webhook/meta (verificación de firma, §2.2) · clasificación del remitente (§3)
- **Entidades:** Salón, numero_duena, Contacto de clienta
- **Controles seguridad:** security-design §4.1, §4.2, §6.1
- **Observabilidad:** observability-design §1.2 (mensajes de número no registrado, sin datos personales)

### Criterios de aceptación (funcionales)

#### AC-1 · Un número desconocido no recibe respuesta
```gherkin
Given un número de prueba que no es la dueña de ningún salón y no tiene citas
When envía "Cita: Laura Gómez, 3001234567, tinte, <día lejano con año>, 3:00 pm" y después "Vista"
Then no recibe ninguna respuesta
```

#### AC-2 · Una clienta que escribe una orden tampoco recibe respuesta
```gherkin
Given la dueña registró una cita para un número de clienta de prueba en un día lejano con año
When desde ese número de clienta se envía "Cancelar: <nombre de la clienta>, <ese día>, <esa hora>"
Then la clienta no recibe ninguna respuesta
And cuando la dueña vuelve a enviar esa misma cita, recibe "Esa cita ya estaba guardada para <día> a las <hora>. No hice cambios."
```

#### AC-3 · Un mensaje que no viene de WhatsApp no tiene efecto
```gherkin
Given un mensaje con una orden de registro que no llega firmado por WhatsApp
When llega a TurnoFácil
Then no se guarda ninguna cita y nadie recibe respuesta
```

### Verificación técnica

- **Endpoints:** POST /webhook/meta responde 401 sin firma `X-Hub-Signature-256` válida y no encola (§2.2) · GET /webhook/meta 403 con token incorrecto (§2.1).
- **AC-3 se comprueba con pruebas automatizadas:** requiere firmar o no firmar peticiones con el secreto de Meta, que la plataforma no tiene. Cubierto por pruebas automatizadas (no se comprueba tras el despliegue).
- **AC-2:** la orden de la clienta se registra como `RespuestaNoEntendida` sin efecto (§3, Inv-CIT-06). Que la cita sigue guardada se comprueba con el aviso de cita repetida de H3.
- **ADRs:** ADR-006, ADR-007.

### Notas

- **Dependencias:** H2, H3 (AC-2).
- **Out of scope:** varios números por salón (un solo número por salón, PRD §6).

## H6 · Cancelar una cita por chat

**Status:** Ready
**Estimación:** 3

### Historia

**Como** dueña de un salón
**Quiero** cancelar una cita escribiendo el nombre de la clienta, el día y la hora
**Para** que a la clienta no le lleguen recordatorios de una cita que ya no existe

### Cross-references

- **PRD:** §5 US-01 (criterio 1.3)
- **RFC:** §1.2 RF-02 · flujo F2
- **ADRs aplicables:** ADR-003 (los recordatorios pendientes se omiten), ADR-008
- **Endpoints:** comando Cancelar §3.1.2 · respuestas R-08, R-09, R-09b (§3.2)
- **Entidades:** Cita, estado `cancelada_duena`, Recordatorio (`omitido`)
- **Controles seguridad:** security-design §4.2 (solo citas del salón del remitente)
- **Observabilidad:** eventos `CitaCanceladaPorLaDueña`, `CancelacionNoEncontrada`

### Criterios de aceptación (funcionales)

#### AC-1 · La cita queda cancelada y la dueña recibe la confirmación
```gherkin
Given la dueña registró "Cita: Marta Díaz, <teléfono de prueba>, uñas, <día lejano con año>, 2:00 pm" y recibió la confirmación
When envía "Cancelar: Marta Díaz, <ese día>, 2:00 pm"
Then recibe "Listo, cancelé la cita de Marta Díaz del <día> a las 2:00 p. m. No le enviaremos más recordatorios."
And la clienta no recibe ningún mensaje por la cancelación
```

#### AC-2 · No se encontró la cita
```gherkin
Given la dueña escribe desde su número registrado
When envía "Cancelar: Nadia Inexistente, <día lejano con año>, 6:00 pm" sin haber registrado esa cita
Then recibe "No encontré una cita de Nadia Inexistente el <día> a las 6:00 p. m. Revisa el nombre, el día y la hora."
```

#### AC-3 · Dos clientas con el mismo nombre a la misma hora
```gherkin
Given la dueña registró dos citas de "Sofía Pérez" con teléfonos distintos para el mismo día lejano a las 5:00 pm
When envía "Cancelar: Sofía Pérez, <ese día>, 5:00 pm"
Then recibe "Hay más de una cita con ese nombre a esa hora. Escríbelo con el teléfono: …"
And cuando envía la cancelación con el teléfono de una de ellas, recibe la confirmación de cancelación solo de esa cita
```

#### AC-4 · Una cita que ya pasó no se puede cancelar
```gherkin
Given una cita del salón cuya hora de inicio ya pasó
When la dueña envía la cancelación de esa cita
Then recibe "No encontré una cita de <clienta> el <día> a las <hora>. Revisa el nombre, el día y la hora."
```

### Verificación técnica

- **Estados cancelables:** `guardada`, `confirmada`, `cancelada_clienta`. Un estado final cuenta como no encontrada (domain-model §6, punto 1; contrato §3.1.2).
- **Efecto:** `CitaCanceladaPorLaDueña`; los recordatorios pendientes pasan a `omitido`; no se avisa a la clienta (US-01·1.3).
- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** AC-4, porque crear una cita pasada exige esperar a que llegue su inicio (Inv-CIT-03 no deja guardarla en el pasado); cancelar una cita `confirmada` o `cancelada_clienta` (necesita un recordatorio enviado, ver H9); los recordatorios cancelados no salen (H8); error al guardar → `R-07`.
- **Cambio pendiente:** CP-01 (mensaje propio "Esa cita ya pasó; no se puede cancelar"). No se implementa en esta historia.
- **RF-12:** `CitaCanceladaPorLaDueña` y `CancelacionNoEncontrada` quedan en la historia de la cita.

### Notas

- **Dependencias:** H2.
- **Out of scope:** avisar a la clienta que la dueña canceló (decisión del PRD); mensaje propio para citas pasadas (CP-01).

## E3 · Vista de la dueña

## H7 · Pedir la vista de confirmadas y sin confirmar

**Status:** Ready
**Estimación:** 5

### Historia

**Como** dueña de un salón
**Quiero** pedir por el chat las citas de un día, separadas en confirmadas y sin confirmar
**Para** saber a quién no tengo que escribirle

### Cross-references

- **PRD:** §5 US-03 (criterios 3.1 a 3.8)
- **RFC:** §1.2 RF-08 · flujo F3
- **ADRs aplicables:** ADR-008
- **Endpoints:** comando Vista §3.1.3 · respuestas R-10, R-11, R-12 (§3.2)
- **Entidades:** Lista de confirmadas, Lista de sin confirmar, Estado de la cita
- **Controles seguridad:** security-design §4.2 (solo citas del salón del remitente; nunca de otro salón)
- **Observabilidad:** observability-design §1.2 (latencia de la vista < 10 s)

### Criterios de aceptación (funcionales)

#### AC-1 · Vista de un día indicado
```gherkin
Given la dueña registró dos citas para un mismo día lejano con año, a las 4:00 pm y a las 10:00 am
When envía "Vista <ese día>"
Then recibe "Citas del <día>" con las dos citas en "Sin confirmar", ordenadas por hora, cada una como "<hora> · <clienta> · <servicio>"
And la respuesta llega en menos de 10 segundos
```

#### AC-2 · Sin día, la vista es de mañana
```gherkin
Given la dueña escribe desde su número registrado
When envía "Vista"
Then recibe la vista o el aviso de que no hay citas, y en los dos casos el día que nombra es el de mañana
```

#### AC-3 · Día sin citas
```gherkin
Given la dueña no registró citas para un día lejano con año
When envía "Vista <ese día>"
Then recibe "No tienes citas el <día>."
```

#### AC-4 · Día que no se entiende
```gherkin
Given la dueña escribe desde su número registrado
When envía "Vista el otro jueves por la tarde"
Then recibe "No entendí el día. Escribe Vista para mañana o Vista 28/11 para otro día."
And no recibe ninguna lista
```

#### AC-5 · Una cita cancelada por la dueña no aparece
```gherkin
Given la dueña registró dos citas para un día lejano con año y canceló una de ellas
When envía "Vista <ese día>"
Then la cita cancelada no aparece en ninguna de las dos listas
And la otra cita aparece en "Sin confirmar"
```

### Verificación técnica

- **Listas:** Confirmadas = `confirmada`, `confirmada_cerrada`. Sin confirmar = `guardada`, `sin_confirmar`, `cancelada_clienta`, `cancelada_clienta_cerrada`. `cancelada_duena` no aparece (RB-10). Lista vacía → "— ninguna" (§3.1.3, R-10).
- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** una cita confirmada aparece en "Confirmadas" y una cancelada o no entendida por la clienta aparece en "Sin confirmar" (US-03·3.3, 3.4; necesitan un recordatorio enviado, ver H9); la vista nunca se envía sin pedirla (US-03·3.6).
- **AC-2** no depende de datos: solo mira el día que nombra la respuesta.

### Notas

- **Dependencias:** H2, H6 (AC-5).

## E4 · Recordatorios y respuestas de la clienta

## H8 · Enviar los dos recordatorios a la clienta

**Status:** Ready
**Estimación:** 8

### Historia

**Como** dueña de un salón
**Quiero** que la clienta reciba un recordatorio el día antes y otro 2 horas antes de su cita
**Para** que llegue a su hora sin que yo tenga que escribirle

### Cross-references

- **PRD:** §5 US-02 (criterios 2.1, 2.2, 2.8) · §6 Rendimiento (retraso máximo 5 min)
- **RFC:** §1.2 RF-04, RF-05 · §5 decisión 1 (hora exacta)
- **ADRs aplicables:** ADR-002 (plantillas de Meta tras el puerto de canal), ADR-003 (evento exacto + vigilante), ADR-004 (reintentos acotados y alerta)
- **Endpoints:** plantillas `recordatorio_dia_antes_v1`, `recordatorio_dos_horas_v1` (§3.4) · puerto `CanalWhatsApp` (§4.1) · cargas de eventos programados (§4.3) · estados de entrega por POST /webhook/meta
- **Entidades:** Recordatorio 1, Recordatorio 2, nombre del salón
- **Controles seguridad:** security-design §2.5 (cargas sin datos personales)
- **Observabilidad:** alertas por recordatorio que no sale, que sale con más de 5 min de retraso o que no se entrega (PRD §6; observability-design D12-3)

### Criterios de aceptación (funcionales)

#### AC-1 · Al guardar, la dueña sabe que saldrán los recordatorios
```gherkin
Given la clienta no se dio de baja
When la dueña registra una cita para un día lejano con año
Then la confirmación termina con "Le enviaremos los recordatorios."
```

#### AC-2 · Recordatorio del día antes
```gherkin
Given una cita guardada para el sábado a las 3:00 pm
When llegan las 6:00 pm del viernes, hora de Colombia
Then la clienta recibe "Hola <clienta>, te recordamos tu cita de <servicio> en <nombre del salón> mañana a las 3:00 p. m. …"
```

#### AC-3 · Recordatorio de 2 horas antes, aunque ya haya confirmado
```gherkin
Given una cita guardada para hoy a las 3:00 pm que la clienta ya confirmó
When llega la 1:00 pm
Then la clienta recibe "Hola <clienta>, tu cita de <servicio> en <nombre del salón> es hoy a las 3:00 p. m. …"
```

#### AC-4 · Si un momento ya pasó, sale solo el que falta
```gherkin
Given son las 8:00 pm y la dueña registra una cita para mañana a las 3:00 pm
When llega la 1:00 pm de mañana
Then la clienta recibe solo el recordatorio de 2 horas antes
```

#### AC-5 · Una cita cancelada no recibe recordatorios
```gherkin
Given la dueña canceló una cita antes del primer recordatorio
When llega la hora de los recordatorios
Then la clienta no recibe ninguno
```

#### AC-6 · Retraso máximo de 5 minutos
```gherkin
Given el canal de WhatsApp falla de forma pasajera a la hora de un recordatorio
When se recupera antes de 5 minutos
Then la clienta recibe el recordatorio una sola vez, con menos de 5 minutos de retraso
```

### Verificación técnica

- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** AC-2 a AC-6. Todos dependen del reloj (18:00 America/Bogotá del día anterior; inicio − 2 h) o de fallas simuladas del canal. Pueden usar fechas fijas.
- **Programación:** un evento de una sola ejecución por recordatorio, nombre determinista `rec-<cita>-<tipo>`, carga con identificadores opacos (RFC §5, ADR-003). Vigilante cada minuto con reserva atómica contra duplicados.
- **Invariantes:** Inv-REC-02 (no se crea un recordatorio cuya hora ya pasó), Inv-REC-05 (pasados 5 min queda `incumplido`).
- **Errores del canal:** `transitorio` → reintento a 10 s y 30 s, luego el vigilante; `permanente` → `no_entregable` y `MensajeNoEntregado` (§4.1, ADR-004).
- **Riesgo externo:** las plantillas dependen de la aprobación de Meta (RFC A1); el costo por mensaje sigue sin validar (PRD §7).
- **RF-12:** cada envío y su estado de entrega quedan en la historia de la cita.

### Notas

- **Dependencias:** H2, H6 (AC-5).
- **Splitting:** el envío con reintentos (AC-6) podría separarse si la estimación supera 8 en el plan.

## H9 · La clienta confirma o cancela respondiendo

**Status:** Ready
**Estimación:** 5

### Historia

**Como** dueña de un salón
**Quiero** que la clienta pueda responder al recordatorio para confirmar o cancelar
**Para** saber quién viene sin tener que perseguir a nadie

### Cross-references

- **PRD:** §5 US-02 (criterios 2.3, 2.4, 2.6, 2.7)
- **RFC:** §1.2 RF-06, RF-10 · flujo F4
- **ADRs aplicables:** ADR-008 (palabras reconocidas), ADR-009 (orden por persona)
- **Endpoints:** respuestas de la clienta §3.3 · POST /webhook/meta
- **Entidades:** Última respuesta válida, Cierre de la cita, estados `confirmada`, `cancelada_clienta`, `sin_confirmar`, `confirmada_cerrada`, `cancelada_clienta_cerrada`
- **Controles seguridad:** security-design §4.2 (la respuesta solo afecta citas del teléfono que escribe)
- **Observabilidad:** eventos de respuesta y `CitaCerrada` (events.md)

### Criterios de aceptación (funcionales)

#### AC-1 · Responder sin haber recibido un recordatorio no cambia nada
```gherkin
Given la dueña registró una cita para un día lejano con año para un número de clienta de prueba
When la clienta escribe "sí" antes de recibir ningún recordatorio
Then la clienta no recibe respuesta
And cuando la dueña pide la vista de ese día, la cita sigue en "Sin confirmar"
```

#### AC-2 · Confirmar
```gherkin
Given la clienta recibió un recordatorio de su cita
When responde "Sí" o "ok" o 👍
Then la cita aparece en "Confirmadas" cuando la dueña pide la vista de ese día
```

#### AC-3 · Cancelar
```gherkin
Given la clienta recibió un recordatorio de su cita
When responde "no puedo"
Then la cita aparece en "Sin confirmar" cuando la dueña pide la vista de ese día
```

#### AC-4 · Vale la última respuesta y una respuesta no entendida no cambia nada
```gherkin
Given la clienta confirmó su cita
When después escribe "a qué hora era?"
Then la cita sigue confirmada y nadie recibe un mensaje por eso
```

#### AC-5 · Al llegar la hora, el estado queda fijo
```gherkin
Given la clienta no respondió ningún recordatorio
When llega la hora de su cita y después escribe "confirmo"
Then la cita queda "sin confirmar" y la respuesta tardía no la cambia
```

### Verificación técnica

- **Clasificación:** `baja` → `cancela` → `confirma` → `no_entendida`, sobre texto normalizado (§3.3). Cita asociada: la del recordatorio citado; si no, la del recordatorio más reciente; si no hay recordatorio enviado, se registra sin efecto (RFC A7).
- **A la clienta no se le responde** al confirmar, cancelar o no entender (§3.3).
- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** AC-2 a AC-5. Necesitan un recordatorio ya enviado o que llegue el inicio de la cita.
- **Invariantes:** Inv-CIT-05, Inv-CIT-06, Inv-CIT-07.
- **RF-12:** cada respuesta (aplicada o no) y `CitaCerrada` quedan en la historia de la cita.
- **Riesgo:** las palabras reconocidas son `[ASUNCIÓN SIN EVIDENCIA]` (PRD §5).

### Notas

- **Dependencias:** H7 (la vista muestra el resultado), H8 (los recordatorios).

## H10 · La clienta se da de baja

**Status:** Ready
**Estimación:** 3

### Historia

**Como** clienta de un salón
**Quiero** escribir "no más" o "stop" para dejar de recibir recordatorios
**Para** no recibir mensajes que no quiero

### Cross-references

- **PRD:** §5 US-02 (criterios 2.5, 2.9, 2.10, 2.11) · §6 Seguridad (riesgo de "baja" y "para")
- **RFC:** §1.2 RF-07 · flujo F5
- **ADRs aplicables:** ADR-006, ADR-007
- **Endpoints:** respuestas de la clienta §3.3 (clasificación `baja`) · respuestas R-20 y R-01b
- **Entidades:** Contacto de clienta (`dada_de_baja`), baja por teléfono en todos los salones
- **Controles seguridad:** security-design §8.1 (Ley 1581 de 2012)
- **Observabilidad:** evento `ClientaDadaDeBaja`

### Criterios de aceptación (funcionales)

#### AC-1 · La clienta se da de baja y recibe la confirmación
```gherkin
Given la dueña registró una cita para un día lejano con año para un número de clienta de prueba nuevo
When la clienta escribe "No más!!"
Then recibe "Listo, no te enviaremos más recordatorios de ningún salón que use TurnoFácil."
```

#### AC-2 · Una cita nueva de una clienta dada de baja avisa a la dueña
```gherkin
Given la clienta de prueba escribió "STOP" y recibió la confirmación de la baja
When la dueña registra otra cita para esa clienta en otro día lejano con año
Then recibe "Listo ✅ Cita guardada: … Ojo: esta clienta pidió no recibir mensajes, así que no le enviaremos recordatorios."
```

#### AC-3 · "Baja" y "para" no dan de baja
```gherkin
Given la dueña registró una cita para un número de clienta de prueba nuevo
When la clienta escribe "baja" y después "para"
Then la clienta no recibe ninguna respuesta
And cuando la dueña registra otra cita para esa clienta, recibe la confirmación normal que dice "Le enviaremos los recordatorios."
```

#### AC-4 · Las citas de una clienta dada de baja quedan en "Sin confirmar"
```gherkin
Given la dueña registró una cita para un día lejano con año y después la clienta escribió "stop"
When la dueña pide la vista de ese día
Then la cita aparece en "Sin confirmar"
```

#### AC-5 · La clienta dada de baja no recibe recordatorios de ningún salón
```gherkin
Given una clienta dada de baja tiene citas en dos salones
When llega la hora de sus recordatorios
Then no recibe ninguno
```

### Verificación técnica

- **Clasificación:** el texto normalizado es exactamente "no mas" o "stop", o empieza con ellas seguido solo de emojis (§3.3). La baja no cambia el estado de ninguna cita (Inv-CON-04).
- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** AC-5 (depende del reloj y de un segundo salón).
- **Riesgo:** texto de R-20 y lista de palabras sujetos a validación legal (domain-model §6, punto 3; PRD §9).
- **RF-12:** `ClientaDadaDeBaja` se registra con `telefono_seudonimo`, nunca el teléfono (ADR-007).

### Notas

- **Dependencias:** H2, H7 (AC-4), H8.
- **Out of scope:** que la clienta se reactive sola (lo hace el equipo, H12).

## E5 · Aviso de cancelación

## H11 · Avisar a la dueña cuando una clienta cancela

**Status:** Ready
**Estimación:** 3

### Historia

**Como** dueña de un salón
**Quiero** recibir un aviso cuando una clienta cancela su cita
**Para** intentar llenar el hueco por mi cuenta

### Cross-references

- **PRD:** §5 US-04 (criterio 4.1) · prioridad baja: es lo primero que se corta
- **RFC:** §1.2 RF-09 · flujo F4 A2b
- **ADRs aplicables:** ADR-002 (plantilla `aviso_a_duena_v1`), ADR-004
- **Endpoints:** plantilla `aviso_a_duena_v1` (§3.4) · puerto `CanalWhatsApp` (§4.1)
- **Entidades:** Cita (`cancelada_clienta`), Salón
- **Controles seguridad:** security-design §4.2 (el aviso va solo al número de la dueña del salón de la cita)
- **Observabilidad:** envío del aviso y estado de entrega

### Criterios de aceptación (funcionales)

#### AC-1 · Escribir "cancelo" sin recordatorio no genera aviso
```gherkin
Given la dueña registró una cita para un día lejano con año para un número de clienta de prueba
When la clienta escribe "cancelo" antes de recibir ningún recordatorio
Then la dueña no recibe ningún aviso
And la cita sigue en "Sin confirmar" cuando la dueña pide la vista de ese día
```

#### AC-2 · La dueña recibe el aviso de cancelación
```gherkin
Given la clienta recibió un recordatorio de su cita
When responde "cancelo"
Then la dueña recibe "Aviso TurnoFácil: <clienta> canceló su cita de <servicio> del <día> a las <hora>."
```

#### AC-3 · La dueña recibe el aviso si la clienta vuelve a confirmar
```gherkin
Given la clienta canceló su cita respondiendo a un recordatorio
When después responde "sí" antes de la hora de la cita
Then la dueña recibe "Aviso TurnoFácil: <clienta> volvió a confirmar su cita de <servicio> del <día> a las <hora>."
```

### Verificación técnica

- **Sin anticipación mínima:** el aviso sale para cualquier cancelación antes del inicio (RFC RF-09).
- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** AC-2 y AC-3 (necesitan un recordatorio ya enviado).
- **Riesgo:** única función que depende de una hipótesis no probada (PRD §4); la plantilla depende de la aprobación de Meta.

### Notas

- **Dependencias:** H9.
- **Out of scope:** ofrecer el hueco a otras clientas o a una lista de espera (PRD §4).

## E6 · Soporte del equipo

## H12 · Operaciones de soporte del equipo

**Status:** Ready
**Estimación:** 5

### Historia

**Como** integrante del equipo de TurnoFácil
**Quiero** cambiar el número de una dueña, reactivar a una clienta dada de baja o borrar los datos de una clienta cuando la dueña lo pide, dejando registro de cada acceso
**Para** resolver esos pedidos sin tocar datos a mano y cumpliendo la ley de datos personales

### Cross-references

- **PRD:** §6 Seguridad y privacidad (acceso del equipo registrado; borrado a pedido) · §6 Observabilidad (alerta por acceso del equipo)
- **RFC:** §1.2 RF-11 · flujo F5
- **ADRs aplicables:** ADR-006 (cambio de número con identidad confirmada), ADR-007 (auditoría de soporte)
- **Endpoints:** Frontera D · Lambda Soporte (§5): `cambiar_numero`, `reactivar_clienta`, `borrar_datos_clienta`
- **Entidades:** Salón, Contacto de clienta, evento de auditoría
- **Controles seguridad:** security-design §2.10, §4.2, §8.1
- **Observabilidad:** `AccesoDelEquipoRegistrado` y alerta 4 del PRD §6 (D12-3: correo y SMS al fundador)

### Criterios de aceptación (funcionales)

#### AC-1 · Una clienta reactivada vuelve a recibir recordatorios
```gherkin
Given una clienta de prueba escribió "stop" y el equipo la reactivó a pedido de la dueña
When la dueña registra una cita nueva para esa clienta en un día lejano con año
Then recibe la confirmación normal que dice "Le enviaremos los recordatorios."
```

#### AC-2 · Cambio de número solo con identidad confirmada
```gherkin
Given una dueña pidió cambiar su número y el fundador no confirmó su identidad por otro medio
When el equipo intenta el cambio
Then el cambio no se hace y el equipo ve que falta confirmar la identidad
And cuando la identidad está confirmada, el número nuevo puede registrar citas y el viejo ya no recibe respuesta
```

#### AC-3 · Borrar los datos de una clienta
```gherkin
Given una clienta pidió a la dueña borrar sus datos
When el equipo ejecuta el borrado para ese salón
Then la vista de la dueña ya no muestra el nombre de esa clienta
And si la clienta estaba dada de baja, la baja se conserva
```

#### AC-4 · Cada acceso del equipo queda registrado y avisado
```gherkin
Given alguien del equipo asume el acceso de soporte
When ejecuta cualquier operación
Then queda registrado quién, cuándo, a pedido de qué salón y por qué
And el fundador recibe el aviso de acceso del equipo
```

### Verificación técnica

- **Operaciones y errores:** `identidad_no_confirmada`, `numero_en_uso`, `salon_no_existe`, `contacto_no_dado_de_baja`, `sin_datos`, `datos_invalidos` (§5).
- **Interfaz:** la Lambda Soporte no tiene ruta HTTP pública y solo se invoca con el rol de soporte (ADR-007, RB-12).
- **Cubierto por pruebas automatizadas (no se comprueba tras el despliegue):** AC-1 a AC-4. Las operaciones de soporte no tienen ruta pública (§5) y la Frontera E no las expone (§10). Vacío señalado en "Condiciones para comprobar tras el despliegue".
- **Auditoría:** el evento guarda `telefono_seudonimo`, nunca el teléfono (Inv-AUD-03); `cambiar_numero` exige `identidad_confirmada` (Inv-AUD-04).
- **Alta de salón:** la misma Lambda con `alta_salon`; es configuración, no historia del producto.

### Notas

- **Dependencias:** H2, H10.
- **Riesgo:** es la historia con menos verificación desde afuera; ver "Condiciones para comprobar tras el despliegue".
