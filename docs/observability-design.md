# Observability Design · TurnoFácil

**Date:** 2026-11-24
**RFC base:** docs/RFC.md § 2.2.3 (y § 2.1.4 para puntualidad y fallos de envío)
**Vendor stack:** Amazon CloudWatch (registros, métricas, alarmas, paneles) + AWS X-Ray (trazas, parte de CloudWatch) + SNS para avisos
**ADRs relacionados:** ADR-001 (TypeScript sobre Lambda con Terraform), ADR-003 (vigilante y alarmas de puntualidad), ADR-004 (reintentos acotados y alerta por envío fallido), ADR-007 (registros sin datos personales y auditoría del equipo), ADR-009 (cola FIFO de entrantes)

---

## Resumen para decidir

**Qué se decidió**

- **Herramienta:** el monitoreo de Amazon que ya eligió el fundador. No hace falta contratar nada aparte.
- **Metas de servicio:** cada mes, 99 de cada 100 veces la dueña recibe la confirmación de una cita guardada en menos de 10 segundos; lo mismo para la vista del día; y 99 de cada 100 recordatorios salen con menos de 5 minutos de retraso. Con el volumen del piloto, eso deja margen para unos 3 recordatorios tardíos al mes. No hay meta de "tiempo encendido": el producto no la pide para el piloto.
- **Si se dañan o se pierden datos:** como máximo se pierden los últimos 5 minutos y el servicio vuelve en 4 horas. Se guarda la posibilidad de volver a cualquier momento de los últimos 35 días. Antes del piloto se hace un ensayo completo de recuperación con reloj.
- **Sin copia en otra ciudad:** si se cae todo el centro de datos de Amazon, el fundador avisa a las dueñas para que confirmen a mano las citas del día, como se hacía en el piloto.
- **Privacidad:** ningún registro guarda nombres ni teléfonos de clientas. Si alguno aparece por error, salta una alerta.

**Qué alertas le llegan al fundador y qué hacer**

Urgentes, por correo y mensaje de texto (SMS), para atender en cuanto se vean:

| Alerta | Qué significa | Qué hacer |
|---|---|---|
| Recordatorio que no sale o sale tarde | Una clienta no recibió su recordatorio a tiempo | Ver en el panel si es uno o varios. Si Meta está caído, esperar: el sistema reintenta solo. Si un recordatorio de 2 horas antes no salió, avisar a la dueña para que confirme esa cita a mano |
| El vigilante dejó de funcionar | Se apagó la red de seguridad que envía los recordatorios atrasados | Pedir a quien construyó el producto que lo vuelva a encender. Mientras tanto, prestar atención a la alerta anterior |
| Alguien del equipo entró a datos de clientas | Se usó el acceso de soporte | Si fue un pedido conocido, anotarlo y cerrar. Si no, cortar el acceso y seguir el procedimiento de incidente de seguridad |
| Aparecieron datos personales en los registros, o alguien cambió permisos fuera de lo normal | Posible incidente de seguridad | Seguir el procedimiento de incidente de seguridad |
| Llegó un mensaje de prueba al sistema real | El canal simulado, que solo debe existir en el ambiente de prueba, quedó abierto en el sistema real; alguien pudo hacerse pasar por una dueña | Apagar los envíos, pedir que se cierre ese canal, deshacer lo que esos mensajes cambiaron y seguir el procedimiento de incidente de seguridad |

Normales, solo por correo, para atender el mismo día:

| Alerta | Qué significa | Qué hacer |
|---|---|---|
| Mensaje no entregado | El número no tiene WhatsApp o Meta rechazó el mensaje | Avisar a la dueña para que verifique el número con la clienta. Si se repite con muchas, revisar en Meta si la plantilla quedó pausada |
| Una cita o cancelación no se guardó | La dueña ya recibió "no se pudo, repite el mensaje" | Verificar en un par de horas que la dueña lo repitió; si no, escribirle |
| Mensajes atascados sin procesar | Un mensaje de chat no se pudo leer | Pedir revisión técnica; no dejarlo más de un día |
| Errores repetidos en una parte del sistema | Algo falla de forma continua | Si coincide con un cambio reciente, volver a la versión anterior |
| La dueña recibe respuestas lentas | Dos o más respuestas tardaron más de 10 segundos en una hora | Revisión técnica en la semana |
| Se gastó la mitad del margen de fallos del mes | Vamos camino a no cumplir una meta de servicio | Priorizar la causa principal la semana siguiente |
| No llegan las alertas | Falló el envío de avisos | Revisar el correo y el número de teléfono suscritos; mientras tanto, mirar el panel dos veces al día |

El paso a paso de cada caso está más abajo, en los procedimientos de respuesta de cada alerta.

**Qué queda abierto y quién lo resuelve**

| Pendiente | Responsable | Para cuándo |
|---|---|---|
| Confirmar que Amazon puede enviar mensajes de texto a celulares de Colombia desde la región que se elija, y a qué costo | Fundador | Antes del piloto, junto con la elección de región |
| Nombrar a una segunda persona que reciba las alertas urgentes cuando el fundador no esté | Fundador | Antes del piloto |
| Elegir dónde se guardan los datos, cumpliendo los 5 minutos de pérdida máxima y los 35 días para volver atrás | Fundador, tras la validación legal | Antes del lanzamiento |
| Confirmar si Meta reenvía los mensajes que no pudimos recibir y durante cuánto tiempo | Quien construya el producto | Antes del piloto |
| Revisar las metas de servicio con los datos reales del primer mes | Fundador | Fin del primer mes del piloto |

