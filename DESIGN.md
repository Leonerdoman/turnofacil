# DESIGN.md — TurnoFácil

> Generado por tech-emergentes-ui-builder · 19/11/2026
> Proyecto: externo · Diseño: responsive (mobile + web)
> **Identidad provisional:** TurnoFácil aún no tiene identidad de marca. La paleta y la tipografía son una propuesta aprobada como provisional, sin tokens ni referencias corporativas de ITTI.

El producto no tiene pantallas de app: todo ocurre en un chat de WhatsApp. Las pantallas simulan las conversaciones, sin logotipos ni marca de WhatsApp. Fuentes: `docs/PRD.md` y `docs/flows/turnofacil/user-flows.md`.

---

## Pantallas generadas

| # | Pantalla | Archivo | Propósito |
|---|----------|---------|-----------|
| 0 | Portada | [index.html](ui/index.html) | Índice del recorrido y cómo leer las marcas |
| 1 | Registrar una cita | [registrar-cita.html](ui/registrar-cita.html) | La dueña registra una cita por chat; incluye rechazos, clienta dada de baja y número no registrado (F1) |
| 2 | Cancelar una cita | [cancelar-cita.html](ui/cancelar-cita.html) | La dueña cancela una cita; incluye «no se encontró» (F2) |
| 3 | La vista de la dueña | [vista-duena.html](ui/vista-duena.html) | Dos listas, confirmadas y sin confirmar (F3) |
| 4 | Aviso de cancelación | [aviso-cancelacion.html](ui/aviso-cancelacion.html) | La dueña se entera de que la clienta canceló (F4 A1) |
| 5 | Recordatorios de la clienta | [recordatorios-clienta.html](ui/recordatorios-clienta.html) | Dos recordatorios y respuestas de la clienta (F4) |
| 6 | Baja de la clienta | [baja-clienta.html](ui/baja-clienta.html) | La clienta escribe «no más» o «stop» (F5) |

Flujo de navegación: portada → 1 → 2 → 3 → 4 → 5 → 6. Las pantallas 1 a 4 son el chat de la dueña; la 5 y la 6, el de la clienta.

---

## Marcas de procedencia del contenido

Cada globo de chat indica de dónde sale su contenido. Son parte del sistema de diseño.

| Marca | Significa | Estilo |
|-------|-----------|--------|
| `PILOTO` | Texto o dato que viene del piloto [E:01M7RXWF70H4FDZ56B2RMEMYSF]. Hoy solo las respuestas «listo» y 👍 | `bg-primary text-white` |
| `FLUJO` | Viene de los flujos aprobados de la etapa 5 o del PRD | `bg-slate-200 text-slate-900` |
| `[PENDIENTE]` | Lo deja abierto el PRD o los flujos | `bg-accent text-ink` |
| `ASUNCIÓN` | El PRD lo define, pero no se validó en el piloto | `bg-white text-slate-900 border border-slate-500` |

El texto final de los mensajes de TurnoFácil no existe en el piloto ni en el PRD. Por eso esos globos describen el contenido con borde punteado.

---

## Colores

### Paleta principal

| Rol | HEX | Uso |
|-----|-----|-----|
| Primary | `#0F766E` | Avatar, botón principal, marca `PILOTO`, pantalla activa en la navegación (`bg-primary`) |
| Secondary | `#F1F5F9` | Fondo del área de chat (`bg-secondary`) |
| Accent | `#F59E0B` | Solo como fondo o detalle con texto oscuro encima: marca `[PENDIENTE]`, globo pendiente, borde de notas (`bg-accent`, `border-accent`). Nunca como color de texto |
| Ink | `#0F172A` | Texto principal y texto sobre el acento (`text-ink`) |

### Neutros

| Rol | HEX | Uso |
|-----|-----|-----|
| Background | `#F8FAFC` | Fondo de página (`bg-slate-50`) |
| Surface | `#FFFFFF` | Tarjetas, globos recibidos, encabezado (`bg-white`) |
| Border | `#E2E8F0` | Bordes y separadores (`border-slate-200`) |
| Text Primary | `#0F172A` | Títulos y texto (`text-ink`) |
| Text Secondary | `#334155` | Referencias y texto de apoyo (`text-slate-700`, `text-slate-800`) |
| Bubble Out | `#CCFBF1` | Globos enviados por quien usa el chat (`bg-teal-100`) |

No se definen colores semánticos de éxito, error o información: las pantallas no los usan. El estado se muestra con texto y la marca de procedencia, no solo con color.

### Contraste (texto sobre fondo)

| Combinación | Ratio |
|-------------|-------|
| Blanco sobre Primary | 5,47:1 |
| Primary sobre Background | 5,23:1 |
| Ink sobre Accent | 8,31:1 |
| Ink sobre globo enviado | 15,84:1 |
| Text Secondary sobre Secondary | 9,45:1 |

---

## Tipografía

**Fuente heading:** Inter · **Fuente body:** Inter (Google Fonts)

