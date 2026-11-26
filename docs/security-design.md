# Security Design · TurnoFácil

**Date:** 2026-11-24
**RFC base:** docs/RFC.md § 2.2.4 (RFC-001)
**Domain model base:** docs/domain-model.md
**ADRs base:** ADR-005 (persistencia), ADR-006 (identidad por número), ADR-007 (registros sin datos personales y auditoría), ADR-009 (cola FIFO)
**Contrato base:** docs/api-contract.md (fronteras A a D)
**Compliance applicable:** Ley 1581 de 2012 de Colombia (Habeas Data), sujeta a la validación legal pendiente (PRD § 7). GDPR, PCI y SOC2: no aplican (§ 8).

---

## Resumen para decidir

- **Lo más valioso que protegemos** son el nombre y el teléfono de las clientas (Cita y Contacto de clienta) y el token de Meta, porque permite enviar mensajes en nombre del salón.
- **Identidad sin contraseñas.** La dueña es su número de WhatsApp (ADR-006). La autenticidad del mensaje la da la firma de Meta. El riesgo aceptado es que quien tenga el teléfono de la dueña actúa como ella (§ 9, OQ-1).
- **Acceso del equipo:** solo por el rol de soporte, con MFA obligatorio y alerta por correo en cada uso. El mismo MFA se exige a toda persona que entre a la cuenta AWS del cliente (decisión de esta etapa).
- **Rotación de secretos:** el token de Meta cada 90 días, el secreto de la aplicación y el token de verificación cada 180 días, y la clave de seudónimos solo ante incidente (decisión de esta etapa).
- **Retención de registros:** 1 año para la auditoría del equipo y el uso del rol de soporte, 90 días para el resto de registros técnicos (decisión de esta etapa). La retención de datos de clientas sigue abierta (RFC A4).
- **Marco legal:** Ley 1581 de 2012. Todo lo de § 8 es asunción sin evidencia hasta que lo valide el abogado.

### Decisiones de esta etapa

| ID | Decisión | Sección |
|---|---|---|
| D11-1 | Marco de cumplimiento: Ley 1581 de 2012 (Habeas Data). GDPR, PCI y SOC2 no aplican, con justificación | § 8 |
| D11-2 | Retención: 1 año para la auditoría del equipo y el rol de soporte (Evento de auditoría y CloudTrail), 90 días para el resto de registros técnicos (grupos de CloudWatch Logs) | § 7 |
| D11-3 | MFA obligatorio para asumir el rol de soporte y para todo acceso de personas a la cuenta AWS del cliente | § 4.1, § 4.2 |
| D11-4 | Rotación: token de Meta (usuario de sistema) cada 90 días; secreto de la aplicación y token de verificación del webhook cada 180 días; clave de seudonimización solo ante incidente. Hay un procedimiento de rotación inmediata ante incidente para los tres | § 5 |
| D11-5 | Límites de abuso: limitación de tráfico en el API del webhook y descarte de remitentes no dueña que superan un umbral (valores provisionales, asunción sin evidencia) | § 6.1, § 6.2 |
| D11-6 | Sin WAF en el piloto: la firma de Meta descarta el tráfico ajeno antes de cualquier proceso. Se revisa si aparece tráfico anómalo | § 6.1 |
| D11-7 | Frontera E · Canal emulado (api-contract § 10): solo existe en el ambiente de prueba, se autentica con una clave de prueba en Secrets Manager y se trata como riesgo de suplantación si llegara a producción | § 2.11, § 5, § 6.1, OQ-8 |

---

## 1. Assets identificados

| Asset | Bounded context | Sensibilidad | Datos | Operaciones críticas |
|---|---|---|---|---|
| Cita | Agenda | PII | Nombre y teléfono de la clienta (tal como los escribe la dueña, D9-3), servicio e inicio | Registrar, cancelar, borrar datos (soporte), armar la vista |
| Contacto de clienta | Recordatorios y respuestas | PII | Teléfono (E.164) y condición activa o dada de baja | Dar de baja, reactivar (solo soporte), consultar antes de enviar |
| Salón | Agenda | PII (de la dueña) + control de acceso | Número registrado de la dueña: es la credencial de la dueña (ADR-006) | Cambio de número (solo soporte, con identidad confirmada) |
| Recordatorio | Recordatorios y respuestas | Interno | Identificadores opacos, hora programada, estado, intentos | `reservarEnvio`, envío |
| Respuesta de clienta | Recordatorios y respuestas | PII baja | Texto de la respuesta e identificador del mensaje de Meta | Cambia el estado de la cita |
| Comando de la dueña | Agenda | PII | Texto del mensaje (contiene nombre y teléfono de clientas) | Registrar, cancelar, vista |
| Aviso a la dueña | Recordatorios y respuestas | PII | Nombre de la clienta en la plantilla | Envío a la dueña |
| Evento de auditoría | Soporte y auditoría | Interno (evidencia legal) | Actor, operación, referencia (salón o seudónimo HMAC), fecha; nunca nombre ni teléfono (Inv-AUD-03) | Solo inserción |
| Mensajes en la cola FIFO y la DLQ | Transversal | PII | Cuerpo del mensaje de WhatsApp | Reintento, inspección de la DLQ |
| Token de Meta (usuario de sistema) | Adaptador de canal | Secreto crítico | Permite enviar mensajes desde el número del negocio | Envío de mensajes |
| Secreto de la aplicación de Meta y token de verificación | Receptor | Secreto crítico | Validan que el webhook viene de Meta | Verificar firma y suscripción |
| Clave de seudonimización (HMAC) | Transversal | Secreto | Permite correlacionar teléfonos en registros y auditoría | Generar seudónimos |
| Estado de Terraform | Infraestructura | Secreto | Describe la cuenta y puede contener valores sensibles | Despliegue |

