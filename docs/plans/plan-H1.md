# Plan ejecutable · H1 · Canal de WhatsApp emulado para el piloto de prueba

**Date:** 2026-11-26 (revisión del plan del 2026-11-25 tras la compuerta de aceptación)
**Story:** docs/stories.md § H1
**Estimación:** 5 puntos (historia técnica, sin RF propio)
**Generado con:** tech-emergentes-story-to-plan · etapa 91 · sin preguntas a la persona (los datos faltantes se resolvieron con la opción más simple y quedan en § 5)

---

## 0. Resumen para quien revisa

- H1 deja funcionando las tres rutas de prueba (`POST /prueba/canal-emulado/mensajes`, `GET /prueba/canal-emulado/mensajes-enviados`, `GET /prueba/canal-emulado/salon-de-prueba`), el adaptador emulado del puerto `CanalWhatsApp`, el salón de prueba sembrado y un Procesador mínimo que clasifica al remitente por número.
- El ambiente real es **la plantilla fija** (CLAUDE.md, `.build/reglas.md`, docs/ambiente-base.md): **una** API HTTP → **una** función Node.js 22 en `.mjs` sin compilar → **una** tabla DynamoDB (`pk`, `sk`). No hay cola FIFO, Secrets Manager, EventBridge ni variables propias, y `infra/` no se puede cambiar. El plan respeta el contrato (§ 10) en todo lo observable desde afuera y adapta por dentro lo que el contrato describía con varias piezas. Cada adaptación está en § 5 como `[ADAPTACIÓN PLANTILLA]`.
- **AC-4 (sin la clave de prueba no entra nada) se cubre solo con pruebas automatizadas** (S-TEST-2): las comprobaciones tras el despliegue siempre mandan la clave. AC-1, AC-2, AC-3 y AC-5 se comprueban además en el ambiente desplegado.
- **Cambio de esta revisión (S-SEC-1, OQ-H1-3).** La última compuerta de aceptación (`.build/ultima-compuerta.md`) dio 401 `clave_invalida` en todas las rutas: el comprobador es la "sesión de prueba", pero al API no le llega ningún `X-Clave-Prueba` (los encabezados recibidos fueron solo `accept-encoding, content-length, content-type, host, user-agent, x-amzn-trace-id, x-forwarded-*`). Ahora, **sin clave configurada en el ambiente, las rutas de prueba no exigen el encabezado**. **Con clave configurada, la exigen y la comparan** en tiempo constante: ese es el caso que prueba AC-4. En producción las rutas siguen sin existir.

---

## 1. Contexto cargado

### 1.1 Governance refs

- **PRD:** § 7 (WhatsApp como canal: costo y aprobación de plantillas sin validar, bloqueante). H1 permite probar sin cuenta de Meta.
- **RFC:** § 1.4 (sin herramientas de prueba fijadas en el RFC; las fija CLAUDE.md) · supuesto A1 (plantillas de Meta) · § 2.1.2 (Receptor → cola → Procesador) · § 2.1.4 (zona fija America/Bogota).
- **ADRs aplicables:**
  - ADR-001 · TypeScript sobre Lambda con Terraform → **reemplazado en la práctica por la plantilla fija** (`.mjs` sin compilar, `infra/` intocable). Los puertos de api-contract § 4 se implementan como módulos ESM con la misma forma; ver § 5, OQ-H1-1.
  - ADR-002 · canal tras un puerto: el adaptador emulado cumple la misma interfaz que el de Meta; el dominio no sabe cuál está activo.
  - ADR-005 · aislar la persistencia: todo acceso a la tabla pasa por el puerto `Repositorio` y el almacén del canal emulado; en pruebas, versión en memoria.
  - ADR-006 · identidad por número: el campo `remitente` no decide la identidad; el Procesador clasifica por `telefono_remitente`.
  - ADR-007 · registros sin datos personales: ni teléfono, ni texto, ni clave en los logs; solo `telefono_seudonimo` cuando haga falta.
  - ADR-009 · cola FIFO ordenada por persona: se conserva la forma (`MensajeEntrante`, agrupamiento por `telefono_seudonimo`, deduplicación por `mensaje_id`) con una cola en proceso; ver § 5.
- **Entidades del UL (domain-model § 2–3):** Salón (`salon_id`, `numero_duena`, `nombre_salon`, `envio_activo`), MensajeEntrante, ComandoDeLaDuena (resultado `no_entendido`), Respuesta con `CodigoRespuesta` (`R-06` en esta historia), EventoDeAuditoria (alta de salón), Remitente (dueña / clienta / número no registrado).
- **Endpoints del contract:** api-contract § 10.1, § 10.2, § 10.4 (Frontera E) · puerto `CanalWhatsApp` § 4.1 y adaptador emulado § 10.3 · puerto `Repositorio` § 4.2 (`buscarSalonPorNumero`, `registrarMensajeProcesado`, `agregarEvento`) · `MensajeEntrante` § 6.2 · `alta_salon` § 5 · clasificación del remitente § 3 · respuesta `R-06` § 3.1.4 y § 3.2 · cuerpo de error común § 10 · seguridad § 10.6.
- **Controles de security:** security-design § 2.11 (STRIDE del canal emulado), § 5 (clave `turnofacil/prueba/clave-canal-emulado`), § 6.1 (rutas solo en prueba), § 6.3 (sin datos reales en prueba), OQ-8 (entrada de prueba en producción).
- **Observabilidad requerida:** observability-design § 1.2 (campos obligatorios del log; registros del Receptor y del Procesador), D12-4 (`correlacion_id` = `mensaje_id`), D12-6 (envíos emulados medidos igual, prefijo `emu.`), AL-13 (alerta si aparece `emu.` en producción; la crea infraestructura de producción, no esta historia).
- **CLAUDE.md y `.build/reglas.md`:** `src/index.mjs` exporta `handler` (API Gateway HTTP, formato 2.0) · código en `src/**/*.mjs` sin dependencias de terceros · tabla en `TABLE_NAME` con `pk`/`sk` · SDK de AWS v3 importado solo con `import()` dinámico dentro del repositorio real · pruebas en `test/**/*.test.mjs` con `node:test` y `node:assert`, comando `node --test` · acceso a datos inyectado y reemplazado por uno en memoria en las pruebas · un registro JSON de una línea por petición · ningún secreto en el código.
- **Testing (precedencia de testing-governance):** no hay `.design/drivers.yaml` → `package.json` (`"test": "node --test"`) y CLAUDE.md declaran `node:test`. Se usa exactamente eso; no se agrega ningún otro corredor.

