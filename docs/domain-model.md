# Domain Model · TurnoFácil

**Date:** 2026-11-24
**RFC base:** docs/RFC.md § 3 (Modelado de dominio), § 2.1.4 (puntualidad y fallos), § 5 (decisiones 5.1 a 5.9)
**PRD base:** docs/PRD.md (US-01 a US-04, § 6, § 8)
**Flujos y estados:** docs/flows/turnofacil/user-flows.md · INDEX.md
**ADRs:** docs/adrs/ADR-001 a ADR-009

---

## Resumen para decidir

**Las tres áreas y quién opera cada una**

- **Agenda.** La opera la dueña desde el número de WhatsApp del salón. Ahí registra citas, las cancela y pide la vista de sus citas.
- **Recordatorios y respuestas.** La opera el sistema solo. Envía los dos recordatorios, entiende lo que responde la clienta, registra las bajas y avisa a la dueña cuando una clienta cancela.
- **Soporte y auditoría.** La opera solo el equipo de TurnoFácil, nunca la dueña. Cambia el número de la dueña, reactiva a una clienta o borra sus datos cuando la dueña lo pide, y deja registro de cada acceso.

**Las cuatro decisiones que tomamos**

- Se mantienen las tres áreas, y en soporte solo actúa el equipo de TurnoFácil.
- La cita es la única que cambia su propio estado. Los recordatorios solo le piden el cambio, y cada recordatorio lleva su propio control de envío.
- El nombre y el teléfono de la clienta se guardan dentro de cada cita, sin una ficha de clientas por salón. Aparte hay un único registro por teléfono, sin nombre, que solo dice si la clienta está activa o dada de baja.
- Si una clienta se da de baja, deja de recibir recordatorios de todos los salones, y el mensaje de baja se lo dice así.

**Reglas más importantes**

- Solo el número de la dueña puede registrar, cancelar o pedir la vista. A cualquier otro número no se le responde.
- Cada salón ve solo sus propias citas.
- Cada cita tiene dos recordatorios: a las 6 de la tarde del día anterior y 2 horas antes. El segundo sale aunque la clienta ya haya confirmado.
- Vale la última respuesta válida de la clienta. Lo que no se entiende no cambia nada.
- La baja vale en todos los salones de TurnoFácil. Una cita que ya estaba confirmada sigue confirmada.
- En la vista, la dueña ve dos listas. En "confirmadas" están las clientas que dijeron que sí. En "sin confirmar" están las que no han respondido, las que respondieron algo que no se entendió y las que cancelaron. Las citas que canceló la dueña no aparecen.
- Cuando una clienta cancela o vuelve a confirmar, la dueña recibe un aviso. Cuando la dueña cancela, a la clienta no se le avisa.
- Al llegar la hora de la cita, el estado queda fijo. Si la clienta no respondió, la cita queda sin confirmar. Lo que escriba después ya no cambia nada, y la dueña tampoco puede cancelarla.
- Si la dueña pide borrar los datos de una clienta, se borran de las citas de su salón y se conserva el registro de baja.

**Lo que queda abierto**

- El texto final del mensaje de baja y la lista final de palabras de baja dependen de la validación legal.
- Cuánto tiempo se guardan los datos, que también depende de la validación legal.
- Si la dueña debería enterarse cuando una clienta se da de baja. Hoy solo lo sabe al registrarle una cita nueva.

---

> Este documento amplía la sección 3 del RFC. El RFC la ubicaba en `arch/domain-model.md`; por instrucción de la plataforma queda en `docs/domain-model.md`.
>
> **Marcas:** `[ASUNCIÓN SIN EVIDENCIA]` indica algo que el PRD o el RFC fijan sin validación en campo. `[DECISIÓN ETAPA 9]` indica una decisión tomada con el fundador en esta etapa.

### Decisiones de esta etapa

| ID | Decisión | Efecto en el modelo |
|---|---|---|
| D9-1 | Se mantienen los tres contextos del RFC § 3.3. En **Soporte y auditoría** opera solo el **equipo de TurnoFácil**, nunca la dueña del salón | § 1.3, RB-12 |
| D9-2 | La **Cita** es el único agregado que cambia su propio estado, incluida la última respuesta válida. Recordatorios interpreta la respuesta y le *pide* a la cita confirmarse o cancelarse. Cada **Recordatorio** es un agregado aparte | § 3.2, § 3.4, RB-04 |
| D9-3 | Nombre y teléfono de la clienta se guardan **dentro de cada cita**, tal como los escribe la dueña. No hay ficha de clientas por salón. Aparte existe un único **Contacto de clienta** por teléfono, compartido entre salones y sin nombre, que guarda solo la condición activa o dada de baja | § 3.2, § 3.5, RB-07 |
| D9-4 | La baja vale por teléfono en **todos los salones**, y el mensaje de confirmación de baja se lo dice a la clienta de forma explícita | RB-07, RB-08 |

---

## 1. Bounded contexts

