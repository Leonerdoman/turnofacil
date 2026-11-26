# Events · TurnoFácil

**Date:** 2026-11-24
**Versión del contrato:** 1.0.0
**Domain model base:** docs/domain-model.md § 4 (eventos de dominio)
**Contrato API:** docs/api-contract.md (schemas compartidos en § 6)

---

## Resumen para decidir

- Los 21 eventos del modelo de dominio quedan definidos con quién los produce, quién los consume, sus datos y su clave contra duplicados.
- **Transporte:** los eventos se publican **dentro del mismo proceso**, como mensajes tipados entre módulos. No hay bus de eventos. Cada evento se guarda en el **historial de la cita** (o del salón, cuando no hay cita), y con eso se reconstruye cada cita como pide el RFC (RF-12). `[DECISIÓN ETAPA 10]`
- Solo salen del proceso las piezas que ya existen en el RFC: los eventos programados (recordatorio y cierre, api-contract § 4.3), los envíos por el canal y las métricas que alimentan las alertas.
- Ningún evento lleva nombre ni teléfono en claro. Cuando hace falta el teléfono, va su seudónimo (RB-13, ADR-007).

**Marcas:** `[DECISIÓN ETAPA 10]` = decisión tomada con el fundador · `[DECISIÓN TÉCNICA ETAPA 10]` = decisión técnica interna, informada al fundador.

---

## 1. Convenciones

### 1.1 Sobre común

Todo evento tiene esta forma:

```json
{
  "evento_id": "01JEVT...",
  "tipo": "CitaRegistrada",
  "version": 1,
  "ocurrido_en": "2026-11-27T10:00:03-05:00",
  "salon_id": "01JSALON...",
  "cita_id": "01JCITA...",
  "causado_por": "wamid.HBgM...",
  "clave_idempotencia": "CitaRegistrada:wamid.HBgM...",
  "datos": { }
}
```

| Campo | Regla |
|---|---|
| `evento_id` | ULID. Ordena los eventos de una misma cita |
| `tipo` | Nombre exacto de domain-model § 4 |
| `version` | Versión del esquema de `datos`. Política en api-contract § 7 |
| `salon_id` / `cita_id` | `null` cuando no aplica (por ejemplo, `ClientaDadaDeBaja` no es de un salón) |
| `causado_por` | `MensajeId` del mensaje que lo originó, nombre del evento programado (`rec-…`, `cierre-…`) o `evento_auditoria_id` |
| `clave_idempotencia` | Única. Si ya existe un evento con esa clave, el segundo no se guarda ni se publica |
| `datos` | Solo identificadores opacos, estados, tipos, cantidades y `telefono_seudonimo` |

### 1.2 Entrega

- **Transporte:** publicación en el mismo proceso, en la misma operación que cambia el estado. Si guardar el estado falla, el evento no existe. `[DECISIÓN ETAPA 10]`
- **Persistencia:** `Repositorio.agregarEvento` (api-contract § 4.2), solo agregar, nunca editar.
- **Orden:** el de los `evento_id` dentro de la cita. Entre teléfonos distintos no se garantiza orden, porque no hace falta (ADR-009).
- **Consumidores "Métrica" o "Alerta":** el consumidor publica una métrica de CloudWatch con dimensiones opacas (`salon_id`, `tipo`). Las alarmas están en el diseño de observabilidad (RFC § 2.2.3).
- **Migración futura a un bus:** el sobre y los `datos` no cambian. Solo cambia quién los transporta.

---

## 2. Catálogo de eventos

### 2.1 Agenda