### 1.2 Lo que NO entra en H1

- Comandos Registrar, Cancelar y Vista (H2–H7): mientras no existan, **todo** texto de la dueña recibe `R-06`. H2 reemplaza esa rama.
- Respuestas de la clienta (H9, H10): un número que no es la dueña no recibe nada (en H1 no hay citas, así que clienta y desconocido se comportan igual).
- Webhook de Meta (Frontera A), recordatorios, estados de entrega y fallas del canal (§ 10.3: el emulado nunca devuelve `ErrorCanal`).

---

## 2. Subtasks (vertical slice)

Capas: **sin frontend** (TurnoFácil no tiene pantallas; api-contract, Resumen para decidir). **Sin migraciones SQL**: la tabla es DynamoDB sin esquema; la subtarea de datos fija el diseño de claves y los adaptadores.

### 2.1 Database

#### S-DB-1 · Diseño de claves y puerto `Repositorio` (subconjunto de H1)

```yaml
id: S-DB-1
title: Claves de la tabla y repositorio (memoria + DynamoDB) para salón, idempotencia y auditoría
layer: database
files:
  create: [src/datos/claves.mjs, src/datos/repositorio-memoria.mjs, src/datos/repositorio-dynamo.mjs]
  modify: []
consume:
  - artifact_id: external:contract
    type: contract
    description: api-contract § 4.2 (buscarSalonPorNumero, registrarMensajeProcesado, agregarEvento) y § 5 alta_salon
  - artifact_id: external:domain
    type: docs
    description: campos del agregado Salón y EventoDeAuditoria (domain-model § 3)
  - artifact_id: external:claude
    type: docs
    description: tabla única pk/sk, SDK solo por import() dinámico
produce:
  - artifact_id: repo-h1
    type: code
    description: crearRepositorio({tabla}) y crearRepositorioMemoria() con altaSalonSiNoExiste, buscarSalonPorNumero, registrarMensajeProcesado, agregarEvento
estimated_minutes: 60
risk: medium
```

- **Claves** (un solo lugar, `claves.mjs`):
  | Ítem | `pk` | `sk` | Atributos |
  |---|---|---|---|
  | Salón | `SALON#<salon_id>` | `SALON` | `nombre_salon`, `numero_duena`, `envio_activo`, `creado_en` |
  | Índice por número de la dueña | `DUENA#<numero_duena>` | `SALON` | `salon_id` (se escribe en la misma transacción lógica; ver acciones) |
  | Mensaje procesado | `MSG#<mensaje_id>` | `MSG` | `procesado_en` |
  | Evento de auditoría | `AUDITORIA#<salon_id>` | `<ts>#<evento_id>` | `tipo`, `operador`, `motivo`, sin teléfono (Inv-AUD-03) |
- **Acciones:**
  1. `altaSalonSiNoExiste({numero_duena, nombre_salon, envio_activo})`: `PutItem` condicional `attribute_not_exists(pk)` sobre `DUENA#<numero>`; si gana, escribe el ítem `SALON#…` y devuelve `{creado: true, salon}`; si pierde, lee el existente y devuelve `{creado: false, salon}`. (Sin `TransactWriteItems`: el rol solo tiene Get/Put/Update/Query.)
  2. `buscarSalonPorNumero(telefono)`: `GetItem` de `DUENA#…` y luego de `SALON#…`.
  3. `registrarMensajeProcesado(mensaje_id)`: `PutItem` condicional → `nuevo` | `ya_procesado`.
  4. `agregarEvento(evento)`: `PutItem` solo agregar.
  5. El adaptador DynamoDB importa `@aws-sdk/client-dynamodb` y `@aws-sdk/lib-dynamodb` con `import()` dentro de la fábrica; el de memoria usa `Map`. Errores del almacén → resultado tipado `{ok:false, error:{codigo:'error_almacen'}}`.
- **DoD:** las dos implementaciones cumplen la misma prueba de contrato del puerto (S-TEST-1); ningún `import` estático del SDK en `src/`.

#### S-DB-2 · Almacén del canal emulado

