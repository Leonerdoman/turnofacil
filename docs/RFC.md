# RFC-001 · Construir la confirmación de citas por WhatsApp sobre AWS serverless

**Status:** In Review
**Date:** 2026-11-19
**Authors:** Fundador de TurnoFácil; plataforma OPOS (rfc-builder)
**PRD:** [docs/PRD.md](PRD.md)
**Drivers:** `arch/drivers.yaml` no existe en este proyecto. Las restricciones técnicas salen de las respuestas del fundador durante la etapa 7 y quedan registradas en §1.4 y §5.
**UX/UI:** [docs/flows/turnofacil/INDEX.md](flows/turnofacil/INDEX.md) · [docs/flows/turnofacil/user-flows.md](flows/turnofacil/user-flows.md) · [DESIGN.md](../DESIGN.md) · [ui/index.html](../ui/index.html)

**Lector previsto:** la fase de implementación de OPOS (historias de usuario, ingeniería y planes, despliegue con Terraform en la cuenta AWS del cliente). Por eso cada requerimiento y cada decisión de este documento cita la historia (US-01 a US-04) y los criterios del PRD que la originan. Los criterios se citan como `US-02·2.3`, es decir, historia y número de criterio.

---

## 1. Propuesta de solución

### 1.0 Contexto del proyecto

No hay código previo: es un proyecto nuevo (greenfield). No existe `CLAUDE.md` ni `arch/drivers.yaml`. Estas son las únicas fuentes técnicas, en orden de autoridad:

1. Respuestas del fundador en esta etapa: construye OPOS con Terraform en la cuenta AWS del cliente, TypeScript sobre AWS Lambda, WhatsApp Business Platform de Meta directo, monitoreo con CloudWatch, avisos por correo al fundador y registros sin nombres ni teléfonos en claro.
2. PRD aprobado (`docs/PRD.md`) y flujos aprobados (`docs/flows/turnofacil/`).
3. Decisiones propias de este RFC, justificadas en §5 (cada una marca si tiene fuente o no).

### 1.1 Problema y contexto

Una cita fallida en un servicio largo deja el puesto vacío y se pierde entre 110.000 y 350.000 pesos [E:01M7RSBPYMAF3FDSW0CDTKB82M]. En la línea base del piloto hubo 17 citas fallidas en 78 [E:01M7RXWF70H4FDZ56B2RMEMYSF]. La dueña gasta de 20 a 40 minutos diarios en confirmar a mano (valor declarado, no medido).

El experimento de la etapa 3 redujo las citas fallidas de 22,2% a 14,8% con mensajes enviados por una persona [E:01M7RXWF70H4FDZ56B2RMEMYSF]. Lo que nunca se probó es que el efecto se mantenga cuando el sistema envía los mensajes (PRD §7, riesgo crítico, confianza 4/10). Este RFC define el sistema que automatiza ese envío y recibe las respuestas.

Planteado técnicamente, hay cuatro problemas:

- **Puntualidad.** Cada recordatorio debe salir en su hora con un retraso máximo de 5 minutos (PRD §6, asunción sin validar). Un envío que falla en silencio anula la función central (US-02).
- **Conversación sin pantallas.** Todo ocurre en chats de WhatsApp. El sistema debe distinguir quién escribe (dueña, clienta o un número desconocido) y qué quiere decir (US-01·1.4, US-01·1.9).
- **Privacidad.** Nombre y teléfono de las clientas son los datos más sensibles (PRD §6). No pueden aparecer en registros, y la ubicación del almacenamiento queda abierta hasta la validación legal.
- **Costo y canal dependientes de un tercero.** El costo por mensaje de WhatsApp y el tiempo de aprobación de plantillas siguen sin validar (PRD §7, bloqueante). El diseño debe tolerar cambiar de proveedor sin tocar las reglas del negocio.

**Por qué ahora.** El PRD está aprobado y el veredicto de la etapa 3 fue perseverar. La construcción mínima es la forma de validar la asunción de alto riesgo dentro del piloto de 8 semanas (PRD §7).

### 1.2 Requerimientos funcionales

Cada RF es verificable con los criterios Given/When/Then del PRD que cita. La columna "Dónde se decide" apunta a §5.

| ID | Requerimiento | Historia · criterios | Dónde se decide |
|---|---|---|---|
| RF-01 | La dueña registra una cita por chat con clienta, teléfono, servicio, día y hora. Se guarda y se le confirma en menos de 10 s. Se rechaza sin guardar si falta un dato, el teléfono no son 10 dígitos que empiezan por 3 (con o sin +57), la fecha ya pasó o ya existe una cita igual. | US-01·1.1, 1.2, 1.5, 1.6, 1.7, 1.8 | 5.1, 5.8 |
| RF-02 | La dueña cancela una cita indicando nombre de la clienta, día y hora. Se cancela aunque estuviera confirmada o cancelada por la clienta, no salen los recordatorios que faltaban, no se avisa a la clienta y la dueña recibe un mensaje que confirma la cancelación. Si no existe, se le avisa que no se encontró. | US-01·1.3 · flujo F2 | 5.8, 5.9 |
| RF-03 | Solo el número registrado de la dueña ejecuta registrar, cancelar o pedir la vista. Cualquier otro número que intente esas acciones no recibe respuesta. | US-01·1.4, 1.9 | 5.6 |
| RF-04 | Al guardar una cita se programan dos recordatorios: el día antes a las 6:00 p. m. (hora de Colombia) y 2 horas antes de la cita. Si un momento ya pasó, ese recordatorio no se programa y sale solo el que falta. | US-02·2.1, 2.2, 2.8 | 5.3 |
| RF-05 | El recordatorio sale con un retraso máximo de 5 minutos. No sale si la cita fue cancelada (por la clienta o por la dueña) ni si la clienta está dada de baja. El de 2 horas antes sí sale si la clienta ya confirmó. | US-02·2.1, 2.2, 2.9, 2.11 | 5.3, 5.4 |
| RF-06 | La clienta responde con palabras de confirmación o cancelación. Vale la última respuesta válida. Una respuesta no entendida no cambia el estado. Sin respuesta válida al llegar la hora, la cita queda "sin confirmar". | US-02·2.3, 2.4, 2.6, 2.7 | 5.8, 5.9 |
| RF-07 | La clienta se da de baja con "no más" o "stop" (cualquier mayúscula, tilde o puntuación). La baja vale por teléfono en todos los salones, recibe un mensaje corto de confirmación y no recibe más recordatorios. "Baja" y "para" no son baja. | US-02·2.5, 2.6, 2.10 | 5.8 |
| RF-08 | La dueña pide la vista (mañana por defecto, o un día indicado) y recibe dos listas: confirmadas y sin confirmar. Las canceladas por la clienta y las no entendidas van en "sin confirmar". Las canceladas por la dueña no aparecen. Si no hay citas o el día no se entiende, se le dice. La vista nunca se envía sin que la dueña la pida. | US-03·3.1 a 3.8 | 5.8 |
| RF-09 | Cuando una clienta cancela, la dueña recibe un aviso con nombre de la clienta, servicio, día y hora, sin anticipación mínima. Si una cita cancelada vuelve a confirmarse, el aviso corresponde al mismo mecanismo. Se corta junto con US-04. | US-04·4.1 · flujo F4 A2b | 5.2, 5.9 |
| RF-10 | Al llegar la hora de la cita, la última respuesta válida queda fija (confirmada cerrada o cancelada por la clienta cerrada). Una respuesta posterior no cambia el estado. | US-02·2.7 · flujo F4 A2c | 5.3, 5.9 |
| RF-11 | El equipo ejecuta a mano, a solicitud de la dueña, tres operaciones: cambio de número de la dueña (con identidad confirmada por el fundador por otro medio), reactivación de una clienta dada de baja y borrado de los datos de una clienta. Cada una queda registrada. | PRD §6 · flujo F5 | 5.7 |
| RF-12 | Por cada cita se puede reconstruir cuándo se registró, qué recordatorios salieron, qué respondió la clienta y en qué estado quedó. | PRD §6 observabilidad | 5.7 |