DDD ligero: tres contextos para un solo equipo y unas ocho entidades (RFC § 3.3). La integración con WhatsApp no es un contexto: es una capa anticorrupción alrededor de Agenda y de Recordatorios y respuestas (puerto `CanalWhatsApp`, ADR-002).

### 1.1 Contexto: Agenda

**Responsabilidad:** registrar y cancelar las citas que la dueña ya agendó, decidir el estado de cada cita y armar la vista que la dueña pide.
**Entidades raíz:** Salón, Cita, Comando de la dueña.
**Lenguaje propio:** dueña, número registrado, registrar, cancelar (por la dueña), cita guardada, confirmación de guardado, rechazo, vista, lista de confirmadas, lista de sin confirmar, cierre de la cita.
**Historias:** US-01, US-03.

### 1.2 Contexto: Recordatorios y respuestas

**Responsabilidad:** programar y enviar los dos recordatorios de cada cita, interpretar lo que responde la clienta, gestionar su baja y avisar a la dueña cuando una clienta cancela.
**Entidades raíz:** Recordatorio, Respuesta de clienta, Contacto de clienta, Aviso a la dueña.
**Lenguaje propio:** recordatorio 1, recordatorio 2, hora programada, retraso, reserva de envío, omitido, incumplido, no entregable, palabra de confirmación, palabra de cancelación, palabra de baja, respuesta no entendida, condición de la clienta, baja, aviso de cancelación.
**Historias:** US-02, US-04.

### 1.3 Contexto: Soporte y auditoría

**Responsabilidad:** permitir que **el equipo de TurnoFácil** (nunca la dueña) ejecute a mano, cuando la dueña lo solicita, tres operaciones: cambio de número de la dueña, reactivación de una clienta y borrado de datos de una clienta. También registra todo acceso del equipo a datos de clientas.
**Entidades raíz:** Evento de auditoría.
**Lenguaje propio:** equipo de TurnoFácil, rol de soporte, solicitud de la dueña, identidad confirmada, cambio de número, reactivación, borrado, acceso registrado.
**Origen:** PRD § 6 (seguridad y observabilidad), RFC RF-11, ADR-007, decisión D9-1.

### 1.4 Mapa de contextos (Context Map)

```
                  WhatsApp (Meta)  ◀── capa anticorrupción: puerto CanalWhatsApp (ADR-002) ──▶
                         │                                              │
                         ▼                                              ▼
┌──────────────────────────────┐   eventos publicados (CitaRegistrada,   ┌──────────────────────────────┐
│           AGENDA             │   CitaCanceladaPorLaDueña, CitaCerrada) │  RECORDATORIOS Y RESPUESTAS  │
│  Salón · Cita · Comando      │ ──────────────────────────────────────▶ │  Recordatorio · Respuesta ·  │
│                              │                                         │  Contacto de clienta · Aviso │
│  (supplier: dueña del estado │ ◀────────────────────────────────────── │  (customer: pide confirmar   │
│   de la cita)                │   operaciones: confirmarPorClienta,     │   o cancelar la cita)        │
│                              │   cancelarPorClienta                    │                              │
│                              │ ──── consulta: condición por teléfono ─▶│  (supplier de la condición)  │
└──────────────┬───────────────┘                                         └───────────────┬──────────────┘
               │                                                                         │
               │ conformist (usa los modelos tal cual, sin reglas propias)               │
               └──────────────────────────┐                ┌─────────────────────────────┘
                                          ▼                ▼
                                ┌────────────────────────────────┐
                                │      SOPORTE Y AUDITORÍA       │
                                │  Evento de auditoría           │
                                │  (opera el equipo TurnoFácil)  │
                                └────────────────────────────────┘
```

| Relación | Tipo DDD | Qué significa aquí |
|---|---|---|
| Agenda → Recordatorios (eventos de cita) | Customer-supplier, con published language | Agenda publica los cambios de la cita. Recordatorios programa u omite envíos a partir de ellos |
| Recordatorios → Agenda (respuestas) | Customer-supplier | Recordatorios no cambia el estado de la cita: invoca operaciones de la Cita, que decide (D9-2) |
| Agenda → Recordatorios (condición) | Customer-supplier | Al registrar, Agenda consulta si el teléfono está dado de baja para avisarlo a la dueña (US-02·2.9) |
| Soporte → Agenda y Recordatorios | Conformist | Usa los modelos de los otros dos sin traducirlos. No tiene reglas de negocio propias más allá de la auditoría |
| WhatsApp → Agenda y Recordatorios | Anti-corruption layer | Los mensajes, plantillas y estados de entrega de Meta se traducen al lenguaje del dominio. Cambiar a Twilio solo toca esta capa (ADR-002) |

---

## 2. Ubiquitous Language

### 2.1 Agenda