**Costo mensual estimado: entre 20 y 50 dólares**

| Concepto | Volumen del piloto | Costo al mes |
|---|---|---|
| Métricas propias | Unas 150 series (5 salones por tipo de dato); muchas solo cuentan las horas en que reciben datos | 15 a 45 dólares |
| Alarmas | Unas 25 (las de este documento y las de seguridad); 10 son gratis | 1,50 a 2,50 dólares |
| Registros | Pocos megabytes al mes, dentro de la cuota gratuita de 5 GB | Menos de 1 dólar |
| Paneles | 3 paneles, dentro de los 3 gratuitos | 0 dólares |
| Trazas | Unos miles al mes, dentro de las 100.000 gratuitas | 0 dólares |
| Registro de accesos a la cuenta | Primera copia gratuita; almacenamiento mínimo | Menos de 1 dólar |
| Mensajes de texto (SMS) | Solo alertas urgentes; se espera menos de 20 al mes | Menos de 2 dólares, más el posible costo fijo de un número de envío para Colombia (por confirmar) |
| **Total** | | **20 a 50 dólares** |

El costo lo domina la cantidad de métricas propias. Si hiciera falta bajarlo, se pueden agrupar métricas de negocio sin separar por salón. Los precios son los de lista de Amazon en su región principal de Estados Unidos y no se verificaron para la región que se elija: **asunción sin evidencia**. Se fija un tope de gasto mensual para los mensajes de texto.

### Decisiones de esta etapa

| ID | Decisión | Sección |
|---|---|---|
| D12-1 | SLO mensual del 99 % para los tres límites del PRD § 6: guardado < 10 s, vista < 10 s, recordatorio con retraso ≤ 5 min. Sin SLO de disponibilidad en el piloto (fundador) | § 4 |
| D12-2 | DR: RPO 5 minutos, RTO 4 horas, recuperación a un punto en el tiempo con 35 días de retención como requisito del almacén, ensayo de restauración antes del piloto (fundador) | § 5 |
| D12-3 | Avisos en dos niveles: **P1** (urgente) por correo y SMS al fundador; **P2** solo por correo. Cierra provisionalmente el pendiente del PRD § 6 "quién recibe los avisos al equipo y por qué canal" (fundador) | § 3 |
| D12-4 | Identificador de correlación único por cadena: `mensaje_id` de Meta para lo que entra por chat y el nombre del evento programado (`rec-<cita>-<tipo>`, `cierre-<cita_id>`) para lo que dispara el programador (decisión técnica) | § 1 |
| D12-5 | Trazas con X-Ray activo en el API y en las seis Lambdas, con muestreo del 100 % (volumen de piloto) y sin datos personales en anotaciones (decisión técnica) | § 1.2 |
| D12-6 | Canal emulado: sus envíos se registran y miden igual que los reales, distinguidos por el prefijo `emu.`; en producción, cualquier entrada `emu.` dispara una alerta P1 (decisión técnica, tras api-contract § 10 y security-design OQ-8) | § 1.2, § 3 |

---

> **Vendor seleccionado: Amazon CloudWatch** · ← RFC § 2.2.3 ("Vendor: **Amazon CloudWatch** (decisión del fundador; no hay `arch/drivers.yaml#nfrs.observability`)") y RFC § 1.3, fila Observabilidad (aprobados). No existen `drivers.yaml` ni `CLAUDE.md` en el repositorio; según la regla de la plataforma, el RFC y los ADRs aprobados son la fuente canónica. No hay divergencia que registrar.

> **Plan del vendor (anti sobre-aprovisionamiento):** no hay `drivers.yaml#capacity_licensing` ni límites fuenteados. CloudWatch se usa en pago por uso, sin nombrar plan ni nivel (RFC § 2.2.1: "No se nombra ningún plan de servicio (A9)"). La carga estimada está en § 6 y el costo en el resumen.

---

## 1. Instrumentación por capa

Principios comunes a todas las capas:

- **Sin datos personales.** Ningún registro, métrica, traza ni carga de evento lleva nombre ni teléfono en claro. El teléfono se representa con `telefono_seudonimo` (HMAC con clave en Secrets Manager). Un filtro de métricas busca el patrón de celular colombiano (`3\d{9}`) en todos los grupos de registros y alerta si aparece (ADR-007; security-design § 7).
- **Correlación (D12-4).** Todo registro lleva `correlacion_id`:
  - Cadena de chat: `correlacion_id = mensaje_id` de Meta. El Receptor lo pone como atributo del mensaje en la cola FIFO y el Procesador lo copia a cada registro, evento de dominio y envío de respuesta.
  - Cadena programada: `correlacion_id = <nombre del evento programado>` (`rec-<cita>-<tipo>` o `cierre-<cita_id>`). Ya viaja en la carga del evento (RFC § 2.1.4). El vigilante usa el mismo nombre al tomar un recordatorio vencido.
  - El identificador de traza de X-Ray (`trace_id`) se registra junto al `correlacion_id`.