```yaml
id: S-DB-2
title: Almacén de envíos emulados (memoria + DynamoDB), consulta por destino y fecha, vencimiento 7 días
layer: database
files:
  create: [src/canal/almacen-emulado-memoria.mjs, src/canal/almacen-emulado-dynamo.mjs]
  modify: [src/datos/claves.mjs]
consume:
  - artifact_id: external:contract
    type: contract
    description: api-contract § 10.2 (campos de cada mensaje, orden y filtro desde/limite) y § 10.3 (almacén propio, vence a 7 días)
  - artifact_id: repo-h1
    type: code
    description: convención de claves y patrón de import() dinámico
produce:
  - artifact_id: almacen-emulado
    type: code
    description: guardarEnvio(envio) y listarEnvios({destino, desde, limite}) en orden del más reciente al más antiguo
estimated_minutes: 45
risk: low
```

- **Claves:** `pk = EMU#<destino>`, `sk = <enviado_en ISO>#<mensaje_id>`, atributos de § 10.2 más `vence_en` (epoch s = `enviado_en` + 7 días).
- **Acciones:** `Query` con `ScanIndexForward: false`, `sk >= desde` si viene, `Limit` = `limite`; filtra en código los ítems con `vence_en` pasado (la tabla no tiene TTL configurado y `infra/` no se cambia; ver § 5).
- **DoD:** dos envíos al mismo destino vuelven del más reciente al más antiguo; `desde` excluye los anteriores; un destino sin envíos devuelve `[]`.

### 2.2 Backend

#### S-BE-1 · Utilidades compartidas

```yaml
id: S-BE-1
title: ULID, hora de Colombia, Telefono, seudónimo y respuestas HTTP JSON
layer: backend
files:
  create: [src/comun/ulid.mjs, src/comun/hora.mjs, src/comun/telefono.mjs, src/comun/seudonimo.mjs, src/comun/http.mjs]
  modify: []
consume:
  - artifact_id: external:contract
    type: contract
    description: § 1 convenciones (ISO 8601 -05:00, Telefono ^\+573\d{9}$, ULID, telefono_seudonimo HMAC-SHA256 hex) y cuerpo de error común de § 10
produce:
  - artifact_id: utilidades
    type: code
    description: nuevoUlid(), ahoraColombia(), esTelefono(), seudonimo(telefono, clave), json(status, cuerpo), error(status, codigo, detalle)
estimated_minutes: 40
risk: low
```

- **Acciones:** ULID con `crypto.getRandomValues` (sin dependencias); `ahoraColombia()` formatea con desfase fijo `-05:00` sin depender de `TZ` (la función corre con `TZ` de la variable `timezone`); `error()` produce `{"error":{"codigo","detalle"}}` con `Content-Type: application/json`, y `detalle` nunca incluye teléfono ni texto recibidos.
- **DoD:** pruebas unitarias de formato (26 caracteres Crockford, `-05:00`, patrón del teléfono, HMAC de 64 hex).

#### S-BE-2 · Adaptador emulado del puerto `CanalWhatsApp` y selección de adaptador

```yaml
id: S-BE-2
title: Adaptador emulado (enviarTexto, enviarPlantilla, interpretarEntrante, interpretarEstado) y fábrica por CANAL_WHATSAPP
layer: backend
files:
  create: [src/canal/canal-emulado.mjs, src/canal/plantillas.mjs, src/canal/elegir-canal.mjs]
  modify: []
consume:
  - artifact_id: almacen-emulado
    type: code
    description: guardarEnvio
  - artifact_id: utilidades
    type: code
    description: nuevoUlid, ahoraColombia
  - artifact_id: external:contract
    type: contract
    description: § 4.1 interfaz del puerto, § 3.4 textos de plantillas, § 10.3 comportamiento emulado
  - artifact_id: external:adrs
    type: docs
    description: ADR-002 (un adaptador activo por ambiente)
produce:
  - artifact_id: canal-emulado
    type: code
    description: crearCanalEmulado({almacen, reloj}) que cumple el puerto CanalWhatsApp; elegirCanal(config) que falla si entorno=produccion y CANAL_WHATSAPP=emulado
estimated_minutes: 50
risk: medium
```

- **Acciones:**
  1. `enviarTexto({destino, codigo, texto, referencia})` guarda `{mensaje_id: emu.<ULID>, destino, forma:'texto', codigo, plantilla:null, variables:null, texto, tipo_mensaje, cita_id, enviado_en}` y devuelve `{ok:true, valor:{mensaje_id, aceptado_en}}`.
  2. `enviarPlantilla` guarda `forma:'plantilla'` con el texto de § 3.4 renderizado (`{{n}}` → variables); no exige plantilla aprobada.
  3. `interpretarEntrante(m)` valida la forma de `MensajeEntrante` y devuelve `[m]`; `interpretarEstado()` devuelve `[]`. Nunca devuelve `ErrorCanal`; si el almacén falla, devuelve `{ok:false, error:{codigo:'error_almacen'}}` (no es un error del canal).
  4. `elegirCanal({CANAL_WHATSAPP, ENTORNO})`: `emulado` es el único adaptador de H1 y el valor por defecto en este ambiente (no hay cuenta de Meta); con `ENTORNO=produccion` y `emulado` lanza un error de arranque (segunda barrera, § 10.6).
- **DoD:** pruebas del adaptador (S-TEST-1) y de la barrera de producción (S-TEST-2).

#### S-BE-3 · Procesador mínimo (clasificación del remitente)