| Término | Definición |
|---|---|
| Salón | Negocio que trabaja solo con citas, con **un** número registrado de dueña. Zona horaria fija: America/Bogota |
| Dueña | Persona que escribe desde el número registrado del salón. Es la única que registra, cancela o pide la vista |
| Número registrado | Teléfono de WhatsApp de la dueña, en formato E.164. Identifica al salón: el salón se deduce de él y nunca del texto del mensaje (ADR-006) |
| Número no registrado | Cualquier remitente que no es el número registrado de un salón. No recibe respuesta a acciones de la dueña (US-01·1.9) |
| Registrar | Acción de la dueña que crea una cita con los cinco datos: clienta, teléfono, servicio, día y hora |
| Cita | Servicio agendado de una clienta en un salón, a un inicio dado. Guarda el nombre y el teléfono tal como los escribió la dueña (D9-3) |
| Inicio | Día y hora de la cita, en hora de Colombia |
| Confirmación de guardado | Mensaje a la dueña que dice que la cita quedó guardada. Puede incluir el aviso de que la clienta está dada de baja. **No es** la confirmación de la clienta |
| Rechazo | Respuesta a la dueña cuando la cita no se guarda: dato faltante, teléfono inválido, fecha pasada o cita duplicada |
| Cancelar (por la dueña) | Acción de la dueña que indica nombre de la clienta, día y hora. Lleva la cita a `cancelada_duena` |
| Estado de la cita | Uno de: `guardada`, `confirmada`, `cancelada_clienta`, `cancelada_duena`, `sin_confirmar`, `confirmada_cerrada`, `cancelada_clienta_cerrada` |
| Última respuesta válida | La última palabra de confirmación o de cancelación de la clienta antes del inicio. Es la que define el estado |
| Cierre de la cita | Momento en que llega el inicio: el estado queda fijo y ninguna respuesta posterior lo cambia |
| Vista | Mensaje que la dueña pide, para mañana o un día indicado, con dos listas: confirmadas y sin confirmar. Nunca se envía sin que la dueña la pida |
| Lista de sin confirmar | Lista de la vista. Agrupa citas `guardada`, `sin_confirmar`, `cancelada_clienta` y `cancelada_clienta_cerrada`. **No es** el estado `sin_confirmar` (ver § 2.4) |
| Comando de la dueña | Mensaje de la dueña interpretado como registrar, cancelar o vista, con su resultado |

### 2.2 Recordatorios y respuestas

| Término | Definición |
|---|---|
| Recordatorio 1 | Mensaje con plantilla a la clienta, a las 18:00 del día anterior a la cita (hora de Colombia) |
| Recordatorio 2 | Mensaje con plantilla a la clienta, 2 horas antes del inicio. Sale aunque la clienta ya haya confirmado; no sale si la cita fue cancelada |
| Hora programada | Momento exacto en que debe salir un recordatorio |
| Retraso | Segundos entre la hora programada y el envío real. Máximo aceptado: 300 s `[ASUNCIÓN SIN EVIDENCIA]` (PRD § 6) |
| Reserva de envío | Paso atómico que deja a un solo emisor enviar un recordatorio y evita duplicados (ADR-003) |
| Omitido | Recordatorio que no se envía porque la cita se canceló o porque la clienta está dada de baja |
| Incumplido | Recordatorio 2 que no salió en 5 minutos y ya no se reenvía (ADR-004) |
| No entregable | Recordatorio que el canal rechaza de forma permanente (por ejemplo, número sin WhatsApp) |
| Respuesta de clienta | Mensaje de la clienta asociado a un recordatorio y clasificado como confirma, cancela, baja o no entendida |
| Palabra de confirmación | "sí", "confirmo", "listo", "ok" o 👍. Lista configurable `[ASUNCIÓN SIN EVIDENCIA]` (US-02) |
| Palabra de cancelación | "cancelo", "cancelar" o "no puedo". Lista configurable `[ASUNCIÓN SIN EVIDENCIA]` |
| Palabra de baja | "no más" o "stop", con cualquier mayúscula, tilde o puntuación. "Baja" y "para" **no** lo son (US-02·2.10) |
| Respuesta no entendida | Cualquier otra respuesta. No cambia la última respuesta válida |
| Contacto de clienta | Registro único por teléfono, compartido entre salones y sin nombre, que guarda solo la condición (D9-3) |
| Condición de la clienta | `activa` o `dada_de_baja`. Es del teléfono, no de la cita |
| Baja | Paso de `activa` a `dada_de_baja` por palabra de baja. Vale en todos los salones de TurnoFácil (D9-4) |
| Mensaje de baja | Mensaje corto a la clienta que confirma la baja y le dice que no recibirá recordatorios de ningún salón de TurnoFácil (D9-4) |
| Aviso de cancelación | Mensaje con plantilla a la dueña cuando una clienta cancela, con nombre, servicio, día y hora. Incluye el aviso cuando una cita cancelada vuelve a confirmarse (flujo F4 A2b) |

### 2.3 Soporte y auditoría

