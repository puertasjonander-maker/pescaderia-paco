# Pescadería Paco — Web App Design Spec
**Date:** 2026-04-24  
**Author:** Jonander Puertas + Claude  
**Status:** Approved for implementation

---

## 1. Visión del producto

Web app mobile-first para **Pescadería Paco** (Málaga), protagonizada por **Fran Rodríguez (@elpescaderodemalaga)**, el Pescadero Tiktokero. La app combina un catálogo de recetas de pescado y marisco con un **modo cocinero interactivo paso a paso**, usando los vídeos de TikTok de Fran como fuente de contenido.

**Propuesta de valor:**  
> "Compras en Pescadería Paco, escaneas o buscas la receta de Fran, y la app te guía mientras cocinas — sin tocar la pantalla."

---

## 2. Audiencia

- **Primaria:** Clientes de Pescadería Paco (Málaga) que quieren cocinar lo que compran
- **Secundaria:** Seguidores de @elpescaderodemalaga en TikTok (49.4K seguidores, 928.8K likes)
- **Dispositivo:** Mobile first (iOS/Android browser). Responsive para tablet/desktop.
- **Idioma:** Español (base). Estructura preparada para inglés futuro (i18n-ready).

---

## 3. Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Deploy | Vercel |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (magic link) |
| Storage | Supabase Storage (thumbnails) |
| Vídeos | TikTok oEmbed API (sin clave API) |
| Estilos | Tailwind CSS v4 |
| Fuente | Inter (Google Fonts) |
| Lenguaje | TypeScript |

---

## 4. Modelo de datos

### `categories`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL        -- "Pescados", "Mariscos", "Arroces"
slug        text UNIQUE NOT NULL
emoji       text                 -- "🐟", "🦞", "🍚"
created_at  timestamptz DEFAULT now()
```

### `recipes`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
slug            text UNIQUE NOT NULL
title           text NOT NULL
description     text
tiktok_url      text NOT NULL
tiktok_embed    text             -- HTML del oEmbed, cacheado
tiktok_embed_cached_at timestamptz -- para invalidación
thumbnail_url   text             -- Supabase Storage (WebP, 400x400)
category_id     uuid REFERENCES categories(id)
difficulty      text CHECK (difficulty IN ('fácil','medio','difícil'))
prep_time       integer          -- minutos
cook_time       integer          -- minutos
servings        integer
published       boolean DEFAULT false
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
-- Trigger: moddatetime() actualiza updated_at en cada UPDATE
```

### `ingredients`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
recipe_id   uuid REFERENCES recipes(id) ON DELETE CASCADE
name        text NOT NULL
quantity    text             -- "2", "½", "al gusto"
unit        text             -- "dientes", "kg", "cucharadas"
optional    boolean DEFAULT false
sort_order  integer NOT NULL
```

### `steps`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
recipe_id       uuid REFERENCES recipes(id) ON DELETE CASCADE
sort_order      integer NOT NULL
text            text NOT NULL
timer_seconds   integer          -- NULL en MVP, usado en v2
```

### `step_ingredients` (join table)
```sql
step_id       uuid REFERENCES steps(id) ON DELETE CASCADE
ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE
PRIMARY KEY (step_id, ingredient_id)
-- Permite asociar ingredientes específicos a pasos concretos
-- para el modo cocinero ("ingredientes de este paso")
```

---

## 5. Seguridad — RLS (Row Level Security)

Todas las tablas tienen RLS activado. Políticas:

| Tabla | Lectura pública | Escritura |
|-------|----------------|-----------|
| `categories` | Sí (todas) | Solo admin (auth.role = 'authenticated') |
| `recipes` | Solo `published = true` | Solo admin |
| `ingredients` | Si receta publicada | Solo admin |
| `steps` | Si receta publicada | Solo admin |
| `step_ingredients` | Si receta publicada | Solo admin |

```sql
-- Ejemplo política lectura pública en recipes
CREATE POLICY "Public can read published recipes"
ON recipes FOR SELECT
USING (published = true);

-- Escritura solo el email de Fran (más restrictivo que auth.role)
CREATE POLICY "Admin full access"
ON recipes FOR ALL
USING (auth.email() = 'pescaderotiktokero@gmail.com');
```

---