### 1.3 Requerimientos no funcionales

| Categoría | Requerimiento | Métrica | Fuente |
|---|---|---|---|
| Performance | Confirmación de guardado y vista en menos de 10 s | Latencia desde que llega el mensaje de la dueña hasta que se entrega la respuesta al canal, medida por evento | PRD §6 (asunción sin validar) · `arch/drivers.yaml#nfrs.performance` (no declarado) |
| Performance | Recordatorio con retraso máximo de 5 minutos | Segundos entre la hora programada y el envío, máximo por ventana de 1 minuto | PRD §6 · RFC §2.1.4 |
| Capacidad | 5 salones al lanzar, unas 34 citas por salón al mes (unas 170 citas y 340 recordatorios al mes en total) | Citas registradas por mes | PRD §6, §7 · `arch/drivers.yaml#capacity_licensing` (no declarado: no se nombra ningún plan de vendor) |
| Observabilidad | CloudWatch con registros estructurados, métricas propias y alarmas. Avisos por correo al fundador (provisional). Detalle en `arch/observability-design.md` | Cuatro alertas del PRD §6, cada una con alarma | Fundador (etapa 7) · PRD §6 · `arch/drivers.yaml#nfrs.observability` (no declarado: se adopta la decisión del fundador) |
| Seguridad y privacidad | Aislamiento entre salones, nombre y teléfono solo visibles para la dueña de su salón, acceso del equipo registrado, registros sin nombres ni teléfonos en claro. Detalle en `arch/security-design.md` | 0 apariciones de nombre o teléfono en claro en los registros | PRD §6 · Fundador (etapa 7) · `arch/drivers.yaml#compliance` (no declarado) |
| Costo | El costo por mensaje de WhatsApp debe caber en 89.000 COP por salón al mes (unos 34 recordatorios y respuestas por cita; ver §1.4) | COP por salón al mes | PRD §7 · `arch/drivers.yaml#budget_constraints` (no declarado) |
| Disponibilidad | Sin SLO. El PRD no la define y no bloquea el piloto. Se diseña para esfuerzo razonable: servicios administrados, reintentos acotados y alarma si algo no sale | n/a justificado: el PRD §6 no la define; la tolerancia efectiva es la ventana de 5 minutos del recordatorio | PRD §6 · `arch/drivers.yaml#sla_targets` (no declarado) |
| Retención de datos | No se fija tiempo de conservación hasta la validación legal. Los datos de una clienta pueden borrarse a solicitud | Operación de borrado ejecutable por soporte | PRD §6 |

### 1.4 Restricciones, asunciones y alcance

**Dentro del alcance:** US-01 (registrar y cancelar), US-02 (recordatorios, respuestas y baja), US-03 (vista) y US-04 (aviso de cancelación). La prioridad de corte del PRD §4B se respeta: primero US-04, luego US-03, luego la cancelación por la dueña.

**Fuera del alcance** (PRD §4): reprogramar por chat, cobro de suscripción o anticipo, lista de espera, reportes distintos a la vista, números sin WhatsApp, interfaz web para la dueña y cualquier segmento distinto a salones solo con citas en Medellín.

**Restricciones:**
- **Técnica.** Construye OPOS y despliega con Terraform en la cuenta AWS del cliente. TypeScript sobre AWS Lambda. Canal: WhatsApp Business Platform de Meta directo. No hay `arch/drivers.yaml` ni `CLAUDE.md`: no hay lista cerrada de lenguajes ni de patrones. El lenguaje se decidió en §5.1.
- **Regulatoria.** Datos personales en Colombia: la validación con un abogado bloquea el lanzamiento, no la construcción (PRD §7). Ver `arch/drivers.yaml#compliance` (no declarado).
- **Presupuestaria.** El PRD declara "sin restricción de presupuesto". Como límite práctico se usa el precio del piloto (89.000 COP por salón al mes) frente al costo de mensajes (PRD §7).
- **Pruebas.** No hay `drivers.yaml#nfrs.testing` ni `package.json` ni ADR: este RFC no introduce herramientas de prueba. La verificación se hace contra los criterios Given/When/Then de las historias.

**Asunciones** (cada una con su condición de invalidación):