| Término | Definición |
|---|---|
| Equipo de TurnoFácil | Personas del proveedor del servicio que pueden asumir el rol de soporte. **No** incluye a la dueña (D9-1) |
| Rol de soporte | Permiso que se asume de forma explícita para acceder a datos de clientas o ejecutar operaciones manuales. Cada vez que se asume, se dispara la alerta 4 del PRD § 6 |
| Solicitud de la dueña | Pedido que hace la dueña al equipo por fuera del chat del producto. Es requisito de las tres operaciones manuales |
| Identidad confirmada | Verificación que hace el fundador, por otro medio, de que quien pide el cambio de número es la dueña |
| Cambio de número | Reemplazo del número registrado de un salón |
| Reactivación | Paso manual de `dada_de_baja` a `activa`. No hay reactivación por mensaje (ADR-007) |
| Borrado | Eliminación del nombre y el teléfono de una clienta en las citas de un salón, a pedido de la dueña (PRD § 6) |
| Evento de auditoría | Registro inmutable de quién del equipo hizo qué, sobre qué salón o contacto, cuándo y a pedido de quién |

### 2.4 Términos con significado distinto según el contexto

| Término | En Agenda | En Recordatorios y respuestas | En Soporte y auditoría |
|---|---|---|---|
| **Clienta** | Nombre y teléfono escritos dentro de una cita | Contacto identificado solo por teléfono, sin nombre | Referencia al contacto o a las citas, sin copiar sus datos |
| **Confirmación** | Confirmación de guardado a la dueña | Respuesta de la clienta con palabra de confirmación | No se usa |
| **Cancelación / cancelada** | Siempre se dice *por la dueña* o *por la clienta*: son estados distintos | Solo existe la cancelación *por la clienta* | No se usa |
| **Sin confirmar** | Estado final `sin_confirmar` (llegó el inicio sin respuesta válida) **y** nombre de una lista de la vista con más estados | No se usa como estado: un recordatorio no confirma nada | No se usa |
| **Baja** | No se usa: la cita no tiene estado de baja | Condición del teléfono | La reactivación revierte la baja |

---

## 3. Agregados (por contexto)

### 3.1 Salón (Agenda)

**Entidad raíz:** Salón
**Identificador:** `salon_id: SalonId (identificador opaco)`
**Entidades hijas:** ninguna
**Value Objects:** `Telefono` (E.164), `ZonaHoraria`

#### Atributos
| Campo | Tipo | Descripción |
|---|---|---|
| salon_id | SalonId | Identificador opaco, el único que aparece en registros |
| numero_duena | Telefono | Número registrado de la dueña |
| zona_horaria | ZonaHoraria | Fija: America/Bogota |
| envio_activo | boolean | Interruptor por salón del rollout (RFC § 6.3) |

#### Invariantes
- [Inv-SAL-01] Un salón tiene exactamente un número registrado.
- [Inv-SAL-02] Un número registrado pertenece a un solo salón (ADR-006).
- [Inv-SAL-03] Solo una operación de soporte cambia `numero_duena` y siempre deja un evento de auditoría (RB-12).

#### Operaciones
- `identificarRemitente(telefono)` → salón de la dueña o "no es dueña".
- `cambiarNumero(nuevo, identidadConfirmada)` → solo desde Soporte y auditoría.

### 3.2 Cita (Agenda)

**Entidad raíz:** Cita
**Identificador:** `cita_id: CitaId (opaco)`; única por (`salon_id`, `telefono`, `inicio`)
**Entidades hijas:** ninguna. Los recordatorios y respuestas son agregados aparte (D9-2)
**Value Objects:** `NombreClienta`, `Telefono`, `Servicio`, `Inicio`, `EstadoCita`, `RespuestaValida`

#### Atributos
| Campo | Tipo | Descripción |
|---|---|---|
| cita_id | CitaId | Identificador opaco |
| salon_id | SalonId | Salón dueño de la cita |
| nombre_clienta | NombreClienta (texto) | Tal como lo escribió la dueña (D9-3). Dato personal |
| telefono | Telefono (E.164) | 10 dígitos que empiezan por 3, normalizado con +57. Dato personal |
| servicio | Servicio (texto) | Servicio agendado |
| inicio | Inicio (fecha y hora, America/Bogota) | Día y hora de la cita |
| estado | EstadoCita (enum) | Ver § 3.2 Transiciones |
| ultima_respuesta_valida | RespuestaValida? (`confirma` \| `cancela`, con fecha) | Vacía hasta la primera respuesta válida |
| registrada_en | fecha y hora | Para reconstruir la cita (RF-12) |
| clienta_dada_de_baja_al_registrar | boolean | Se informa a la dueña en la confirmación de guardado (US-02·2.9) |
| datos_borrados | boolean | Verdadero tras un borrado: nombre y teléfono quedan vacíos |

#### Transiciones
```
guardada ──confirma──▶ confirmada ──cancela──▶ cancelada_clienta ──confirma──▶ confirmada
guardada ──cancela──▶ cancelada_clienta
guardada | confirmada | cancelada_clienta ──cancela la dueña──▶ cancelada_duena          (final)
al llegar el inicio:  guardada → sin_confirmar                                          (final)
                      confirmada → confirmada_cerrada                                   (final)
                      cancelada_clienta → cancelada_clienta_cerrada                     (final)
```