```yaml
id: S-BE-3
title: Procesador que clasifica por número, responde R-06 a la dueña y calla ante cualquier otro número
layer: backend
files:
  create: [src/procesador/procesador.mjs, src/procesador/respuestas.mjs]
  modify: []
consume:
  - artifact_id: repo-h1
    type: code
    description: buscarSalonPorNumero, registrarMensajeProcesado
  - artifact_id: canal-emulado
    type: code
    description: puerto CanalWhatsApp (enviarTexto)
  - artifact_id: external:contract
    type: contract
    description: § 3 tabla de remitentes, § 3.1.4 y § 3.2 R-06
  - artifact_id: external:adrs
    type: docs
    description: ADR-006 (salón deducido del número), ADR-008 (intérprete determinista)
produce:
  - artifact_id: procesador
    type: code
    description: crearProcesador({repo, canal, log}).procesar(MensajeEntrante) → {clasificacion, resultado}
estimated_minutes: 45
risk: medium
```

- **Acciones:**
  1. `registrarMensajeProcesado(mensaje_id)`: si `ya_procesado`, termina sin responder (Inv-CMD-01).
  2. `buscarSalonPorNumero(telefono_remitente)`: si hay salón → remitente `duena`; si no → `no_dueña` (en H1 no hay citas ni contactos, así que no se distingue clienta de desconocido; H9 agrega esa rama).
  3. Dueña: responde `R-06` con el texto exacto de § 3.2 (tres ejemplos) por `canal.enviarTexto` con `referencia {salon_id, tipo_mensaje:'respuesta_duena'}`. El resultado del comando es `no_entendido`. **H2 reemplaza esta rama por el intérprete.**
  4. No dueña: no envía nada; registra `remitente_no_autorizado` o `sin_efecto` (sin teléfono).
  5. `respuestas.mjs` guarda el catálogo de textos por código para que H2+ lo amplíen.
- **DoD:** "Hola" de `+573000000001` produce un envío `R-06` guardado como texto con su código (AC-2); "Vista" desde la serie 900 no produce envíos (AC-3).

#### S-BE-4 · Cola de entrantes en proceso

```yaml
id: S-BE-4
title: Puerto ColaEntrantes con adaptador en proceso que conserva MessageGroupId y MessageDeduplicationId
layer: backend
files:
  create: [src/cola/cola-en-proceso.mjs]
  modify: []
consume:
  - artifact_id: procesador
    type: code
    description: procesar(MensajeEntrante)
  - artifact_id: utilidades
    type: code
    description: seudonimo()
  - artifact_id: external:adrs
    type: docs
    description: ADR-009 (orden por persona, deduplicación por mensaje_id)
produce:
  - artifact_id: cola-entrantes
    type: code
    description: encolar(mensaje, {grupo, deduplicacion}) → {ok} | {ok:false, error:{codigo:'cola_no_disponible'}}
estimated_minutes: 25
risk: medium
```

- **Acciones:** `encolar` calcula `grupo = telefono_seudonimo` y `deduplicacion = mensaje_id`, y entrega el mensaje al Procesador **dentro de la misma invocación** antes de devolver (la plantilla no tiene SQS y una Lambda no sigue trabajando tras responder). Si el Procesador falla por el almacén, devuelve `cola_no_disponible` → la ruta responde 500. Cuando exista la cola FIFO real se cambia solo este adaptador.
- **DoD:** el mensaje llega al Procesador con los atributos de agrupamiento y deduplicación; un error del Procesador se traduce a `cola_no_disponible`.

#### S-BE-5 · Siembra idempotente del salón de prueba

```yaml
id: S-BE-5
title: alta_salon del Salón de Prueba TurnoFácil con evento de auditoría, idempotente
layer: backend
files:
  create: [src/prueba/siembra.mjs]
  modify: []
consume:
  - artifact_id: repo-h1
    type: code
    description: altaSalonSiNoExiste, agregarEvento
  - artifact_id: external:contract
    type: contract
    description: § 10.4 datos del salón de prueba y § 5 alta_salon
produce:
  - artifact_id: siembra
    type: code
    description: asegurarSalonDePrueba(repo) → salon; memoriza el resultado por instancia de la función
estimated_minutes: 30
risk: medium
```

- **Acciones:**
  1. Datos fijos: `nombre_salon = "Salón de Prueba TurnoFácil"`, `numero_duena = "+573000000001"`, `envio_activo = true`.
  2. Se ejecuta **la primera vez que una instancia de la función atiende una ruta de prueba** (no hay paso de despliegue donde correrla; ver § 5). Si el salón ya existe no hace nada.
  3. Solo cuando crea el salón agrega `EventoDeAuditoria` `alta_salon` con `operador: "sistema:siembra-prueba"`, `motivo: "siembra del ambiente de prueba"`.
- **DoD:** dos llamadas seguidas dejan un solo salón y un solo evento; `GET salon-de-prueba` nunca devuelve 404 tras la primera petición válida salvo que el almacén falle.

#### S-BE-6 · Rutas de la Frontera E y punto de entrada