- **Formato.** JSON de una línea por evento, escrito con un registrador común del paquete compartido. Las métricas propias se publican con Embedded Metric Format (EMF) desde el mismo registro, sin llamadas extra a la API de métricas.
- **Retención** (security-design D11-2): 90 días para grupos de registros técnicos; 1 año para auditoría del equipo y CloudTrail. Las métricas usan la retención estándar de CloudWatch.
- **Espacio de nombres de métricas:** `TurnoFacil/Piloto`. Dimensiones permitidas: `componente`, `salon_id` (opaco, 5 valores), `tipo` (recordatorio 1 / 2, tipo de mensaje), `motivo`. Nunca dimensiones por cita ni por teléfono.

### 1.1 Frontend

**No aplica.** TurnoFácil no tiene interfaz propia: la dueña y las clientas usan WhatsApp (RFC § 2.1; `ui/` solo representa conversaciones). Lo equivalente a "lo que ve el usuario" se mide en el backend como tiempo hasta que Meta acepta la respuesta (§ 1.2) y como estado de entrega que Meta informa por webhook (`entregado`, `leído`, `fallido`).

### 1.2 Backend (Lambdas)

**Logs** · campos obligatorios en cada registro:

| Campo | Ejemplo | Nota |
|---|---|---|
| `ts` | `2026-11-24T18:00:03.120-05:00` | ISO 8601 con zona America/Bogotá |
| `nivel` | `INFO` | `ERROR`, `WARN`, `INFO`. `DEBUG` apagado en el piloto |
| `componente` | `emisor` | receptor, procesador, emisor, vigilante, cierre, soporte |
| `evento` | `RecordatorioEnviado` | Nombre del evento de dominio (events.md § 2) o técnico (`firma_invalida`, `latido_vigilante`, `reintento_envio`) |
| `correlacion_id` | `rec-01J…-r1` | D12-4 |
| `trace_id` | `1-6743…` | X-Ray |
| `salon_id` | `sal_03` | Opaco |
| `cita_id`, `recordatorio_id` | `cit_01J…` | Cuando aplique |
| `telefono_seudonimo` | `h:9f2c…` | Solo si hace falta correlacionar a una persona |
| `resultado` | `ok`, `rechazado`, `error_transitorio`, `error_permanente` | |
| `duracion_ms` | `840` | Tiempo de la operación |
| `error_tipo`, `codigo_proveedor` | `timeout`, `131026` | Solo en errores |

Qué registra cada componente (nivel `INFO` salvo indicación):

| Componente | Registros clave |
|---|---|
| Receptor | Mensaje aceptado y encolado; duplicado descartado; `firma_invalida` (`WARN`, sin cuerpo, solo IP); verificación de suscripción |
| Procesador | Clasificación del remitente (dueña / clienta / no dueña); comando interpretado o rechazado con `motivo`; cada evento de dominio; respuesta enviada; fallo de guardado (`ERROR`) |
| Emisor | `reservarEnvio` ganado o perdido; verificación previa (omitido y motivo); cada intento con resultado; `RecordatorioEnviado` con `retraso_s` y `via`; `RecordatorioIncumplido` y `MensajeNoEntregado` (`ERROR`) |
| Vigilante | Latido por ejecución con cantidad de vencidos encontrados y tomados |
| Cierre | `CitaCerrada` / `CitaQuedoSinConfirmar` con motivo |
| Soporte | Cada operación con actor, operación, referencia y resultado (además del evento de auditoría, ADR-007) |

**Métricas (RED por componente).** Las de rate, errores y duración salen de las métricas nativas de Lambda y del API. Las propias del negocio y de puntualidad se publican por EMF:

| Métrica | Tipo | Fuente | Uso |
|---|---|---|---|
| `Invocations`, `Errors`, `Throttles`, `Duration` por Lambda | Nativa | Lambda | RED técnico |
| `4xx`, `5xx`, `Count`, `Latency` del API del webhook | Nativa | API Gateway | RED del receptor |
| `RetrasoEnvio` (s) por `tipo` | Propia | Emisor / Vigilante | Alerta de tardanza, SLO de puntualidad |
| `RecordatoriosVencidosSinEnviar` | Propia | Vigilante (conteo por ejecución) | Alerta |
| `LatidoVigilante` (1 por ejecución) | Propia | Vigilante | Alerta de vigilante detenido |
| `RecordatorioIncumplido` | Propia | Emisor / Vigilante | Alerta 1 del PRD |
| `MensajeNoEntregado` por `tipo` y `origen` | Propia | Emisor / Procesador | Alerta 2 del PRD |
| `FalloGuardado` por operación (registrar / cancelar) | Propia | Procesador | Alerta 3 del PRD |
| `LatenciaRespuestaDueña` (ms) por comando (registrar / cancelar / vista) | Propia | Procesador: desde la marca de tiempo del mensaje en Meta hasta la aceptación de la respuesta por Meta | SLO de guardado y de vista |
| `RespuestaDueñaLenta` (1 si > 10 s) por comando | Propia | Procesador | SLO (conteo de eventos malos) |
| `ReintentoEnvio` | Propia | Emisor | Salud del canal |
| `MensajesEnviados` por hora | Propia | Emisor / Procesador | Volumen anómalo (security-design § 7) |
| Eventos de negocio: `CitaRegistrada`, `RegistroRechazado` (por `motivo`), `CitaConfirmada`, `CitaCanceladaPorLaClienta`, `CitaCerrada` (por `estado_final`), `CitaQuedoSinConfirmar` (por `motivo`), `RespuestaNoEntendida`, `ClientaDadaDeBaja`, `VistaEntregada` | Propia, por `salon_id` | Procesador / Cierre | Panel de negocio (§ 2.2) |