#### Invariantes
- [Inv-CIT-01] Nunca se guarda una cita sin los cinco datos (US-01·1.5).
- [Inv-CIT-02] Nunca se guarda una cita con teléfono distinto de 10 dígitos que empiezan por 3, con o sin +57 (US-01·1.8).
- [Inv-CIT-03] Nunca se guarda una cita cuyo inicio ya pasó (US-01·1.6).
- [Inv-CIT-04] No hay dos citas con el mismo (salón, teléfono, inicio) (US-01·1.7; dentro del salón según el supuesto A6 del RFC).
- [Inv-CIT-05] El estado solo cambia por las transiciones de arriba. Un estado final no cambia nunca.
- [Inv-CIT-06] Una respuesta no entendida o de baja no cambia ni el estado ni `ultima_respuesta_valida` (flujo F4 A3; decisión 9 de INDEX).
- [Inv-CIT-07] Una respuesta posterior al inicio se registra pero no cambia el estado (RF-10).
- [Inv-CIT-08] Solo la propia Cita cambia su estado (D9-2).

#### Operaciones
- `registrar(datos, condicionClienta)` → `CitaRegistrada` o `RegistroRechazado(motivo)`.
- `confirmarPorClienta(respuesta)` / `cancelarPorClienta(respuesta)` → las invoca Recordatorios y respuestas.
- `cancelarPorDueña()` → solo desde `guardada`, `confirmada` o `cancelada_clienta`.
- `cerrar()` → al llegar el inicio.
- `borrarDatosPersonales()` → solo desde Soporte y auditoría.

### 3.3 Comando de la dueña (Agenda)

**Entidad raíz:** Comando de la dueña
**Identificador:** `mensaje_id: MensajeId` (identificador del mensaje de Meta)
**Entidades hijas:** ninguna
**Value Objects:** `TipoComando` (`registrar` \| `cancelar` \| `vista`), `ResultadoComando`

#### Atributos
| Campo | Tipo | Descripción |
|---|---|---|
| mensaje_id | MensajeId | Da idempotencia ante reentregas del webhook |
| salon_id | SalonId | Salón deducido del remitente |
| tipo | TipoComando | Acción interpretada |
| resultado | ResultadoComando (enum) | `guardada`, `cancelada`, `no_encontrada`, `vista_enviada`, `sin_citas`, `dia_no_entendido`, `rechazado:<motivo>`, `no_entendido`, `error_al_guardar` |
| cita_id | CitaId? | Cita afectada, si aplica |
| recibido_en / respondido_en | fecha y hora | Para medir los 10 s `[ASUNCIÓN SIN EVIDENCIA]` |

#### Invariantes
- [Inv-CMD-01] Un mismo `mensaje_id` se procesa una sola vez (ADR-009).
- [Inv-CMD-02] Solo existe un comando si el remitente es el número registrado de un salón (US-01·1.4, 1.9).

#### Operaciones
- `procesar(mensaje)` → ejecuta la acción sobre Cita o arma la vista y guarda el resultado.

> **La vista** no es un agregado: es una consulta de solo lectura sobre las citas del salón para un día (RB-10).

### 3.4 Recordatorio (Recordatorios y respuestas)

**Entidad raíz:** Recordatorio
**Identificador:** `cita_id + tipo` (`rec-<cita>-<tipo>`)
**Entidades hijas:** ninguna
**Value Objects:** `TipoRecordatorio` (`dia_antes` \| `dos_horas_antes`), `HoraProgramada`, `EstadoRecordatorio`, `Intento`

#### Atributos
| Campo | Tipo | Descripción |
|---|---|---|
| cita_id | CitaId | Cita a la que pertenece |
| tipo | TipoRecordatorio | Recordatorio 1 o 2 |
| hora_programada | fecha y hora | 18:00 del día anterior o inicio menos 2 h |
| estado | EstadoRecordatorio (enum) | `programado`, `enviando`, `reintentar`, `enviado`, `enviado_tarde`, `omitido`, `omitido_por_baja`, `incumplido`, `no_entregable`, `no_entregado` |
| intentos | Intento[] (fecha, resultado) | Historial de envíos (RF-12) |
| enviado_en | fecha y hora? | Hora real de envío |
| retraso_s | entero? | Segundos de retraso |

#### Invariantes
- [Inv-REC-01] Hay como máximo un recordatorio por (cita, tipo); como máximo dos por cita.
- [Inv-REC-02] No se crea un recordatorio cuya hora programada ya pasó al registrar la cita (US-02·2.8).
- [Inv-REC-03] Solo quien gana la reserva de envío (`programado`/`reintentar` → `enviando`) envía. Nunca se envía dos veces (ADR-003).
- [Inv-REC-04] No se envía si la cita está cancelada (por la clienta o por la dueña): pasa a `omitido`. No se envía si la clienta está dada de baja: pasa a `omitido_por_baja` (RF-05).
- [Inv-REC-05] El recordatorio 2 no se reenvía pasados 5 minutos: queda `incumplido` (ADR-004).
- [Inv-REC-06] El contenido solo muestra datos de la propia cita (PRD § 6).