| # | Asunción | Se invalida si |
|---|---|---|
| A1 | Meta cobra y exige plantillas aprobadas para mensajes iniciados por la empresa (recordatorios 1 y 2 y aviso de cancelación). Los mensajes que responden a la dueña o a la clienta dentro de la ventana de atención no necesitan plantilla (guardado, cancelación, vista, baja). Si es así, el sistema usa tres plantillas | La validación de costo y plantillas (PRD §7) muestra otras reglas |
| A2 | El costo por mensaje cabe en 89.000 COP por salón al mes | La validación del costo da un valor mayor: se activa Twilio como alternativa (Decisión 5.2) o se revisa el precio |
| A3 | El almacén persistente y la región de AWS se eligen después de la validación legal. Hasta entonces solo se usan datos sintéticos. El RFC no nombra almacén ni región (Decisión 5.5) | La validación legal pide un lugar o una retención específicos: se emite un ADR con esa elección |
| A4 | La retención de datos no se fija. No hay purga automática hasta la validación legal | La validación legal define un tiempo de conservación |
| A5 | Los nueve ajustes de los flujos aprobados (`user-flows.md`, "Propuesta de actualización del PRD") rigen como reglas de este RFC: cancelar con nombre, día y hora; la última respuesta válida gana; un mensaje no entendido no cambia la respuesta válida; la cita confirmada sigue confirmada si la clienta se da de baja después, entre otros | La próxima versión del PRD los contradice |
| A6 | La cita duplicada (US-01·1.7) se evalúa dentro del mismo salón: mismo teléfono, día y hora | El PRD aclara que vale entre salones |
| A7 | Una clienta con citas en varios salones responde a un recordatorio. Se asocia la respuesta al recordatorio citado con la función "responder" de WhatsApp. Si la respuesta no cita ninguno, se asocia al recordatorio enviado más recientemente | Las respuestas reales muestran ambigüedad frecuente |
| A8 | El borrado de datos de una clienta (PRD §6) se pide a soporte, no por chat: US-01·1.4 limita las acciones de la dueña a registrar, cancelar y pedir la vista | El PRD agrega un comando de borrado |
| A9 | Mientras no haya fuente de límites contratados no se nombra ningún plan o nivel de servicio de AWS ni de Meta. Todo es de pago por uso y el volumen es de unos 340 recordatorios al mes | Un contrato o el cliente fija un plan |
| A10 | La suscripción de correo de alertas pertenece al fundador y se confirma al desplegar. Es provisional hasta que se defina otro canal | El fundador designa otra persona o canal |

---

## 2. Arquitectura de referencia

### 2.1 Aplicación

#### 2.1.1 Vista de contenedores (C4 nivel 2)

```
   Dueña ──┐                                              ┌── Clienta
           │ WhatsApp                          WhatsApp   │
           ▼                                              ▼
   ┌─────────────────────── WhatsApp Business Platform (Meta) ───────────────────────┐
   └───────────▲──────────────────────────────┬──────────────────────────────────────┘
               │ envíos                       │ webhook (mensajes y estados)
               │                              ▼
        ┌──────┴───────┐             ┌─────────────────┐     ┌────────────────────┐
        │ Adaptador    │             │ Receptor        │────▶│ Cola FIFO de       │
        │ de canal     │             │ (Lambda · firma │     │ entrantes + DLQ    │
        │ (puerto)     │             │  + dedupe)      │     └─────────┬──────────┘
        └──────▲───────┘             └─────────────────┘               ▼
               │                                            ┌─────────────────────┐
               │                                            │ Procesador          │
               │                                            │ (Lambda · dominio)  │
               │                                            └───┬─────────────┬───┘
               │                                                │             │
        ┌──────┴────────┐   ┌───────────────┐       ┌───────────▼──┐   ┌──────▼───────┐
        │ Emisor de     │◀──│ Programador   │◀──────│ Repositorio  │   │ Programación │
        │ recordatorios │   │ (EventBridge  │       │ (puerto)     │   │ de eventos   │
        │ (Lambda)      │   │  Scheduler)   │       └───────▲──────┘   └──────────────┘
        └──────▲────────┘   └───────────────┘               │
               │            ┌───────────────┐               │
               └────────────│ Vigilante     │───────────────┘
                            │ (Lambda · 1m) │
                            └───────────────┘
   Transversal: CloudWatch (registros, métricas, alarmas) → SNS → correo del fundador
                Secrets Manager (credenciales de Meta, clave de seudonimización)
                Terraform describe todo lo anterior en la cuenta AWS del cliente
```

#### 2.1.2 Servicios y módulos

El código se organiza en un dominio puro (sin dependencias de AWS ni de Meta) y adaptadores. Esto permite cambiar de proveedor de WhatsApp o de almacén sin tocar las reglas (Decisiones 5.2 y 5.5).

- **Receptor** (Lambda, TypeScript). Expone el webhook de Meta detrás de un API HTTP. Verifica la firma del mensaje con el secreto de la aplicación, descarta duplicados por el identificador del mensaje de Meta, responde 200 de inmediato y deja el mensaje en la cola. No interpreta contenido. Cubre la base de US-01·1.9: un mensaje con firma inválida se descarta sin responder.
- **Cola FIFO de entrantes** con cola de mensajes fallidos (DLQ). El grupo de ordenamiento es el teléfono del remitente, para que dos mensajes seguidos de la misma persona se procesen en orden. Garantiza el orden de "última respuesta válida" (RF-06).
- **Procesador** (Lambda). Clasifica al remitente: si el teléfono es el número registrado de algún salón, es la dueña; si no, es una clienta (RF-03). Ejecuta el comando o la respuesta usando el dominio y responde por el adaptador de canal. Si el remitente no es la dueña y el mensaje pide registrar, cancelar o la vista, no responde nada (US-01·1.9).
- **Dominio** (módulo TypeScript). Contiene el intérprete de comandos (Decisión 5.8), las reglas de validación de US-01, la máquina de estados de la cita, la condición de la clienta, el cálculo de recordatorios y el armado de la vista. Es el único lugar donde viven las reglas de los criterios del PRD.
- **Emisor de recordatorios** (Lambda). Recibe del programador el identificador del recordatorio, reserva el envío de forma atómica, vuelve a verificar la cita y la condición de la clienta, envía por el adaptador y registra el retraso. Detalle en §2.1.4.
- **Vigilante** (Lambda, cada minuto). Red de seguridad del programador: busca recordatorios vencidos sin enviar y los envía. Emite un latido para detectar que dejó de ejecutarse.
- **Cierre de cita** (programado a la hora de la cita). Pasa "guardada" a "sin confirmar" y fija "confirmada" y "cancelada por la clienta" como finales (RF-10).
- **Adaptador de canal** (puerto `CanalWhatsApp`). Operaciones: enviar plantilla, enviar texto dentro de la ventana de atención, interpretar un evento entrante y interpretar un estado de entrega. Implementación inicial: Meta directo. Alternativa documentada: Twilio.
- **Repositorio** (puerto `Repositorio`). Operaciones con nombre de negocio (guardar cita, buscar cita por salón y teléfono o por nombre, día y hora, reservar envío, listar vencidos, marcar baja). Exige tres propiedades: escritura condicional atómica (para `reservarEnvio`), unicidad por (salón, teléfono, inicio) y consulta por (estado, hora programada). Su tecnología queda abierta hasta la validación legal (Decisión 5.5).
- **Operaciones de soporte** (Lambda invocable solo con el rol de soporte). Cambio de número de la dueña, reactivación de clienta y borrado de datos de una clienta. Cada ejecución escribe un evento de auditoría (Decisión 5.7).

#### 2.1.3 Integraciones externas