**Canal emulado (solo ambiente de prueba, D12-6).** Los mensajes y envíos por el canal emulado (api-contract § 10) producen los mismos registros, métricas y trazas que los reales, sin datos personales (ADR-007). Se distinguen por el prefijo `emu.` del `mensaje_id`, que llega como `correlacion_id`. La clave de prueba no se registra nunca. El almacén del canal emulado no es fuente de observabilidad.

**Traces (D12-5).** X-Ray activo en el API del webhook y en las seis Lambdas. Segmentos instrumentados: entrada de cada Lambda; envío y recepción en la cola FIFO; cada llamada al `Repositorio` (subsegmento por operación: `guardarCita`, `reservarEnvio`, `listarVencidos`…); cada llamada a la API de Meta (subsegmento `canal.enviar` con `codigo_proveedor`); creación y borrado de eventos programados; lectura de Secrets Manager. Anotaciones permitidas: `correlacion_id`, `salon_id`, `componente`, `resultado`. Muestreo del 100 % por el volumen del piloto (unas 170 citas y 340 recordatorios al mes).

### 1.3 Database (puerto `Repositorio`)

El almacén no está elegido (ADR-005). La instrumentación se hace **en el adaptador del puerto** para que no dependa de la tecnología:

**Métricas (USE desde el adaptador):**
- **Utilización:** `RepositorioDuracion` (ms) por operación, p50/p95/p99.
- **Saturación:** `RepositorioLimitado` (respuestas de límite de capacidad o de tasa del almacén).
- **Errores:** `RepositorioError` por operación y tipo; `ReservaEnvioPerdida` (conflicto esperado de la escritura condicional, mide coincidencias emisor–vigilante; no es error); `UnicidadViolada` (intento de cita duplicada por salón, teléfono e inicio).

**Logs:** operación lenta si supera **500 ms** (`WARN`, con operación y `correlacion_id`, sin parámetros con datos personales).

Cuando se elija el almacén, su ADR agrega las métricas nativas (capacidad consumida, conexiones o equivalente) a este apartado y al panel de capacidad.

### 1.4 Infraestructura (servicios administrados)

No hay servidores, contenedores ni red privada (RFC § 2.2.1). Se observan las métricas nativas de cada servicio:

| Servicio | Métricas |
|---|---|
| Lambda | `ConcurrentExecutions`, `Throttles`, `Errors`, `Duration` frente al tiempo límite, `IteratorAge` no aplica |
| Cola FIFO de entrantes | `ApproximateNumberOfMessagesVisible`, `ApproximateAgeOfOldestMessage` |
| DLQ | `ApproximateNumberOfMessagesVisible` |
| EventBridge Scheduler | `InvocationAttemptCount`, `TargetErrorCount`, `InvocationDroppedCount` |
| Regla de un minuto del vigilante | `Invocations`, `FailedInvocations` |
| SNS (avisos) | `NumberOfNotificationsFailed` |
| Secrets Manager / KMS | Vía CloudTrail (security-design § 7) |

---

## 2. Dashboards

Tres paneles de CloudWatch declarados en Terraform. Ninguno muestra datos personales.

### 2.1 Dashboard de servicio · "TurnoFácil · Operación"

- Puntualidad: `RetrasoEnvio` máximo y p95 por minuto, con línea en 300 s; recordatorios enviados por `via` (emisor / vigilante).
- `LatenciaRespuestaDueña` p50/p95/p99 por comando, con línea en 10 s.
- Errores: `Errors` por Lambda; `5xx` del API; `RecordatorioIncumplido`, `MensajeNoEntregado`, `FalloGuardado`.
- Tráfico: mensajes entrantes por minuto (Receptor), envíos por hora.
- Latido del vigilante (debe ser 1 por minuto) y `RecordatoriosVencidosSinEnviar`.
- Top de componentes por errores en las últimas 24 h (consulta de Logs Insights por `componente` y `error_tipo`).
- Estado de las alarmas de § 3.
- Consumo del presupuesto de error de los tres SLO (§ 4).

### 2.2 Dashboard de negocio · "TurnoFácil · Piloto"

Alineado con PRD § 8. Por salón (`salon_id`) y total, por semana:

- **North Star (70 %)**: citas cerradas sin que la dueña escriba ÷ citas cerradas, a partir de `CitaCerrada` por `estado_final`. Muestra aparte las citas excluidas y por qué (PRD § 8: "Cada reporte del 70% informa cuántas citas quedaron fuera del cálculo y por qué"). **Límite:** el panel solo ve lo que pasa en el sistema; si la dueña escribió por fuera se sabe por la revisión semanal, no por el producto (PRD § 6).
- **KPI 1 (75 %)**: recordatorios con respuesta ÷ citas con al menos un recordatorio enviado, medido **por cita** mientras se unifica la unidad (PRD § 8, pendiente de las primeras 2 semanas).
- `CitaQuedoSinConfirmar` por `motivo` (sin respuesta / baja / no entregable).
- Citas registradas y rechazos por `motivo`.
- `RespuestaNoEntendida` por `tipo_contenido` (riesgo conocido de "baja"/"para", PRD § 6).
- `ClientaDadaDeBaja` por semana.
- `VistaEntregada`: veces que cada dueña pide la vista (PRD § 7).
- Avisos de cancelación enviados.