Cross-ref: RB-13 del domain-model fija que nombre y teléfono solo viven en Cita y Contacto de clienta. Este documento trata cualquier otra aparición, como la cola, el texto del comando o los registros, como una fuga que hay que controlar.

---

## 2. Threat model · STRIDE por componente

Los componentes son los de RFC § 2.1.2. EventBridge Scheduler se evalúa junto con el Emisor y el Cierre de cita, porque es su disparador.

### 2.1 Componente: Receptor (API del webhook + Lambda)

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | Sí: cualquiera puede llamar a la URL pública y fingir ser Meta | Verificar `X-Hub-Signature-256` (HMAC-SHA256 del cuerpo crudo) con comparación en tiempo constante. Si la firma es inválida o falta, se responde 401, no se encola nada y no se responde por WhatsApp (api-contract, frontera A). La suscripción exige `hub.verify_token` desde Secrets Manager |
| **T**ampering | Sí: alterar el cuerpo en tránsito | La firma cubre el cuerpo completo y se valida sobre los bytes crudos, antes de interpretar el JSON. TLS en el API |
| **R**epudiation | Bajo | Se registra cada rechazo de firma (`firma_invalida`) con IP de origen y hora, sin el cuerpo (§ 7) |
| **I**nformation disclosure | Sí: los errores o registros podrían exponer el cuerpo | No se registra el cuerpo. Las respuestas de error no tienen detalle. Los registros siguen ADR-007 |
| **D**oS | Sí: inundar la URL pública | Limitación de tráfico en la etapa del API (§ 6.1). El rechazo por firma es barato y ocurre antes de encolar. Límite de concurrencia reservada en la Lambda para no consumir la cuota de la cuenta |
| **E**levation of privilege | Bajo | El rol de la Lambda solo puede enviar a la cola FIFO y leer dos secretos (secreto de la aplicación y token de verificación). No lee el almacén |

### 2.2 Componente: Cola FIFO de entrantes + DLQ

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | Sí: un tercero con permisos podría inyectar mensajes falsos | Política de la cola: solo el rol del Receptor puede enviar y solo el del Procesador puede recibir. Sin acceso entre cuentas |
| **T**ampering | Bajo | Solo el Receptor escribe. Cifrado con KMS |
| **R**epudiation | Bajo | CloudTrail registra los cambios de política de la cola |
| **I**nformation disclosure | Sí: contiene mensajes con PII | Cifrado en reposo con una clave KMS administrada por el cliente. Retención corta (RFC § 2.2.2). Inspeccionar la DLQ exige el rol de soporte (alerta 4) |
| **D**oS | Sí: una avalancha de mensajes de un remitente bloquea su grupo FIFO | Los grupos de ordenamiento son por teléfono, así que un remitente abusivo solo atrasa su propio grupo. Hay alarma de DLQ y de antigüedad del mensaje más viejo |
| **E**levation of privilege | No: la cola no ejecuta código | n/a justificado: la cola no tiene permisos propios |

### 2.3 Componente: Procesador (Lambda)

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | Sí: un número ajeno intenta actuar como dueña | El remitente sale del campo `from` del mensaje firmado, nunca del texto. Si no coincide con el número registrado de un salón, los comandos de registrar, cancelar o pedir la vista no reciben respuesta (US-01·1.9, ADR-006). El robo del teléfono de la dueña es un riesgo aceptado (OQ-1) |
| **T**ampering | Sí: la dueña de un salón intenta modificar citas de otro | `salon_id` se deduce del remitente y se pasa a toda operación del repositorio. El texto del mensaje nunca aporta `salon_id`. La clienta solo afecta citas asociadas a su teléfono y al recordatorio que cita (RFC A7) |
| **R**epudiation | Sí: la dueña niega haber registrado o cancelado | Cada Comando de la dueña se guarda con el identificador del mensaje de Meta y su resultado. La confirmación repite fecha y hora interpretadas (api-contract) |
| **I**nformation disclosure | Sí: la vista o un mensaje de error podrían filtrar datos de otro salón | Todas las consultas de Agenda van filtradas por `salon_id`. Las pruebas de aislamiento son obligatorias (§ 6.2). A un número desconocido no se le responde |
| **D**oS | Sí: un remitente envía cientos de mensajes | Umbral por remitente no dueña (§ 6.2). Concurrencia reservada. La idempotencia por identificador de mensaje evita reprocesar duplicados |
| **E**levation of privilege | Sí: una clienta usa palabras de comando | El intérprete separa los caminos por rol antes de interpretar (ADR-008). Un remitente clienta solo tiene confirmar, cancelar y dar de baja. Reactivar no existe por chat (ADR-007) |