- **WhatsApp Business Platform de Meta**, directo. Entra por webhook (mensajes y estados de entrega) y sale por la API de mensajes. Los recordatorios y el aviso de cancelación usan plantillas aprobadas (A1). Costo por mensaje y tiempo de aprobación de plantillas: validación abierta en el PRD §7 (bloqueante, responsable: fundador). Este RFC se escribe de forma que esa validación no cambie el dominio.
- **Twilio** (alternativa, no elegida). Se activa implementando un segundo adaptador de `CanalWhatsApp` si Meta no cumple en costo o plantillas (Decisión 5.2).
- **Correo del fundador**, por suscripción a un tema SNS (alertas, provisional).

Ninguna integración usa un modelo de lenguaje: el intérprete es determinista (Decisión 5.8).

#### 2.1.4 Puntualidad del recordatorio (máximo 5 minutos) y fallos de envío

**Objetivo.** El recordatorio sale a su hora con un retraso máximo de 5 minutos (PRD §6; US-02·2.1, 2.2). Se logra con tres capas, de la más exacta a la más tosca:

1. **Hora exacta por recordatorio.** Al guardar una cita, el procesador crea un evento programado de una sola ejecución por recordatorio, a la hora exacta y sin ventana flexible, con nombre determinista `rec-<cita>-<tipo>`. La carga del evento contiene solo identificadores opacos, nunca nombre ni teléfono. Un reintento de registro no duplica el evento por el nombre determinista. Horas: recordatorio 1 a las 18:00 (America/Bogotá) del día anterior; recordatorio 2 a inicio de cita menos 2 horas. Colombia no tiene cambio de hora, por lo que no hay saltos que corregir.
2. **Vigilante cada minuto.** Consulta los recordatorios en estado "programado" cuya hora ya pasó hace más de 60 segundos y los envía. Cubre tres fallos del programador: evento que nunca se creó (el registro avisó error al crearlo), evento perdido y evento que no se ejecutó. Peor caso sin fallos del canal: unos 60 s de espera más el tiempo de envío, muy dentro de los 300 s.
3. **Alarmas.** Cada envío mide el retraso (hora real menos hora programada) y lo publica como métrica. Una alarma se dispara si el máximo de un minuto supera 300 s. Otra se dispara si hay recordatorios vencidos sin enviar durante dos minutos seguidos. Una tercera se dispara si falta el latido del vigilante (datos faltantes cuentan como fallo).

**Garantía de no duplicar.** El emisor y el vigilante pueden coincidir sobre el mismo recordatorio. Antes de enviar, ambos ejecutan `reservarEnvio`: una escritura condicional que cambia el estado de "programado" a "enviando" y falla si otro ya lo hizo. Solo quien gana envía.

**Verificaciones justo antes de enviar** (el estado pudo cambiar desde el registro):
- Cita cancelada por la clienta o por la dueña: el recordatorio pasa a "omitido" y no se envía (US-01·1.3, US-02·2.4).
- Clienta dada de baja: pasa a "omitido por baja" y no se envía (US-02·2.5, 2.9, 2.11).
- Cita confirmada: el recordatorio 1 ya no aplica porque la confirmación solo puede llegar después de recibirlo. El recordatorio 2 **sí se envía** aunque ya confirmó (decisión del fundador sobre US-02·2.2).
- Cita cancelada: el recordatorio 2 no se envía.

**Qué pasa si un envío falla.**

| Situación | Qué hace el sistema | Estado final | Alerta |
|---|---|---|---|
| Error transitorio del proveedor (tiempo agotado, error 5xx, límite de velocidad) | Reintenta dentro de la misma ejecución a los 10 y 30 segundos. Si sigue fallando, deja el recordatorio en "reintentar" y el vigilante lo intenta cada minuto mientras el retraso sea menor a 5 minutos | "enviado" si alguno funciona | Si no sale antes de los 5 minutos: alerta de recordatorio tardío |
| Pasaron 5 minutos sin éxito | El recordatorio 2 se marca "incumplido" y no se reenvía (un aviso más cerca de la cita ya no cumple su función). El recordatorio 1 se sigue intentando cada 5 minutos hasta que llegue la hora del recordatorio 2 | "incumplido" o "enviado tarde" | Alerta de recordatorio que no sale (una por recordatorio) |
| Error permanente (número sin WhatsApp, destinatario inválido) | No reintenta. La cita queda "sin confirmar" (flujo F4·A6) | "no entregable" | Alerta de mensaje no entregado |
| El proveedor acepta el envío pero luego informa por webhook que falló la entrega | Registra el estado de entrega recibido. No reintenta automáticamente | "no entregado" | Alerta de mensaje no entregado |
| Error al guardar un registro o una cancelación de la dueña | No guarda, responde a la dueña que no se pudo y que repita el mensaje, y publica la métrica de fallo de guardado | La cita no existe o conserva su estado | Alerta de registro o cancelación que no se guardó |
| Mensaje entrante que el procesador no logra procesar tras los reintentos de la cola | Va a la DLQ | Sin cambios | Alarma si la DLQ tiene mensajes |

Cada recordatorio guarda intentos, hora de envío, retraso y resultado, de modo que RF-12 se cumple sin buscar en los registros.

### 2.2 Infraestructura

#### 2.2.1 Topología de deploy

Todo se declara con Terraform y se despliega en la cuenta AWS del cliente, en un solo ambiente de piloto. La región de AWS es una variable de Terraform sin valor por defecto y no se fija en este RFC hasta la validación legal (A3). Componentes: API HTTP para el webhook, cinco Lambdas (receptor, procesador, emisor, vigilante, soporte) más la de cierre de cita, cola FIFO con DLQ, EventBridge Scheduler para los eventos programados, regla de un minuto para el vigilante, SNS, CloudWatch y Secrets Manager.

Cada Lambda tiene su propio rol con permisos mínimos. No hay red privada ni servidores propios: no se justifica con 5 salones y un volumen de unos 340 recordatorios al mes. No se nombra ningún plan de servicio (A9).

#### 2.2.2 Datos

- **Almacén persistente:** detrás del puerto `Repositorio`. Tecnología y región no se fijan hasta la validación legal (Decisión 5.5). Requisitos que sí se fijan: cifrado en reposo, escritura condicional atómica, unicidad por (salón, teléfono, inicio), consulta por (estado, hora programada) y operación de borrado por clienta.
- **Cola de entrantes:** retención corta, solo para reintentos. Contiene el mensaje de WhatsApp, por lo que se cifra y no se usa como archivo.
- **Eventos programados:** la carga lleva solo identificadores opacos.
- **Retención:** sin fijar (A4). Hasta entonces no hay purga automática y solo se borran datos a solicitud (RF-11).
- **Respaldo:** no se define en este RFC. El piloto de 5 salones no lo exige en el PRD. Si la validación legal o el cliente lo piden, se incorpora al ADR del almacén.