**Fuera del panel:** KPI 2 (pago del segundo mes) y KPI 3 / límite del 22 % de citas fallidas no son funciones del producto: se miden en la revisión semanal con las dueñas (PRD § 6). El 14,8 % de referencia del brazo de confirmación sale del piloto [E:01M7RXWF70H4FDZ56B2RMEMYSF].

### 2.3 Dashboard de capacidad · "TurnoFácil · Capacidad"

- `ConcurrentExecutions` y `Throttles` por Lambda; `Duration` p99 frente al tiempo límite configurado.
- Cola FIFO: mensajes visibles y antigüedad del mensaje más viejo; DLQ.
- EventBridge Scheduler: intentos, errores de destino y descartados.
- `RepositorioDuracion` p99 y `RepositorioLimitado` por operación.
- `MensajesEnviados` por hora y por salón frente al máximo esperado (base de costo de Meta).
- Volumen de ingesta de registros por grupo (base de costo de CloudWatch).

---

## 3. Alertas + runbooks

Severidades (D12-3):
- **P1 · urgente:** correo + SMS al fundador por el tema SNS `turnofacil-alertas-p1`. Atender en cuanto se vea.
- **P2 · normal:** correo al fundador por `turnofacil-alertas-p2`. Atender el mismo día.

Todas las alarmas se declaran en Terraform. Las alarmas por evento (una por recordatorio o mensaje fallido) no tienen tiempo sostenido a propósito: cada evento es un fallo real que el PRD pide conocer (ADR-004). Para evitar avisos repetidos, la alarma se evalúa por minuto y solo notifica al pasar a ALARM; el detalle de cada caso se lee en el registro.

| ID | Alerta | Métrica y umbral | Sostenido | Severidad | PRD § 6 | Runbook |
|---|---|---|---|---|---|---|
| AL-01 | Recordatorio tardío | `RetrasoEnvio` máximo > 300 s | 1 de 1 periodos de 1 min | P1 | Alerta 1 | RB-01 |
| AL-02 | Recordatorios vencidos sin enviar | `RecordatoriosVencidosSinEnviar` > 0 | 2 de 2 periodos de 1 min (RFC § 2.1.4) | P1 | Alerta 1 | RB-01 |
| AL-03 | Recordatorio incumplido | `RecordatorioIncumplido` suma > 0 | Por evento, 1 min | P1 | Alerta 1 | RB-01 |
| AL-04 | Vigilante detenido | `LatidoVigilante` suma < 1; datos faltantes cuentan como fallo | 3 de 3 periodos de 1 min | P1 | Alerta 1 (preventiva) | RB-02 |
| AL-05 | Mensaje no entregado | `MensajeNoEntregado` suma > 0 | Por evento, 5 min | P2 | Alerta 2 | RB-03 |
| AL-06 | Registro o cancelación no guardada | `FalloGuardado` suma > 0 | Por evento, 5 min | P2 | Alerta 3 | RB-04 |
| AL-07 | Acceso del equipo a datos de clientas | Asunción del rol de soporte (CloudTrail → EventBridge) | Por evento | P1 | Alerta 4 | RB-05 |
| AL-08 | Mensajes en la DLQ | `ApproximateNumberOfMessagesVisible` de la DLQ > 0 | 1 de 1 periodos de 5 min | P2 | — (RFC § 2.1.4) | RB-06 |
| AL-09 | Errores de una Lambda | `Errors` > 0 en una misma Lambda | 3 de 5 periodos de 1 min | P2 | — | RB-07 |
| AL-10 | Respuesta a la dueña lenta | `RespuestaDueñaLenta` suma ≥ 2 | En 1 h | P2 | — (SLO § 4) | RB-08 |
| AL-11 | Presupuesto de error de un SLO al 50 % | Eventos malos del mes ≥ 50 % del presupuesto | Evaluación diaria | P2 | — (SLO § 4) | RB-09 |
| AL-12 | Falla al enviar avisos | `NumberOfNotificationsFailed` de SNS > 0 | 1 de 1 periodos de 5 min | P2 (solo correo) | — | RB-10 |
| AL-13 | Entrada de prueba en producción | Filtro de métricas en los grupos de registros de producción: `correlacion_id` que empieza con `emu.`, suma > 0. Solo se crea en producción | Por evento, 1 min | P1 | — (security-design OQ-8) | RB-11 |

Las alertas de seguridad (firma inválida, consola sin MFA, cambios de IAM o KMS, lectura de secretos, datos personales en registros, volumen anómalo, abuso) ya están definidas en security-design § 7, con su umbral. Van al tema P2, salvo "datos personales en registros" y "cambios de IAM o KMS fuera del pipeline", que van al P1 por ser incidentes de seguridad (security-design § 5).

### 3.1 Runbooks