### 2.4 Componente: Dominio (módulo TypeScript)

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | No | n/a justificado: no tiene entrada propia, recibe al remitente ya clasificado por el Procesador |
| **T**ampering | Sí: texto malicioso en el nombre o el servicio que luego va en plantillas o en la vista | Validación en el borde: longitud máxima de nombre y servicio, sin saltos de línea ni caracteres de control en parámetros de plantilla. El teléfono sigue Inv-CIT-02 |
| **R**epudiation | Bajo | Los eventos de dominio (domain-model § 4) dejan rastro por cita (RF-12) |
| **I**nformation disclosure | Bajo | El dominio no registra nada por sí mismo. Los registros los emite el adaptador con identificadores opacos |
| **D**oS | Bajo: expresiones regulares costosas sobre texto libre | El intérprete limita el largo del texto de entrada (4.096 caracteres) y no usa expresiones con retroceso catastrófico |
| **E**levation of privilege | Sí: transiciones ilegales de estado | La máquina de estados rechaza transiciones no permitidas. Los estados finales no cambian (RF-10) |

### 2.5 Componente: Emisor de recordatorios + EventBridge Scheduler

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | Sí: otro principal invoca al Emisor con un identificador cualquiera | Solo el rol de ejecución del Scheduler puede invocar la Lambda. El Emisor vuelve a leer la cita y la condición de la clienta antes de enviar y nunca confía en la carga |
| **T**ampering | Sí: modificar o crear eventos programados | Solo el rol del Procesador crea o borra eventos, dentro de un grupo de schedules propio. La carga lleva solo identificadores opacos |
| **R**epudiation | Bajo | Cada recordatorio guarda intentos, hora de envío, retraso y resultado (RFC § 2.1.4) |
| **I**nformation disclosure | Sí: la carga de los eventos es visible en la consola | La carga no contiene nombre ni teléfono (RFC § 2.1.4) |
| **D**oS | Sí: una avalancha de recordatorios agota el límite de Meta o genera costo | La reserva atómica evita duplicados. Interruptor general y por salón (RFC § 6.3). Alarma de costo si el volumen supera el doble de lo esperado (unos 340 recordatorios al mes; asunción sin evidencia) |
| **E**levation of privilege | Bajo | Rol mínimo: leer y actualizar recordatorios y citas, leer el token de Meta |

### 2.6 Componente: Vigilante (Lambda cada minuto)

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | Bajo | Solo la regla programada puede invocarlo |
| **T**ampering | Bajo | Usa la misma reserva atómica que el Emisor |
| **R**epudiation | Bajo | Emite un latido y registra cada envío que hace |
| **I**nformation disclosure | Sí: lee recordatorios vencidos de todos los salones | Solo lee identificadores y estados. Los datos de contacto se leen recién al enviar, igual que en el Emisor |
| **D**oS | Sí: desactivar al vigilante en silencio | Hay una alarma por latido faltante, en la que los datos faltantes cuentan como fallo (ADR-003) |
| **E**levation of privilege | Bajo | Mismo alcance que el Emisor. No puede crear schedules |

### 2.7 Componente: Cierre de cita (Lambda programada)

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | Bajo | Solo el Scheduler puede invocarla |
| **T**ampering | Sí: un cierre adelantado fijaría el estado antes de tiempo | Verifica contra el inicio guardado de la cita y no contra la carga. Si la hora no llegó, no cierra |
| **R**epudiation | Bajo | Registra la transición con el identificador de la cita |
| **I**nformation disclosure | No | n/a justificado: no lee nombre ni teléfono |
| **D**oS | Bajo | Una ejecución por cita y volumen mínimo |
| **E**levation of privilege | Bajo | Rol limitado a actualizar el estado de la cita |

### 2.8 Componente: Adaptador de canal (Meta)

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | Sí: conexión a un endpoint falso | URL base fija en el código hacia el dominio de Meta, solo HTTPS y validación del certificado por defecto. Nunca se toma una URL de un mensaje |
| **T**ampering | Bajo | TLS |
| **R**epudiation | Sí: discutir si un mensaje salió | Se guarda el identificador del mensaje que devuelve Meta y los estados de entrega del webhook |
| **I**nformation disclosure | Sí: el token en los registros o en errores | El token se lee de Secrets Manager en memoria, nunca se registra y se redacta de los errores HTTP. El teléfono se registra como seudónimo |
| **D**oS | Sí: el límite de velocidad de Meta | Se clasifica como error transitorio y se reintenta de forma acotada (ADR-004) |
| **E**levation of privilege | Sí: un token con más permisos de los necesarios | Token de usuario de sistema con permisos solo de mensajería y de gestión del número del negocio. Sin permisos de administración de la cuenta de negocio |

### 2.9 Componente: Repositorio (almacén por definir, ADR-005)

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | Sí: acceso directo al almacén fuera de las Lambdas | Acceso solo por roles IAM de las Lambdas y del rol de soporte. Sin credenciales de larga duración |
| **T**ampering | Sí: alterar estados o el número de la dueña | Escrituras condicionales. El número de la dueña solo se cambia desde la Lambda de soporte. Los Eventos de auditoría son solo de inserción (sin actualizar ni borrar en el rol de la aplicación) |
| **R**epudiation | Sí | Eventos de auditoría (ADR-007) y CloudTrail |
| **I**nformation disclosure | Sí: PII de todas las clientas | Cifrado en reposo con KMS (requisito fijo de ADR-005). Filtro por `salon_id` en Agenda. Datos sintéticos hasta la validación legal |
| **D**oS | Bajo | Pago por uso y volumen mínimo |
| **E**levation of privilege | Sí: un rol de Lambda con acceso total al almacén | Permisos por Lambda limitados a las operaciones del puerto. El borrado de datos solo lo tiene el rol de soporte |