```yaml
id: S-BE-6
title: handler de src/index.mjs con enrutador y las tres rutas de prueba
layer: backend
files:
  create: [src/index.mjs, src/rutas/canal-emulado.mjs, src/arranque.mjs]
  modify: []
consume:
  - artifact_id: cola-entrantes
    type: code
    description: encolar
  - artifact_id: almacen-emulado
    type: code
    description: listarEnvios
  - artifact_id: siembra
    type: code
    description: asegurarSalonDePrueba
  - artifact_id: clave-prueba
    type: code
    description: verificarClave(evento)
  - artifact_id: logger
    type: code
    description: registro por petición
  - artifact_id: external:contract
    type: contract
    description: § 10.1, § 10.2, § 10.4 (estados, cuerpos y errores)
produce:
  - artifact_id: api-frontera-e
    type: code
    description: handler(evento API Gateway 2.0) que atiende POST /prueba/canal-emulado/mensajes, GET /prueba/canal-emulado/mensajes-enviados y GET /prueba/canal-emulado/salon-de-prueba; 404 JSON para todo lo demás
estimated_minutes: 75
risk: high
```

- **Acciones:**
  1. `arranque.mjs` arma las dependencias una vez por instancia (repositorio DynamoDB con `TABLE_NAME`, almacén, canal elegido, Procesador, cola, logger) y exporta `crearHandler(deps)` para inyectar las versiones en memoria en las pruebas.
  2. Orden en cada ruta de prueba: modo del canal emulado (`deshabilitado` → 404 JSON como ruta inexistente) → clave solo en modo `estricto` (401 `clave_invalida`) → validación (400 `datos_invalidos`) → lógica.
  3. **POST mensajes:** JSON válido; `remitente` ∈ `duena|clienta|desconocido`; `telefono` con el patrón; `texto` `null` o 1–4096 caracteres; `responde_a` `null` o que empiece por `emu.`. Asegura la siembra; con `buscarSalonPorNumero` aplica las reglas de `remitente` (422 `remitente_inconsistente`, sin encolar). Arma `MensajeEntrante {version:1, mensaje_id: emu.<ULID>, telefono_remitente, recibido_en, texto, responde_a}`, encola y responde **202** `{mensaje_id, encolado_en}`; error de cola → 500 `cola_no_disponible`.
  4. **GET mensajes-enviados:** `telefono` obligatorio (el `+` llega decodificado de `%2B`; si llega como espacio por un cliente que no lo codificó, se rechaza con 400), `desde` ISO 8601 opcional, `limite` 1–100 (20 por defecto). 200 `{telefono, mensajes}` con los campos de § 10.2; `[]` si no hay; error del almacén → 500 `almacen_no_disponible`.
  5. **GET salon-de-prueba:** asegura la siembra y responde 200 `{salon_id, nombre_salon, numero_duena, envio_activo}`; si el salón no se pudo sembrar ni leer → 404 `salon_no_sembrado`.
- **DoD:** las respuestas cumplen estado, `Content-Type: application/json` y cuerpo del contrato; cada camino de error tiene prueba (S-TEST-1, S-TEST-2).

### 2.3 Frontend

No aplica: TurnoFácil no tiene pantallas; la dueña y la clienta usan solo WhatsApp.

### 2.4 Tests

Herramienta: `node:test` + `node:assert`, comando `node --test`, archivos `test/**/*.test.mjs` (CLAUDE.md, `package.json`). Sin AWS: repositorio y almacén en memoria inyectados con `crearHandler(deps)`. Cada prueba llama al `handler` con eventos API Gateway HTTP 2.0 armados a mano.

#### S-TEST-1 · Pruebas funcionales de los criterios y del puerto

```yaml
id: S-TEST-1
title: Un test por AC-1, AC-2, AC-3 y AC-5 más pruebas de contrato del puerto y de validación
layer: tests
files:
  create: [test/h1-canal-emulado.test.mjs, test/canal-emulado-adaptador.test.mjs, test/repositorio-memoria.test.mjs, test/utilidades.test.mjs, test/apoyo/eventos-api.mjs]
  modify: []
consume:
  - artifact_id: api-frontera-e
    type: code
    description: handler con dependencias en memoria
  - artifact_id: external:story
    type: docs
    description: AC-1 a AC-5 de H1
produce:
  - artifact_id: suite-h1-funcional
    type: test
    description: pruebas G-W-T que pasan con node --test
estimated_minutes: 60
risk: low
```

| AC | Given / When / Then en la prueba |
|---|---|
| AC-1 | Ambiente recién creado (memoria vacía) · `GET /prueba/canal-emulado/salon-de-prueba` con clave · 200 con `"Salón de Prueba TurnoFácil"`, `+573000000001`, `envio_activo: true`; una segunda llamada devuelve el mismo `salon_id` y hay un solo evento de auditoría `alta_salon` |
| AC-2 | `POST mensajes` `{remitente:"duena", telefono:"+573000000001", texto:"Hola"}` · 202 con `mensaje_id` que empieza por `emu.` · `GET mensajes-enviados?telefono=%2B573000000001&desde=<antes del POST>` trae un mensaje `forma:"texto"`, `codigo:"R-06"`, texto que empieza por "No entendí el mensaje. Puedes escribir:" con los tres ejemplos, `tipo_mensaje:"respuesta_duena"` |
| AC-3 | `POST mensajes` `{remitente:"desconocido", telefono:"+573000000901", texto:"Vista"}` · 202 · `GET mensajes-enviados` para ese número devuelve 200 con `mensajes: []` |
| AC-5 | `POST mensajes` `{remitente:"clienta", telefono:"+573000000001", texto:"sí"}` · 422 `remitente_inconsistente` · no hay mensajes nuevos para `+573000000001` y el Procesador no fue llamado. Caso espejo: `remitente:"duena"` desde `+573000000150` → 422 |