**RB-01 · Recordatorio tardío, vencido o incumplido (AL-01, AL-02, AL-03)**
1. Abrir el panel de Operación: ver si es un recordatorio aislado o varios y de qué salones.
2. En Logs Insights filtrar por `evento in [RecordatorioIncumplido, reintento_envio]` en los últimos 30 min y leer `error_tipo` y `codigo_proveedor`.
3. Si `error_tipo` es transitorio (tiempo agotado, 5xx, límite de velocidad): revisar el estado de la API de WhatsApp de Meta. Si Meta está caído, no hay acción técnica; el recordatorio 1 se reintenta cada 5 min hasta la hora del recordatorio 2 (RFC § 2.1.4).
4. Si `via` es siempre `vigilante`: el programador no está ejecutando los eventos. Revisar `TargetErrorCount` e `InvocationDroppedCount` del Scheduler y los permisos del rol del emisor.
5. Si hay vencidos y no hay errores de envío: revisar `Errors` y `Throttles` del emisor y del vigilante, y la duración frente al tiempo límite.
6. Si fue un despliegue reciente: volver a la versión anterior con Terraform (alias de la Lambda a la versión previa).
7. Si un recordatorio 2 quedó "incumplido": avisar a la dueña del salón para que confirme la cita manualmente (como en el piloto, donde enviaba una persona).
8. Registrar el incidente en la revisión semanal con cantidad de recordatorios afectados (consumo del SLO de puntualidad).

**RB-02 · Vigilante detenido (AL-04)**
1. Revisar `Invocations` y `FailedInvocations` de la regla de un minuto: si son 0, la regla está desactivada o se borró. Volver a aplicar Terraform.
2. Si hay invocaciones pero no latido: revisar `Errors` y el último registro de error del vigilante (tiempo límite, permisos del `Repositorio`, credenciales).
3. Mientras el vigilante esté caído, los recordatorios dependen solo del programador: vigilar AL-01 a AL-03.
4. Confirmar que el latido vuelve y que `RecordatoriosVencidosSinEnviar` baja a 0.

**RB-03 · Mensaje no entregado (AL-05)**
1. Buscar el registro `MensajeNoEntregado` por `correlacion_id`: leer `tipo_mensaje`, `origen` y `codigo_proveedor`.
2. Error permanente (número sin WhatsApp, destinatario inválido): la cita ya quedó "sin confirmar" (flujo F4·A6). Avisar a la dueña para que verifique el número con la clienta.
3. Error de plantilla (rechazada, pausada o con parámetros inválidos): afecta a todos los envíos de esa plantilla. Revisar el estado de la plantilla en el administrador de Meta y, si está pausada, apagar el envío del salón o el general (RFC § 6.3) hasta resolver.
4. Si se repiten varios en una hora con el mismo código: tratar como incidente del canal y revisar calidad del número en Meta.

**RB-04 · Registro o cancelación no guardada (AL-06)**
1. La dueña ya recibió "no se pudo, repite el mensaje". Buscar por `correlacion_id` el `error_tipo` del `Repositorio`.
2. Si es límite de capacidad o tasa del almacén: revisar `RepositorioLimitado` y la configuración de capacidad del almacén.
3. Si es error de permisos o de red: revisar el último cambio de Terraform y los permisos del rol del procesador.
4. Verificar a las 2 h que la dueña repitió el mensaje (`CitaRegistrada` del mismo salón). Si no, escribirle para confirmar que la cita está guardada.

**RB-05 · Acceso del equipo a datos de clientas (AL-07)**
1. Confirmar quién asumió el rol de soporte y con qué motivo (evento `AccesoDelEquipoRegistrado`).
2. Si el acceso es esperado (ticket o pedido de la dueña): anotarlo en el registro de soporte y cerrar.
3. Si no es esperado: revocar sesiones del rol, rotar credenciales del usuario y seguir el procedimiento de incidente de security-design § 5 (incluida la evaluación de notificación).

**RB-06 · Mensajes en la DLQ (AL-08)**
1. Leer el registro del procesador para el `correlacion_id` del mensaje (el contenido del mensaje no se copia a los registros).
2. Si es un defecto del intérprete o del dominio: corregir y desplegar; reprocesar el mensaje con el redrive de la DLQ.
3. Si el mensaje ya no aplica (por ejemplo, respuesta tras el cierre de la cita): borrarlo de la DLQ y anotar la causa.
4. No dejar mensajes más de 24 h en la DLQ: contienen texto de WhatsApp.

**RB-07 · Errores de una Lambda (AL-09)**
1. Panel de Operación: identificar la Lambda y la hora de inicio.
2. Logs Insights: agrupar por `error_tipo` en la Lambda afectada.
3. Correlacionar con el último despliegue; si coincide, volver a la versión anterior.
4. Si es un servicio de AWS degradado, revisar el estado de AWS en la región y esperar; las alarmas de negocio (AL-01 a AL-06) dicen si hay impacto en clientas.

**RB-08 · Respuesta a la dueña lenta (AL-10)**
1. Abrir la traza X-Ray de los mensajes lentos (`RespuestaDueñaLenta = 1`) y ver qué subsegmento domina: cola, `Repositorio`, creación de eventos programados o Meta.
2. Si es arranque en frío del procesador: evaluar concurrencia aprovisionada mínima (cambio con ADR por costo).
3. Si es Meta: no hay acción; registrar para la revisión semanal.
4. Si es el `Repositorio`: ver RB-04, paso 2.

