# API Contract · TurnoFácil

**Date:** 2026-11-25
**Versión del contrato:** 1.1.0 (agrega la Frontera E, § 10)
**RFC base:** docs/RFC.md § 2.1 (contenedores, servicios, integraciones, puntualidad y fallos)
**Domain model base:** docs/domain-model.md (§ 2 Ubiquitous Language, § 3 agregados, § 4 eventos)
**ADRs:** ADR-002 (canal tras puerto), ADR-003 (evento exacto + vigilante), ADR-004 (reintentos), ADR-006 (identidad por número), ADR-007 (registros sin datos personales), ADR-008 (intérprete determinista), ADR-009 (cola FIFO)
**Documentos hermanos:** docs/events.md · docs/integration-flows.md

---

## Resumen para decidir

- TurnoFácil no tiene pantalla web ni app propia: la dueña y la clienta solo usan WhatsApp. Por eso este contrato no es "frontend ↔ backend" sino **cuatro fronteras** donde se puede probar el sistema: **A** webhook de Meta, **B** mensajes de chat (comandos de la dueña, respuestas de la clienta, textos y plantillas), **C** puertos internos (canal de WhatsApp, repositorio y cargas de los eventos programados) y **D** operaciones de soporte. `[DECISIÓN ETAPA 10]`
- Solo en el ambiente de prueba existe además la **Frontera E · Canal emulado** (§ 10): permite enviar mensajes simulados de la dueña, de una clienta o de un número desconocido y leer lo que el sistema respondió, sin cuenta de Meta. En producción no existe. `[DECISIÓN ETAPA 10]`
- La dueña escribe con **palabra clave al inicio y datos separados por comas**: `Cita: Laura Gómez, 3001234567, tinte, 28/11, 3:00 pm` · `Cancelar: Laura Gómez, 28/11, 3:00 pm` · `Vista` o `Vista 28/11`. Se aceptan variaciones razonables de escritura. `[DECISIÓN ETAPA 10]`
- Los dos recordatorios dicen el **nombre del salón**, un dato fijo que carga el equipo al dar de alta el salón. Es un **agregado pendiente** al modelo de dominio aprobado (§ 8). `[DECISIÓN ETAPA 10]`
- Toda confirmación de guardado **repite la fecha y la hora interpretadas**, para que la dueña detecte un error de lectura del intérprete.
- Hora escrita sin a. m. ni p. m.: las 12 son mediodía, de 1 a 6 es tarde y las 10 y las 11 son mañana. Por las 7, las 8 y las 9 el sistema **pregunta** "¿mañana o noche?" antes de guardar (§ 3.1.1.1). `[DECISIÓN ETAPA 10]`
- Los textos de los mensajes son borradores. Las plantillas dependen de la aprobación de Meta (supuesto A1 del RFC), y el mensaje de baja depende además de la validación legal (domain-model § 6, punto 3).

**Marcas:** `[DECISIÓN ETAPA 10]` = decisión tomada con el fundador en esta etapa · `[DECISIÓN TÉCNICA ETAPA 10]` = decisión técnica interna tomada en esta etapa, informada al fundador · `[ASUNCIÓN SIN EVIDENCIA]` = sin validación en campo.

---

## 1. Convenciones

| Tema | Regla |
|---|---|
| Versionado | El contrato completo usa semver (`1.0.0`). Las plantillas de Meta llevan su propio sufijo de versión (`_v1`). Política en § 7 |
| Formato de datos internos | JSON, `snake_case` en los campos, nombres del Ubiquitous Language (domain-model § 2) sin traducir |
| Rutas HTTP | `kebab-case`. Solo existe una ruta pública: el webhook de Meta (§ 2). En el ambiente de prueba se suman las rutas `/prueba/canal-emulado/…` de la Frontera E (§ 10), que no existen en producción |
| Fechas y horas | ISO 8601 con desfase explícito de Colombia: `2026-11-28T15:00:00-05:00`. Zona fija `America/Bogota`, sin cambio de hora (RFC § 2.1.4) |
| Teléfono | Tipo `Telefono`: E.164 colombiano móvil, patrón `^\+573\d{9}$` |
| Identificadores | `SalonId`, `CitaId` y `EventoId` son opacos (ULID). `MensajeId` es el identificador de mensaje de Meta (`wamid.…`) |
| Datos personales | `nombre_clienta` y `telefono` solo viajan dentro de las fronteras B y C hacia el canal y el repositorio. **Nunca** en registros, cargas de eventos programados, eventos de auditoría ni métricas (RB-13, ADR-007). Cuando hace falta correlacionar un teléfono, se usa `telefono_seudonimo` (HMAC-SHA256 con clave en Secrets Manager, codificado en hex) |
| Autenticación | Frontera A: firma `X-Hub-Signature-256` de Meta. Frontera B: identidad por número remitente (ADR-006). Frontera D: rol IAM de soporte asumido de forma explícita (ADR-007). Frontera E: clave de prueba en el encabezado `X-Clave-Prueba`, solo en el ambiente de prueba (§ 10.6). Las fronteras internas (C) usan los permisos IAM mínimos de cada Lambda |
| Errores internos | Resultado tipado `{ ok: true, valor } | { ok: false, error: { codigo, detalle } }`. No se lanzan excepciones a través de un puerto. Los códigos están en § 6.4 |

---

## 2. Frontera A · Webhook de Meta (Receptor)

Lo expone el **Receptor** (Lambda) detrás de un API HTTP. No interpreta el contenido: verifica, descarta duplicados y deja el mensaje en la cola (RFC § 2.1.2; ADR-009).

### 2.1 GET /webhook/meta

**Descripción:** verificación de suscripción que Meta hace una vez al configurar el webhook.

**Query:**
| Campo | Tipo | Required | Constraints |
|---|---|---|---|
| hub.mode | string | yes | `subscribe` |
| hub.verify_token | string | yes | Igual al token guardado en Secrets Manager |
| hub.challenge | string | yes | Se devuelve tal cual |

**Response 200:** cuerpo `text/plain` con el valor de `hub.challenge`.

**Errors:**
| Code | When |
|---|---|
| 403 | `hub.mode` distinto de `subscribe` o token incorrecto |

### 2.2 POST /webhook/meta

**Descripción:** recibe mensajes entrantes (de la dueña, de la clienta o de un número no registrado) y estados de entrega de los mensajes enviados.

**Headers:**
| Header | Required | Regla |
|---|---|---|
| X-Hub-Signature-256 | yes | `sha256=<hex>`: HMAC-SHA256 del cuerpo crudo con el secreto de la aplicación de Meta. Se compara en tiempo constante |
| Content-Type | yes | `application/json` |