### 2.10 Componente: Operaciones de soporte (Lambda + rol de soporte)

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | Sí: alguien se hace pasar por la dueña para cambiar el número (secuestro de cuenta) | El cambio de número exige `identidad_confirmada: true`, que se pone solo después de que el fundador confirma la identidad por otro medio (Inv-AUD-04). El nuevo número no puede ser de otro salón (Inv-SAL-02) |
| **T**ampering | Sí: borrado o reactivación indebidos | Cada operación escribe un Evento de auditoría antes de devolver el resultado. Se avisa por correo (alerta 4) |
| **R**epudiation | Sí | Auditoría con actor (identidad IAM de la sesión con MFA), operación, referencia y fecha. Retención de 1 año (D11-2) |
| **I**nformation disclosure | Sí: el equipo ve PII | MFA obligatorio para asumir el rol (D11-3). Sesión de máximo 1 hora. Cada asunción dispara la alerta 4 |
| **D**oS | Bajo | Invocación manual |
| **E**levation of privilege | Sí: usar el rol para tocar infraestructura | El rol de soporte solo puede invocar la Lambda de soporte y leer el almacén y la DLQ. No modifica IAM, secretos ni Terraform |

### 2.11 Componente: Canal emulado (Frontera E, solo ambiente de prueba)

Rutas `/prueba/canal-emulado/…`, Lambda Canal emulado, adaptador emulado y su almacén (api-contract § 10). Estas rutas no llevan la firma de Meta: quien tenga la clave de prueba puede enviar mensajes **como cualquier número**, también el de la dueña de prueba. Ese es su riesgo principal, y sería grave si las rutas llegaran a existir en producción.

| Threat | ¿Aplica? | Mitigación |
|---|---|---|
| **S**poofing | Sí: con la clave se simula cualquier remitente | En producción las rutas no existen: Terraform solo las crea con `canal_emulado_habilitado = true`, que vale `false` por defecto y es `true` solo en el ambiente de prueba. Una llamada en producción recibe el 404 del API. Segunda barrera: en producción el Procesador, el Emisor y el Vigilante se niegan a arrancar con `CANAL_WHATSAPP=emulado` (api-contract § 10.6). En prueba, la clave `X-Clave-Prueba` se compara en tiempo constante. Sin clave o con clave incorrecta: 401 y no se encola |
| **T**ampering | Bajo | Solo hay números y datos de prueba (§ 6.3). La identidad la sigue dando el número (ADR-006) |
| **R**epudiation | Bajo | Los mensajes emulados llevan el prefijo `emu.` en su `mensaje_id`, lo que los distingue de los reales en registros y auditoría |
| **I**nformation disclosure | Sí: el almacén del canal emulado guarda teléfono y texto | Solo con números y nombres de prueba. El almacén vence a los 7 días. La clave no se registra en ningún log |
| **D**oS | Sí: una prueba mal hecha satura la cola | Límite de 5 peticiones por segundo en las rutas de prueba (429 al superarlo) |
| **E**levation of privilege | Sí: usar la clave para actuar como otro salón | La clave autoriza a usar el canal emulado, no da identidad: el salón se sigue deduciendo del número remitente. El rol de la Lambda solo puede enviar a la cola de prueba, leer su almacén y leer la clave de prueba |

---

## 3. OWASP Top 10 mapeado

TurnoFácil no tiene interfaz web: la superficie es el webhook, la API de Meta y la consola de AWS. Cada categoría se evalúa contra esa superficie.