| Nivel | Tamaño | Peso | Line-height | Clase Tailwind |
|-------|--------|------|-------------|----------------|
| H1 | 30px | 700 | 1.20 | `text-3xl font-bold font-heading` |
| H2 | 18px | 600 | 1.30 | `text-lg font-semibold font-heading` |
| Body | 16px | 400 | 1.60 | `text-base font-body` |
| Body SM | 14px | 400 | 1.50 | `text-sm font-body` |
| Caption (marcas) | 12px | 600 | 1.40 | `text-xs font-semibold font-body` |

---

## Espaciado

Base unit: **4px** (escala Tailwind estándar)

| Token | Valor (px) | Clase Tailwind |
|-------|------------|----------------|
| space-1 | 4px | `p-1` / `gap-1` |
| space-2 | 8px | `p-2` / `gap-2` |
| space-3 | 12px | `p-3` / `gap-3` |
| space-4 | 16px | `p-4` / `gap-4` |
| space-6 | 24px | `p-6` / `gap-6` |
| space-8 | 32px | `mt-8` |

---

## Tamaños (Border-radius y alturas estructurales)

| Token | Valor (px) | Clase Tailwind |
|-------|------------|----------------|
| Default | 8px | `rounded-lg` |
| Card | 12px | `rounded-xl` |
| Bubble | 16px | `rounded-2xl` |
| Full | 9999px | `rounded-full` |
| Header | 56px (móvil) / 64px (escritorio) | `h-14 md:h-16` |
| TouchTarget | 44px | `min-h-[44px]` |

No hay barra inferior: la navegación entre pantallas es una fila horizontal con desplazamiento propio bajo el encabezado, en móvil y en escritorio.

---

## Elevación

| Nivel | Valor | Clase Tailwind |
|-------|-------|----------------|
| sm | 0 1px 2px rgba(0,0,0,0.05) | `shadow-sm` (tarjetas y globos) |
| md | 0 4px 6px rgba(0,0,0,0.1) | `hover:shadow-md` (tarjetas de la portada) |

---

## Componentes base

### Botones

| Variante | Clases Tailwind |
|----------|----------------|
| Primary | `flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary` |
| Secondary | `flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary` |

### Cards

| Variante | Clases Tailwind |
|----------|----------------|
| Default | `rounded-xl border border-slate-200 bg-white p-4 shadow-sm` |
| Nota (acento al borde) | `rounded-xl border border-slate-200 border-l-4 border-l-accent bg-white p-4 shadow-sm` |
| Escenario de chat | `rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden` |

### Globos de chat

| Variante | Clases Tailwind |
|----------|----------------|
| Recibido | `rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-sm` |
| Enviado | `rounded-2xl bg-teal-100 border border-teal-200 px-3.5 py-2.5 shadow-sm` |
| Descriptivo (el texto final no está definido) | recibido o enviado + `border-dashed` |
| Pendiente | `rounded-2xl bg-accent/25 border-2 border-dashed border-accent px-3.5 py-2.5` |
| Sin respuesta | `rounded-2xl border border-dashed border-slate-400 px-3.5 py-2.5` |

### Badges (marcas de procedencia)

| Variante | Clases Tailwind |
|----------|----------------|
| Piloto | `rounded-full px-2 py-0.5 text-xs font-semibold bg-primary text-white` |
| Flujo | `rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-200 text-slate-900` |
| Pendiente | `rounded-full px-2 py-0.5 text-xs font-semibold bg-accent text-ink` |
| Asunción | `rounded-full px-2 py-0.5 text-xs font-semibold bg-white text-slate-900 border border-slate-500` |

### Nav

| Variante | Clases Tailwind |
|----------|----------------|
| Ítem | `flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-800 hover:bg-slate-200 transition-colors duration-200` |
| Ítem activo | `bg-primary text-white` (con `aria-current="page"`) |

### Inputs

Las pantallas no tienen campos de formulario: toda la entrada ocurre escribiendo en el chat.

---

## Tailwind Config

```js
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary:   '#0F766E',
        secondary: '#F1F5F9',
        accent:    '#F59E0B',
        ink:       '#0F172A',
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
    }
  }
}
```

---

## Do's and Don'ts

1. **Do** marcar cada globo con su procedencia: `PILOTO`, `FLUJO`, `[PENDIENTE]` o `ASUNCIÓN`.
2. **Do** usar el acento solo como fondo o detalle, con texto oscuro encima.
3. **Do** usar datos entre `< >` como estructura; nunca nombres, teléfonos u horas inventados.
4. **Do** mantener targets táctiles de al menos 44px.
5. **Do** mostrar el riesgo de «baja» y «para» como nota de diseño al margen, fuera del chat.
6. **Don't** inventar el texto de los mensajes: si no está en el piloto o en el PRD, se describe o se marca `[PENDIENTE]`.
7. **Don't** usar el ámbar como color de texto sobre fondo claro.
8. **Don't** usar logotipos ni marca de WhatsApp.
9. **Don't** usar emojis como íconos; el 👍 aparece solo como contenido de una respuesta del piloto.
10. **Don't** presentar la paleta como identidad de marca definitiva.

---

*Íconos: [Lucide Icons](https://lucide.dev) · Stack: Tailwind CSS CDN + Lucide CDN · Fuente: Inter (Google Fonts)*
*Fuente de tokens: propuesta provisional aprobada en la etapa 6 (proyecto externo; no usa DESIGN.md de ITTI)*