**RB-09 · Presupuesto de error al 50 % (AL-11)**
1. Identificar qué SLO consume y las causas (RB-01 o RB-08).
2. Priorizar la causa principal en la siguiente semana de trabajo.
3. Si se agota el presupuesto: congelar cambios que no sean correcciones hasta fin de mes y revisar el SLO en la revisión semanal (§ 4).

**RB-10 · Fallan los avisos (AL-12)**
1. Revisar en SNS la suscripción afectada (correo sin confirmar, número de SMS bloqueado o límite de gasto de SMS alcanzado).
2. Corregir la suscripción y enviar un aviso de prueba.
3. Mientras tanto, revisar a mano el panel de Operación al menos dos veces al día.

**RB-11 · Entrada de prueba en producción (AL-13)**
1. Tratarlo como incidente de seguridad (security-design § 5, OQ-8): alguien pudo actuar como cualquier dueña sin firma de Meta.
2. Apagar el envío general (RFC § 6.3) y verificar en el plan de Terraform de producción que `canal_emulado_habilitado` sea `false` y que no existan rutas `/prueba/canal-emulado/…`. Si existen, volver a aplicar con `false`.
3. Con los `correlacion_id` `emu.` de los registros, listar qué citas, cancelaciones o bajas se crearon o cambiaron y revertirlas con la Lambda de soporte.
4. Encender el envío y seguir el procedimiento de incidente, incluida la evaluación de notificación.

---

## 4. SLOs

D12-1: objetivo mensual del 99 % para los tres límites del PRD § 6. **Sin SLO de disponibilidad** en el piloto: el PRD no la define y el RFC § 1.3 la deja "n/a justificado: el PRD §6 no la define; la tolerancia efectiva es la ventana de 5 minutos del recordatorio". Los tres límites son [ASUNCIÓN SIN VALIDAR] en el PRD: no se midieron en el piloto, donde enviaba una persona. Se revisan con datos reales al terminar el primer mes.

| Servicio | SLI | SLO | Volumen estimado / mes | Error budget / mes |
|---|---|---|---|---|
| Recordatorios (emisor + vigilante) | Recordatorios enviados con `RetrasoEnvio` ≤ 300 s ÷ recordatorios que debían salir (enviados + incumplidos + enviados tarde; no cuentan los omitidos ni los no entregables por error permanente) | 99 % | ~340 | ~3 recordatorios tardíos o incumplidos |
| Guardado (procesador, comandos registrar y cancelar) | Comandos con `LatenciaRespuestaDueña` < 10 s ÷ comandos con respuesta | 99 % | ~170 registros + cancelaciones | ~1 a 2 respuestas lentas |
| Vista (procesador, comando vista) | Vistas con `LatenciaRespuestaDueña` < 10 s ÷ vistas pedidas | 99 % | Sin dato (PRD § 7 lo mide en el piloto) | 1 % de las vistas del mes |

Cálculo: métricas de conteo de eventos buenos y malos con suma mensual (metric math en el panel de Operación). Un fallo de guardado (AL-06) cuenta como evento malo del SLO de guardado.

**Política de presupuesto de error:**
- Al 50 %: AL-11 (P2) y revisión de causas.
- Al 100 %: solo correcciones hasta fin de mes; se revisa en la revisión semanal si el SLO o el diseño deben cambiar.
- Con este volumen, un solo incidente puede agotar el presupuesto: se acepta, porque el objetivo es aprender a qué ritmo falla el sistema en el piloto, no penalizar.

---

## 5. DR / Backup

### 5.1 RPO/RTO (D12-2)

- **RPO** (máxima pérdida de datos): **5 minutos**.
- **RTO** (máximo tiempo sin servicio): **4 horas**. Lo atiende el fundador, sin guardia; es la única persona que responde (PRD § 7, riesgo de concentración).
- **Alcance:** fallo o corrupción del almacén, borrado accidental, despliegue que daña datos. **Fuera de alcance:** caída completa de la región de AWS. No hay réplica en otra región: la región aún no está fijada (ADR-005) y no se justifica para 5 salones. Riesgo aceptado: en ese caso el RTO depende de AWS, y el fundador avisa a las dueñas para que confirmen las citas del día a mano.

### 5.2 Backup

| Componente | Estrategia | Retención | Nota |
|---|---|---|---|
| Almacén (citas, recordatorios, contactos, auditoría) | **Requisito para el ADR del almacén:** recuperación a un punto en el tiempo continua, cifrada con la clave KMS del cliente | 35 días | Si la tecnología elegida no la ofrece, el ADR debe cumplir el RPO de 5 min por otro medio o reabrir esta decisión. Los borrados por pedido de la clienta (RF-11) se vuelven a aplicar tras una restauración (paso 5.3·6) |
| Infraestructura | Terraform en el repositorio; estado remoto cifrado y versionado | Versiones del estado: 90 días | Toda la infraestructura se recrea con `terraform apply` |
| Eventos programados (EventBridge Scheduler) | No se respaldan: se **reconstruyen** desde los recordatorios en estado "programado" (nombres deterministas `rec-<cita>-<tipo>` y `cierre-<cita_id>`, idempotentes) | — | Operación de soporte "reprogramar pendientes" (a construir) |
| Secretos (credenciales de Meta, clave HMAC) | Secrets Manager con recuperación del borrado; la clave HMAC anterior se conserva marcada como `anterior` (security-design § 4) | Ventana de recuperación de 30 días | Perder la clave HMAC rompe la correlación de bajas y auditoría |
| Cola FIFO de entrantes | No se respalda: retención corta, solo para reintentos (RFC § 2.2.2) | — | Si se pierde, depende de que Meta reenvíe el webhook no confirmado (asunción sin evidencia) |
| Registros y auditoría | CloudWatch Logs y bucket de CloudTrail | 90 días / 1 año (D11-2) | El bucket de CloudTrail con versionado |