| OWASP | Aplica al sistema | Control requerido | Status |
|---|---|---|---|
| A01 Broken Access Control | Sí: aislamiento entre salones, comandos solo de la dueña, rol de soporte | `salon_id` deducido del remitente en toda consulta de Agenda. Los comandos se rechazan en silencio si el remitente no es dueña. Roles IAM mínimos por Lambda. Pruebas de aislamiento entre dos salones | Planned |
| A02 Cryptographic Failures | Sí: PII en el almacén, la cola y los registros | TLS 1.2 o superior en el API y hacia Meta. KMS con clave del cliente para la cola, Secrets Manager, el almacén y los registros. Seudónimo HMAC-SHA256 en los registros. Comparación de firma en tiempo constante | Planned |
| A03 Injection | Sí: texto libre de la dueña y la clienta | Intérprete determinista con formato guiado (ADR-008). Validación de longitud y de caracteres en el borde. Acceso al almacén solo con el SDK o con consultas parametrizadas, nunca armando la consulta con texto. Parámetros de plantilla sin saltos de línea | Planned |
| A04 Insecure Design | Sí | Este threat model. Reglas de identidad por número (ADR-006). Riesgo aceptado del teléfono de la dueña documentado (OQ-1) | Done |
| A05 Security Misconfiguration | Sí: Terraform define toda la cuenta | Escaneo de Terraform con checkov o tfsec en cada cambio. Estado de Terraform en un bucket cifrado, con versionado, bloqueo y sin acceso público. Bloqueo de acceso público de S3 a nivel de cuenta. Logs del API activados | Planned |
| A06 Vulnerable Components | Sí: dependencias npm | Lockfile versionado, `npm ci` y `npm audit` en el pipeline (falla con severidad alta). Actualizaciones automáticas de dependencias. Runtime de Node.js con soporte vigente en Lambda | Planned |
| A07 Identification & Auth Failures | Sí: identidad por número, acceso del equipo | Firma de Meta en cada mensaje. MFA obligatorio para personas en AWS (D11-3). Sin usuarios IAM con llaves de acceso para personas. El cambio de número requiere identidad confirmada | Planned |
| A08 Software & Data Integrity Failures | Sí: código desplegado y estado de Terraform | Despliegue solo desde el pipeline con plan revisado. Paquetes de Lambda generados en CI desde el lockfile. Idempotencia por identificador de mensaje frente a reentregas. Firma de código de Lambda: opcional, se revisa después del piloto | Planned |
| A09 Logging & Monitoring Failures | Sí | Eventos de § 7 con retención D11-2 y alertas por correo. CloudTrail activado en todas las regiones. Prueba de que no hay PII en los registros (RFC § 6.2) | Planned |
| A10 SSRF | Baja: el sistema no descarga URLs que vengan en los mensajes | URL base de Meta fija. Los mensajes de audio, imagen o sticker no se descargan, se tratan como no entendidos (api-contract). Si en el futuro se descargan medios, solo desde el dominio de Meta | Planned |

---

## 4. Auth / Authz

### 4.1 Authentication

| Actor | Provider | Flow | MFA | Sesión |
|---|---|---|---|---|
| Meta (webhook) | Meta | HMAC-SHA256 `X-Hub-Signature-256` sobre el cuerpo crudo; `hub.verify_token` en la suscripción | No aplica (máquina a máquina) | Sin sesión: se valida cada mensaje |
| Dueña | WhatsApp (número registrado en Salón) | El número `from` del mensaje firmado se compara con el número del salón (ADR-006) | No: se descarta pedir código o contraseña (ADR-006). Lo que tenga el teléfono de la dueña (bloqueo de pantalla, verificación en dos pasos de WhatsApp) se recomienda en el alta, pero el sistema no lo controla | Sin sesión. La revocación se hace con el cambio de número por soporte |
| Clienta | WhatsApp (su número) | El número `from` del mensaje firmado | No | Sin sesión |
| Equipo (fundador y soporte) | AWS IAM Identity Center o usuarios federados de la cuenta del cliente | Inicio de sesión en AWS y asunción explícita del rol `soporte` | **Obligatorio** (D11-3): condición `aws:MultiFactorAuthPresent = true` en la política de confianza del rol y en el acceso de personas. Aplicación de códigos o llave física | Máximo 1 hora en el rol de soporte. Revocación: quitar al usuario y revocar las sesiones activas del rol |
| Pipeline de despliegue | AWS IAM | Rol de despliegue con federación OIDC desde el proveedor de CI, sin llaves de larga duración | No aplica (máquina) | Credenciales temporales por ejecución |

### 4.2 Authorization

- **Modelo:** RBAC para personas y roles de AWS, más ABAC por `salon_id` en el dominio. El atributo sale siempre del remitente.
- **Enforcement point:** el Procesador, al clasificar al remitente y fijar `salon_id`, y el Repositorio, que exige `salon_id` en toda operación de Agenda. En AWS: políticas IAM y políticas de recurso de la cola, los secretos y las claves KMS.

**Matriz de permisos (negocio):**

| Acción | Dueña de su salón | Dueña de otro salón | Clienta | Número desconocido | Soporte |
|---|---|---|---|---|---|
| Registrar cita | ✅ | ❌ (sin respuesta) | ❌ (sin respuesta) | ❌ (sin respuesta) | ❌ |
| Cancelar cita | ✅ solo su salón | ❌ | ❌ | ❌ | ❌ |
| Pedir la vista | ✅ solo su salón | ❌ | ❌ | ❌ | ❌ |
| Confirmar o cancelar por recordatorio | ❌ | ❌ | ✅ solo sus citas | ❌ | ❌ |
| Darse de baja | — | — | ✅ (vale en todos los salones) | ✅ (queda como baja de ese número) | ❌ |
| Reactivar clienta | ❌ | ❌ | ❌ | ❌ | ✅ con auditoría |
| Cambiar número de la dueña | ❌ | ❌ | ❌ | ❌ | ✅ con identidad confirmada y auditoría |
| Borrar datos de una clienta | ❌ (lo pide a soporte, RFC A8) | ❌ | ❌ | ❌ | ✅ con auditoría |

**Matriz de permisos (roles AWS):**