#### 2.2.3 Observabilidad (alto nivel)

Vendor: **Amazon CloudWatch** (decisión del fundador; no hay `arch/drivers.yaml#nfrs.observability`). Detalle en `arch/observability-design.md` (a producir en la etapa siguiente).

- **Registros:** JSON estructurado con `cita_id`, `salon_id`, tipo de evento y resultado. Nunca nombre ni teléfono. Cuando hace falta correlacionar un teléfono, se registra su seudónimo (HMAC con clave en Secrets Manager), no el número.
- **Métricas propias:** retraso de envío (segundos), recordatorios vencidos sin enviar, latido del vigilante, mensajes no entregados, fallos de guardado, latencia de respuesta a la dueña.
- **Alertas** (las cuatro del PRD §6), por correo al fundador a través de SNS:
  1. Un recordatorio no sale o sale con más de 5 minutos de retraso.
  2. Un mensaje no se pudo entregar.
  3. Un registro o una cancelación no se guardó.
  4. Alguien del equipo accede a datos de clientas.
- **Reconstrucción por cita:** el estado de cada cita y de cada recordatorio guarda los eventos de RF-12.

#### 2.2.4 Seguridad (alto nivel)

Detalle en `arch/security-design.md` (a producir en la etapa siguiente).

- **Identidad:** no hay proveedor de autenticación de usuarios. La identidad de la dueña es su número de WhatsApp registrado, y la de la clienta es el suyo. La autenticidad del mensaje la da la firma del webhook de Meta (Decisión 5.6).
- **Aislamiento entre salones:** el salón se deduce del número remitente, nunca del texto del mensaje. Toda consulta lleva `salon_id`.
- **Secretos:** credenciales de Meta, secreto de la aplicación y clave de seudonimización en Secrets Manager.
- **Acceso del equipo:** por un rol de soporte que exige asumirlo de forma explícita. Cada asunción del rol dispara la alerta 4. Los cambios manuales pasan por la Lambda de soporte y dejan evento de auditoría (Decisión 5.7).
- **Cifrado:** en reposo para almacén y cola, y en tránsito con TLS.

---

## 3. Modelado de dominio (alto nivel)

El detalle (agregados, eventos, invariantes) irá en `arch/domain-model.md` (a producir en la etapa siguiente).

### 3.1 Entidades principales

| Entidad | Responsabilidad | Identificada por |
|---|---|---|
| **Salón** | Agrupa las citas de un negocio. Guarda el número registrado de la dueña (uno por salón) y la zona horaria (America/Bogotá) | `salon_id` |
| **Cita** | Un servicio agendado: nombre de la clienta, teléfono, servicio, inicio. Lleva el estado (ver 3.4) y la última respuesta válida | `cita_id`; única por (salón, teléfono, inicio) |
| **Contacto de clienta** | Condición por teléfono, válida en todos los salones: activa o dada de baja. Es una condición, no un estado de la cita | Teléfono normalizado (E.164) |
| **Recordatorio** | Un envío planeado para una cita: tipo (día antes o 2 horas antes), hora programada, estado, intentos, retraso | `cita_id` + tipo |
| **Respuesta de clienta** | Mensaje recibido, clasificado como confirma, cancela, baja o no entendido, asociado a un recordatorio | Identificador del mensaje de Meta |
| **Aviso a la dueña** | Cancelación (o reconfirmación) comunicada a la dueña, con su estado de entrega | `cita_id` + secuencia |
| **Comando de la dueña** | Registro, cancelación o vista recibidos, con resultado (guardado, rechazado y motivo) | Identificador del mensaje de Meta |
| **Evento de auditoría** | Acceso o cambio manual del equipo: quién, qué, a qué clienta o salón, cuándo | `evento_id` |

### 3.2 Relaciones clave

```
Salón 1 ────── N Cita 1 ────── 0..2 Recordatorio
                │  1
                │  └───── N Respuesta de clienta
                │  └───── N Aviso a la dueña
                │
                └── N ────── 1 Contacto de clienta (por teléfono, compartido entre salones)

Salón 1 ────── N Comando de la dueña
Evento de auditoría ────── referencia (Salón | Contacto de clienta), nunca duplica sus datos
```

- Un salón tiene muchas citas. Una cita tiene como máximo dos recordatorios y puede tener muchas respuestas.
- El contacto de clienta se comparte entre salones porque la baja vale por teléfono (US-02·2.5). Por eso es una entidad aparte y no un atributo de la cita.
- Los comandos de la dueña y las respuestas se guardan por identificador de mensaje de Meta, lo que da idempotencia ante reentregas del webhook.

### 3.3 Bounded contexts identificados

DDD ligero, tres contextos. No se justifica más con 8 entidades y un solo equipo.

- **Agenda** (Salón, Cita, Comando de la dueña, vista): registra, cancela y arma las listas. Cubre US-01 y US-03.
- **Recordatorios y respuestas** (Recordatorio, Respuesta de clienta, Contacto de clienta, Aviso a la dueña): programa, envía, interpreta y avisa. Cubre US-02 y US-04. Consulta al contexto Agenda el estado de la cita y le informa los cambios.
- **Soporte y auditoría** (Evento de auditoría, operaciones manuales): cambio de número, reactivación, borrado y registro de accesos. Transversal, sin reglas de negocio propias.

La integración con WhatsApp es un adaptador (anticorrupción) alrededor de los dos primeros contextos y no un contexto de dominio.

### 3.4 Estados (de los flujos aprobados)

**Cita** (`lifecycle-cita/ciclo-de-vida-cita.html`): `guardada` → `confirmada` | `cancelada_clienta` | `cancelada_duena` | `sin_confirmar` (esta última cuando llega la hora sin respuesta válida). La última respuesta válida alterna entre confirmada y cancelada por la clienta. La dueña puede cancelar desde guardada, confirmada o cancelada por la clienta. A la hora de la cita, `confirmada` pasa a `confirmada_cerrada` y `cancelada_clienta` a `cancelada_clienta_cerrada` (finales). No hay estados de resultado ("llegó", "no llegó"): se miden en la revisión semanal del piloto (PRD §6).

**Condición de la clienta** (`lifecycle-condicion-clienta/condicion-clienta.html`): `activa` → `dada_de_baja`. Volver a activa lo hace el equipo a mano (Decisión 5.7). Una cita confirmada sigue confirmada si la clienta se da de baja después (A5).

---

## 4. Alternativas consideradas