### 5.3 Plan de restauración

1. **Detectar y contener:** confirmar el daño (AL-04, AL-06, AL-09 o reporte de una dueña). Apagar el envío general (RFC § 6.3) para no mandar recordatorios con datos dañados.
2. **Elegir el punto:** el último minuto antes del daño, según registros y trazas.
3. **Restaurar** el almacén a ese punto en un recurso nuevo (no sobre el dañado).
4. **Apuntar** el adaptador del `Repositorio` al recurso restaurado con una variable de Terraform y aplicar.
5. **Reconstruir eventos programados** con la operación de soporte "reprogramar pendientes": recrea `rec-…` y `cierre-…` para todo lo que esté "programado" en el futuro. El vigilante cubre lo vencido.
6. **Reaplicar borrados** de datos de clientas posteriores al punto restaurado, a partir de los eventos de auditoría `DatosDeClientaBorrados` (CloudWatch Logs y auditoría, fuera del almacén).
7. **Revisar huecos:** con los registros de `CitaRegistrada` y `CitaCanceladaPorLaDueña` entre el punto restaurado y el daño, identificar citas que la dueña registró y que no quedaron. Avisar a cada dueña afectada para que las repita.
8. **Encender** el envío y verificar el panel de Operación durante 30 minutos.
9. **Postmortem** en 48 h, presentado en la revisión semanal.

**Ensayo:** una restauración completa (pasos 2 a 8, en una copia) **antes de empezar el piloto**, cronometrada contra el RTO de 4 h. Se repite cuando cambie el almacén o la región.

---

## 6. Capacidad y costo de la observabilidad

Sin plan de vendor (pago por uso, A9). Estimación para dimensionar, no un límite contratado:

- **Métricas propias:** unas 25 métricas con dimensiones de baja cardinalidad (5 salones, 2 tipos de recordatorio, motivos acotados). Del orden de 150 series en total.
- **Alarmas:** 13 de este documento + las de security-design § 7 (unas 12).
- **Registros:** unas 170 citas y 340 recordatorios al mes, más mensajes de chat; pocos megabytes al mes.
- **Trazas:** muestreo del 100 %; unos miles de trazas al mes.
- **SMS:** solo alertas P1; se fija un límite de gasto mensual de SMS en SNS para evitar sorpresas.

Si el producto crece más allá de 5 salones (PRD § 6, pendiente), revisar la cardinalidad por `salon_id` y el muestreo de trazas.

---

## 7. Preguntas abiertas

| ID | Pregunta | Responsable | Cuándo |
|---|---|---|---|
| OQ-1 | No existe `drivers.yaml#nfrs.observability`: el vendor sale del RFC aprobado (decisión del fundador). Si se crea, declararlo con `vendor: cloudwatch` y `enforced: true` | Fundador | Cuando se cree |
| OQ-2 | Envío de SMS a Colombia desde SNS en la región que se elija: disponibilidad, identificador de origen y costo. **Asunción sin evidencia**. Si no es viable, la alternativa es una app de notificaciones (de pago) suscrita al mismo tema | Fundador | Antes del piloto, con la región (ADR-005) |
| OQ-3 | Suplente para recibir alertas P1 si el fundador no está disponible (PRD § 7, riesgo de concentración) | Fundador | Antes del piloto |
| OQ-4 | Tecnología del almacén: debe cumplir recuperación a un punto en el tiempo, RPO 5 min y retención de 35 días (D12-2) | Fundador / ADR del almacén | Tras la validación legal |
| OQ-5 | ¿Meta reintenta webhooks no confirmados y durante cuánto tiempo? Afecta la pérdida de entrantes si falla la cola. **Asunción sin evidencia** | Quien construya | Antes del piloto |
| OQ-6 | Revisar los tres SLO con datos del primer mes del piloto (los límites del PRD son asunciones sin validar) | Fundador | Fin del primer mes |

---

## 8. Checklist de calidad

- [x] § 1 cubre todas las capas (frontend justificado como no aplicable; backend, base de datos vía puerto, infraestructura administrada)
- [x] Cada capa especifica logs, métricas (RED o USE) y trazas
- [x] `correlacion_id` presente en todas las capas (D12-4)
- [x] § 2 incluye los 3 paneles; el de negocio referencia los KPI del PRD § 8
- [x] § 3 lista 13 alertas con umbral, tiempo sostenido o justificación por evento, severidad y runbook concreto
- [x] § 4 define SLI, SLO y presupuesto de error para los servicios críticos; sin SLO de disponibilidad, alineado con RFC § 1.3
- [x] § 5 define RPO y RTO numéricos, estrategia de respaldo y plan de restauración con pasos y ensayo