| Evento | Productor | Consumidores | `datos` | Clave de idempotencia |
|---|---|---|---|---|
| **CitaRegistrada** | Cita.registrar (Procesador) | Recordatorios: crea 0 a 2 recordatorios y sus eventos programados, más el cierre · Respuesta `R-01`/`R-01b` · Métrica de latencia | `inicio`, `clienta_dada_de_baja: boolean`, `recordatorios_programados: TipoRecordatorio[]` | `CitaRegistrada:<mensaje_id>` |
| **RegistroRechazado** | Cita.registrar | Respuesta `R-02` a `R-05` · Métrica de rechazos por motivo | `motivo: MotivoRechazo`, `dato_faltante?: string` | `RegistroRechazado:<mensaje_id>` |
| **CitaCanceladaPorLaDueña** | Cita.cancelarPorDueña | Recordatorios: pasa los pendientes a `omitido` y borra sus eventos programados · Respuesta `R-08` · Cálculo del 70% (la excluye) | `estado_anterior: EstadoCita` | `CitaCanceladaPorLaDueña:<mensaje_id>` |
| **CancelacionNoEncontrada** | Procesador (comando cancelar) | Respuesta `R-09` o `R-09b` | `ambigua: boolean` | `CancelacionNoEncontrada:<mensaje_id>` |
| **CitaConfirmada** | Cita.confirmarPorClienta, desde `guardada` | Vista · Cálculo del 70% | `respuesta_id: MensajeId` | `CitaConfirmada:<respuesta_id>` |
| **CitaReconfirmada** | Cita.confirmarPorClienta, desde `cancelada_clienta` | Aviso a la dueña (`reconfirmacion`) · Cálculo del 70% | `respuesta_id` | `CitaReconfirmada:<respuesta_id>` |
| **CitaCanceladaPorLaClienta** | Cita.cancelarPorClienta, desde `guardada` o `confirmada` | Aviso a la dueña (`cancelacion`) · Recordatorios: el recordatorio 2 quedará `omitido` al verificarse antes de enviar | `respuesta_id`, `estado_anterior` | `CitaCanceladaPorLaClienta:<respuesta_id>` |
| **CitaCerrada** | Cita.cerrar (Lambda de cierre, evento `cierre-<cita_id>`) | Cálculo del 70% · Marca las respuestas posteriores como no aplicadas | `estado_final: EstadoCita` | `CitaCerrada:<cita_id>` |
| **CitaQuedoSinConfirmar** | Cita.cerrar, cuando el estado era `guardada` | Cálculo del 70% (no cerrada) | `motivo: sin_respuesta \| baja \| no_entregable` | `CitaQuedoSinConfirmar:<cita_id>` |
| **VistaEntregada** | Procesador (comando vista) | Medición "veces que pide la vista" (PRD § 7) | `dia`, `cantidad_confirmadas`, `cantidad_sin_confirmar` | `VistaEntregada:<mensaje_id>` |

**Motivo de `CitaQuedoSinConfirmar`:** `baja` si la clienta estaba dada de baja y no salió ningún recordatorio; `no_entregable` si todos los recordatorios terminaron `no_entregable`, `no_entregado` o `incumplido`; `sin_respuesta` en los demás casos. `[DECISIÓN TÉCNICA ETAPA 10]`

### 2.2 Recordatorios y respuestas

| Evento | Productor | Consumidores | `datos` | Clave de idempotencia |
|---|---|---|---|---|
| **RecordatorioEnviado** | Emisor o Vigilante, tras ganar `reservarEnvio` y recibir aceptación del canal | Métrica de retraso · KPI 1 (respuesta) · Cálculo del 70% (la cita entra) | `tipo: TipoRecordatorio`, `retraso_s`, `via: emisor \| vigilante`, `intentos`, `tarde: boolean` | `RecordatorioEnviado:<cita_id>:<tipo>` |
| **RecordatorioOmitido** | Emisor o Vigilante, en la verificación previa al envío | Historial de la cita (RF-12) | `tipo`, `motivo: cita_cancelada \| clienta_dada_de_baja \| envio_apagado` | `RecordatorioOmitido:<cita_id>:<tipo>` |
| **RecordatorioIncumplido** | Emisor o Vigilante, al pasar 300 s sin éxito en el recordatorio 2 | Alerta 1 del PRD § 6 | `tipo`, `intentos`, `ultimo_error: string` | `RecordatorioIncumplido:<cita_id>:<tipo>` |
| **MensajeNoEntregado** | Emisor (error permanente) o Procesador (estado de entrega `fallido`) | Alerta 2 del PRD § 6 | `tipo_mensaje: TipoMensaje`, `mensaje_id?`, `codigo_proveedor`, `origen: rechazo_envio \| estado_entrega` | `MensajeNoEntregado:<mensaje_id o cita_id:tipo>` |
| **RespuestaNoEntendida** | Respuesta de clienta.clasificar | Medición del piloto. Sin cambio de estado | `respuesta_id`, `tipo_contenido: texto \| audio \| imagen \| otro` | `RespuestaNoEntendida:<respuesta_id>` |
| **ClientaDadaDeBaja** | Contacto de clienta.darDeBaja | Mensaje de baja `R-20` · Recordatorios: los pendientes de todos los salones quedarán `omitido_por_baja` al verificarse | `telefono_seudonimo` | `ClientaDadaDeBaja:<respuesta_id>` |
| **AvisoDeCancelacionEnviado** | Aviso a la dueña.avisar, tras `CitaCanceladaPorLaClienta` o `CitaReconfirmada` | Medición de utilidad del aviso (PRD § 7) | `tipo: TipoAviso`, `secuencia`, `mensaje_id` | `AvisoDeCancelacionEnviado:<cita_id>:<secuencia>` |