#### Operaciones
- `programar(cita)`, `reservarEnvio()`, `registrarEnvio(resultado)`, `omitir(motivo)`, `registrarEstadoDeEntrega(estado)`.

### 3.5 Contacto de clienta (Recordatorios y respuestas)

**Entidad raíz:** Contacto de clienta
**Identificador:** `telefono: Telefono (E.164)`
**Entidades hijas:** ninguna
**Value Objects:** `Telefono`, `CondicionClienta`

#### Atributos
| Campo | Tipo | Descripción |
|---|---|---|
| telefono | Telefono | Identidad. Es el único dato personal: **no guarda nombre** (D9-3) |
| condicion | CondicionClienta (`activa` \| `dada_de_baja`) | Vale en todos los salones |
| dada_de_baja_en | fecha y hora? | Momento de la baja |
| reactivada_en | fecha y hora? | Última reactivación manual |

#### Invariantes
- [Inv-CON-01] Existe un solo contacto por teléfono en todo TurnoFácil (D9-3).
- [Inv-CON-02] Solo una palabra de baja pasa de `activa` a `dada_de_baja` (US-02·2.5, 2.10).
- [Inv-CON-03] Solo una reactivación del equipo de TurnoFácil, con evento de auditoría, pasa de `dada_de_baja` a `activa`. Ningún mensaje de la clienta la reactiva (ADR-007).
- [Inv-CON-04] La baja no cambia el estado de ninguna cita. Una cita confirmada sigue confirmada (decisión 9 de INDEX).

#### Operaciones
- `darDeBaja()` → `ClientaDadaDeBaja`. Dispara el mensaje de baja (RB-08).
- `reactivar(evento_auditoria)` → solo desde Soporte y auditoría.
- `estaDadaDeBaja()` → consulta de Agenda y del emisor.

### 3.6 Respuesta de clienta (Recordatorios y respuestas)

**Entidad raíz:** Respuesta de clienta
**Identificador:** `mensaje_id: MensajeId`
**Entidades hijas:** ninguna
**Value Objects:** `Clasificacion` (`confirma` \| `cancela` \| `baja` \| `no_entendida`)

#### Atributos
| Campo | Tipo | Descripción |
|---|---|---|
| mensaje_id | MensajeId | Identificador de Meta. Da idempotencia |
| telefono | Telefono | Remitente |
| cita_id | CitaId | Cita asociada al recordatorio citado, o al más reciente (supuesto A7 del RFC) |
| clasificacion | Clasificacion | Resultado del intérprete determinista (ADR-008) |
| recibida_en | fecha y hora | Orden de llegada |
| aplicada | boolean | Falso si llegó después del cierre o no cambió el estado |

#### Invariantes
- [Inv-RES-01] Un `mensaje_id` se clasifica y se aplica una sola vez (ADR-009).
- [Inv-RES-02] Las respuestas del mismo teléfono se aplican en orden de llegada (ADR-009).
- [Inv-RES-03] La clasificación se compara sin importar mayúsculas, tildes ni puntuación (US-02·2.10).

#### Operaciones
- `clasificar(texto)` y `aplicar()`. `aplicar` invoca `Cita.confirmarPorClienta`, `Cita.cancelarPorClienta` o `Contacto.darDeBaja`.

### 3.7 Aviso a la dueña (Recordatorios y respuestas)

**Entidad raíz:** Aviso a la dueña
**Identificador:** `cita_id + secuencia`
**Entidades hijas:** ninguna
**Value Objects:** `TipoAviso` (`cancelacion` \| `reconfirmacion`), `EstadoEntrega`

#### Atributos
| Campo | Tipo | Descripción |
|---|---|---|
| cita_id | CitaId | Cita que cambió |
| secuencia | entero | Orden de avisos de la misma cita |
| tipo | TipoAviso | Cancelación o reconfirmación (flujo F4 A2b) |
| estado_entrega | EstadoEntrega | `enviado`, `no_entregado` |
| enviado_en | fecha y hora | Momento del aviso |

#### Invariantes
- [Inv-AVI-01] Hay un aviso por cada `CitaCanceladaPorLaClienta` y por cada `CitaReconfirmada`; ninguno por la cancelación de la dueña (US-01·1.3).
- [Inv-AVI-02] Lleva nombre de la clienta, servicio, día y hora, y va solo al número registrado del salón de la cita (RF-09).
- [Inv-AVI-03] Si se corta US-04, se cortan juntos el aviso de cancelación y el de reconfirmación (PRD § 4B; flujo F4 A2b).

#### Operaciones
- `avisar(cita, tipo)`, `registrarEstadoDeEntrega(estado)`.

### 3.8 Evento de auditoría (Soporte y auditoría)

**Entidad raíz:** Evento de auditoría
**Identificador:** `evento_id: EventoId`
**Entidades hijas:** ninguna
**Value Objects:** `TipoOperacion` (`acceso` \| `cambio_numero` \| `reactivacion` \| `borrado`), `Referencia` (SalonId \| seudónimo del teléfono)