| Opción | Pros | Contras | Por qué descartada |
|---|---|---|---|
| **A · WhatsApp Business Platform de Meta directo** (elegida) | Sin intermediario, mejor precio por mensaje en principio, control de plantillas | Aprobación de plantillas y costo por validar (PRD §7); integración propia de webhook y firma | Elegida por decisión del fundador, sujeta a la validación del PRD §7 |
| B · Twilio sobre WhatsApp | Integración más rápida, soporte propio, mismos mensajes | Sobreprecio por mensaje sobre el de Meta, otro proveedor entre el sistema y Meta | Alternativa documentada, no elegida; se activa vía el puerto `CanalWhatsApp` si A2 se invalida |
| C · Lambda + eventos programados + cola (elegida) | Pago por uso, sin servidores, encaja con 340 recordatorios al mes, se describe completo en Terraform | Límites propios de cada servicio, ejecuciones cortas | Elegida (Decisión 5.1) |
| D · Contenedores permanentes (por ejemplo, ECS) | Procesos de larga vida y más control | Costo fijo con tráfico casi nulo, más piezas que operar para un piloto de 5 salones | Costo y operación desproporcionados |
| E · Un recorrido cada minuto sobre todas las citas, sin eventos programados | Un solo mecanismo | Lee todo el almacén cada minuto, más costo y más datos personales expuestos al proceso | Se conserva solo como vigilante de respaldo, no como mecanismo principal |
| F · Un modelo de lenguaje para interpretar los mensajes de la dueña | Entiende texto libre | Latencia cercana al límite de 10 s, costo por mensaje, envía nombre y teléfono a un tercero antes de la validación legal, resultados no deterministas | Descartado para el piloto (Decisión 5.8) |
| G · Interpretador determinista con palabras y formato guiado (elegida) | Predecible, barato, auditable contra los criterios del PRD | Menos tolerante con redacciones libres | Elegida (Decisión 5.8) |

---

## 5. Decisiones nuevas introducidas

### Decisión 5.1: Usar TypeScript sobre AWS Lambda con Terraform
- **Contexto**: no hay `arch/drivers.yaml` ni `CLAUDE.md`, así que no hay lenguaje ni patrón impuestos. El fundador fijó AWS, Terraform y, tras la propuesta, TypeScript sobre Lambda. El volumen es mínimo (unos 340 recordatorios al mes) y las cargas son cortas y por eventos.
- **Decisión**: TypeScript para todas las funciones, desplegadas como Lambdas y descritas con Terraform en la cuenta AWS del cliente. El dominio es un módulo sin dependencias de AWS.
- **Alternativas descartadas**: contenedores permanentes (costo fijo y más operación); otros lenguajes (sin ventaja que justifique el cambio).
- **Consecuencias**: casi no hay costo en reposo y no hay servidores que mantener. Cada ejecución es corta y sin estado, por lo que todo estado va al repositorio. Fuente: respuesta del fundador (etapa 7); la forma de las Lambdas es decisión propia.
- **Implicación de producto/mercado**: el costo de infraestructura por salón es marginal frente a los 89.000 COP del piloto, lo que hace viable el precio con 5 salones. Escalar más allá de 5 no requiere rediseño, pero el PRD no define esa meta.
- **Trazabilidad**: US-01 a US-04 (base común).
- **Deriva ADR**: ADR-001

### Decisión 5.2: Enviar por Meta directo, con Twilio como alternativa tras un puerto
- **Contexto**: el fundador eligió WhatsApp Business Platform de Meta directo. El costo por mensaje y la aprobación de plantillas siguen sin validar (PRD §7, bloqueante, responsable: fundador).
- **Decisión**: el dominio habla con una interfaz `CanalWhatsApp`. La primera implementación es Meta directo. Twilio queda como segunda implementación posible, no como elección. Los mensajes iniciados por la empresa (recordatorio 1, recordatorio 2 y aviso de cancelación) usan tres plantillas; el resto responde dentro de la ventana de atención (A1).
- **Alternativas descartadas**: Twilio como primera opción (sobreprecio y un intermediario más); acoplar el dominio a la API de Meta (cambiar de proveedor obligaría a reescribir reglas).
- **Consecuencias**: si la validación del PRD §7 resulta adversa (A2), cambiar de proveedor es cambiar un adaptador. El costo de ese seguro es una capa más de código. Las plantillas deben estar aprobadas antes de lanzar.
- **Implicación de producto/mercado**: el costo por mensaje es el principal costo variable del producto. Si no cabe en 89.000 COP por salón, el precio o el proveedor cambian. El tiempo de aprobación de plantillas marca la fecha más temprana en que el piloto puede empezar.
- **Trazabilidad**: US-02·2.1, 2.2 y US-04·4.1 (mensajes iniciados por la empresa); US-01·1.1, US-03·3.1 y US-02·2.5 (respuestas dentro de ventana).
- **Deriva ADR**: ADR-002

### Decisión 5.3: Programar cada recordatorio por evento exacto con un vigilante de respaldo
- **Contexto**: el recordatorio debe salir con un retraso máximo de 5 minutos (PRD §6, asunción sin validar). Un programador puede fallar o no crear un evento, y el fallo no se notaría.
- **Decisión**: un evento programado por recordatorio a su hora exacta, más un vigilante cada minuto que envía los vencidos sin enviar, más alarmas sobre retraso y sobre el propio latido del vigilante (§2.1.4). Recordatorio 1 a las 18:00 (America/Bogotá) del día anterior y recordatorio 2 a 2 horas antes. El envío usa una reserva atómica contra duplicados.
- **Alternativas descartadas**: solo un recorrido cada minuto sobre todas las citas (más lecturas y más exposición de datos); solo eventos programados (un evento perdido pasa inadvertido).
- **Consecuencias**: el retraso típico es de segundos y el peor caso sin fallo del canal es de poco más de un minuto. Hay dos caminos de envío que deben coordinarse con la reserva atómica. El almacén debe soportar escritura condicional (§2.1.2). La hora 18:00 es decisión del fundador (aceptó la recomendación).
- **Implicación de producto/mercado**: la puntualidad es lo que se promete a la dueña; este diseño es lo que permite medirla y cumplirla con evidencia en las 8 semanas. A las 18:00 la clienta ya terminó su jornada y puede responder.
- **Trazabilidad**: US-02·2.1, 2.2, 2.8, 2.7; PRD §6 (5 minutos).
- **Deriva ADR**: ADR-003

