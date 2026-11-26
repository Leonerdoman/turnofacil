# Mapa de flujos — TurnoFácil

- **Fuente:** PRD aprobado, `docs/PRD.md`. No hay repositorio de código ni pantallas.
- **Modo de evidencia:** sin evidencia de repositorio. Cada elemento cita su sección del PRD en los diagramas y en `user-flows.md`; no hay enlaces a líneas de código.
- **Fecha:** 19/11/2026
- **Herramienta:** archify (diagramas HTML interactivos e independientes, con tema claro y oscuro y exportación a PNG y SVG)
- **Flujos en texto:** [`user-flows.md`](user-flows.md)

## Diagramas

| # | Tipo | Alcance | Archivo | Validación automática | Revisión en navegador |
|---|------|---------|---------|-----------------------|-----------------------|
| 1a | Flujo de usuario | La dueña registra, cancela o pide la vista por el chat | [`workflow-duena-chat/flujo-duena-chat.html`](workflow-duena-chat/flujo-duena-chat.html) | ✅ pasó | ✅ pasó |
| 1b | Flujo de usuario | La clienta recibe recordatorios y responde | [`workflow-clienta-recordatorios/flujo-clienta-recordatorios.html`](workflow-clienta-recordatorios/flujo-clienta-recordatorios.html) | ✅ pasó | ✅ pasó |
| 2 | Ciclo de vida | Estados de la cita (sin baja y sin estados de resultado) | [`lifecycle-cita/ciclo-de-vida-cita.html`](lifecycle-cita/ciclo-de-vida-cita.html) | ✅ pasó | ✅ pasó, con 2 cruces de líneas resueltos de forma automática; conviene mirarlo |
| 2b | Ciclo de vida | Condición de la clienta por teléfono: activa o dada de baja | [`lifecycle-condicion-clienta/condicion-clienta.html`](lifecycle-condicion-clienta/condicion-clienta.html) | ✅ pasó | ✅ pasó |
| 3A | Secuencia | Registro → recordatorios → cancelación de la clienta → aviso a la dueña | [`sequence-cancelacion-clienta/secuencia-cancelacion-clienta.html`](sequence-cancelacion-clienta/secuencia-cancelacion-clienta.html) | ✅ pasó | ✅ pasó |
| 3B | Secuencia | Baja de la clienta con "no más" | [`sequence-baja-clienta/secuencia-baja-clienta.html`](sequence-baja-clienta/secuencia-baja-clienta.html) | ✅ pasó | ✅ pasó |

"Validación automática" y "revisión en navegador" son comprobaciones automáticas de archify. Nadie revisó los diagramas visualmente.

## Ajustes pedidos por el usuario

- La baja no es un estado de la cita: es una condición de la clienta, por teléfono, y está en el diagrama 2b.
- No se incluyen estados de resultado ("llegó", "no llegó"): se miden en el piloto, no en el producto.
- No se asume ninguna tecnología: los participantes son la dueña, TurnoFácil, WhatsApp (el canal que nombra el PRD) y la clienta.

## Decisiones del diagrama (proponer al PRD)

1. Para cancelar, la dueña indica el nombre de la clienta y el día y la hora.
2. Si la cita no existe, se le avisa a la dueña que no se encontró.
3. La dueña puede cancelar cualquier cita activa, también una confirmada o ya cancelada por la clienta (pasa a cancelada por la dueña).
4. La clienta puede cambiar su respuesta y vale la última respuesta válida.
5. Un mensaje no entendido no cambia la última respuesta válida; "sin confirmar" aplica solo mientras no haya ninguna respuesta válida.
6. Los rechazos del registro se revisan sin orden fijo.
7. Al llegar la hora, Confirmada y Cancelada por la clienta quedan finales; una respuesta posterior no cambia el estado.
8. El aviso cuando una cita cancelada vuelve a confirmarse es parte del aviso de cancelación y se corta con él.
9. Una cita confirmada sigue confirmada si la clienta se da de baja después.

## Pendientes ([PENDIENTE])

| Pendiente | Origen | Diagramas |
|-----------|--------|-----------|
| Hora del recordatorio 1 | PRD US-02 | 1b, 3A |
| Si el recordatorio 2 sale cuando la clienta ya confirmó o canceló | PRD US-02 | 1b, 3A |
| Contenido y anticipación mínima del aviso de cancelación | PRD US-04 | 1b, 3A |
| Qué pasa si la dueña cambia de número | PRD §6 | 1a |
| Lista final de palabras de baja (validación legal) | PRD §6 | 2b, 3B |
| Cómo vuelve una clienta de "dada de baja" a "activa" | Usuario: queda pendiente | 2b, 3B |
| Si la dueña recibe un mensaje que confirma su cancelación | Surgió al mapear | 1a |

## Skills sugeridas para seguir

- **tech-emergentes-wireframe-ux-builder:** usar `user-flows.md` como entrada para bocetos de las conversaciones del chat.
- **tech-emergentes-ui-builder:** PRD + `user-flows.md` como contexto, si más adelante hay alguna interfaz.
