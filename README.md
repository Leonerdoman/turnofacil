# TurnoFácil

reservas de turnos por WhatsApp para peluquerías de barrio

## Dónde está funcionando

La aplicación está publicada en <https://putbwo8xo8.execute-api.us-east-2.amazonaws.com>.

## Historias

| Historia | Qué hace | Estado |
|---|---|---|
| H1 | Canal de WhatsApp emulado para el piloto de prueba | Funcionando |
| H2 | Registrar una cita por chat | Pendiente |
| H3 | Rechazar un registro incompleto o inválido | Pendiente |
| H4 | Aclarar si la hora es de mañana o de noche | Pendiente |
| H5 | Solo la dueña da órdenes al chat | Pendiente |
| H6 | Cancelar una cita por chat | Pendiente |
| H7 | Pedir la vista de confirmadas y sin confirmar | Pendiente |
| H8 | Enviar los dos recordatorios a la clienta | Pendiente |
| H9 | La clienta confirma o cancela respondiendo | Pendiente |
| H10 | La clienta se da de baja | Pendiente |
| H11 | Avisar a la dueña cuando una clienta cancela | Pendiente |
| H12 | Operaciones de soporte del equipo | Pendiente |

## Qué hay en este repositorio

- `.discovery/`: investigación del problema y de la solución.
- `docs/`: documentos del recorrido: PRD, flujos, RFC, decisiones, dominio, contratos, seguridad, observabilidad, historias y planes.
- `infra/`: copia de referencia de la infraestructura (Terraform).
- `src/`: código de la aplicación.
- `test/`: pruebas.
- `ui/`: pantallas diseñadas en el recorrido.

Los artefactos del recorrido:

- **Experimento:** [.discovery/outputs/mapa-asunciones.md](.discovery/outputs/mapa-asunciones.md), [.discovery/outputs/diseno-experimento.md](.discovery/outputs/diseno-experimento.md)
- **Evidencia:** [.discovery/outputs/artefacto-traspaso.md](.discovery/outputs/artefacto-traspaso.md), [.discovery/outputs/reporte-evidencia.md](.discovery/outputs/reporte-evidencia.md)
- **Solución:** [.discovery/outputs/definicion-solucion.md](.discovery/outputs/definicion-solucion.md)
- **PRD:** [docs/PRD.md](docs/PRD.md)
- **Flujos:** [docs/flows/](docs/flows/)
- **Pantallas:** [ui/](ui/), [DESIGN.md](DESIGN.md)
- **RFC:** [docs/RFC.md](docs/RFC.md)
- **ADRs:** [docs/adrs/](docs/adrs/)
- **Dominio:** [docs/domain-model.md](docs/domain-model.md)
- **Contratos:** [docs/api-contract.md](docs/api-contract.md), [docs/events.md](docs/events.md), [docs/integration-flows.md](docs/integration-flows.md)
- **Seguridad:** [docs/security-design.md](docs/security-design.md)
- **Observabilidad:** [docs/observability-design.md](docs/observability-design.md)
- **Historias:** [docs/stories.md](docs/stories.md)
- **Ambiente:** [docs/ambiente-base.md](docs/ambiente-base.md)
- **Planes por historia:** [docs/plans/](docs/plans/)

## Cómo correr las pruebas

Desde la raíz del repositorio:

```
node --test
```

## Infraestructura

Plantilla: API sin servidor. La carpeta `infra/` es una copia de referencia de la infraestructura; el estado de Terraform no está en este repositorio.

## Sobre esta rama

La rama `opos/main` la publica opos-platform después de cada historia verificada. Conviene no escribir en ella: trabaja en otra rama y trae los cambios desde aquí cuando los necesites.