#### Atributos
| Campo | Tipo | Descripción |
|---|---|---|
| evento_id | EventoId | Identificador |
| operador | identificador del miembro del equipo | Siempre del equipo de TurnoFácil |
| tipo | TipoOperacion | Qué se hizo |
| referencia | Referencia | Salón o seudónimo HMAC del teléfono. Nunca copia nombre ni teléfono |
| solicitado_por | SalonId | Salón cuya dueña pidió la operación |
| identidad_confirmada | boolean | Obligatorio en `cambio_numero` |
| ocurrido_en | fecha y hora | Cuándo |

#### Invariantes
- [Inv-AUD-01] Inmutable: solo se agregan eventos, nunca se editan ni se borran.
- [Inv-AUD-02] El operador es siempre del equipo de TurnoFácil, nunca la dueña (D9-1).
- [Inv-AUD-03] No contiene nombre ni teléfono en claro (ADR-007).
- [Inv-AUD-04] Un `cambio_numero` sin `identidad_confirmada` no se ejecuta.

#### Operaciones
- `registrarAcceso()`, `registrarOperacion(tipo, referencia, solicitud)`.

---

## 4. Eventos de dominio

Son eventos del negocio. Los eventos técnicos (latido del vigilante, mensaje en DLQ) quedan en el diseño de observabilidad.

| Evento | Disparador | Datos | Consumidores |
|---|---|---|---|
| CitaRegistrada | La dueña registra una cita válida (US-01·1.1) | cita_id, salon_id, inicio, clienta_dada_de_baja | Recordatorios (programa 0 a 2 recordatorios), confirmación de guardado |
| RegistroRechazado | Falta un dato, teléfono inválido, fecha pasada o duplicada (US-01·1.5 a 1.8) | salon_id, motivo | Respuesta a la dueña; métrica |
| CitaCanceladaPorLaDueña | La dueña cancela una cita existente (US-01·1.3) | cita_id, salon_id, estado_anterior | Recordatorios (omite pendientes); mensaje a la dueña; cálculo del 70% (la excluye) |
| CancelacionNoEncontrada | La dueña cancela una cita que no existe (flujo F2 A1) | salon_id | Respuesta "no se encontró" |
| CitaConfirmada | Respuesta con palabra de confirmación sobre `guardada` (US-02·2.3) | cita_id, respuesta_id | Vista; cálculo del 70% |
| CitaReconfirmada | Respuesta de confirmación sobre `cancelada_clienta` (flujo F4 A2) | cita_id, respuesta_id | Aviso a la dueña (reconfirmación) |
| CitaCanceladaPorLaClienta | Respuesta con palabra de cancelación sobre `guardada` o `confirmada` (US-02·2.4) | cita_id, respuesta_id | Aviso a la dueña; Recordatorios (omite el 2) |
| RespuestaNoEntendida | Respuesta que no es confirmación, cancelación ni baja (US-02·2.6) | cita_id, respuesta_id | Medición del piloto; sin cambio de estado |
| CitaCerrada | Llega el inicio (RF-10) | cita_id, estado_final | Cálculo del 70%; descarta respuestas posteriores |
| CitaQuedoSinConfirmar | Llega el inicio sin respuesta válida (US-02·2.7) | cita_id, motivo (`sin_respuesta`, `baja`, `no_entregable`) | Cálculo del 70% (no cerrada) |
| RecordatorioEnviado | El emisor envía con éxito | cita_id, tipo, retraso_s | Métrica de retraso; KPI 1 (respuesta) |
| RecordatorioOmitido | Cita cancelada o clienta dada de baja antes de enviar | cita_id, tipo, motivo | Reconstrucción de la cita (RF-12) |
| RecordatorioIncumplido | No salió en 5 minutos (ADR-004) | cita_id, tipo | Alerta 1 del PRD § 6 |
| MensajeNoEntregado | Error permanente o estado de entrega fallido | cita_id o salon_id, tipo_mensaje | Alerta 2 del PRD § 6 |
| ClientaDadaDeBaja | Respuesta con palabra de baja (US-02·2.5) | seudónimo del teléfono | Mensaje de baja; Recordatorios (omite en todos los salones) |
| AvisoDeCancelacionEnviado | Tras CitaCanceladaPorLaClienta o CitaReconfirmada (US-04·4.1) | cita_id, tipo | Medición de utilidad del aviso (PRD § 7) |
| VistaEntregada | La dueña pide la vista (US-03) | salon_id, dia, cantidades por lista | Medición "veces que pide la vista" (PRD § 7) |
| NumeroDeDueñaCambiado | Operación de soporte con identidad confirmada | salon_id, evento_auditoria_id | Identificación de remitentes |
| ClientaReactivada | Operación de soporte | seudónimo del teléfono, evento_auditoria_id | Recordatorios futuros |
| DatosDeClientaBorrados | Operación de soporte a pedido de la dueña | salon_id, seudónimo del teléfono, evento_auditoria_id | Agenda (vacía nombre y teléfono) |
| AccesoDelEquipoRegistrado | Un miembro del equipo asume el rol de soporte | operador, motivo | Alerta 4 del PRD § 6 |