### Decisión 5.4: Reintentos acotados, clasificación de errores y alerta por envío fallido
- **Contexto**: un envío fallido no debe ser invisible, y reintentar sin límite puede enviar un recordatorio de 2 horas ya inútil. El PRD exige saber cuándo un recordatorio no sale o un mensaje no se entrega (PRD §6).
- **Decisión**: errores transitorios se reintentan a los 10 y 30 segundos y luego cada minuto mientras el retraso sea menor a 5 minutos. Pasado ese límite, el recordatorio 2 se marca "incumplido" y el 1 se sigue intentando cada 5 minutos hasta la hora del 2. Errores permanentes no se reintentan. Cada fallo genera su métrica y su alarma por correo. Un estado de entrega fallido informado por Meta se registra sin reintento.
- **Alternativas descartadas**: reintentar sin límite (puede enviar tarde y sin sentido); no reintentar (un fallo momentáneo costaría una cita); reenviar tras un estado de fallo de entrega (puede repetir un mensaje que a la clienta sí le llegó).
- **Consecuencias**: la cita de una clienta con número sin WhatsApp queda "sin confirmar" (limitación conocida del PRD §7). Hay que mantener la clasificación de errores del adaptador. La fuente de la política de tiempos es esta decisión, derivada del límite de 5 minutos del PRD.
- **Implicación de producto/mercado**: el fundador se entera de cada fallo por correo mientras el piloto dure. Una cita sin recordatorio es una cita que no cuenta como cerrada en el 70% (PRD §8), así que el fallo de envío se refleja directo en la métrica principal.
- **Trazabilidad**: US-02·2.1, 2.2, 2.6 (A6 del flujo F4); PRD §6 (observabilidad).
- **Deriva ADR**: ADR-004

### Decisión 5.5: Aislar la persistencia tras un puerto y no fijar almacén ni región hasta la validación legal
- **Contexto**: el PRD deja abiertas la conservación de datos y la validación legal de datos personales en Colombia. El fundador pidió no fijar dónde se guardan los datos hasta tenerla.
- **Decisión**: la persistencia se accede solo por el puerto `Repositorio`, con tres requisitos técnicos (escritura condicional atómica, unicidad por (salón, teléfono, inicio), consulta por (estado, hora programada)) y cifrado en reposo. El RFC no nombra tecnología ni región. La región de AWS es una variable de Terraform sin valor por defecto. Hasta la validación legal se trabaja con datos sintéticos. Cuando esa validación exista, se emite un ADR con la elección (A3, A4).
- **Alternativas descartadas**: elegir ya un almacén de AWS (arriesga rehacer si la validación legal pide otro lugar o retención); no definir requisitos (el puerto quedaría sin contrato verificable).
- **Consecuencias**: la implementación puede avanzar con una versión de prueba del repositorio, pero no puede cargar datos reales de clientas antes del lanzamiento. El ADR del almacén debe cerrarse antes del piloto.
- **Implicación de producto/mercado**: la validación legal pasa a ser una dependencia de calendario del piloto, además de ser un requisito del lanzamiento. Si exige datos en otro lugar o una retención corta, el costo está acotado al adaptador.
- **Trazabilidad**: US-01·1.1, 1.7; US-02·2.5; PRD §6 (privacidad, conservación).
- **Deriva ADR**: ADR-005

### Decisión 5.6: Identificar por número de WhatsApp y deducir el salón del remitente
- **Contexto**: solo el número registrado de la dueña puede registrar, cancelar o pedir la vista (US-01·1.4, 1.9) y un salón no puede ver datos de otro (PRD §6). No hay cuentas ni contraseñas.
- **Decisión**: el procesador busca el número remitente entre los números registrados de dueñas. Si coincide, es esa dueña y ese es el salón de todas las consultas. Si no, es una clienta. Un remitente que no es la dueña y que escribe un comando de registro, cancelación o vista no recibe respuesta. La autenticidad de cada mensaje se verifica con la firma del webhook de Meta, y los duplicados se descartan por identificador de mensaje.
- **Alternativas descartadas**: pedir un código o contraseña (no pedido por el PRD, añade fricción); deducir el salón del texto del mensaje (permitiría suplantar).
- **Consecuencias**: quien tenga el teléfono de la dueña actúa como ella; el cambio de número es una operación manual con verificación (Decisión 5.7). Una dueña solo opera un salón y un número pertenece a un solo salón.
- **Implicación de producto/mercado**: sin cuentas ni aplicaciones, el alta de un salón es registrar un número, lo que reduce la fricción de entrada. Un teléfono robado o perdido es un riesgo real para la dueña y se resuelve cambiando el número con el equipo.
- **Trazabilidad**: US-01·1.4, 1.9; PRD §6 (aislamiento, un número por salón).
- **Deriva ADR**: ADR-006

### Decisión 5.7: Registros sin datos personales, auditoría del equipo y operaciones manuales
- **Contexto**: nombre y teléfono son los datos más sensibles (PRD §6); el equipo solo accede cuando es necesario y ese acceso queda registrado. El fundador pidió que los registros no guarden nombres ni teléfonos en claro y cerró la alerta de acceso por correo, de forma provisional.
- **Decisión**: los registros usan identificadores opacos (`cita_id`, `salon_id`) y, cuando hace falta correlacionar un teléfono, su seudónimo HMAC con clave en Secrets Manager. El acceso del equipo a datos de clientas se hace solo con un rol de soporte que se asume de forma explícita y cuya asunción dispara la alerta 4. Los cambios manuales (cambio de número con identidad confirmada por el fundador por otro medio, reactivación de una clienta, borrado) pasan por una Lambda de soporte que escribe un evento de auditoría. No hay reactivación automática por mensaje.
- **Alternativas descartadas**: registrar el teléfono completo para depurar (viola el pedido del fundador); permitir que la clienta se reactive escribiendo (un mensaje suelto podría reactivar a quien pidió parar, con implicaciones legales).
- **Consecuencias**: depurar es más lento, porque hay que cruzar identificadores con el almacén. Todo cambio manual depende del fundador y del equipo, lo que concentra el riesgo en una persona (PRD §7). El correo es provisional hasta que se defina otro canal (A10).
- **Implicación de producto/mercado**: ante una consulta legal o de una clienta, existe un registro de quién tocó qué. A cambio, el cambio de número y la reactivación no son inmediatos para la dueña.
- **Trazabilidad**: US-02·2.5, 2.9, 2.11; PRD §6 (seguridad, observabilidad), flujo F5.
- **Deriva ADR**: ADR-007