**Request (forma de Meta, recortada a los campos que se usan):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "metadata": { "phone_number_id": "1234567890" },
        "messages": [{
          "id": "wamid.HBgM...",
          "from": "573001234567",
          "timestamp": "1764356400",
          "type": "text",
          "text": { "body": "Cita: Laura Gómez, 3001234567, tinte, 28/11, 3:00 pm" },
          "context": { "id": "wamid.REC..." }
        }],
        "statuses": [{
          "id": "wamid.REC...",
          "status": "failed",
          "timestamp": "1764356460",
          "errors": [{ "code": 131026 }]
        }]
      }
    }]
  }]
}
```

**Tratamiento:**
1. Firma inválida o ausente → no se encola nada y no se responde a nadie por WhatsApp (base de US-01·1.9).
2. Por cada elemento de `messages` y `statuses` se arma un `MensajeEntrante` o un `EstadoDeEntregaEntrante` (§ 6.2) y se encola en la **cola FIFO de entrantes**, con:
   - `MessageGroupId` = `telefono_seudonimo` del remitente (para mensajes) o `estado-<MensajeId>` (para estados). El orden queda garantizado por persona sin poner el teléfono en claro en los atributos de la cola. `[DECISIÓN TÉCNICA ETAPA 10]`
   - `MessageDeduplicationId` = `MensajeId` (mensajes) o `MensajeId:status` (estados). Una reentrega de Meta no duplica.
3. Responde 200 en cuanto termina de encolar, sin esperar el procesamiento.

Tipos de mensaje distintos de `text` (audio, imagen, sticker): se encolan con `texto: null` y el intérprete los trata como no entendidos. La única excepción es el emoji 👍 en una **reacción** (`type: "reaction"`), que se normaliza a texto `👍` porque es palabra de confirmación (domain-model § 2.2).

**Response 200:** cuerpo vacío.

**Errors:**
| Code | When |
|---|---|
| 401 | Firma inválida o ausente. No se encola |
| 400 | Cuerpo que no es JSON o sin `entry`. No se encola |
| 500 | La cola no aceptó el mensaje. Meta reintenta; la deduplicación evita duplicar |

---

## 3. Frontera B · Mensajes de chat

Lo interpreta el **Procesador** con el intérprete determinista del dominio (ADR-008). Primero clasifica al remitente (RB-01):

| Remitente | Cómo se reconoce | Qué se interpreta |
|---|---|---|
| Dueña | `from` coincide con el `numero_duena` de un salón. El `salon_id` sale de ahí, nunca del texto (ADR-006) | Comandos de § 3.1 |
| Clienta | Cualquier otro número que tenga al menos una cita o un Contacto de clienta | Respuestas de § 3.3 |
| Número no registrado | Ninguno de los anteriores | Nada. No recibe respuesta, escriba lo que escriba (US-01·1.9) |

Un número que no es de la dueña y escribe un comando (`Cita:`, `Cancelar:`, `Vista`) **no recibe respuesta** aunque sea una clienta (US-01·1.4, 1.9). Para una clienta, ese texto se registra como respuesta no entendida.

### 3.1 Comandos de la dueña

**Normalización previa** (se aplica a todo el texto antes de interpretarlo):
- Mayúsculas y minúsculas indistintas. Tildes y diéresis ignoradas. Espacios múltiples reducidos a uno.
- La palabra clave puede ir seguida de `:` , `-` o un espacio: `Cita: …`, `cita - …`, `CITA …`.
- El separador de datos es la coma. También se acepta el salto de línea, para quien escribe un dato por renglón.

#### 3.1.1 Registrar

**Formato:** `Cita: <clienta>, <teléfono>, <servicio>, <día>, <hora>`
**Ejemplo:** `Cita: Laura Gómez, 3001234567, tinte, 28/11, 3:00 pm`
**Sinónimos aceptados de la palabra clave:** `cita`, `registrar`, `agendar`.

| Dato | Tipo de dominio | Reglas de lectura | Rechazo |
|---|---|---|---|
| clienta | `NombreClienta` | Texto tal como lo escribió la dueña, de 1 a 80 caracteres, recortado. Se guarda con sus mayúsculas y tildes originales (D9-3) | Falta → `R-02` |
| teléfono | `Telefono` | Se quitan espacios, guiones, puntos y paréntesis. Se aceptan `3001234567`, `+573001234567` y `573001234567`. Se normaliza a `+573001234567` | No son 10 dígitos que empiezan por 3 → `R-03` (US-01·1.8) |
| servicio | `Servicio` | Texto de 1 a 60 caracteres | Falta → `R-02` |
| día | parte fecha de `Inicio` | `dd/mm`, `d/m`, `dd/mm/aaaa`, `dd-mm`, `hoy`, `mañana`, `pasado mañana` o un día de la semana (`viernes` = el próximo viernes; si hoy es viernes, el de la semana siguiente). Para `dd/mm` sin año: se toma el año en curso; si esa fecha ya pasó y en el año siguiente cae dentro de los próximos 60 días, se toma el año siguiente (cubre diciembre → enero) `[DECISIÓN TÉCNICA ETAPA 10]` | No se entiende → `R-02`. Ya pasó → `R-04` (US-01·1.6) |
| hora | parte hora de `Inicio` | `3:00 pm`, `3pm`, `3 p. m.`, `3:30pm`, `15:00`, `15h`. Sin a. m. ni p. m., ver la regla de lectura de la hora (§ 3.1.1.1). La confirmación de guardado repite la hora interpretada | No se entiende → `R-02`. Ya pasó → `R-04`. Puede ser de mañana o de noche → `R-13` (no se guarda todavía) |

##### 3.1.1.1 Lectura de la hora sin a. m. ni p. m. `[DECISIÓN ETAPA 10]`

| Hora escrita | Se lee como | Ejemplo |
|---|---|---|
| 12 (con o sin minutos) | Mediodía | `12`, `12:30` → 12:00 m., 12:30 p. m. |
| 1 a 6 | p. m. | `3` → 3:00 p. m. |
| 10 y 11 | a. m. | `10:30` → 10:30 a. m. |
| 7, 8 y 9 | **No se supone.** Puede ser de mañana o de noche, porque hay salones que atienden hasta tarde. El sistema pregunta con `R-13` antes de guardar | `7` → "¿a las 7 de la mañana o de la noche?" |

El sistema no conoce el horario de cada salón, así que pregunta por las 7, las 8 y las 9 en todos los salones. Así se cumple que una hora que puede ser de mañana o de noche no se supone. La lectura de 1 a 6 y de 10 a 11 sigue siendo `[ASUNCIÓN SIN EVIDENCIA]`.

**Aclaración pendiente:**
- La cita **no se guarda** mientras falte la aclaración. El comando queda con resultado `pendiente_aclaracion` y conserva los datos ya validados (datos completos, teléfono).
- La respuesta de la dueña se acepta, sin importar mayúsculas ni tildes, como **mañana**: `mañana`, `de la mañana`, `am`, `a. m.`; o como **noche**: `noche`, `de la noche`, `tarde`, `pm`, `p. m.`. También vale reescribir la hora completa (`7 pm`, `19:00`).
- Con la respuesta se completan las validaciones que faltan (fecha y hora futuras, duplicada) y se responde `R-01`, `R-01b`, `R-04` o `R-05`. Los 10 s de la confirmación se miden desde la respuesta de aclaración.
- Si la dueña envía otro comando en lugar de aclarar, o pasan 30 minutos, la aclaración se descarta sin guardar nada. Un comando nuevo se procesa normalmente `[DECISIÓN TÉCNICA ETAPA 10]`.
- Un mensaje que no es ni mañana ni noche durante la aclaración repite `R-13`.

**Validaciones en orden** (la primera que falla define la respuesta): datos completos → teléfono → hora sin ambigüedad (si no, `R-13`) → fecha y hora futuras → duplicada (mismo salón, teléfono e inicio, Inv-CIT-04) → guardar.

**Resultado:** `CitaRegistrada` (events.md) y respuesta `R-01` o `R-01b`, en menos de 10 s `[ASUNCIÓN SIN EVIDENCIA]` (PRD § 6).

#### 3.1.2 Cancelar

**Formato:** `Cancelar: <clienta>, <día>, <hora>`
**Formato con desempate (opcional):** `Cancelar: <clienta>, <teléfono>, <día>, <hora>`
**Ejemplo:** `Cancelar: Laura Gómez, 28/11, 3:00 pm`
**Sinónimos aceptados:** `cancelar`, `cancela`, `anular`.

| Regla | Detalle |
|---|---|
| Búsqueda | En el salón del remitente, la cita cuyo `nombre_clienta` normalizado (sin tildes ni mayúsculas) coincide y cuyo `inicio` es exactamente el indicado |
| Estados cancelables | `guardada`, `confirmada`, `cancelada_clienta` (domain-model § 3.2). Una cita en estado final cuenta como no encontrada (domain-model § 6, punto 1) |
| Sin coincidencia | `CancelacionNoEncontrada` y respuesta `R-09` |
| Dos o más coincidencias (mismo nombre a la misma hora) | No cancela ninguna. Responde `R-09b` pidiendo el formato con teléfono `[DECISIÓN TÉCNICA ETAPA 10]` |
| Efecto | `CitaCanceladaPorLaDueña`: los recordatorios pendientes pasan a `omitido`, **no** se avisa a la clienta (US-01·1.3) y la dueña recibe `R-08` |

#### 3.1.3 Vista

**Formato:** `Vista` (mañana) · `Vista <día>` con los mismos formatos de día de § 3.1.1
**Sinónimos aceptados:** `vista`, `citas`, `agenda`.

| Regla | Detalle |
|---|---|
| Día por defecto | Mañana (US-03) |
| Listas | **Confirmadas:** `confirmada`, `confirmada_cerrada`. **Sin confirmar:** `guardada`, `sin_confirmar`, `cancelada_clienta`, `cancelada_clienta_cerrada`. `cancelada_duena` no aparece (RB-10) |
| Orden | Por hora de inicio |
| Línea por cita | `<hora> · <clienta> · <servicio>` |
| Sin citas | `R-11` |
| Día no entendido | `R-12` |
| Envío | Solo como respuesta a este comando. Nunca se envía sola (US-03) |

#### 3.1.4 Mensaje de la dueña que no es ningún comando

Responde `R-06` con los tres ejemplos de formato. No guarda nada.

### 3.2 Catálogo de respuestas a la dueña

Todas van como texto libre dentro de la ventana de atención de 24 h, porque responden a un mensaje de la dueña (supuesto A1 del RFC). Los textos son borradores; lo que fija el contrato son el código, el disparador y las variables.

| Código | Disparador | Variables | Texto borrador |
|---|---|---|---|
| R-01 | Cita guardada | clienta, servicio, dia_texto, hora_texto | `Listo ✅ Cita guardada: {clienta} · {servicio} · {dia_texto} · {hora_texto}. Le enviaremos los recordatorios.` |
| R-01b | Cita guardada, clienta dada de baja (US-02·2.9) | ídem | `Listo ✅ Cita guardada: {clienta} · {servicio} · {dia_texto} · {hora_texto}. Ojo: esta clienta pidió no recibir mensajes, así que no le enviaremos recordatorios.` |
| R-02 | Falta un dato o no se entiende día u hora | dato_faltante | `No pude guardar la cita: falta {dato_faltante}. Escríbela así: Cita: Laura Gómez, 3001234567, tinte, 28/11, 3:00 pm` |
| R-03 | Teléfono inválido | — | `No pude guardar la cita: el teléfono debe tener 10 dígitos y empezar por 3. Ejemplo: 3001234567` |
| R-04 | Fecha u hora ya pasaron | dia_texto, hora_texto | `No pude guardar la cita: {dia_texto} a las {hora_texto} ya pasó. Revisa el día y la hora.` |
| R-05 | Cita duplicada | dia_texto, hora_texto | `Esa cita ya estaba guardada para {dia_texto} a las {hora_texto}. No hice cambios.` |
| R-06 | Mensaje no entendido | — | `No entendí el mensaje. Puedes escribir:\n• Cita: Laura Gómez, 3001234567, tinte, 28/11, 3:00 pm\n• Cancelar: Laura Gómez, 28/11, 3:00 pm\n• Vista (o Vista 28/11)` |
| R-07 | Error al guardar un registro o una cancelación (RFC § 2.1.4) | — | `No pude guardar el cambio por un problema nuestro. Por favor repite el mensaje.` |
| R-08 | Cita cancelada por la dueña | clienta, dia_texto, hora_texto | `Listo, cancelé la cita de {clienta} del {dia_texto} a las {hora_texto}. No le enviaremos más recordatorios.` |
| R-09 | Cita a cancelar no encontrada | clienta, dia_texto, hora_texto | `No encontré una cita de {clienta} el {dia_texto} a las {hora_texto}. Revisa el nombre, el día y la hora.` |
| R-09b | Varias coincidencias al cancelar | — | `Hay más de una cita con ese nombre a esa hora. Escríbelo con el teléfono: Cancelar: Laura Gómez, 3001234567, 28/11, 3:00 pm` |
| R-10 | Vista con citas | dia_texto, lista_confirmadas, lista_sin_confirmar | `Citas del {dia_texto}\n\nConfirmadas:\n{lista_confirmadas}\n\nSin confirmar:\n{lista_sin_confirmar}` (si una lista está vacía: `— ninguna`) |
| R-11 | Vista sin citas | dia_texto | `No tienes citas el {dia_texto}.` |
| R-12 | Día de la vista no entendido | — | `No entendí el día. Escribe Vista para mañana o Vista 28/11 para otro día.` |
| R-13 | Hora de registro que puede ser de mañana o de noche (7, 8 o 9 sin a. m. ni p. m.) | hora | `¿A las {hora} de la mañana o de la noche? Responde mañana o noche y guardo la cita.` |

`dia_texto` = día de la semana abreviado y fecha (`vie 28/11`). `hora_texto` = formato de 12 horas con `a. m.`/`p. m.` (`3:00 p. m.`).

### 3.3 Respuestas de la clienta

**Normalización:** minúsculas, sin tildes ni diéresis, sin puntuación ni signos, espacios reducidos. Los emojis se conservan (Inv-RES-03).

| Clasificación | Regla de coincidencia (lista configurable, `[ASUNCIÓN SIN EVIDENCIA]`) | Efecto |
|---|---|---|
| `baja` | El texto normalizado es exactamente `no mas` o `stop`, o empieza con alguna de esas dos frases seguida de nada más que emojis | `ClientaDadaDeBaja` y mensaje de baja `R-20`. No cambia el estado de ninguna cita (Inv-CON-04) |
| `cancela` | El texto normalizado es `cancelo`, `cancelar` o `no puedo`, o empieza con una de ellas | `Cita.cancelarPorClienta` |
| `confirma` | El texto normalizado es `si`, `confirmo`, `listo`, `ok` o `👍`, o empieza con uno de ellos seguido de un espacio | `Cita.confirmarPorClienta` |
| `no_entendida` | Cualquier otra cosa, incluidos `baja` y `para` (US-02·2.10), audios e imágenes | `RespuestaNoEntendida`. No cambia nada (Inv-CIT-06) |

- **Orden de evaluación:** `baja` → `cancela` → `confirma`. Así, "no puedo" nunca se lee como confirmación y "no más" nunca como cancelación. `[DECISIÓN TÉCNICA ETAPA 10]`
- **Cita asociada:** la del recordatorio citado con "responder" (`context.id`). Si no cita ninguno, la del recordatorio enviado más recientemente a ese teléfono (supuesto A7 del RFC). Si el teléfono no tiene ningún recordatorio enviado, la respuesta se registra sin cita y sin efecto.
- **Respuesta a la clienta:** solo el mensaje de baja `R-20`. A `confirma`, `cancela` y `no_entendida` **no se le responde**, como en el flujo aprobado F4, que no tiene ese paso. Esto también ahorra costo de mensajes. `[DECISIÓN TÉCNICA ETAPA 10]`
- **Respuestas después del inicio:** se guardan con `aplicada: false` y no cambian el estado (Inv-CIT-07).

| Código | Disparador | Texto borrador (sujeto a validación legal, RB-08) |
|---|---|---|
| R-20 | Baja | `Listo, no te enviaremos más recordatorios de ningún salón que use TurnoFácil.` |

### 3.4 Plantillas (mensajes iniciados por TurnoFácil)

Se envían fuera de la ventana de atención y necesitan aprobación de Meta (supuesto A1 del RFC; ADR-002). Categoría recomendada: `UTILITY`. Idioma: `es`.

| Nombre de plantilla | Uso | Destinatario | Variables (en orden) | Texto borrador |
|---|---|---|---|---|
| `recordatorio_dia_antes_v1` | Recordatorio 1, a las 18:00 del día anterior | Clienta | 1 `clienta`, 2 `servicio`, 3 `nombre_salon`, 4 `hora_texto` | `Hola {{1}}, te recordamos tu cita de {{2}} en {{3}} mañana a las {{4}}. Responde SÍ para confirmar o CANCELO si no puedes ir. Si no quieres recibir más recordatorios, escribe STOP.` |
| `recordatorio_dos_horas_v1` | Recordatorio 2, 2 horas antes del inicio | Clienta | 1 `clienta`, 2 `servicio`, 3 `nombre_salon`, 4 `hora_texto` | `Hola {{1}}, tu cita de {{2}} en {{3}} es hoy a las {{4}}. Si no puedes ir, responde CANCELO. Para no recibir más recordatorios, escribe STOP.` |
| `aviso_a_duena_v1` | Aviso de cancelación y de reconfirmación (US-04·4.1; flujo F4 A2b) | Dueña | 1 `clienta`, 2 `accion` (`canceló` \| `volvió a confirmar`), 3 `servicio`, 4 `dia_texto`, 5 `hora_texto` | `Aviso TurnoFácil: {{1}} {{2}} su cita de {{3}} del {{4}} a las {{5}}.` |

- `nombre_salon` es el dato fijo del salón que se agrega en esta etapa (§ 8). `[DECISIÓN ETAPA 10]`
- El aviso a la dueña usa **una sola plantilla con la acción como variable**. Así se mantienen las tres plantillas del RFC (supuesto A1) y se cumple que el aviso de cancelación y el de reconfirmación se cortan juntos (Inv-AVI-03). `[DECISIÓN TÉCNICA ETAPA 10]`
- La línea de STOP en los recordatorios es un borrador para que la clienta sepa cómo darse de baja; su redacción final depende de la validación legal.
- Mientras la dueña tenga la ventana de 24 h abierta, el aviso igual se envía como plantilla. Es más simple que decidir entre texto y plantilla, y el costo con el volumen del piloto es marginal `[ASUNCIÓN SIN EVIDENCIA]`.

---

## 4. Frontera C · Puertos internos

Interfaces TypeScript del dominio (ADR-001). Son el contrato que deben cumplir los adaptadores: Meta hoy y Twilio como alternativa (ADR-002); el almacén queda por definir (ADR-005).

### 4.1 Puerto `CanalWhatsApp`

```ts
interface CanalWhatsApp {
  enviarPlantilla(p: {
    destino: Telefono;
    plantilla: 'recordatorio_dia_antes_v1' | 'recordatorio_dos_horas_v1' | 'aviso_a_duena_v1';
    variables: string[];          // en el orden de § 3.4
    referencia: ReferenciaEnvio;  // para registros, sin datos personales
  }): Promise<Resultado<EnvioAceptado, ErrorCanal>>;