| Rol | Permisos | Prohibido |
|---|---|---|
| `receptor` | Enviar a la cola FIFO; leer el secreto de la aplicación y el token de verificación | Leer el almacén, leer el token de Meta |
| `procesador` | Recibir de la cola; leer y escribir el almacén por el puerto; crear y borrar schedules en su grupo; leer el token de Meta y la clave HMAC | Borrar datos de clientas, cambiar el número de la dueña |
| `emisor` / `vigilante` | Leer y actualizar recordatorios y citas; leer contactos; leer el token de Meta y la clave HMAC | Crear schedules (vigilante), escribir citas nuevas |
| `cierre` | Actualizar el estado de la cita | Leer secretos |
| `soporte-lambda` | Operaciones de soporte sobre el almacén; insertar Eventos de auditoría; leer la clave HMAC | Leer el token de Meta |
| `soporte` (personas) | Asumir solo con MFA; invocar `soporte-lambda`; leer el almacén y la DLQ | IAM, Secrets Manager (escritura), KMS (administración), Terraform |
| `despliegue` | Aplicar Terraform | Leer los valores de los secretos |

---

## 5. Secrets management

- **Vault:** AWS Secrets Manager, cifrado con una clave KMS del cliente. La política de cada secreto restringe la lectura a los roles de § 4.2.

| Secreto | Usado por | Rotación (D11-4) | Cómo se rota |
|---|---|---|---|
| Token de Meta (usuario de sistema) | Procesador, Emisor, Vigilante | Cada 90 días y ante incidente | El fundador genera un token nuevo en el administrador de negocio de Meta, lo carga como versión nueva del secreto, verifica un envío de prueba y revoca el anterior. Recordatorio por alarma a los 80 días |
| Secreto de la aplicación de Meta | Receptor | Cada 180 días y ante incidente | Se restablece en el panel de la aplicación de Meta y se actualiza el secreto de inmediato. Las Lambdas releen el secreto con caché de 5 minutos como máximo, lo que deja una ventana corta de rechazos (Meta reintenta la entrega) |
| Token de verificación del webhook | Receptor | Cada 180 días, junto con el anterior, y ante incidente | Nuevo valor aleatorio en el secreto y en la suscripción del webhook |
| Clave de prueba del canal emulado (`turnofacil/prueba/clave-canal-emulado`) | Lambda Canal emulado, **solo en el ambiente de prueba** | En cada despliegue nuevo del ambiente de prueba y ante filtración (api-contract § 10.6) | Valor aleatorio de al menos 32 bytes, creado con el ambiente de prueba. No existe en producción |
| Clave de seudonimización HMAC | Procesador, Emisor, Vigilante, Soporte | **Solo ante incidente**, porque rotarla rompe la correlación de bajas y auditoría por teléfono | Se crea una clave nueva y la anterior se conserva marcada como `anterior`, solo para consultas de soporte durante 1 año. Se registra la fecha de corte |

- **Procedimiento ante incidente (los tres tipos):** (1) apagar el interruptor general si el token de Meta pudo filtrarse; (2) rotar el secreto afectado; (3) revisar en CloudTrail quién leyó el secreto en los últimos 90 días; (4) registrar un Evento de auditoría del incidente; (5) evaluar si hay que notificar según la Ley 1581 (§ 8.1). Responsable: el fundador.
- **Scopes:** un secreto por propósito y lectura solo para los roles que lo usan (§ 4.2). Ningún secreto en variables de entorno, en el estado de Terraform ni en el código: Terraform crea el secreto vacío y el valor se carga fuera de Terraform.
- **Detección de fugas:** gitleaks en cada cambio del repositorio y escaneo de secretos del proveedor de código, si está disponible. Alarma si un principal no autorizado llama a `GetSecretValue` (§ 7).

---

## 6. Controles por capa

### 6.1 Edge (API del webhook)

- **WAF:** no se usa en el piloto (D11-6). La firma de Meta descarta el tráfico ajeno con un costo mínimo y el volumen es bajo (5 salones). Se agrega WAF con reglas administradas si la métrica `firma_invalida` supera 100 rechazos por hora de forma sostenida.
- **Rate limiting:** limitación de tráfico en la etapa del API: 20 solicitudes por segundo con ráfagas de 50 (asunción sin evidencia; el tráfico esperado es de pocas solicitudes por minuto). Concurrencia reservada en la Lambda del Receptor.
- **Bot detection:** no. La firma cumple esa función.
- Solo HTTPS, sin endpoint en HTTP plano. En producción solo se exponen las rutas `GET` y `POST` del webhook. Las rutas `/prueba/canal-emulado/…` existen únicamente en el ambiente de prueba (§ 2.11). La revisión del plan de Terraform de producción verifica que `canal_emulado_habilitado` sea `false` y que esas rutas no aparezcan.

### 6.2 Application

- **Validación en el borde:** firma antes de interpretar. Esquema del cuerpo de Meta validado (campos esperados, tipos). Texto truncado a 4.096 caracteres. Teléfono según Inv-CIT-02. Nombre y servicio con un máximo de 60 caracteres, sin saltos de línea ni caracteres de control (asunción sin evidencia sobre el largo).
- **Codificación de salida:** los parámetros de plantilla y los textos de la vista se envían como texto plano, sin saltos de línea dentro de un parámetro. No hay HTML, así que XSS, CSRF y cabeceras de navegador (CSP, X-Frame-Options) no aplican: el sistema no tiene interfaz web (PRD § 4, fuera de alcance).
- **Abuso por remitente:** si un número que no es dueña envía más de 30 mensajes en 10 minutos (asunción sin evidencia), los siguientes se descartan sin procesar hasta que pase la ventana y se publica la métrica `remitente_limitado`. La dueña registrada no tiene este límite.
- **Aislamiento entre salones:** pruebas obligatorias con dos salones: la dueña A no puede cancelar ni ver citas de B, aunque escriba el nombre exacto de una clienta de B.
- **Idempotencia:** por identificador de mensaje de Meta (ADR-009).
- **Errores:** no se devuelven detalles internos ni a Meta ni por WhatsApp.