- **`envio_apagado`** cubre el interruptor por salón y el general del rollout (RFC § 6.3). No es un motivo nuevo de negocio: el recordatorio queda `omitido` con ese motivo para poder reconstruir la cita. `[DECISIÓN TÉCNICA ETAPA 10]`
- **`ClientaDadaDeBaja`** no lleva `salon_id` ni `cita_id`: la baja es del teléfono (RB-07). Se guarda en el historial del Contacto de clienta.

### 2.3 Soporte y auditoría

| Evento | Productor | Consumidores | `datos` | Clave de idempotencia |
|---|---|---|---|---|
| **NumeroDeDueñaCambiado** | Lambda Soporte, `cambiar_numero` | Identificación de remitentes (Procesador lee el nuevo número) | `evento_auditoria_id` | `NumeroDeDueñaCambiado:<evento_auditoria_id>` |
| **ClientaReactivada** | Lambda Soporte, `reactivar_clienta` | Recordatorios futuros | `telefono_seudonimo`, `evento_auditoria_id` | `ClientaReactivada:<evento_auditoria_id>` |
| **DatosDeClientaBorrados** | Lambda Soporte, `borrar_datos_clienta` | Agenda: vacía nombre y teléfono en las citas del salón | `telefono_seudonimo`, `citas_afectadas`, `evento_auditoria_id` | `DatosDeClientaBorrados:<evento_auditoria_id>` |
| **AccesoDelEquipoRegistrado** | Asunción del rol de soporte (detectada por CloudTrail y enrutada a la Lambda Soporte) | Alerta 4 del PRD § 6 | `operador`, `motivo` | `AccesoDelEquipoRegistrado:<id de la sesión del rol>` |

Ni el número anterior ni el nuevo de la dueña van en `NumeroDeDueñaCambiado`. Quedan en el Salón y en el evento de auditoría como seudónimo (Inv-AUD-03).

---

## 3. Cobertura frente al modelo de dominio

| Evento de domain-model § 4 | Sección |
|---|---|
| CitaRegistrada, RegistroRechazado, CitaCanceladaPorLaDueña, CancelacionNoEncontrada, CitaConfirmada, CitaReconfirmada, CitaCanceladaPorLaClienta, CitaCerrada, CitaQuedoSinConfirmar, VistaEntregada | § 2.1 |
| RecordatorioEnviado, RecordatorioOmitido, RecordatorioIncumplido, MensajeNoEntregado, RespuestaNoEntendida, ClientaDadaDeBaja, AvisoDeCancelacionEnviado | § 2.2 |
| NumeroDeDueñaCambiado, ClientaReactivada, DatosDeClientaBorrados, AccesoDelEquipoRegistrado | § 2.3 |

21 de 21 cubiertos, sin eventos nuevos. Los eventos técnicos (latido del vigilante, mensaje en la DLQ) quedan en el diseño de observabilidad, como indica domain-model § 4.