  enviarTexto(p: {
    destino: Telefono;
    codigo: CodigoRespuesta;      // R-01 … R-20
    texto: string;
    referencia: ReferenciaEnvio;
  }): Promise<Resultado<EnvioAceptado, ErrorCanal>>;

  interpretarEntrante(crudo: unknown): MensajeEntrante[];             // § 6.2
  interpretarEstado(crudo: unknown): EstadoDeEntregaEntrante[];       // § 6.2
}

type EnvioAceptado = { mensaje_id: MensajeId; aceptado_en: string };
type ErrorCanal = { clase: 'transitorio' | 'permanente'; codigo_proveedor: string; detalle: string };
type ReferenciaEnvio = { salon_id: SalonId; cita_id?: CitaId; tipo_mensaje: TipoMensaje };
```

**Clasificación de errores** (ADR-004; la mantiene el adaptador):
| Clase | Casos en Meta | Qué hace el dominio |
|---|---|---|
| `transitorio` | Tiempo agotado, HTTP 5xx, HTTP 429, límite de velocidad (códigos 4, 80007, 130429, 131048, 131056) | Reintenta a los 10 s y 30 s; después lo toma el vigilante mientras el retraso sea menor a 300 s |
| `permanente` | Número sin WhatsApp o destinatario inválido (131026, 131030), plantilla rechazada o pausada (132000–132016), parámetros inválidos (100, 131008, 131009) | No reintenta. El recordatorio queda `no_entregable` y se emite `MensajeNoEntregado` |

Los códigos de Meta listados son la referencia inicial del adaptador y se verifican contra la documentación vigente de Meta al implementarlo. Twilio tendría su propia tabla con la misma salida.

### 4.2 Puerto `Repositorio`

Operaciones con nombre de negocio (RFC § 2.1.2). Toda operación de Agenda lleva `salon_id` (RB-02).

| Operación | Entrada | Salida | Propiedad exigida |
|---|---|---|---|
| `guardarCita` | `Cita` | `ok` \| `duplicada` | Unicidad por (`salon_id`, `telefono`, `inicio`) |
| `actualizarCita` | `Cita`, `version_esperada` | `ok` \| `conflicto` | Escritura condicional por versión |
| `buscarCitaPorId` | `cita_id` | `Cita?` | — |
| `buscarCitasParaCancelar` | `salon_id`, `nombre_normalizado`, `inicio`, `telefono?` | `Cita[]` | Solo estados cancelables |
| `listarCitasDelDia` | `salon_id`, `dia` | `Cita[]` | — |
| `buscarSalonPorNumero` | `Telefono` | `Salon?` | — |
| `obtenerContacto` / `marcarBaja` / `reactivar` | `Telefono` | `ContactoDeClienta` | Un solo contacto por teléfono (Inv-CON-01) |
| `guardarRecordatorio` | `Recordatorio` | `ok` | Uno por (`cita_id`, `tipo`) |
| `reservarEnvio` | `cita_id`, `tipo` | `ganada` \| `perdida` | Escritura condicional atómica `programado`/`reintentar` → `enviando` (Inv-REC-03) |
| `listarRecordatoriosVencidos` | `ahora`, `margen_s = 60` | `Recordatorio[]` | Consulta por (`estado`, `hora_programada`) |
| `registrarMensajeProcesado` | `mensaje_id` | `nuevo` \| `ya_procesado` | Idempotencia (Inv-CMD-01, Inv-RES-01) |
| `agregarEvento` | `EventoDeDominio` | `ok` | Solo agregar (historial de la cita, events.md) |
| `borrarDatosDeClienta` | `salon_id`, `Telefono` | `citas_afectadas: number` | Vacía `nombre_clienta` y `telefono`, marca `datos_borrados` |

### 4.3 Cargas de los eventos programados

EventBridge Scheduler invoca Lambdas con cargas que **solo llevan identificadores opacos** (RFC § 2.1.4; RB-13).

| Evento programado | Nombre del evento | Hora | Lambda destino | Carga |
|---|---|---|---|---|
| Recordatorio | `rec-<cita_id>-<tipo>` | `hora_programada`, sin ventana flexible | Emisor de recordatorios | `{ "version": 1, "cita_id": "01J…", "tipo": "dia_antes" }` |
| Cierre de cita | `cierre-<cita_id>` | `inicio` | Cierre de cita | `{ "version": 1, "cita_id": "01J…" }` |
| Vigilante | regla fija `vigilante-1m` | cada minuto | Vigilante | `{ "version": 1 }` |

- `tipo` ∈ `dia_antes` | `dos_horas_antes` (`TipoRecordatorio`).
- Crear un evento con un nombre que ya existe se trata como éxito: el reintento de un registro no duplica (RFC § 2.1.4).
- Al cancelar una cita se intenta borrar sus eventos programados. Si el borrado falla no pasa nada grave: el emisor vuelve a verificar el estado antes de enviar y deja el recordatorio en `omitido`.

---

## 5. Frontera D · Operaciones de soporte

Lambda **Soporte**, que solo se puede invocar con el rol de soporte (ADR-007; RB-12). No hay ruta HTTP pública. Asumir el rol emite `AccesoDelEquipoRegistrado` y dispara la alerta 4 del PRD § 6.

**Request común:**
```json
{
  "operacion": "cambiar_numero",
  "operador": "equipo:ana",
  "solicitado_por": "01JSALON...",
  "motivo": "Dueña perdió el teléfono, pidió el cambio por correo 2026-12-02",
  "datos": { }
}
```

| `operacion` | `datos` | Reglas | Evento emitido |
|---|---|---|---|
| `cambiar_numero` | `{ "nuevo_numero": "+573001112233", "identidad_confirmada": true }` | Sin `identidad_confirmada: true` no se ejecuta (Inv-AUD-04). El nuevo número no puede pertenecer a otro salón (Inv-SAL-02) | `NumeroDeDueñaCambiado` |
| `reactivar_clienta` | `{ "telefono": "+573001234567" }` | El contacto debe estar `dada_de_baja` | `ClientaReactivada` |
| `borrar_datos_clienta` | `{ "telefono": "+573001234567" }` | Solo en las citas del salón `solicitado_por`. El Contacto de clienta se conserva si está dado de baja o tiene citas en otros salones (domain-model § 6, punto 2) | `DatosDeClientaBorrados` |

**Response:**
```json
{ "ok": true, "evento_auditoria_id": "01JAUD...", "resultado": { "citas_afectadas": 3 } }
```

**Errores:**
| `codigo` | Cuándo |
|---|---|
| `identidad_no_confirmada` | `cambiar_numero` sin identidad confirmada |
| `numero_en_uso` | El nuevo número ya es de otro salón |
| `salon_no_existe` | `solicitado_por` no corresponde a un salón |
| `contacto_no_dado_de_baja` | Reactivar una clienta activa |
| `sin_datos` | No hay citas del salón con ese teléfono |
| `datos_invalidos` | Teléfono con formato inválido o campos faltantes |

El evento de auditoría guarda `telefono_seudonimo`, nunca el teléfono (Inv-AUD-03). El teléfono de la solicitud no queda en los registros de la Lambda.

**Alta de salón.** Es una tarea de configuración del equipo, no un comando del producto: crea el Salón con `numero_duena`, `nombre_salon` y `envio_activo: false`. Se hace con la misma Lambda (`operacion: "alta_salon"`, datos `{ "numero_duena", "nombre_salon" }`) y deja evento de auditoría. `[DECISIÓN TÉCNICA ETAPA 10]`

---

## 6. Schemas compartidos

Se definen una sola vez y se referencian desde las fronteras y desde events.md.

### 6.1 Value objects

| Tipo | Definición |
|---|---|
| `SalonId`, `CitaId`, `EventoId` | string ULID, 26 caracteres |
| `MensajeId` | string, identificador de Meta |
| `Telefono` | string `^\+573\d{9}$` |
| `TelefonoSeudonimo` | string hex de 64 caracteres (HMAC-SHA256) |
| `NombreClienta` | string 1–80 |
| `Servicio` | string 1–60 |
| `NombreSalon` | string 1–40 (agregado pendiente, § 8) |
| `Inicio`, `HoraProgramada` | string ISO 8601 con `-05:00` |
| `EstadoCita` | `guardada` \| `confirmada` \| `cancelada_clienta` \| `cancelada_duena` \| `sin_confirmar` \| `confirmada_cerrada` \| `cancelada_clienta_cerrada` |
| `TipoRecordatorio` | `dia_antes` \| `dos_horas_antes` |
| `EstadoRecordatorio` | `programado` \| `enviando` \| `reintentar` \| `enviado` \| `enviado_tarde` \| `omitido` \| `omitido_por_baja` \| `incumplido` \| `no_entregable` \| `no_entregado` |
| `CondicionClienta` | `activa` \| `dada_de_baja` |
| `Clasificacion` | `confirma` \| `cancela` \| `baja` \| `no_entendida` |
| `TipoComando` | `registrar` \| `cancelar` \| `vista` |
| `ResultadoComando` | `guardada` \| `cancelada` \| `no_encontrada` \| `vista_enviada` \| `sin_citas` \| `dia_no_entendido` \| `rechazado:<motivo>` \| `no_entendido` \| `error_al_guardar` \| `pendiente_aclaracion` (agregado pendiente, § 8) |
| `MotivoRechazo` | `dato_faltante` \| `telefono_invalido` \| `fecha_pasada` \| `duplicada` |
| `TipoAviso` | `cancelacion` \| `reconfirmacion` |
| `TipoMensaje` | `recordatorio_dia_antes` \| `recordatorio_dos_horas` \| `aviso_a_duena` \| `respuesta_duena` \| `mensaje_baja` |
| `CodigoRespuesta` | `R-01` … `R-13`, `R-20` (§ 3.2, § 3.3) |

### 6.2 Mensajes de la cola de entrantes

```json
// MensajeEntrante
{
  "version": 1,
  "mensaje_id": "wamid.HBgM...",
  "telefono_remitente": "+573001234567",
  "recibido_en": "2026-11-27T10:00:00-05:00",
  "texto": "Cita: Laura Gómez, 3001234567, tinte, 28/11, 3:00 pm",
  "responde_a": "wamid.REC..."
}
```
`texto` es `null` para audio, imagen y otros tipos. `responde_a` es `null` si la persona no usó "responder". La cola va cifrada (RFC § 2.2.2).

```json
// EstadoDeEntregaEntrante
{
  "version": 1,
  "mensaje_id": "wamid.REC...",
  "estado": "fallido",
  "ocurrido_en": "2026-11-27T18:00:40-05:00",
  "codigo_proveedor": "131026"
}
```
`estado` ∈ `enviado` | `entregado` | `leido` | `fallido`. Solo `fallido` cambia algo: el recordatorio o aviso pasa a `no_entregado` y se emite `MensajeNoEntregado`, sin reintento (ADR-004).

### 6.3 Agregados expuestos

Los campos de `Salon`, `Cita`, `Recordatorio`, `ContactoDeClienta`, `RespuestaDeClienta`, `AvisoADuena`, `ComandoDeLaDuena` y `EventoDeAuditoria` son exactamente los de domain-model § 3, con los nombres de campo de ese documento. La única adición es `Salon.nombre_salon` (§ 8).

### 6.4 Códigos de error internos

| `codigo` | Origen | Significado |
|---|---|---|
| `firma_invalida` | Receptor | Firma de Meta ausente o incorrecta |
| `remitente_no_autorizado` | Procesador | Comando desde un número que no es la dueña: se descarta en silencio |
| `rechazo:<MotivoRechazo>` | Dominio | Registro rechazado |
| `no_encontrada` / `ambigua` | Dominio | Cancelación sin coincidencia o con varias |
| `transicion_invalida` | Cita | Operación no permitida desde el estado actual (Inv-CIT-05) |
| `conflicto_version` | Repositorio | Otra escritura ganó; se reintenta una vez leyendo de nuevo |
| `reserva_perdida` | Repositorio | Otro emisor tomó el recordatorio; no se envía |
| `canal_transitorio` / `canal_permanente` | Canal | § 4.1 |
| `error_almacen` | Repositorio | Fallo al guardar: respuesta `R-07` y métrica de fallo de guardado |

---

## 7. Política de versionado

- **Contrato:** semver. Un cambio incompatible (quitar o renombrar un campo, cambiar el significado de un estado) sube la versión mayor. Agregar un campo opcional o un código de respuesta nuevo sube la versión menor.
- **Cargas de cola y de eventos programados:** llevan `version`. El consumidor acepta la versión actual y la anterior durante al menos 14 días, el horizonte máximo de un evento programado ya creado `[DECISIÓN TÉCNICA ETAPA 10]`.
- **Plantillas de Meta:** no se editan en sitio. Un cambio de texto crea `<nombre>_v2`, se aprueba en Meta y recién entonces se cambia en la configuración. La `_v1` se retira cuando no quedan envíos programados que la usen.
- **Gramática de la dueña:** agregar sinónimos o formatos de fecha es compatible. Quitar uno que ya se usa es incompatible y obliga a avisar a las dueñas.
- **Listas de palabras de la clienta:** son configuración (ADR-008). Cada cambio queda registrado con fecha para poder separar su efecto en la medición del piloto.

---

## 8. Agregado pendiente al modelo de dominio

| Término / campo | Agregado | Tipo | Definición recomendada para el Ubiquitous Language | Origen |
|---|---|---|---|---|
| **Nombre del salón** · `nombre_salon` | Salón (Agenda) | `NombreSalon` (string 1–40) | Nombre comercial con el que la clienta reconoce al salón. Lo carga el equipo de TurnoFácil al dar de alta el salón. No es dato personal. Aparece en los dos recordatorios | `[DECISIÓN ETAPA 10]` con el fundador |
| **Aclaración de hora** · `pendiente_aclaracion` | Comando de la dueña (Agenda) | Valor nuevo de `ResultadoComando` | Registro que espera que la dueña diga si la hora (7, 8 o 9 sin a. m. ni p. m.) es de mañana o de noche. La cita todavía no existe | `[DECISIÓN ETAPA 10]` con el fundador (§ 3.1.1.1) |

El modelo de dominio está aprobado y no se modifica desde esta etapa. Para incorporar estos términos de forma oficial hay que **reabrir la etapa del modelo de dominio** (botón Reabrir), lo que deja obsoletas las etapas siguientes. Hasta entonces, este contrato es la fuente de ese campo.

---

## 9. Verificación contra el checklist de la skill

| Ítem | Estado |
|---|---|
| Todos los puntos de integración del RFC § 2.1 cubiertos | ✅ Receptor (§ 2), Procesador e intérprete (§ 3), Canal y Repositorio (§ 4.1, § 4.2), Emisor, Vigilante y Cierre (§ 4.3), Soporte (§ 5). No hay frontend web (fuera de alcance, RFC § 1.4) |
| Cada endpoint con método, ruta, request, response y errores | ✅ § 2.1, § 2.2, § 5 |
| Tipos con el Ubiquitous Language | ✅ § 6. Términos nuevos: `nombre_salon` y `pendiente_aclaracion`, declarados en § 8 |
| Naming consistente | ✅ `snake_case` en los datos, `kebab-case` en la ruta |
| Autenticación documentada | ✅ § 1 (firma de Meta, número remitente, rol de soporte) |
| Política de versionado explícita | ✅ § 7 |
| Canal emulado para el ambiente de prueba (historia H1) | ✅ § 10: rutas, datos, errores, adaptador, salón sembrado y seguridad |

---

## 10. Frontera E · Canal emulado (solo ambiente de prueba)

Permite probar el sistema completo sin cuenta de Meta (historia H1). Una Lambda **Canal emulado**, detrás del mismo API HTTP del ambiente de prueba, expone tres rutas. Los mensajes simulados entran al **mismo Procesador** que los del webhook, por la misma cola, con el mismo `MensajeEntrante` (§ 6.2). Lo que el sistema responde lo guarda el **adaptador emulado** del puerto `CanalWhatsApp` (§ 4.1) en lugar de enviarlo. `[DECISIÓN ETAPA 10]`

| Ruta | Para qué |
|---|---|
| `POST /prueba/canal-emulado/mensajes` | Enviar un mensaje simulado (§ 10.1) |
| `GET /prueba/canal-emulado/mensajes-enviados` | Leer lo que el sistema mandó a un número (§ 10.2) |
| `GET /prueba/canal-emulado/salon-de-prueba` | Consultar el salón de prueba sembrado (§ 10.4) |

**Cuerpo de error común** de las tres rutas:
```json
{ "error": { "codigo": "datos_invalidos", "detalle": "telefono: debe cumplir ^\\+573\\d{9}$" } }
```
`detalle` nunca repite el texto del mensaje ni el teléfono recibido.

### 10.1 POST /prueba/canal-emulado/mensajes

**Descripción:** simula un mensaje que llega por WhatsApp. No lleva firma de Meta: en su lugar exige la clave de prueba (§ 10.6). El mensaje se arma como `MensajeEntrante` y se encola en la **cola FIFO de entrantes** con las mismas reglas del Receptor (§ 2.2, ADR-009). Desde ahí el Procesador lo trata igual que uno real.

**Headers:**
| Header | Required | Regla |
|---|---|---|
| X-Clave-Prueba | yes | Igual a la clave de prueba guardada en Secrets Manager. Se compara en tiempo constante |
| Content-Type | yes | `application/json` |

**Request:**
```json
{
  "remitente": "duena",
  "telefono": "+573000000001",
  "texto": "Vista 15/03/2027",
  "responde_a": null
}
```

| Campo | Tipo | Required | Constraints |
|---|---|---|---|
| remitente | string | yes | `duena` \| `clienta` \| `desconocido`. Dice desde qué papel se escribe |
| telefono | `Telefono` | yes | Número de prueba del remitente, patrón `^\+573\d{9}$` |
| texto | string \| null | yes | 1–4096 caracteres. `null` simula un audio, imagen u otro mensaje que no es texto. Para simular la reacción 👍 se envía el texto `👍` |
| responde_a | `MensajeId` \| null | no | `mensaje_id` de un mensaje enviado por el canal emulado (§ 10.2), para simular que la clienta usó "responder" sobre un recordatorio. Por defecto `null` |

**Reglas del campo `remitente`** `[DECISIÓN TÉCNICA ETAPA 10]`:
- El papel declarado **no decide la identidad**. El Procesador sigue clasificando al remitente solo por su número (§ 3, ADR-006), igual que con Meta. El campo sirve para que la prueba sea explícita y para detectar errores al prepararla.
- `duena`: el teléfono debe ser el `numero_duena` de un salón; si no, `remitente_inconsistente`.
- `clienta` o `desconocido`: el teléfono **no** puede ser el `numero_duena` de un salón; si lo es, `remitente_inconsistente`.
- La diferencia entre `clienta` y `desconocido` la decide el Procesador según si el número tiene citas o un Contacto de clienta (§ 3). Si se envía como `clienta` un número sin citas, el sistema lo trata como desconocido y no responde. No es error de la ruta.

**Tratamiento:**
1. Clave ausente o incorrecta → no se encola nada.
2. Se arma el `MensajeEntrante` (§ 6.2):
   - `mensaje_id` = `emu.<ULID>` generado por la Lambda. El prefijo `emu.` distingue los mensajes emulados de los de Meta (`wamid.…`).
   - `telefono_remitente` = `telefono`; `recibido_en` = hora actual en `-05:00`; `texto` y `responde_a` tal como llegaron.
3. Se encola con `MessageGroupId` = `telefono_seudonimo` del remitente y `MessageDeduplicationId` = `mensaje_id`, como en § 2.2. Así se conserva el orden por persona.
4. Responde 202 en cuanto el mensaje queda encolado, sin esperar el procesamiento. La respuesta del sistema se lee después con § 10.2; la meta de 10 s de la confirmación (§ 3.1.1) se mide igual que con Meta.

Cada llamada crea un mensaje nuevo: repetir la llamada equivale a que la persona escriba dos veces el mismo texto.

**Response 202:**
```json
{ "mensaje_id": "emu.01JDX7Q2K8M3N4P5R6S7T8V9W0", "encolado_en": "2026-11-25T10:00:00-05:00" }
```

**Errors:**
| Code | `codigo` | When |
|---|---|---|
| 401 | `clave_invalida` | `X-Clave-Prueba` ausente o incorrecta. No se encola |
| 400 | `datos_invalidos` | Cuerpo que no es JSON, campo faltante, `remitente` fuera de la lista, teléfono con formato inválido, texto vacío o de más de 4096 caracteres, `responde_a` que no empieza por `emu.` |
| 422 | `remitente_inconsistente` | El papel declarado no coincide con el número (reglas de arriba). No se encola |
| 500 | `cola_no_disponible` | La cola no aceptó el mensaje. Se puede repetir la llamada |

### 10.2 GET /prueba/canal-emulado/mensajes-enviados

**Descripción:** devuelve los mensajes que el sistema mandó a un número por el canal emulado: respuestas de texto a la dueña (§ 3.2), mensaje de baja (§ 3.3) y plantillas (§ 3.4).

**Headers:** `X-Clave-Prueba` (igual que § 10.1).

**Query:**
| Campo | Tipo | Required | Constraints |
|---|---|---|---|
| telefono | `Telefono` | yes | Destino a consultar. El `+` va codificado como `%2B` |
| desde | string ISO 8601 | no | Solo mensajes con `enviado_en` mayor o igual. Sirve para leer únicamente lo que llegó después de un mensaje simulado |
| limite | integer | no | 1–100. Por defecto 20 |

**Response 200** (del más reciente al más antiguo):
```json
{
  "telefono": "+573000000001",
  "mensajes": [
    {
      "mensaje_id": "emu.01JDX7R0A1B2C3D4E5F6G7H8J9",
      "enviado_en": "2026-11-25T10:00:03-05:00",
      "forma": "texto",
      "codigo": "R-11",
      "plantilla": null,
      "variables": null,
      "texto": "No tienes citas el lun 15/03/2027.",
      "tipo_mensaje": "respuesta_duena",
      "cita_id": null
    },
    {
      "mensaje_id": "emu.01JDX6Z9Y8X7W6V5T4S3R2Q1P0",
      "enviado_en": "2026-11-24T18:00:01-05:00",
      "forma": "plantilla",
      "codigo": null,
      "plantilla": "recordatorio_dia_antes_v1",
      "variables": ["Laura Gómez", "tinte", "Salón de Prueba TurnoFácil", "3:00 p. m."],
      "texto": "Hola Laura Gómez, te recordamos tu cita de tinte en Salón de Prueba TurnoFácil mañana a las 3:00 p. m. Responde SÍ para confirmar o CANCELO si no puedes ir. Si no quieres recibir más recordatorios, escribe STOP.",
      "tipo_mensaje": "recordatorio_dia_antes",
      "cita_id": "01JDX5..."
    }
  ]
}
```

| Campo | Tipo | Regla |
|---|---|---|
| mensaje_id | `MensajeId` | `emu.<ULID>`. Se puede usar como `responde_a` en § 10.1 |
| enviado_en | string ISO 8601 `-05:00` | Fecha y hora en que el adaptador guardó el mensaje |
| forma | `texto` \| `plantilla` | `texto` para `enviarTexto`, `plantilla` para `enviarPlantilla` |
| codigo | `CodigoRespuesta` \| null | Solo en `texto` |
| plantilla | string \| null | Nombre de plantilla de § 3.4. Solo en `plantilla` |
| variables | string[] \| null | En el orden de § 3.4. Solo en `plantilla` |
| texto | string | En `texto`, el texto enviado. En `plantilla`, el texto borrador de § 3.4 con las variables reemplazadas, para poder comprobarlo igual que una respuesta |
| tipo_mensaje | `TipoMensaje` | De la `referencia` del envío (§ 4.1) |
| cita_id | `CitaId` \| null | De la `referencia` del envío, si tiene |

Un número sin mensajes devuelve 200 con `mensajes: []`, no 404: así se comprueba que a un número desconocido no se le respondió (US-01·1.9).

**Errors:**
| Code | `codigo` | When |
|---|---|---|
| 401 | `clave_invalida` | `X-Clave-Prueba` ausente o incorrecta |
| 400 | `datos_invalidos` | Falta `telefono`, teléfono con formato inválido, `desde` que no es ISO 8601 o `limite` fuera de rango |
| 500 | `almacen_no_disponible` | No se pudo leer el almacén del canal emulado. Se puede repetir la llamada |

### 10.3 Adaptador emulado del puerto `CanalWhatsApp`

Cumple la misma interfaz de § 4.1 que el adaptador de Meta. El dominio no sabe cuál está activo (ADR-002). Se elige por configuración del ambiente (`CANAL_WHATSAPP=emulado`), y en cada ambiente hay un solo adaptador activo. `[DECISIÓN ETAPA 10]`

| Operación | Comportamiento del adaptador emulado |
|---|---|
| `enviarTexto` | No llama a Meta. Guarda `{ mensaje_id, destino, forma: "texto", codigo, texto, referencia, enviado_en }` y devuelve `{ ok: true, valor: { mensaje_id, aceptado_en } }` |
| `enviarPlantilla` | No llama a Meta ni exige plantilla aprobada. Guarda `{ mensaje_id, destino, forma: "plantilla", plantilla, variables, texto renderizado, referencia, enviado_en }` y devuelve `EnvioAceptado` |
| `interpretarEntrante` | Recibe el `MensajeEntrante` que armó § 10.1, valida su forma y lo devuelve en una lista de un elemento |
| `interpretarEstado` | Devuelve siempre `[]`: el canal emulado no genera estados de entrega |

- `mensaje_id` = `emu.<ULID>`. Como el dominio solo guarda el identificador devuelto, la asociación de una respuesta de la clienta con su recordatorio por `responde_a` (§ 3.3) funciona igual que con Meta.
- El adaptador emulado **nunca devuelve `ErrorCanal`**. Las fallas del canal (transitorias, permanentes, estado `fallido`) quedan fuera del canal emulado y se cubren con pruebas automatizadas (historia H8). `[DECISIÓN TÉCNICA ETAPA 10]`
- Los registros y métricas de los envíos emulados son los mismos que los de los envíos reales, sin datos personales (ADR-007). El almacén del canal emulado sí guarda teléfono y texto, porque es lo que se quiere leer; por eso solo admite números de prueba (§ 10.6).
- Almacén: uno propio del canal emulado, consultado por (`destino`, `enviado_en`), con vencimiento automático a los **7 días**. Su tecnología sigue la decisión diferida del almacén (ADR-005). `[DECISIÓN TÉCNICA ETAPA 10]`

### 10.4 Salón de prueba sembrado

Al desplegar el ambiente de prueba queda dado de alta un salón de prueba. La siembra usa la operación `alta_salon` (§ 5), deja su evento de auditoría y es idempotente: si el salón ya existe, no hace nada. `[DECISIÓN ETAPA 10]`

| Dato | Valor |
|---|---|
| `nombre_salon` | `Salón de Prueba TurnoFácil` |
| `numero_duena` | `+573000000001` |
| `envio_activo` | `true`. En el ambiente de prueba los envíos van al canal emulado, así que activarlo no manda nada real `[DECISIÓN TÉCNICA ETAPA 10]` |

**Números de prueba de referencia** `[DECISIÓN TÉCNICA ETAPA 10]`: de `+573000000100` a `+573000000199` para clientas y de `+573000000900` a `+573000000999` para números desconocidos. Son una convención para las pruebas; el sistema no los trata distinto.

**GET /prueba/canal-emulado/salon-de-prueba**

**Headers:** `X-Clave-Prueba` (igual que § 10.1).

**Response 200:**
```json
{ "salon_id": "01JDX4...", "nombre_salon": "Salón de Prueba TurnoFácil", "numero_duena": "+573000000001", "envio_activo": true }
```

**Errors:**
| Code | `codigo` | When |
|---|---|---|
| 401 | `clave_invalida` | `X-Clave-Prueba` ausente o incorrecta |
| 404 | `salon_no_sembrado` | La siembra no se ejecutó o falló. Hay que volver a desplegar el ambiente de prueba |

### 10.5 Diferencias con la Frontera A

| Tema | Frontera A (Meta) | Frontera E (emulado) |
|---|---|---|
| Autenticación | Firma `X-Hub-Signature-256` | Clave `X-Clave-Prueba` |
| Forma del pedido | JSON de Meta (`entry`, `changes`) | JSON plano de § 10.1 |
| Mensaje que llega a la cola | `MensajeEntrante` (§ 6.2) | El mismo `MensajeEntrante` |
| Agrupamiento y deduplicación en la cola | `telefono_seudonimo` / `MensajeId` | Igual |
| Procesamiento | Procesador e intérprete (§ 3) | El mismo |
| Envío de respuestas | Adaptador de Meta | Adaptador emulado (§ 10.3) |
| Estados de entrega | Sí | No |
| `mensaje_id` | `wamid.…` | `emu.…` |

### 10.6 Seguridad `[DECISIÓN ETAPA 10]`

- **Solo en el ambiente de prueba.** Terraform crea las tres rutas, la Lambda Canal emulado, el almacén del canal emulado y el secreto de la clave únicamente cuando el ambiente es de prueba (variable `canal_emulado_habilitado`, `false` por defecto y `true` solo en prueba). En producción no existen: una llamada a `/prueba/canal-emulado/…` recibe el 404 propio del API porque la ruta no está definida. `[DECISIÓN TÉCNICA ETAPA 10]`
- **Segunda barrera.** En producción el Procesador, el Emisor y el Vigilante se niegan a arrancar si la configuración pide `CANAL_WHATSAPP=emulado`. Así un error de configuración no puede dejar a las clientas reales sin recordatorios en silencio. `[DECISIÓN TÉCNICA ETAPA 10]`
- **Clave de prueba.** Valor aleatorio de al menos 32 bytes, guardado en Secrets Manager (`turnofacil/prueba/clave-canal-emulado`) y enviado en el encabezado `X-Clave-Prueba`. Se compara en tiempo constante. No se registra en ningún log. Se cambia en cada despliegue nuevo del ambiente de prueba o si se filtra. `[DECISIÓN TÉCNICA ETAPA 10]`
- **Sin datos reales.** En el ambiente de prueba solo se usan números y nombres de prueba (security-design § 6.3). El almacén del canal emulado vence a los 7 días.
- **Límite de uso.** Las rutas de prueba tienen un límite de 5 peticiones por segundo en el API, para que una prueba mal hecha no sature la cola. Al superarlo, el API responde 429. `[DECISIÓN TÉCNICA ETAPA 10]`
- La identidad dentro del sistema sigue siendo el número remitente (ADR-006): la clave de prueba autoriza a usar el canal emulado, no a actuar como un salón distinto del que corresponde al número.