---

## 5. Reglas de negocio (cross-context)

- **[RB-01] Identidad por número.** Solo el número registrado de un salón ejecuta registrar, cancelar o vista. Un mensaje con esas acciones desde otro número no se ejecuta ni se responde (US-01·1.4, 1.9; ADR-006).
- **[RB-02] Aislamiento.** Toda lectura y escritura lleva `salon_id`, deducido del remitente. Una dueña nunca ve citas ni datos de otro salón (PRD § 6).
- **[RB-03] Recordatorios por cita.** Al registrar se crean el recordatorio 1 (18:00 del día anterior) y el 2 (inicio menos 2 h). Si una hora ya pasó, ese recordatorio no se crea (US-02·2.1, 2.2, 2.8; ADR-003).
- **[RB-04] La cita decide su estado.** Recordatorios clasifica la respuesta y pide el cambio; la Cita lo aplica o lo rechaza según sus transiciones (D9-2).
- **[RB-05] Vale la última respuesta válida antes del inicio.** Una respuesta no entendida no la cambia; después del inicio nada la cambia (flujo F4 A2, A2c, A3).
- **[RB-06] Recordatorio 2 tras confirmar.** Sale aunque la clienta ya haya confirmado; no sale si la cita fue cancelada (RFC § 2.1.4).
- **[RB-07] La baja vale en todos los salones.** La baja es del teléfono, no de la cita. Desde el momento de la baja, ningún salón de TurnoFácil envía recordatorios a ese número: los pendientes quedan `omitido_por_baja` y las citas nuevas se guardan sin recordatorios, con aviso a la dueña en la confirmación de guardado. Las citas ya confirmadas siguen confirmadas (US-02·2.5, 2.9, 2.11; D9-3, D9-4).
- **[RB-08] El mensaje de baja dice que aplica a todos los salones.** El mensaje corto que confirma la baja le dice a la clienta, de forma explícita, que no recibirá más recordatorios de ningún salón que use TurnoFácil. La redacción final queda sujeta a la validación legal (PRD § 6; D9-4).
- **[RB-09] Palabras de baja.** Solo "no más" y "stop", sin importar mayúsculas, tildes ni puntuación. "Baja" y "para" son respuestas no entendidas (US-02·2.10). Riesgo conocido en el PRD § 6.
- **[RB-10] Armado de la vista.** Confirmadas: `confirmada`, `confirmada_cerrada`. Sin confirmar: `guardada`, `sin_confirmar`, `cancelada_clienta`, `cancelada_clienta_cerrada`. `cancelada_duena` no aparece. Por defecto, mañana. Nunca se envía sin que la dueña la pida (US-03·3.1 a 3.8).
- **[RB-11] Aviso a la dueña.** Toda cancelación por la clienta y toda reconfirmación generan un aviso a la dueña del salón; la cancelación por la dueña no avisa a la clienta (US-01·1.3; US-04·4.1).
- **[RB-12] Operaciones manuales solo del equipo.** Cambio de número, reactivación y borrado los ejecuta solo el equipo de TurnoFácil, a pedido de la dueña, y cada uno deja un evento de auditoría. La dueña no tiene comando de borrado por chat (supuesto A8 del RFC; D9-1).
- **[RB-13] Datos personales fuera de los registros.** Nombre y teléfono solo viven en Cita y Contacto de clienta. Registros, eventos programados y auditoría usan identificadores opacos o el seudónimo del teléfono (ADR-007).
- **[RB-14] Cálculo del 70%.** Entran las citas con al menos un `RecordatorioEnviado`; quedan fuera las `cancelada_duena`. Cada informe dice cuántas quedaron fuera y por qué (PRD § 8). La parte "la dueña no le escribió" se mide en la revisión semanal, no en el producto `[ASUNCIÓN SIN EVIDENCIA]`.

---

## 6. Open questions

Ninguna bloquea la implementación del modelo.

**Cerradas en esta etapa** `[DECISIÓN ETAPA 9]`:

1. **Cancelar una cita cuyo inicio ya pasó.** La dueña no puede cancelarla. Solo se cancela desde `guardada`, `confirmada` o `cancelada_clienta`; al llegar el inicio la cita queda en un estado final y la dueña recibe "no se encontró" (Inv-CIT-05).
2. **Alcance del borrado.** El borrado aplica a nombre y teléfono en las citas del salón que lo pide. El registro de baja se conserva: el Contacto de clienta no se borra si está dado de baja o si tiene citas en otros salones (Inv-CON-03, RB-07, RB-12).

**Abiertas para iterar:**

3. **Redacción del mensaje de baja (RB-08) y lista final de palabras de baja.** Sujetas a la validación legal y a las plantillas de Meta (supuesto A1 del RFC).
4. **Retención.** Sin purga automática hasta la validación legal (supuesto A4 del RFC).
5. **Aviso a la dueña cuando una clienta se da de baja.** El PRD no lo pide; hoy la dueña solo se entera al registrar una cita nueva (hallazgo de user-flows). No se modela.