### 6.3 Data

- **Cifrado en reposo:** AES-256 con claves KMS administradas por el cliente para el almacén, la cola FIFO y la DLQ, Secrets Manager, los grupos de CloudWatch Logs, el bucket de CloudTrail y el estado de Terraform. Rotación anual automática de las claves KMS.
- **Cifrado en tránsito:** TLS 1.2 o superior en el API (política de seguridad del dominio) y hacia Meta.
- **Almacén:** la tecnología está pendiente (ADR-005). Cualquier elección debe cumplir cifrado con KMS, acceso solo por IAM, sin endpoint público con usuario y contraseña, y borrado por clienta. Hasta la validación legal solo se usan datos sintéticos.
- **Minimización:** los registros, los eventos programados y la auditoría usan identificadores opacos o seudónimos (RB-13). La DLQ es la única copia temporal de mensajes completos.
- **Borrado:** la operación de soporte vacía nombre y teléfono en las citas del salón (domain-model § 2.3) y se audita.

### 6.4 Infrastructure

- **Red:** no hay VPC ni servidores (RFC § 2.2.1). La superficie es el API del webhook. Los demás servicios solo son accesibles por IAM.
- **IAM:** un rol por Lambda, sin comodines de recurso donde el servicio permite acotarlos. Sin llaves de acceso de larga duración para personas. MFA obligatorio (D11-3). Usuario raíz con MFA y sin llaves de acceso.
- **IaC:** checkov o tfsec en cada cambio, con bloqueo por hallazgos altos. Plan de Terraform revisado antes de aplicar. Región como variable sin valor por defecto (ADR-005).
- **Auditoría de cuenta:** CloudTrail activado en todas las regiones, con validación de integridad de archivos.
- **Paquetes:** las Lambdas no usan contenedores. Los paquetes zip se construyen en CI desde el lockfile.

---

## 7. Logging de seguridad

Retención según D11-2: **1 año** para la auditoría del equipo y del rol de soporte; **90 días** para el resto. Ningún evento lleva nombre ni teléfono en claro. Los teléfonos van como seudónimo HMAC (ADR-007).

| Evento | Fuente | Datos | Retention | Alerting |
|---|---|---|---|---|
| Asunción del rol de soporte | CloudTrail (`AssumeRole`) | Identidad, MFA presente, IP, fecha | 1 año | **Siempre:** correo al fundador (alerta 4 del PRD § 6) |
| Operación de soporte (cambio de número, reactivación, borrado, acceso) | Evento de auditoría + registro de `soporte-lambda` | Actor, operación, referencia (salón o seudónimo), resultado, fecha | 1 año | Siempre: correo al fundador |
| Intento de cambio de número sin identidad confirmada | `soporte-lambda` (`identidad_no_confirmada`) | Actor, `salon_id`, fecha | 1 año | Siempre |
| Inicio de sesión en la consola de AWS sin MFA o fallido | CloudTrail (`ConsoleLogin`) | Usuario, IP, resultado | 1 año | Siempre si no hay MFA; más de 3 fallos en 10 minutos |
| Cambios de IAM, KMS, políticas de la cola o de los secretos | CloudTrail | Actor, recurso, cambio | 1 año | Siempre fuera de una ejecución del pipeline |
| Lectura de secretos | CloudTrail (`GetSecretValue`) | Principal, secreto, fecha | 1 año | Si el principal no es uno de los roles de § 4.2 |
| Firma inválida o ausente en el webhook | Receptor (`firma_invalida`) | IP de origen, fecha, sin cuerpo | 90 días | Más de 100 por hora (revisar WAF, D11-6) |
| Verificación de suscripción fallida | Receptor | IP, fecha | 90 días | Cualquier caso fuera de una rotación |
| Comando de un remitente que no es dueña | Procesador | Seudónimo del remitente, tipo de comando, fecha | 90 días | Más de 10 por día del mismo seudónimo |
| Remitente limitado por abuso | Procesador (`remitente_limitado`) | Seudónimo, conteo | 90 días | Siempre (correo) |
| Mensajes en la DLQ | CloudWatch | Cantidad | 90 días | Más de 0 (ya definido en el RFC § 2.1.4) |
| Limitación de tráfico del API (429) | API | Conteo | 90 días | Más de 50 en 5 minutos |
| Volumen de envíos anómalo | Emisor y Procesador | Mensajes enviados por hora | 90 días | Más del doble del máximo esperado (costo y posible abuso del token) |
| Aparición de PII en registros | Filtro de métricas sobre el patrón de teléfono colombiano (`3\d{9}`) en los grupos de registros | Grupo, conteo | 90 días | Más de 0: es un defecto de ADR-007 |

---

## 8. Compliance

### 8.1 Ley 1581 de 2012 (Habeas Data, Colombia) · aplica (D11-1)