## 6. Auth admin

- **Login page:** `/admin/login` — formulario de email → envía magic link a través de Supabase Auth.
- **Middleware:** `middleware.ts` en la raíz del proyecto intercepta todas las rutas `/admin/*`. Si no hay sesión válida (cookie `sb-access-token`), redirige a `/admin/login`.
- **Sesión expirada:** Si la sesión expira mientras se edita, el middleware detecta el estado en el siguiente request y redirige a login. El formulario se guarda en localStorage temporalmente para no perder datos.
- **Un solo usuario admin:** Solo el email de Fran puede autenticarse. Supabase permite restringir via allowed emails o validación custom en el callback.

---

## 7. Pantallas y flujos

### 7.1 Home `/`
- **Hero:** Fondo oscuro con nombre de Fran y tagline. Identidad de marca fuerte.
- **Filtro de categorías:** Pills horizontales scrollables (Todo, 🐟 Pescados, 🦞 Mariscos, 🍚 Arroces, 🦑 Cefalópodos).
- **Grid de recetas:** Cards con thumbnail, título, tiempo y dificultad. Máx. 12 recetas en home (paginación en listado).
- **CTA:** Card destacada con receta viral anclada.
- **404 / not-found:** `not-found.tsx` en el directorio raíz con mensaje amable y link a home.

### 7.2 Listado de recetas `/recetas`
- Grid filtrable por categoría (state en URL query param `?categoria=mariscos`).
- Búsqueda por nombre (client-side sobre las recetas cargadas; max 100 recetas en MVP — suficiente para búsqueda en memoria).
- Si catálogo crece a >200 recetas, migrar a búsqueda server-side con `ilike` en Supabase.
- Cards linkean a `/recetas/[slug]`.

### 7.3 Detalle de receta `/recetas/[slug]`
- `notFound()` si slug no existe en la base de datos.
- Vídeo de TikTok embebido (oEmbed HTML, cacheado). Si `tiktok_embed` es null (vídeo borrado), se muestra un placeholder con link directo a TikTok.
- Metadatos: dificultad, tiempo total, raciones.
- Lista de ingredientes con checkboxes (estado local, no persistido).
- Pasos resumidos (preview).
- **CTA prominente:** Botón "🍳 Empezar a cocinar" → navega a `/recetas/[slug]/cocinar`.

### 7.4 Modo cocinero `/recetas/[slug]/cocinar`
- `notFound()` si slug no existe.
- **Pantalla completa, un paso a la vez.**
- Barra de progreso (paso N de M).
- Texto del paso en tipografía grande (legible con manos ocupadas).
- Ingredientes del paso via `step_ingredients`. Si no hay asociación, no se muestra sección de ingredientes.
- Botones "Anterior" y "Siguiente" con área de toque mínimo 64px.
- Botón X para salir (vuelve al detalle de la receta).
- Wake Lock API activado al entrar; liberado al salir.
- Al completar el último paso: pantalla de celebración con link al vídeo de TikTok original.

### 7.5 Panel admin `/admin`
- `/admin/login` — magic link.
- `/admin` — lista de recetas (publicadas + borradores).
- `/admin/recetas/nueva` — formulario nueva receta.
- `/admin/recetas/[id]/editar` — edición de receta existente.
- **Auto-import TikTok:** Al pegar URL → `POST /api/tiktok-oembed` → autocompleta título, thumbnail y embed.
- **Editor de ingredientes y pasos:** Listas con add/remove/reorder (dnd-kit). Asignación de ingredientes a pasos via checkboxes en la sección de cada paso.

---

## 8. APIs del servidor

### `POST /api/tiktok-oembed`
- **Auth:** Solo accesible con sesión Supabase válida (header `Authorization: Bearer <token>`). No es un endpoint público.
- **Validación:** La URL debe pasar regex `/^https:\/\/(www\.)?tiktok\.com\//` antes de hacer la petición externa. Rechaza cualquier otra URL con 400.
- **Lógica:** Llama a `https://www.tiktok.com/oembed?url=<url>`, devuelve `{ title, html, thumbnail_url }`.
- **Caché:** Guarda el resultado en `recipes.tiktok_embed` y `tiktok_embed_cached_at`. Si el admin re-guarda la receta, se refresca el embed. No hay refresco automático (MVP).