### Decisión 5.8: Interpretar mensajes con reglas deterministas y listas configurables
- **Contexto**: la dueña escribe texto libre y la clienta responde con palabras. El PRD fija las palabras de confirmación, cancelación y baja y marca esas listas como provisionales, sujetas a ajuste con respuestas reales y a la validación legal.
- **Decisión**: un intérprete determinista reconoce las tres acciones de la dueña (registrar, cancelar, vista) y extrae los cinco datos con un formato guiado. Si no entiende, pide repetir el mensaje con un ejemplo. Para la clienta compara la respuesta, sin importar mayúsculas, tildes ni puntuación, contra listas configurables de confirmación, cancelación y baja. "Baja" y "para" no figuran en la lista de baja. No hay modelo de lenguaje.
- **Alternativas descartadas**: modelo de lenguaje para extraer datos (latencia cerca de los 10 s, costo por mensaje, envío de nombre y teléfono a un tercero antes de la validación legal, resultados no deterministas).
- **Consecuencias**: algunas redacciones libres de la dueña se rechazan y se le pide repetir. Cambiar las palabras de la clienta es un cambio de configuración y no de código, lo que permite ajustar tras las primeras semanas y tras la validación legal.
- **Implicación de producto/mercado**: la dueña debe aprender un formato corto para registrar. Esa es la fricción que la asunción "las dueñas aceptan registrar por chat" pone a prueba (S3 prefirió su libreta).
- **Trazabilidad**: US-01·1.1, 1.5, 1.6, 1.8; US-02·2.3, 2.4, 2.5, 2.6, 2.10; US-03·3.1, 3.2, 3.7.
- **Deriva ADR**: ADR-008

### Decisión 5.9: Procesar entrantes por cola ordenada con estados finales fijos
- **Contexto**: Meta reintenta el webhook y puede entregar duplicados. Las reglas de "última respuesta válida" y de estados finales a la hora de la cita dependen del orden y de no aplicar un mensaje dos veces.
- **Decisión**: el receptor responde de inmediato y delega a una cola FIFO ordenada por teléfono del remitente. El procesador es idempotente por identificador de mensaje. La cita guarda la última respuesta válida y un evento programado la fija a la hora de la cita (A5). Una respuesta posterior a esa hora se registra pero no cambia el estado. El aviso a la dueña (US-04) se genera en la misma transición que cancela, sin depender de otro mensaje.
- **Alternativas descartadas**: procesar dentro del webhook (riesgo de superar el tiempo de respuesta de Meta y de duplicar); cola estándar sin orden (podría aplicar "cancelo" antes que un "sí" anterior).
- **Consecuencias**: añade una cola y una DLQ a operar, con su alarma. La latencia de respuesta a la dueña suma el paso por la cola y debe seguir bajo 10 s.
- **Implicación de producto/mercado**: la dueña y la clienta ven un comportamiento consistente: lo último que dice una clienta antes de la cita es lo que vale. El aviso de cancelación (primero en recortarse) se puede cortar sin tocar el resto del flujo.
- **Trazabilidad**: US-02·2.3, 2.4, 2.6, 2.7; US-04·4.1; US-01·1.3.
- **Deriva ADR**: ADR-009

> Verificación de la regla F-RFC-DECISIONES: 9 decisiones con header `### Decisión 5.M:` (mínimo 6 para un proyecto nuevo).

---

## 6. Métricas de éxito y plan de validación

### 6.1 KPIs del producto

Del PRD §8. El sistema debe emitir los eventos que permiten calcularlos.

- **North Star:** al menos 70% de las citas se cierran sin que la dueña escriba, a las 8 semanas (asunción sin validar). Se cuenta con los eventos de respuesta de la clienta; la declaración de la dueña la recoge el fundador en la revisión semanal. El sistema registra, por cada informe, cuántas citas quedaron fuera del cálculo y por qué.
- **KPI 1:** al menos 75% de las clientas responden a uno de los dos recordatorios (línea base en las primeras 2 semanas).
- **KPI 2:** al menos 60% de los salones pagan el segundo mes (medida fuera del sistema).
- **KPI 3:** citas fallidas de no más de 18% (aspiración 15%). Guardrail: no más de 22%. Se miden en la revisión semanal, no en el producto.
- **KPIs técnicos derivados** (PRD §6): confirmación de guardado y vista en menos de 10 s, recordatorio con retraso máximo de 5 minutos. Se miden con las métricas de §2.2.3 desde el primer día.

### 6.2 Plan de validación técnica

- **Criterios de aceptación:** cada criterio Given/When/Then de US-01 a US-04 se convierte en un caso de verificación. La matriz de §1.2 y las trazas de §5 indican qué criterios cubre cada componente. Este RFC no fija herramientas de prueba (§1.4).
- **Puntualidad:** programar recordatorios con datos sintéticos y verificar el retraso medido contra los 300 s. Verificar también el camino del vigilante (evento programado borrado a propósito) y la reserva atómica ante envío concurrente.
- **Fallos:** simular error transitorio, error permanente y estado de entrega fallido, y comprobar que cada uno produce el estado de §2.1.4 y la alarma correspondiente.
- **Privacidad:** revisar que ningún registro contenga nombres ni teléfonos en claro, y que un remitente no registrado no reciba respuesta.
- **Costo:** con las plantillas aprobadas, contar los mensajes de un salón durante la primera semana y comparar con 89.000 COP al mes.
- **Seguridad:** detalle en `arch/security-design.md`.

### 6.3 Plan de rollout

- **Piloto:** 5 salones, de uno en uno. Un parámetro de configuración activa el envío por salón y otro lo apaga para todos (interruptor general).
- **Antes de cada salón:** plantillas aprobadas, número de la dueña registrado y suscripción de correo de alertas confirmada por el fundador (A10).
- **Antes del primer salón con datos reales:** validación legal cerrada y ADR del almacén emitido (Decisión 5.5).
- **Revisión intermedia:** semana 4, con el umbral que el PRD define para el riesgo crítico (citas fallidas de no más de 18% con envío automático).
- **Rollback:** apagar el interruptor general. Los recordatorios programados no se envían (el emisor lo verifica antes de enviar) y las citas siguen guardadas. La dueña vuelve a confirmar a mano. El despliegue de Terraform se revierte por versión. Los datos no se destruyen con el rollback.

---

## 7. Open questions

Ninguna — todas resueltas en §5 Decisiones o §1.4 Asunciones

---

## 8. Artefactos relacionados

- `docs/PRD.md` · fuente de las historias US-01 a US-04 y de los criterios citados en cada requerimiento y decisión.
- `docs/flows/turnofacil/INDEX.md` y `user-flows.md` · flujos y estados aprobados (diagramas de cita y de condición de la clienta).
- `arch/drivers.yaml` · no existe en este proyecto; todas las referencias de §1.3 y §1.4 a sus rutas indican "no declarado".
- `arch/domain-model.md` · modelo de dominio completo (expansión de §3). A producir en la etapa siguiente.
- `arch/observability-design.md` · instrumentación detallada (expansión de §2.2.3). A producir en la etapa siguiente.
- `arch/security-design.md` · controles y modelo de amenazas (expansión de §2.2.4). A producir en la etapa siguiente.
- `docs/adrs/ADR-INDEX.md` · ADR-001 a ADR-009, derivados de §5.