Todo este apartado es **asunción sin evidencia** hasta la validación con el abogado, que bloquea el lanzamiento (PRD § 7). El sistema se construye para no impedir ninguna de estas obligaciones.

| Obligación (resumen) | Cómo la soporta el sistema | Pendiente para el abogado |
|---|---|---|
| Roles: responsable y encargado del tratamiento | Supuesto: el salón (la dueña) es responsable de los datos de sus clientas y TurnoFácil es encargado. Meta y AWS son subencargados | Confirmar los roles y el contrato de transmisión entre TurnoFácil y cada salón |
| Autorización previa de la titular | La dueña registra a la clienta. El sistema no recoge la autorización. El primer recordatorio identifica al salón y ofrece la baja con STOP | Cómo y quién obtiene la autorización de la clienta antes del primer mensaje |
| Finalidad y minimización | Solo se guardan nombre, teléfono, servicio e inicio. Los registros no tienen PII (ADR-007) | Validar la finalidad declarada |
| Derechos de la titular (conocer, actualizar, rectificar, suprimir, revocar) | Revocar la autorización para mensajes = baja por chat (US-02·2.5). Suprimir = borrado por soporte (RF-11). Conocer y rectificar: a pedido, por soporte | Canal formal para reclamos y plazos de respuesta |
| Seguridad de la información | §§ 4 a 7 de este documento | — |
| Transferencia o transmisión internacional | La región de AWS está abierta (ADR-005). AWS no tiene región en Colombia y Meta procesa fuera del país | Si se permite almacenar fuera de Colombia y con qué condiciones. Esto decide el ADR del almacén y la región |
| Retención | Los datos de clientas no tienen plazo hasta la validación (RFC A4). Los registros técnicos y de auditoría no tienen PII (D11-2) | Plazo de conservación de citas y contactos |
| Reporte de incidentes | Procedimiento de § 5 con evaluación de notificación | Obligación y plazo de reporte a la autoridad (SIC) |
| Política de tratamiento y registro de bases | Fuera del sistema | Si TurnoFácil debe publicar una política e inscribir la base |

### 8.2 GDPR · no aplica

El piloto opera solo con salones y clientas de Medellín (PRD § 4: otros segmentos fuera de alcance). No se ofrecen servicios a personas en la Unión Europea ni se las monitorea. Se revisa si el producto sale de Colombia.

### 8.3 PCI DSS · no aplica

El sistema no recibe, procesa ni guarda datos de tarjetas. El cobro de suscripción y el de anticipo están fuera del alcance (PRD § 4). Si se agrega cobro, debe hacerse con un procesador externo que tokenice y mantenga a TurnoFácil fuera del alcance de PCI.

### 8.4 SOC2 · no aplica

Los clientes son peluquerías de barrio que no exigen auditorías SOC2 y no existe contrato que la pida. La auditoría del equipo (ADR-007) y CloudTrail cubren la trazabilidad que el piloto necesita.

---

## 9. Open questions

| # | Pregunta / riesgo | Impacto | Responsable | Mitigación actual |
|---|---|---|---|---|
| OQ-1 | **Teléfono de la dueña robado, perdido o con SIM clonada.** Quien lo tenga registra, cancela y ve las citas del salón (riesgo aceptado en ADR-006) | Exposición de los datos de un salón y cancelaciones falsas | Fundador | Cambio de número por soporte con identidad confirmada. En el alta, recomendar a la dueña la verificación en dos pasos de WhatsApp y el bloqueo de pantalla. Se revisa si ocurre un caso en el piloto |
| OQ-2 | Mecanismo de autorización previa de la clienta (Ley 1581) | Bloquea el lanzamiento | Fundador con el abogado | El texto del recordatorio identifica al salón y ofrece STOP |
| OQ-3 | Región y almacén: transmisión internacional de datos | Bloquea el primer salón con datos reales (ADR-005) | Fundador con el abogado | Datos sintéticos hasta la validación |
| OQ-4 | Plazo de retención de citas y contactos | Define la purga automática | Abogado | Sin purga. Borrado a pedido |
| OQ-5 | Umbrales de abuso (20 solicitudes por segundo en el API, 30 mensajes cada 10 minutos por remitente) | Falsos bloqueos o abuso no detectado | Equipo de ingeniería | Valores provisionales sin evidencia. Se ajustan con las métricas de las primeras 2 semanas |
| OQ-6 | Concentración del soporte en una persona (el fundador): MFA, rotaciones y confirmación de identidad dependen de él (PRD § 7) | Si el fundador no está, no hay rotación ni cambio de número | Fundador | Procedimientos escritos (§ 5). Designar un respaldo antes de ampliar a más de 5 salones |
| OQ-7 | Canal de alertas provisional por correo (RFC A10) | Una alerta de seguridad puede leerse tarde | Fundador | Correo del fundador confirmado al desplegar |
| OQ-8 | Canal emulado habilitado por error en producción: quien tenga la clave de prueba podría actuar como cualquier dueña sin firma de Meta | Suplantación de dueñas y exposición de datos de todos los salones | Equipo de ingeniería | Rutas creadas solo con `canal_emulado_habilitado = true` (por defecto `false`). Las Lambdas de producción no arrancan con el adaptador emulado. El plan de Terraform de producción se revisa (§ 6.1). La clave de prueba es distinta en cada despliegue del ambiente de prueba |