Además: 400 `datos_invalidos` por cada regla de § 10.1 y § 10.2 (JSON roto, campo faltante, `remitente` fuera de lista, teléfono inválido, texto vacío y de 4097 caracteres, `responde_a` sin `emu.`, `limite` 0 y 101, `desde` no ISO); 404 JSON en una ruta desconocida; 500 `cola_no_disponible` y `almacen_no_disponible` con un repositorio en memoria que falla; mismo `mensaje_id` procesado dos veces → una sola respuesta; misma batería de contrato contra `repositorio-memoria` (el de DynamoDB no se ejecuta sin AWS).

- **DoD:** `node --test` pasa completo.

#### S-TEST-2 · Pruebas de seguridad (incluye AC-4, solo automatizado)

```yaml
id: S-TEST-2
title: AC-4 sin clave no entra nada, clave incorrecta o corta, clave nunca registrada, barrera de producción y rutas deshabilitadas
layer: tests
files:
  create: [test/h1-seguridad.test.mjs]
  modify: []
consume:
  - artifact_id: api-frontera-e
    type: code
    description: handler con dependencias en memoria y logger capturable
  - artifact_id: clave-prueba
    type: code
    description: verificarClave y configuración de habilitación
  - artifact_id: canal-emulado
    type: code
    description: elegirCanal (segunda barrera)
produce:
  - artifact_id: suite-h1-seguridad
    type: test
    description: pruebas de seguridad que pasan con node --test
estimated_minutes: 45
risk: medium
```

| Caso | Prueba |
|---|---|
| **AC-4** (solo automatizado: las comprobaciones tras el despliegue siempre envían la clave) | Given canal emulado en modo `estricto` (clave de prueba de 32 bytes inyectada en la configuración) · When `POST mensajes` como dueña `+573000000001` con texto "Hola" **sin** `X-Clave-Prueba` · Then 401 `{"error":{"codigo":"clave_invalida",…}}` · And el Procesador no se llamó y `GET mensajes-enviados` (con clave) para `+573000000001` no trae mensajes nuevos |
| AC-4 variante | Igual con clave incorrecta del mismo largo, con clave de otro largo y con encabezado vacío → 401 y nada encolado. Las tres rutas exigen la clave (GET `mensajes-enviados` y `salon-de-prueba` → 401) |
| Clave nunca registrada | Capturar todas las líneas del logger durante un POST válido y uno con clave incorrecta: ninguna contiene el valor de la clave, el teléfono ni el texto |
| Comparación en tiempo constante | `verificarClave` usa `crypto.timingSafeEqual` sobre los SHA-256 de ambos valores (prueba sobre el módulo, no de tiempos) |
| Clave configurada < 32 bytes | Las rutas de prueba responden 404 como si no existieran (falla cerrada) |
| Sin clave configurada (modo `abierto`) | Un POST como dueña "Hola" **sin** encabezado → 202 y respuesta `R-06` guardada (reproduce la compuerta de aceptación); se registra una sola vez `clave_no_configurada` en WARN; con `ENTORNO=produccion` sigue dando 404 |
| Detalle del 401 | En modo `estricto`, el cuerpo del 401 no contiene nombres ni valores de encabezados |
| Segunda barrera de producción | `elegirCanal({ENTORNO:'produccion', CANAL_WHATSAPP:'emulado'})` lanza error y `crearHandler` no arranca; con `ENTORNO=produccion` las rutas `/prueba/canal-emulado/…` responden 404 aunque haya clave |
| Identidad por número | Con clave válida, un POST como `duena` desde un número que no es dueña de ningún salón → 422; la clave no da identidad (ADR-006) |

- **DoD:** `node --test` pasa completo; AC-4 queda marcado en el reporte de la historia como "cubierto por pruebas automatizadas".

### 2.5 Observability

#### S-OBS-1 · Registro estructurado por petición y por evento

```yaml
id: S-OBS-1
title: Logger JSON de una línea con los campos de observability-design § 1.2, sin datos personales ni clave
layer: observability
files:
  create: [src/comun/log.mjs]
  modify: [src/rutas/canal-emulado.mjs, src/procesador/procesador.mjs, src/canal/canal-emulado.mjs]
consume:
  - artifact_id: external:observability
    type: docs
    description: § 1.2 campos obligatorios, D12-4 correlacion_id, D12-6 prefijo emu.
  - artifact_id: utilidades
    type: code
    description: ahoraColombia, seudonimo
produce:
  - artifact_id: logger
    type: code
    description: crearLog({componente, salida}) con info/warn/error que escriben una línea JSON; salida inyectable para pruebas
estimated_minutes: 35
risk: low
```

- **Acciones:**
  1. Campos: `ts` (-05:00), `nivel`, `componente` (`canal_emulado` para las rutas, `procesador`), `evento`, `correlacion_id`, `trace_id` (de `x-amzn-trace-id` si llega), `salon_id`, `telefono_seudonimo` solo cuando hace falta, `resultado`, `duracion_ms`, `error_tipo`.
  2. **Una línea por petición** en las rutas (`evento: peticion_canal_emulado`, método, ruta, estado HTTP, `duracion_ms`); en el POST, `correlacion_id` = `mensaje_id` `emu.…`.
  3. Procesador: `remitente_clasificado` (`duena` / `no_duena`), `comando_no_entendido` y `respuesta_enviada` con `codigo`, y `ERROR` en fallo de almacén. Siembra: `SalonDadoDeAlta` solo cuando crea.
  4. `clave_invalida` se registra en `WARN` sin el valor recibido.
  5. La alerta AL-13 (entrada `emu.` en producción) y las métricas de CloudWatch no se crean aquí: dependen de infraestructura que `infra/` no permite cambiar (ver § 5).