---

## 9. Sistema de diseño

### Colores
| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#E8350A` | CTAs, acentos, badges |
| `background` | `#0A0A0A` | Fondo base |
| `surface` | `#141414` | Cards, modales |
| `surface-alt` | `#1A1A1A` | Tags, inputs, chips |
| `text-primary` | `#FFFFFF` | Texto principal |
| `text-secondary` | `#AAAAAA` | Metadatos, subtítulos (ratio 5.7:1 sobre #141414, pasa WCAG AA) |
| `accent-green` | `#1A4A3A` | Confirmaciones, "publicado" |

> **Nota contraste:** `text-secondary` se actualiza a `#AAAAAA` (era `#888888`). El ratio con `surface` (#141414) sube de 3.9:1 a 5.7:1, cumpliendo WCAG AA para texto normal.

### Imágenes
- Thumbnails almacenados en Supabase Storage como **WebP, 400×400px**, con transformación automática via Supabase Image Transformation o generados al subir.
- Usados en Next.js `<Image>` con `sizes="(max-width: 768px) 50vw, 25vw"` y `priority` en las primeras 4 cards del home.

### Tipografía
- **Fuente:** Inter (Google Fonts)
- **Display:** 48px / weight 900 — Títulos hero
- **Heading:** 24px / weight 800 — Nombres de recetas
- **Subheading:** 18px / weight 700 — Secciones
- **Body:** 16px / weight 400 — Descripciones, pasos de cocina
- **Label:** 11px / weight 700 / uppercase / letter-spacing 2px — Categorías, metadatos

### Componentes clave
- `RecipeCard` — thumbnail + título + tiempo + dificultad
- `CookStep` — barra progreso + texto paso + botones nav
- `IngredientList` — lista con checkboxes
- `CategoryFilter` — pills horizontales scrollables
- `TikTokEmbed` — oEmbed HTML con fallback si embed es null
- `AdminRecipeForm` — formulario con auto-fetch de TikTok + editor de ingredientes/pasos

---

## 10. MVP vs. Futuro

### MVP (v1)
- [x] Home con catálogo de recetas (max 12 destacadas)
- [x] Listado con filtro por categoría y búsqueda client-side
- [x] Detalle de receta con TikTok embebido
- [x] Modo cocinero interactivo (pasos + ingredientes por paso)
- [x] Wake Lock (pantalla activa durante cocina)
- [x] Panel admin con auto-import desde URL de TikTok
- [x] Auth por magic link con middleware de protección
- [x] 404 y not-found handling

### v2
- [ ] Timers por paso (campo `timer_seconds` ya en el modelo)
- [ ] Modo offline (PWA + service worker para recetas guardadas)
- [ ] Paginación server-side y búsqueda con `ilike` cuando catálogo >200 recetas
- [ ] Favoritos (localStorage)
- [ ] Refresco automático de embeds cacheados de TikTok

### Futuro
- [ ] Control por voz ("siguiente paso")
- [ ] Multiidioma (español + inglés)
- [ ] Integración directa con TikTok API oficial
- [ ] E-commerce básico (pedir pescado directamente)

---

## 11. Consideraciones técnicas

- **TikTok oEmbed:** No requiere API key. Solo accesible desde el admin (autenticado). El HTML del embed se cachea en `tiktok_embed`. Si el vídeo se borra, la UI muestra un placeholder con enlace externo.
- **Wake Lock API:** Soportado en Chrome/Edge/Safari iOS 16.4+. Fallback silencioso (`try/catch`) en navegadores sin soporte.
- **SEO:** Rutas de recetas con `generateMetadata` (title, description, OG image desde thumbnail). Server Components para el render inicial.
- **Accesibilidad:** Contraste mínimo 4.5:1 para texto normal. Áreas de toque mínimo 64×64px en modo cocinero. Texto del paso readable a 16px+ sin zoom.
- **`updated_at` trigger:** Migrations incluirán `CREATE EXTENSION IF NOT EXISTS moddatetime` y el trigger correspondiente en `recipes`.
- **SSRF prevention:** `/api/tiktok-oembed` valida con regex estricto que la URL pertenece a `tiktok.com` antes de hacer fetch externo.