- **DoD:** S-TEST-2 comprueba que ningún registro tiene clave, teléfono ni texto; un POST deja exactamente una línea `peticion_canal_emulado`.

### 2.6 Security

#### S-SEC-1 · Clave de prueba y habilitación de las rutas

```yaml
id: S-SEC-1
title: Lectura de la clave de prueba, comparación en tiempo constante y habilitación solo fuera de producción
layer: security
files:
  create: [src/prueba/clave.mjs]
  modify: []
consume:
  - artifact_id: external:security
    type: docs
    description: § 2.11 STRIDE del canal emulado, § 5 clave de prueba, § 6.1 rutas solo en prueba
  - artifact_id: external:contract
    type: contract
    description: § 10.6 (≥ 32 bytes, tiempo constante, nunca registrada, solo en prueba)
  - artifact_id: repo-h1
    type: code
    description: lectura del ítem de configuración en la tabla
produce:
  - artifact_id: clave-prueba
    type: code
    description: cargarConfigCanalEmulado({env, repo}) → {modo: estricto|abierto|deshabilitado, clave}; verificarClave(evento, clave) → boolean
estimated_minutes: 35
risk: high
```

- **Acciones:**
  1. Fuente de la clave, en orden: variable de entorno `CLAVE_CANAL_EMULADO`; si no está, el ítem `pk = CONFIG`, `sk = CANAL_EMULADO`, atributo `clave` de la tabla. **Nunca** en el código ni en el repositorio de código (regla "ningún secreto en el código").
  2. Modos, según la clave configurada y `ENTORNO`:
     | Situación | Modo | Rutas de prueba |
     |---|---|---|
     | `ENTORNO=produccion` | `deshabilitado` | 404 JSON (no existen), haya o no clave |
     | Clave configurada de 32 bytes o más | `estricto` | Exigen `X-Clave-Prueba` igual a la clave; si falta o no coincide → 401 `clave_invalida`, sin encolar (**AC-4**) |
     | Clave configurada de menos de 32 bytes | `deshabilitado` | 404 JSON (configuración rota, falla cerrada) |
     | Sin clave configurada, fuera de producción | `abierto` | Se atienden **sin exigir el encabezado**; si viene, se ignora. Se registra una vez `clave_no_configurada` en WARN |
  3. `verificarClave` (solo en modo `estricto`): lee `x-clave-prueba` (API Gateway 2.0 entrega los encabezados en minúsculas); compara `timingSafeEqual(sha256(recibida), sha256(esperada))`; ausente o distinta → `false`. El `detalle` del 401 dice solo "clave de prueba ausente o incorrecta": **se quita el listado de nombres de encabezados** que se agregó para diagnosticar la compuerta.
  4. La clave se guarda solo en memoria de la instancia; no se devuelve ni se registra. Mientras el modo no sea `estricto`, la configuración se relee en cada petición, así que guardar la clave en el ítem `CONFIG` activa el modo estricto sin volver a desplegar.
  5. Límite de 5 peticiones por segundo: el API ya limita a 10/s con ráfaga de 20 (infra fija). No se agrega limitador en código (por instancia no sería confiable); ver § 5.
- **DoD:** S-TEST-2 en verde; en modo `estricto` ninguna ruta de prueba se atiende antes de `verificarClave`; en el ambiente desplegado sin clave configurada, las comprobaciones de AC-1, AC-2, AC-3 y AC-5 dejan de recibir 401.

---

## 3. Dependencias entre subtasks

```
S-BE-1 ──┬──▶ S-DB-1 ──┬──▶ S-BE-3 ──▶ S-BE-4 ──┐
         │             ├──▶ S-BE-5 ─────────────┤
         │             └──▶ S-SEC-1 ────────────┤
         ├──▶ S-DB-2 ──▶ S-BE-2 ──▶ S-BE-3      ├──▶ S-BE-6 ──┬──▶ S-TEST-1
         └──▶ S-OBS-1 ──────────────────────────┘             └──▶ S-TEST-2
```

| Subtask | Depende de | Puede ir en paralelo con |
|---|---|---|
| S-BE-1 | — | — |
| S-DB-1 | S-BE-1 | S-DB-2, S-OBS-1 |
| S-DB-2 | S-BE-1 (y convención de claves de S-DB-1) | S-OBS-1 |
| S-OBS-1 | S-BE-1 | S-DB-1, S-DB-2 |
| S-BE-2 | S-DB-2, S-BE-1 | S-SEC-1, S-BE-5 |
| S-SEC-1 | S-DB-1 | S-BE-2, S-BE-5 |
| S-BE-5 | S-DB-1 | S-BE-2, S-SEC-1 |
| S-BE-3 | S-DB-1, S-BE-2 | S-BE-5, S-SEC-1 |
| S-BE-4 | S-BE-3, S-BE-1 | — |
| S-BE-6 | S-BE-4, S-DB-2, S-BE-5, S-SEC-1, S-OBS-1 | — |
| S-TEST-1 | S-BE-6 | S-TEST-2 |
| S-TEST-2 | S-BE-6, S-SEC-1, S-BE-2 | S-TEST-1 |

Sin ciclos. Orden de riesgo: S-BE-6 y S-SEC-1 (alto) apenas tengan sus insumos. Las pruebas de las subtareas se escriben junto con cada una; S-TEST-1 y S-TEST-2 cierran la cobertura por criterio. Total estimado: 600 minutos.

---

## 4. Hand-off a task-dependency-analyzer

Cada subtask declara `id`, `layer`, `files`, `consume`/`produce` con `artifact_id` únicos y `estimated_minutes`/`risk`. Los insumos externos usan el prefijo `external:` (`external:contract`, `external:domain`, `external:adrs`, `external:observability`, `external:security`, `external:claude`, `external:story`). El plan es procesable por TDA para armar el DAG.

Definición de terminado de la historia (`.build/reglas.md`): cada AC con al menos una prueba (AC-4 solo automatizada), `node --test` en verde, respuestas según api-contract § 10, un registro JSON por petición, ningún secreto en el código.

---

## 5. Decisiones tomadas sin consulta y preguntas abiertas

Nadie podía responder durante esta etapa. Cada punto toma la opción más simple y se puede revisar.

| ID | Tema | Decisión tomada | Por qué / costo de cambiarla |
|---|---|---|---|
| OQ-H1-1 `[ADAPTACIÓN PLANTILLA]` | ADR-001 (TypeScript + Terraform propio) frente a la plantilla fija (`.mjs`, `infra/` intocable) | Se sigue la plantilla: módulos `.mjs` con la forma de los puertos de api-contract § 4 | La plantilla es la que se despliega. Pasar a TypeScript después exige un paso de compilación que hoy no existe |
| OQ-H1-2 `[ADAPTACIÓN PLANTILLA]` | Cola FIFO de entrantes (ADR-009) | Cola en proceso tras el puerto `ColaEntrantes`; el POST responde 202 después de procesar | No hay SQS. Cambiar a SQS es reemplazar solo `cola-en-proceso.mjs` |
| OQ-H1-3 `[ADAPTACIÓN PLANTILLA]` · **revisada 2026-11-26** | Dónde vive la clave de prueba (contrato: Secrets Manager) y qué pasa si no hay ninguna | Variable `CLAVE_CANAL_EMULADO` o ítem `CONFIG / CANAL_EMULADO` de la tabla. Con clave configurada se aplica el modo estricto. Sin clave configurada se aplica el modo abierto: las rutas se atienden sin exigir el encabezado | Evidencia: la compuerta de aceptación del 2026-11-25 recibió 401 en todas las rutas y no le llegó ningún `X-Clave-Prueba`. Los dos intentos anteriores fallaron: con 404 sin clave y con "encabezado presente, aunque vacío". **Riesgo aceptado:** mientras no haya clave configurada, cualquiera puede usar las rutas de prueba. Solo hay datos y números de prueba, el API limita a 10 peticiones/s y en producción las rutas no existen. Para cerrarlo basta con guardar la clave en el ítem `CONFIG`, sin volver a desplegar. **Desvío del contrato:** api-contract § 10.6 pide la clave siempre. Se mantiene en modo estricto y se cubre con pruebas automatizadas (AC-4) |
| OQ-H1-4 `[ADAPTACIÓN PLANTILLA]` | Habilitación solo en prueba (`canal_emulado_habilitado` en Terraform) | Variable `ENTORNO`: con `produccion` las rutas dan 404 y el canal emulado no arranca. Este despliegue es el ambiente de prueba (no hay cuenta de Meta) | No se puede agregar la variable de Terraform. Cuando exista producción, poner `ENTORNO=produccion` es obligatorio |
| OQ-H1-5 `[ADAPTACIÓN PLANTILLA]` | Siembra "al desplegar" | Siembra idempotente en la primera petición de prueba de cada instancia | No hay paso posterior al despliegue. Resultado visible igual al del contrato |
| OQ-H1-6 `[ADAPTACIÓN PLANTILLA]` | Vencimiento a 7 días del almacén | `vence_en` guardado y filtrado al leer | La tabla no tiene TTL configurado. Activarlo luego no cambia el código |
| OQ-H1-7 `[ADAPTACIÓN PLANTILLA]` | Límite de 5 peticiones/s con 429 | Se acepta el límite del API (10/s, ráfaga 20) | No se puede cambiar `infra/`. Riesgo bajo: solo hay datos de prueba |
| OQ-H1-8 `[ADAPTACIÓN PLANTILLA]` | Clave del seudónimo (HMAC en Secrets Manager) | Misma fuente que la clave de prueba (`CLAVE_SEUDONIMO` o atributo `clave_seudonimo` del ítem `CONFIG`); si falta, el log omite `telefono_seudonimo` y el grupo de la cola usa un SHA-256 del número | En prueba solo hay números de prueba; producción necesita la clave real antes de H2 |
| OQ-H1-9 | Forma del cuerpo de error: `.build/reglas.md` pide `{"error":"<mensaje>"}`, el contrato aprobado `{"error":{"codigo","detalle"}}` | Se sigue el contrato (§ 10) | El contrato es lo aprobado y lo que leen las comprobaciones; ambos llevan la clave `error` |
| OQ-H1-10 | AL-13 y métricas de CloudWatch | No se crean en H1 | Requieren cambios de infraestructura; quedan para cuando exista producción |
