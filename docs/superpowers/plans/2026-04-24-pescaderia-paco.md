# Pescadería Paco Web App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Next.js 16.x web app for Pescadería Paco (Málaga) with a recipe catalogue powered by TikTok videos and an interactive step-by-step cooking mode, managed via an admin panel.

**Architecture:** Next.js 16.x App Router with React Server Components for public pages (fast, SEO-friendly) and Client Components only where interactivity is needed (cooking mode, admin forms). Supabase handles the database (PostgreSQL + RLS), auth (magic link), and image storage.

**Tech Stack:** Next.js 16.x, TypeScript, Tailwind CSS v4 (CSS-first config via `@theme` in globals.css — no tailwind.config.ts), Supabase (PostgreSQL + Auth + Storage), Vercel deploy, dnd-kit (drag-and-drop in admin), Inter font (Google Fonts).

**Spec:** `docs/superpowers/specs/2026-04-24-pescaderia-paco-design.md`

---

## File Map

```
pescaderia-paco/                          ← project root
├── app/
│   ├── layout.tsx                        root layout, fonts, metadata
│   ├── page.tsx                          Home — hero + recipe grid
│   ├── not-found.tsx                     global 404 page
│   ├── recetas/
│   │   ├── page.tsx                      Recipe list with category filter + search
│   │   └── [slug]/
│   │       ├── page.tsx                  Recipe detail — embed + ingredients + CTA
│   │       └── cocinar/
│   │           └── page.tsx              Cooking mode — step-by-step full screen
│   ├── admin/
│   │   ├── layout.tsx                    Admin shell (session check, nav)
│   │   ├── login/
│   │   │   └── page.tsx                  Magic link login form
│   │   ├── page.tsx                      Admin recipe list (all + drafts)
│   │   └── recetas/
│   │       ├── nueva/
│   │       │   └── page.tsx              New recipe form
│   │       └── [id]/
│   │           └── editar/
│   │               └── page.tsx          Edit recipe form
│   └── api/
│       └── tiktok-oembed/
│           └── route.ts                  POST — proxy TikTok oEmbed (auth-gated)
├── components/
│   ├── recipe-card.tsx                   Card: thumbnail + title + time + difficulty
│   ├── category-filter.tsx               Horizontal scrollable category pills (client)
│   ├── tiktok-embed.tsx                  oEmbed HTML renderer with fallback
│   ├── ingredient-list.tsx               Checkbox ingredient list (client)
│   ├── cook-mode.tsx                     Full cooking mode UI with Wake Lock (client)
│   └── admin/
│       ├── recipe-form.tsx               Create/edit recipe with TikTok auto-import
│       ├── ingredients-editor.tsx        Drag-drop ingredient list (dnd-kit)
│       └── steps-editor.tsx             Drag-drop step list with ingredient picker
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     Browser Supabase client (singleton)
│   │   ├── server.ts                     Server Supabase client (cookies)
│   │   └── types.ts                      Generated DB types (via supabase gen types)
│   ├── queries.ts                        All Supabase data-fetching functions
│   └── tiktok.ts                         TikTok oEmbed fetch + URL validation
├── middleware.ts                         Protect /admin/* routes, refresh session
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql                All tables + updated_at trigger
│       ├── 002_rls.sql                   RLS policies for all tables
│       └── 003_seed.sql                  Initial categories seed
└── tailwind.config.ts                   Design tokens (colors, fonts)
```

---

## Phase 1 — Project Setup

### Task 1: Scaffold the project and init git + GitHub repo

**Files:**
- Create: entire project root via `create-next-app`
- Create: `tailwind.config.ts`
- Create: `.gitignore` (add `.superpowers/`)

- [ ] **Step 1: Scaffold Next.js 15**

```bash
cd "/Users/jonanderpuertas/Desktop/Pescaderia Paco Web App"
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=no \
  --import-alias="@/*" \
  --use-npm
```
Accept all defaults. This creates the project in the existing directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install --save-dev @types/node
```

- [ ] **Step 3: Add .superpowers/ to .gitignore**

Append to the generated `.gitignore`:
```
.superpowers/
```

- [ ] **Step 4: Init git and push to GitHub**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 15 + Tailwind + Supabase deps"
gh repo create pescaderia-paco --public --source=. --remote=origin --push
```

---

### Task 2: Configure design tokens in Tailwind

**Note:** Tailwind v4 uses CSS-first configuration — there is NO `tailwind.config.ts`. All design tokens go into `app/globals.css` using the `@theme` block.

**Files:**
- Modify: `app/globals.css` (add `@theme` tokens + Inter font import)
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update globals.css with design tokens (Tailwind v4 @theme)**

Replace the entire contents of `app/globals.css`:
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

@theme {
  --color-primary: #E8350A;
  --color-background: #0A0A0A;
  --color-surface: #141414;
  --color-surface-alt: #1A1A1A;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #AAAAAA;
  --color-accent-green: #1A4A3A;

  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  background-color: #0A0A0A;
  color: #FFFFFF;
}

body {
  font-family: var(--font-sans);
  background-color: #0A0A0A;
  color: #FFFFFF;
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
}
```

With Tailwind v4, `@theme { --color-primary: ... }` makes `bg-primary`, `text-primary`, `border-primary` etc. available as utility classes automatically.

- [ ] **Step 2: Update app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pescadería Paco — Recetas del Mar',
  description: 'Recetas de pescado y marisco por Fran, el Pescadero Tiktokero de Málaga.',
  openGraph: {
    siteName: 'Pescadería Paco',
    locale: 'es_ES',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```
Expected: compiles without errors, http://localhost:3000 shows default Next.js page.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: configure design tokens, fonts and root layout"
```

---

### Task 3: Supabase project + database migrations

**Files:**
- Create: `supabase/migrations/001_schema.sql`
- Create: `supabase/migrations/002_rls.sql`
- Create: `supabase/migrations/003_seed.sql`
- Create: `.env.local`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New project → name: `pescaderia-paco`.
Note the **Project URL** and **anon key** from Settings → API.

- [ ] **Step 2: Create .env.local**

```bash
# .env.local (never commit this file)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Add `.env.local` to `.gitignore` if not already there.

- [ ] **Step 3: Write 001_schema.sql**

```sql
-- supabase/migrations/001_schema.sql

CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  emoji      text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE recipes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    text UNIQUE NOT NULL,
  title                   text NOT NULL,
  description             text,
  tiktok_url              text NOT NULL,
  tiktok_embed            text,
  tiktok_embed_cached_at  timestamptz,
  thumbnail_url           text,
  category_id             uuid REFERENCES categories(id),
  difficulty              text CHECK (difficulty IN ('fácil','medio','difícil')),
  prep_time               integer,
  cook_time               integer,
  servings                integer,
  published               boolean DEFAULT false,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TABLE ingredients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  uuid REFERENCES recipes(id) ON DELETE CASCADE,
  name       text NOT NULL,
  quantity   text,
  unit       text,
  optional   boolean DEFAULT false,
  sort_order integer NOT NULL
);

CREATE TABLE steps (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id      uuid REFERENCES recipes(id) ON DELETE CASCADE,
  sort_order     integer NOT NULL,
  text           text NOT NULL,
  timer_seconds  integer
);

CREATE TABLE step_ingredients (
  step_id       uuid REFERENCES steps(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, ingredient_id)
);
```

- [ ] **Step 4: Write 002_rls.sql**

```sql
-- supabase/migrations/002_rls.sql

ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps            ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_ingredients ENABLE ROW LEVEL SECURITY;

-- Public: read published recipes + their relations
CREATE POLICY "public_read_categories"
  ON categories FOR SELECT USING (true);

CREATE POLICY "public_read_published_recipes"
  ON recipes FOR SELECT USING (published = true);

CREATE POLICY "public_read_ingredients"
  ON ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = ingredients.recipe_id AND r.published = true
  ));

CREATE POLICY "public_read_steps"
  ON steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = steps.recipe_id AND r.published = true
  ));

CREATE POLICY "public_read_step_ingredients"
  ON step_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM steps s
    JOIN recipes r ON r.id = s.recipe_id
    WHERE s.id = step_ingredients.step_id AND r.published = true
  ));

-- Admin: full access for Fran's email only
CREATE POLICY "admin_all_categories"
  ON categories FOR ALL USING (auth.email() = 'pescaderotiktokero@gmail.com');

CREATE POLICY "admin_all_recipes"
  ON recipes FOR ALL USING (auth.email() = 'pescaderotiktokero@gmail.com');

CREATE POLICY "admin_all_ingredients"
  ON ingredients FOR ALL USING (auth.email() = 'pescaderotiktokero@gmail.com');

CREATE POLICY "admin_all_steps"
  ON steps FOR ALL USING (auth.email() = 'pescaderotiktokero@gmail.com');

CREATE POLICY "admin_all_step_ingredients"
  ON step_ingredients FOR ALL USING (auth.email() = 'pescaderotiktokero@gmail.com');
```

- [ ] **Step 5: Write 003_seed.sql**

```sql
-- supabase/migrations/003_seed.sql
INSERT INTO categories (name, slug, emoji) VALUES
  ('Todos',        'todos',        '🎣'),
  ('Pescados',     'pescados',     '🐟'),
  ('Mariscos',     'mariscos',     '🦞'),
  ('Arroces',      'arroces',      '🍚'),
  ('Cefalópodos',  'cefalopodos',  '🦑'),
  ('Guisos',       'guisos',       '🍲');
```

- [ ] **Step 6: Run migrations in Supabase SQL editor**

Copy-paste each SQL file in order (001 → 002 → 003) into the Supabase dashboard SQL editor and run each one.

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat: add DB migrations — schema, RLS policies and category seed"
```

Note: `.env.local` is in `.gitignore` and must NOT be committed.

---

## Phase 2 — Data Layer

### Task 4: Supabase clients and TypeScript types

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/types.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create browser Supabase client**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server Supabase client**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Write TypeScript types manually**

```typescript
// lib/supabase/types.ts
export type Difficulty = 'fácil' | 'medio' | 'difícil'

export interface Category {
  id: string
  name: string
  slug: string
  emoji: string | null
  created_at: string
}

export interface Recipe {
  id: string
  slug: string
  title: string
  description: string | null
  tiktok_url: string
  tiktok_embed: string | null
  tiktok_embed_cached_at: string | null
  thumbnail_url: string | null
  category_id: string | null
  difficulty: Difficulty | null
  prep_time: number | null
  cook_time: number | null
  servings: number | null
  published: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Ingredient {
  id: string
  recipe_id: string
  name: string
  quantity: string | null
  unit: string | null
  optional: boolean
  sort_order: number
}

export interface Step {
  id: string
  recipe_id: string
  sort_order: number
  text: string
  timer_seconds: number | null
  step_ingredients?: { ingredient_id: string; ingredient?: Ingredient }[]
}

export interface RecipeWithRelations extends Recipe {
  ingredients: Ingredient[]
  steps: (Step & { step_ingredients: { ingredient_id: string }[] })[]
}

// For Supabase client generic — minimal
export type Database = {
  public: {
    Tables: {
      categories: { Row: Category; Insert: Omit<Category, 'id' | 'created_at'>; Update: Partial<Category> }
      recipes: { Row: Recipe; Insert: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Recipe> }
      ingredients: { Row: Ingredient; Insert: Omit<Ingredient, 'id'>; Update: Partial<Ingredient> }
      steps: { Row: Step; Insert: Omit<Step, 'id'>; Update: Partial<Step> }
      step_ingredients: { Row: { step_id: string; ingredient_id: string }; Insert: { step_id: string; ingredient_id: string }; Update: never }
    }
  }
}
```

- [ ] **Step 4: Create middleware.ts (admin route protection)**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  if (isAdminRoute && !isLoginPage && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    return NextResponse.redirect(loginUrl)
  }

  if (isLoginPage && user) {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = '/admin'
    return NextResponse.redirect(adminUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/ middleware.ts
git commit -m "feat: add Supabase clients, TypeScript types and admin middleware"
```

---

### Task 5: Data fetching queries

**Files:**
- Create: `lib/queries.ts`
- Create: `lib/tiktok.ts`

- [ ] **Step 1: Write queries.ts**

```typescript
// lib/queries.ts
import { createClient } from '@/lib/supabase/server'
import type { Category, Recipe, RecipeWithRelations } from '@/lib/supabase/types'

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function getPublishedRecipes(categorySlug?: string): Promise<Recipe[]> {
  const supabase = await createClient()
  let query = supabase
    .from('recipes')
    .select('*, category:categories(*)')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (categorySlug && categorySlug !== 'todos') {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    if (category) query = query.eq('category_id', category.id)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Recipe[]
}

export async function getRecipeBySlug(slug: string): Promise<RecipeWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      category:categories(*),
      ingredients(*),
      steps(*, step_ingredients(ingredient_id))
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) return null

  // Sort ingredients and steps by sort_order
  const recipe = data as RecipeWithRelations
  recipe.ingredients.sort((a, b) => a.sort_order - b.sort_order)
  recipe.steps.sort((a, b) => a.sort_order - b.sort_order)
  return recipe
}

// Admin queries (no published filter)
export async function getAllRecipesAdmin(): Promise<Recipe[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Recipe[]
}

export async function getRecipeByIdAdmin(id: string): Promise<RecipeWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      category:categories(*),
      ingredients(*),
      steps(*, step_ingredients(ingredient_id))
    `)
    .eq('id', id)
    .single()
  if (error) return null
  const recipe = data as RecipeWithRelations
  recipe.ingredients.sort((a, b) => a.sort_order - b.sort_order)
  recipe.steps.sort((a, b) => a.sort_order - b.sort_order)
  return recipe
}
```

- [ ] **Step 2: Write lib/tiktok.ts with URL validation**

```typescript
// lib/tiktok.ts

const TIKTOK_URL_REGEX = /^https:\/\/(www\.)?tiktok\.com\//

export function isValidTikTokUrl(url: string): boolean {
  return TIKTOK_URL_REGEX.test(url)
}

export interface TikTokOEmbedResult {
  title: string
  html: string
  thumbnail_url: string | null
}

export async function fetchTikTokOEmbed(url: string): Promise<TikTokOEmbedResult> {
  if (!isValidTikTokUrl(url)) {
    throw new Error('URL no válida: debe ser de tiktok.com')
  }
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
  const res = await fetch(oembedUrl, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`TikTok oEmbed falló: ${res.status}`)
  const data = await res.json()
  return {
    title: data.title ?? '',
    html: data.html ?? '',
    thumbnail_url: data.thumbnail_url ?? null,
  }
}
```

- [ ] **Step 3: Write tests for tiktok.ts validation**

```typescript
// lib/__tests__/tiktok.test.ts
import { describe, it, expect } from 'vitest'
import { isValidTikTokUrl } from '../tiktok'

describe('isValidTikTokUrl', () => {
  it('accepts valid tiktok.com URLs', () => {
    expect(isValidTikTokUrl('https://www.tiktok.com/@elpescaderodemalaga/video/123')).toBe(true)
    expect(isValidTikTokUrl('https://tiktok.com/@user/video/456')).toBe(true)
  })
  it('rejects non-TikTok URLs', () => {
    expect(isValidTikTokUrl('https://evil.com/https://tiktok.com/fake')).toBe(false)
    expect(isValidTikTokUrl('https://instagram.com/reel/abc')).toBe(false)
    expect(isValidTikTokUrl('')).toBe(false)
  })
})
```

- [ ] **Step 4: Install Vitest and run tests**

```bash
npm install --save-dev vitest @vitejs/plugin-react
```

Add to `package.json` scripts: `"test": "vitest run"`

```bash
npm test
```
Expected: 2 tests pass (one per `it` block).

- [ ] **Step 5: Commit**

```bash
git add lib/ package.json
git commit -m "feat: add data queries and TikTok oEmbed utility with tests"
```

---

## Phase 3 — Public Frontend

### Task 6: Core components

**Files:**
- Create: `components/recipe-card.tsx`
- Create: `components/category-filter.tsx`
- Create: `components/tiktok-embed.tsx`
- Create: `components/ingredient-list.tsx`

- [ ] **Step 1: RecipeCard component**

```tsx
// components/recipe-card.tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Recipe } from '@/lib/supabase/types'

interface RecipeCardProps {
  recipe: Recipe
  priority?: boolean
}

export function RecipeCard({ recipe, priority = false }: RecipeCardProps) {
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)

  return (
    <Link href={`/recetas/${recipe.slug}`} className="block group">
      <div className="bg-surface rounded-2xl overflow-hidden hover:ring-1 hover:ring-primary transition-all">
        <div className="relative aspect-square bg-surface-alt">
          {recipe.thumbnail_url ? (
            <Image
              src={recipe.thumbnail_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl">🐟</div>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-bold leading-tight mb-2 line-clamp-2">{recipe.title}</h3>
          <div className="flex gap-2 flex-wrap">
            {totalTime > 0 && (
              <span className="text-xs text-text-secondary bg-surface-alt px-2 py-1 rounded-md">
                ⏱ {totalTime}min
              </span>
            )}
            {recipe.difficulty && (
              <span className="text-xs text-text-secondary bg-surface-alt px-2 py-1 rounded-md">
                {recipe.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: CategoryFilter component (client)**

```tsx
// components/category-filter.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/supabase/types'

interface CategoryFilterProps {
  categories: Category[]
  activeSlug: string
}

export function CategoryFilter({ categories, activeSlug }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug === 'todos') {
      params.delete('categoria')
    } else {
      params.set('categoria', slug)
    }
    router.push(`/recetas?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => {
        const isActive = cat.slug === activeSlug || (activeSlug === 'todos' && cat.slug === 'todos')
        return (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.slug)}
            className={`flex-none px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-primary text-white'
                : 'bg-surface-alt text-text-secondary hover:text-white'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: TikTokEmbed component**

```tsx
// components/tiktok-embed.tsx
interface TikTokEmbedProps {
  embedHtml: string | null
  tiktokUrl: string
}

export function TikTokEmbed({ embedHtml, tiktokUrl }: TikTokEmbedProps) {
  if (!embedHtml) {
    return (
      <div className="bg-surface-alt rounded-2xl p-6 text-center">
        <p className="text-text-secondary text-sm mb-3">Vídeo no disponible</p>
        <a
          href={tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm font-bold"
        >
          Ver en TikTok →
        </a>
      </div>
    )
  }

  return (
    <div
      className="tiktok-embed-container flex justify-center"
      dangerouslySetInnerHTML={{ __html: embedHtml }}
    />
  )
}
```

- [ ] **Step 4: IngredientList component (client, for checkboxes)**

```tsx
// components/ingredient-list.tsx
'use client'
import { useState } from 'react'
import type { Ingredient } from '@/lib/supabase/types'

interface IngredientListProps {
  ingredients: Ingredient[]
}

export function IngredientList({ ingredients }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <ul className="space-y-2">
      {ingredients.map((ing) => (
        <li
          key={ing.id}
          onClick={() => toggle(ing.id)}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className={`w-5 h-5 rounded border-2 flex-none flex items-center justify-center transition-colors ${
            checked.has(ing.id) ? 'bg-primary border-primary' : 'border-surface-alt'
          }`}>
            {checked.has(ing.id) && <span className="text-white text-xs">✓</span>}
          </div>
          <span className={`text-sm ${checked.has(ing.id) ? 'line-through text-text-secondary' : ''}`}>
            {ing.quantity && <span className="font-bold">{ing.quantity} {ing.unit} </span>}
            {ing.name}
            {ing.optional && <span className="text-text-secondary text-xs"> (opcional)</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/
git commit -m "feat: add RecipeCard, CategoryFilter, TikTokEmbed and IngredientList components"
```

---

### Task 7: Home page

**Files:**
- Modify: `app/page.tsx`
- Create: `app/not-found.tsx`

- [ ] **Step 1: Write Home page**

```tsx
// app/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { getPublishedRecipes, getCategories } from '@/lib/queries'
import { RecipeCard } from '@/components/recipe-card'

export const revalidate = 60 // ISR — revalidate every 60s

export default async function HomePage() {
  const [recipes, categories] = await Promise.all([
    getPublishedRecipes(),
    getCategories(),
  ])

  const featured = recipes.slice(0, 12)

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="px-4 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-bold tracking-widest text-primary uppercase">Pescadería Paco</span>
        </div>
        <h1 className="text-5xl font-black leading-none mb-2">
          Recetas<br />del Mar 🎣
        </h1>
        <p className="text-text-secondary text-sm mt-3">
          Por <a href="https://www.tiktok.com/@elpescaderodemalaga" target="_blank" rel="noopener noreferrer" className="text-primary font-bold">@elpescaderodemalaga</a> · Málaga
        </p>
      </section>

      {/* Category pills */}
      <section className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/recetas?categoria=${cat.slug}`}
              className="flex-none px-4 py-2 rounded-full text-sm font-semibold bg-surface-alt text-text-secondary hover:text-white transition-colors whitespace-nowrap"
            >
              {cat.emoji} {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Recipe grid */}
      <section className="px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">Recetas</h2>
          <Link href="/recetas" className="text-primary text-sm font-bold">Ver todas →</Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-12">Próximamente más recetas 🎣</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {featured.map((recipe, i) => (
              <RecipeCard key={recipe.id} recipe={recipe} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Write global not-found.tsx**

```tsx
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">🎣</div>
      <h1 className="text-2xl font-black mb-2">Página no encontrada</h1>
      <p className="text-text-secondary text-sm mb-8">
        Esta receta se la llevó la marea...
      </p>
      <Link href="/" className="bg-primary text-white font-bold px-6 py-3 rounded-xl">
        Volver al inicio
      </Link>
    </main>
  )
}
```

- [ ] **Step 3: Verify home page renders**

```bash
npm run dev
```
Open http://localhost:3000. Expected: hero section and empty grid (or recipes if DB has data).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/not-found.tsx
git commit -m "feat: add Home page with hero, category pills and recipe grid"
```

---

### Task 8: Recipe list and detail pages

**Files:**
- Create: `app/recetas/page.tsx`
- Create: `app/recetas/[slug]/page.tsx`

- [ ] **Step 1: Write recipe list page**

```tsx
// app/recetas/page.tsx
import { Suspense } from 'react'
import { getPublishedRecipes, getCategories } from '@/lib/queries'
import { RecipeCard } from '@/components/recipe-card'
import { CategoryFilter } from '@/components/category-filter'

export const revalidate = 60

interface Props {
  searchParams: Promise<{ categoria?: string }>
}

export default async function RecipesPage({ searchParams }: Props) {
  const { categoria } = await searchParams
  const activeSlug = categoria ?? 'todos'

  const [recipes, categories] = await Promise.all([
    getPublishedRecipes(activeSlug),
    getCategories(),
  ])

  return (
    <main className="min-h-screen px-4 pt-8 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <a href="/" className="text-text-secondary text-sm">← Inicio</a>
        <h1 className="text-2xl font-black">Recetas</h1>
      </div>

      <div className="mb-6">
        <Suspense>
          <CategoryFilter categories={categories} activeSlug={activeSlug} />
        </Suspense>
      </div>

      {recipes.length === 0 ? (
        <p className="text-text-secondary text-sm text-center py-16">
          No hay recetas en esta categoría todavía 🎣
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recipes.map((recipe, i) => (
            <RecipeCard key={recipe.id} recipe={recipe} priority={i < 4} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Write recipe detail page**

```tsx
// app/recetas/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getRecipeBySlug } from '@/lib/queries'
import { TikTokEmbed } from '@/components/tiktok-embed'
import { IngredientList } from '@/components/ingredient-list'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)
  if (!recipe) return {}
  return {
    title: `${recipe.title} — Pescadería Paco`,
    description: recipe.description ?? `Receta de ${recipe.title} por El Pescadero Tiktokero`,
    openGraph: {
      images: recipe.thumbnail_url ? [recipe.thumbnail_url] : [],
    },
  }
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)
  if (!recipe) notFound()

  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)

  return (
    <main className="min-h-screen pb-24">
      {/* Back nav */}
      <div className="px-4 pt-6 mb-4">
        <Link href="/recetas" className="text-text-secondary text-sm">← Recetas</Link>
      </div>

      {/* Title */}
      <section className="px-4 mb-6">
        <h1 className="text-3xl font-black leading-tight mb-3">{recipe.title}</h1>
        <div className="flex gap-2 flex-wrap">
          {totalTime > 0 && (
            <span className="text-xs text-text-secondary bg-surface px-3 py-1.5 rounded-lg">⏱ {totalTime} min</span>
          )}
          {recipe.difficulty && (
            <span className="text-xs text-text-secondary bg-surface px-3 py-1.5 rounded-lg">👨‍🍳 {recipe.difficulty}</span>
          )}
          {recipe.servings && (
            <span className="text-xs text-text-secondary bg-surface px-3 py-1.5 rounded-lg">🍽 {recipe.servings} personas</span>
          )}
        </div>
      </section>

      {/* TikTok video */}
      <section className="px-4 mb-6">
        <TikTokEmbed embedHtml={recipe.tiktok_embed} tiktokUrl={recipe.tiktok_url} />
      </section>

      {/* Ingredients */}
      {recipe.ingredients.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-4">
            Ingredientes ({recipe.ingredients.length})
          </h2>
          <IngredientList ingredients={recipe.ingredients} />
        </section>
      )}

      {/* Steps preview */}
      {recipe.steps.length > 0 && (
        <section className="px-4 mb-8">
          <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-4">
            Pasos ({recipe.steps.length})
          </h2>
          <ol className="space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={step.id} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-alt text-xs font-bold flex-none flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-text-secondary leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* CTA — sticky at bottom */}
      {recipe.steps.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
          <Link
            href={`/recetas/${recipe.slug}/cocinar`}
            className="block w-full bg-primary text-white text-center font-black text-lg py-4 rounded-2xl"
          >
            🍳 Empezar a cocinar
          </Link>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 3: Verify pages render without errors**

```bash
npm run dev
```
Open http://localhost:3000/recetas — should show recipe list. Open any recipe slug — should show detail or 404 page.

- [ ] **Step 4: Commit**

```bash
git add app/recetas/
git commit -m "feat: add recipe list and detail pages with TikTok embed and ingredients"
```

---

### Task 9: Cooking mode

**Files:**
- Create: `components/cook-mode.tsx`
- Create: `app/recetas/[slug]/cocinar/page.tsx`

- [ ] **Step 1: Write CookMode client component with Wake Lock**

```tsx
// components/cook-mode.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { RecipeWithRelations, Ingredient } from '@/lib/supabase/types'

interface CookModeProps {
  recipe: RecipeWithRelations
  recipeSlug: string
}

export function CookMode({ recipe, recipeSlug }: CookModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)

  const steps = recipe.steps
  const step = steps[currentStep]

  // Wake Lock — keep screen on
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    async function acquireWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch {}
    }
    acquireWakeLock()
    return () => { wakeLock?.release() }
  }, [])

  // Get step-specific ingredients
  const stepIngredientIds = new Set(
    step?.step_ingredients?.map((si) => si.ingredient_id) ?? []
  )
  const stepIngredients: Ingredient[] = recipe.ingredients.filter(
    (ing) => stepIngredientIds.has(ing.id)
  )

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      setDone(true)
    }
  }

  function handlePrev() {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h2 className="text-3xl font-black mb-3">¡Listo!</h2>
        <p className="text-text-secondary mb-2">{recipe.title}</p>
        <p className="text-text-secondary text-sm mb-8">Buen provecho 🐟</p>
        <a
          href={recipe.tiktok_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-primary text-white font-black text-base py-4 rounded-2xl mb-4"
        >
          Ver el vídeo de Fran en TikTok →
        </a>
        <Link href={`/recetas/${recipeSlug}`} className="text-text-secondary text-sm">
          ← Volver a la receta
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-text-secondary text-sm">Paso {currentStep + 1} de {steps.length}</span>
        <Link href={`/recetas/${recipeSlug}`} className="text-text-secondary text-2xl w-10 h-10 flex items-center justify-center">
          ✕
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-alt rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step text */}
      <div className="flex-1">
        <p className="text-3xl font-extrabold leading-tight mb-8">{step.text}</p>

        {/* Step ingredients */}
        {stepIngredients.length > 0 && (
          <div className="bg-surface rounded-2xl p-4">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">
              Ingredientes de este paso
            </p>
            <ul className="space-y-1">
              {stepIngredients.map((ing) => (
                <li key={ing.id} className="text-sm text-text-secondary">
                  {ing.quantity && <span className="font-bold text-white">{ing.quantity} {ing.unit} </span>}
                  {ing.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="flex-1 bg-surface-alt text-white font-bold py-5 rounded-2xl disabled:opacity-30 text-base"
        >
          ← Anterior
        </button>
        <button
          onClick={handleNext}
          className="flex-2 bg-primary text-white font-black py-5 rounded-2xl text-base flex-[2]"
        >
          {currentStep === steps.length - 1 ? '¡Listo! 🎉' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write cooking mode page**

```tsx
// app/recetas/[slug]/cocinar/page.tsx
import { notFound } from 'next/navigation'
import { getRecipeBySlug } from '@/lib/queries'
import { CookMode } from '@/components/cook-mode'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CookPage({ params }: Props) {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)

  if (!recipe || recipe.steps.length === 0) notFound()

  return <CookMode recipe={recipe} recipeSlug={slug} />
}
```

- [ ] **Step 3: Verify cooking mode works**

Add a test recipe manually in Supabase with at least 3 steps. Open `/recetas/[slug]/cocinar`. Verify:
- Steps advance with Next button
- Progress bar updates
- Final screen shows celebration + TikTok link
- Back button returns to recipe detail

- [ ] **Step 4: Commit**

```bash
git add components/cook-mode.tsx app/recetas/
git commit -m "feat: add interactive cooking mode with step-by-step navigation and Wake Lock"
```

---

## Phase 4 — Admin Panel

### Task 10: TikTok oEmbed API route

**Files:**
- Create: `app/api/tiktok-oembed/route.ts`

- [ ] **Step 1: Write the API route**

```typescript
// app/api/tiktok-oembed/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchTikTokOEmbed, isValidTikTokUrl } from '@/lib/tiktok'

export async function POST(req: NextRequest) {
  // Auth check — only authenticated admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { url } = body

  if (!url || !isValidTikTokUrl(url)) {
    return NextResponse.json({ error: 'URL de TikTok no válida' }, { status: 400 })
  }

  try {
    const result = await fetchTikTokOEmbed(url)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'No se pudo obtener el vídeo de TikTok' },
      { status: 502 }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/
git commit -m "feat: add auth-gated TikTok oEmbed API route with SSRF protection"
```

---

### Task 11: Admin login page

**Files:**
- Create: `app/admin/login/page.tsx`

- [ ] **Step 1: Write magic link login page**

```tsx
// app/admin/login/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎣</div>
          <h1 className="text-2xl font-black">Panel Admin</h1>
          <p className="text-text-secondary text-sm mt-1">Pescadería Paco</p>
        </div>

        {sent ? (
          <div className="bg-accent-green rounded-2xl p-6 text-center">
            <p className="font-bold mb-1">¡Enlace enviado!</p>
            <p className="text-sm text-text-secondary">Revisa tu email y haz clic en el enlace para entrar.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold tracking-widest text-primary uppercase block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pescaderotiktokero@gmail.com"
                required
                className="w-full bg-surface border border-surface-alt text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-black py-4 rounded-2xl disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create admin layout (session wrapper)**

```tsx
// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/
git commit -m "feat: add admin login page with magic link auth"
```

---

### Task 12: Admin recipe list and recipe form

**Files:**
- Create: `app/admin/page.tsx`
- Create: `components/admin/recipe-form.tsx`
- Create: `components/admin/ingredients-editor.tsx`
- Create: `components/admin/steps-editor.tsx`
- Create: `app/admin/recetas/nueva/page.tsx`
- Create: `app/admin/recetas/[id]/editar/page.tsx`

- [ ] **Step 1: Write admin recipe list page**

```tsx
// app/admin/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAllRecipesAdmin } from '@/lib/queries'

export default async function AdminPage() {
  const recipes = await getAllRecipesAdmin()

  return (
    <main className="px-4 pt-8 pb-12 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black">Recetas</h1>
        <Link
          href="/admin/recetas/nueva"
          className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-xl"
        >
          + Nueva
        </Link>
      </div>

      <div className="space-y-3">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-surface rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">{recipe.title}</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  recipe.published ? 'bg-accent-green text-green-300' : 'bg-surface-alt text-text-secondary'
                }`}>
                  {recipe.published ? 'Publicada' : 'Borrador'}
                </span>
              </div>
            </div>
            <Link
              href={`/admin/recetas/${recipe.id}/editar`}
              className="text-primary text-sm font-bold"
            >
              Editar →
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Write IngredientsEditor component**

```tsx
// components/admin/ingredients-editor.tsx
'use client'
import type { Ingredient } from '@/lib/supabase/types'

interface EditorIngredient extends Partial<Ingredient> {
  _key: string
}

interface Props {
  ingredients: EditorIngredient[]
  onChange: (ingredients: EditorIngredient[]) => void
}

export function IngredientsEditor({ ingredients, onChange }: Props) {
  function add() {
    onChange([...ingredients, { _key: crypto.randomUUID(), name: '', quantity: '', unit: '', optional: false, sort_order: ingredients.length }])
  }

  function remove(key: string) {
    onChange(ingredients.filter((i) => i._key !== key))
  }

  function update(key: string, field: string, value: string | boolean) {
    onChange(ingredients.map((i) => i._key === key ? { ...i, [field]: value } : i))
  }

  return (
    <div>
      <div className="space-y-2 mb-3">
        {ingredients.map((ing) => (
          <div key={ing._key} className="flex gap-2 items-center">
            <input
              value={ing.quantity ?? ''}
              onChange={(e) => update(ing._key!, 'quantity', e.target.value)}
              placeholder="Cant."
              className="w-16 bg-surface-alt text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={ing.unit ?? ''}
              onChange={(e) => update(ing._key!, 'unit', e.target.value)}
              placeholder="Unidad"
              className="w-20 bg-surface-alt text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={ing.name ?? ''}
              onChange={(e) => update(ing._key!, 'name', e.target.value)}
              placeholder="Ingrediente"
              className="flex-1 bg-surface-alt text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={() => remove(ing._key!)} className="text-red-400 text-xl px-1">×</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="text-primary text-sm font-bold"
      >
        + Añadir ingrediente
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Write StepsEditor component**

```tsx
// components/admin/steps-editor.tsx
'use client'
import type { Step } from '@/lib/supabase/types'

interface EditorStep extends Partial<Step> {
  _key: string
  _ingredientIds: string[]
}

interface Props {
  steps: EditorStep[]
  ingredientOptions: { id: string; name: string }[]
  onChange: (steps: EditorStep[]) => void
}

export function StepsEditor({ steps, ingredientOptions, onChange }: Props) {
  function add() {
    onChange([...steps, { _key: crypto.randomUUID(), text: '', sort_order: steps.length, _ingredientIds: [] }])
  }

  function remove(key: string) {
    onChange(steps.filter((s) => s._key !== key))
  }

  function update(key: string, field: string, value: string) {
    onChange(steps.map((s) => s._key === key ? { ...s, [field]: value } : s))
  }

  function toggleIngredient(stepKey: string, ingId: string) {
    onChange(steps.map((s) => {
      if (s._key !== stepKey) return s
      const ids = s._ingredientIds.includes(ingId)
        ? s._ingredientIds.filter((id) => id !== ingId)
        : [...s._ingredientIds, ingId]
      return { ...s, _ingredientIds: ids }
    }))
  }

  return (
    <div className="space-y-4">
      {steps.map((step, i) => (
        <div key={step._key} className="bg-surface-alt rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Paso {i + 1}</span>
            <button onClick={() => remove(step._key)} className="text-red-400 text-sm">Eliminar</button>
          </div>
          <textarea
            value={step.text ?? ''}
            onChange={(e) => update(step._key, 'text', e.target.value)}
            placeholder="Describe este paso..."
            rows={2}
            className="w-full bg-surface text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-3"
          />
          {ingredientOptions.length > 0 && (
            <div>
              <p className="text-xs text-text-secondary mb-2">Ingredientes de este paso:</p>
              <div className="flex flex-wrap gap-2">
                {ingredientOptions.map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => toggleIngredient(step._key, ing.id)}
                    className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                      step._ingredientIds.includes(ing.id)
                        ? 'bg-primary text-white'
                        : 'bg-surface text-text-secondary'
                    }`}
                  >
                    {ing.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="text-primary text-sm font-bold">
        + Añadir paso
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Write RecipeForm component**

```tsx
// components/admin/recipe-form.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IngredientsEditor } from './ingredients-editor'
import { StepsEditor } from './steps-editor'
import type { Category, RecipeWithRelations } from '@/lib/supabase/types'

interface EditorIngredient {
  _key: string
  id?: string
  name: string
  quantity: string
  unit: string
  optional: boolean
  sort_order: number
}

interface EditorStep {
  _key: string
  id?: string
  text: string
  sort_order: number
  _ingredientIds: string[]
}

interface Props {
  categories: Category[]
  recipe?: RecipeWithRelations
}

export function RecipeForm({ categories, recipe }: Props) {
  const router = useRouter()
  const isEdit = !!recipe
  const supabase = createClient()

  const [title, setTitle] = useState(recipe?.title ?? '')
  const [description, setDescription] = useState(recipe?.description ?? '')
  const [tiktokUrl, setTiktokUrl] = useState(recipe?.tiktok_url ?? '')
  const [tiktokEmbed, setTiktokEmbed] = useState(recipe?.tiktok_embed ?? '')
  const [categoryId, setCategoryId] = useState(recipe?.category_id ?? '')
  const [difficulty, setDifficulty] = useState(recipe?.difficulty ?? '')
  const [prepTime, setPrepTime] = useState(recipe?.prep_time?.toString() ?? '')
  const [cookTime, setCookTime] = useState(recipe?.cook_time?.toString() ?? '')
  const [servings, setServings] = useState(recipe?.servings?.toString() ?? '')
  const [published, setPublished] = useState(recipe?.published ?? false)

  const [ingredients, setIngredients] = useState<EditorIngredient[]>(
    recipe?.ingredients.map((i) => ({ ...i, _key: i.id, quantity: i.quantity ?? '', unit: i.unit ?? '' })) ?? []
  )
  const [steps, setSteps] = useState<EditorStep[]>(
    recipe?.steps.map((s) => ({
      ...s,
      _key: s.id,
      _ingredientIds: s.step_ingredients?.map((si) => si.ingredient_id) ?? [],
    })) ?? []
  )

  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleImportTikTok() {
    if (!tiktokUrl) return
    setImporting(true)
    setError(null)
    try {
      const res = await fetch('/api/tiktok-oembed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tiktokUrl }),
      })
      if (!res.ok) throw new Error('No se pudo importar el vídeo')
      const data = await res.json()
      if (data.title && !title) setTitle(data.title)
      setTiktokEmbed(data.html ?? '')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setImporting(false)
    }
  }

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 80)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const slug = recipe?.slug ?? generateSlug(title)

      const recipeData = {
        title,
        slug,
        description: description || null,
        tiktok_url: tiktokUrl,
        tiktok_embed: tiktokEmbed || null,
        tiktok_embed_cached_at: tiktokEmbed ? new Date().toISOString() : null,
        category_id: categoryId || null,
        difficulty: (difficulty as 'fácil' | 'medio' | 'difícil') || null,
        prep_time: prepTime ? parseInt(prepTime) : null,
        cook_time: cookTime ? parseInt(cookTime) : null,
        servings: servings ? parseInt(servings) : null,
        published,
      }

      let recipeId: string

      if (isEdit) {
        const { error } = await supabase.from('recipes').update(recipeData).eq('id', recipe.id)
        if (error) throw error
        recipeId = recipe.id

        // Delete existing relations before re-inserting
        await supabase.from('step_ingredients').delete().in(
          'step_id',
          recipe.steps.map((s) => s.id)
        )
        await supabase.from('steps').delete().eq('recipe_id', recipeId)
        await supabase.from('ingredients').delete().eq('recipe_id', recipeId)
      } else {
        const { data, error } = await supabase.from('recipes').insert(recipeData).select('id').single()
        if (error) throw error
        recipeId = data.id
      }

      // Insert ingredients
      const savedIngredients: { _key: string; id: string }[] = []
      if (ingredients.length > 0) {
        const { data: insertedIngs, error } = await supabase
          .from('ingredients')
          .insert(
            ingredients.map((ing, i) => ({
              recipe_id: recipeId,
              name: ing.name,
              quantity: ing.quantity || null,
              unit: ing.unit || null,
              optional: ing.optional,
              sort_order: i,
            }))
          )
          .select('id')
        if (error) throw error
        ingredients.forEach((ing, i) => {
          savedIngredients.push({ _key: ing._key, id: insertedIngs[i].id })
        })
      }

      // Insert steps + step_ingredients
      if (steps.length > 0) {
        const { data: insertedSteps, error: stepsError } = await supabase
          .from('steps')
          .insert(
            steps.map((step, i) => ({
              recipe_id: recipeId,
              sort_order: i,
              text: step.text,
            }))
          )
          .select('id')
        if (stepsError) throw stepsError

        const stepIngredientsToInsert: { step_id: string; ingredient_id: string }[] = []
        steps.forEach((step, i) => {
          step._ingredientIds.forEach((_key) => {
            const saved = savedIngredients.find((s) => s._key === _key)
            if (saved) {
              stepIngredientsToInsert.push({ step_id: insertedSteps[i].id, ingredient_id: saved.id })
            }
          })
        })

        if (stepIngredientsToInsert.length > 0) {
          await supabase.from('step_ingredients').insert(stepIngredientsToInsert)
        }
      }

      router.push('/admin')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto px-4 pt-6 pb-16">
      <h1 className="text-2xl font-black">{isEdit ? 'Editar receta' : 'Nueva receta'}</h1>

      {/* TikTok URL */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-primary uppercase mb-2">URL de TikTok</label>
        <div className="flex gap-2">
          <input
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@elpescaderodemalaga/video/..."
            className="flex-1 bg-surface-alt text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleImportTikTok}
            disabled={importing || !tiktokUrl}
            className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50"
          >
            {importing ? '...' : '→'}
          </button>
        </div>
        {tiktokEmbed && <p className="text-green-400 text-xs mt-1">✓ Vídeo importado</p>}
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-primary uppercase mb-2">Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-surface-alt text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-primary uppercase mb-2">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-surface-alt text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Metadata row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Prep (min)</label>
          <input type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Cocción</label>
          <input type="number" value={cookTime} onChange={(e) => setCookTime(e.target.value)} className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Personas</label>
          <input type="number" value={servings} onChange={(e) => setServings(e.target.value)} className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      {/* Category + difficulty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Categoría</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
            <option value="">—</option>
            {categories.filter(c => c.slug !== 'todos').map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Dificultad</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
            <option value="">—</option>
            <option value="fácil">Fácil</option>
            <option value="medio">Medio</option>
            <option value="difícil">Difícil</option>
          </select>
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-primary uppercase mb-3">Ingredientes</label>
        <IngredientsEditor ingredients={ingredients as any} onChange={setIngredients as any} />
      </div>

      {/* Steps */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-primary uppercase mb-3">Pasos</label>
        <StepsEditor
          steps={steps as any}
          ingredientOptions={ingredients.map((i) => ({ id: i._key, name: i.name || 'Sin nombre' }))}
          onChange={setSteps as any}
        />
      </div>

      {/* Published toggle */}
      <div className="flex items-center justify-between bg-surface rounded-2xl px-4 py-4">
        <span className="font-bold text-sm">Publicar receta</span>
        <button
          type="button"
          onClick={() => setPublished(!published)}
          className={`w-12 h-6 rounded-full transition-colors ${published ? 'bg-primary' : 'bg-surface-alt'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${published ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-primary text-white font-black py-4 rounded-2xl text-lg disabled:opacity-60"
      >
        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear receta'}
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Write nueva + editar pages**

```tsx
// app/admin/recetas/nueva/page.tsx
import { getCategories } from '@/lib/queries'
import { RecipeForm } from '@/components/admin/recipe-form'

export default async function NewRecipePage() {
  const categories = await getCategories()
  return <RecipeForm categories={categories} />
}
```

```tsx
// app/admin/recetas/[id]/editar/page.tsx
import { notFound } from 'next/navigation'
import { getCategories, getRecipeByIdAdmin } from '@/lib/queries'
import { RecipeForm } from '@/components/admin/recipe-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params
  const [recipe, categories] = await Promise.all([
    getRecipeByIdAdmin(id),
    getCategories(),
  ])
  if (!recipe) notFound()
  return <RecipeForm categories={categories} recipe={recipe} />
}
```

- [ ] **Step 6: Test admin flow end-to-end**

1. Navigate to http://localhost:3000/admin — should redirect to `/admin/login`
2. Enter email, get magic link, click it — should land on `/admin`
3. Click "+ Nueva", paste a TikTok URL, click "→" — title and embed should auto-fill
4. Add 2 ingredients and 2 steps, assign ingredients to steps
5. Toggle "Publicar", save
6. Verify recipe appears at http://localhost:3000/recetas
7. Open recipe, click "Empezar a cocinar", go through all steps

- [ ] **Step 7: Commit**

```bash
git add app/admin/ components/admin/
git commit -m "feat: add admin panel — recipe list, create/edit form with TikTok import"
```

---

## Phase 5 — Polish and Deploy

### Task 13: Deploy to Vercel

- [ ] **Step 1: Push all changes to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Import project in Vercel**

Go to https://vercel.com → Add New Project → Import from GitHub → select `pescaderia-paco`.

- [ ] **Step 3: Set environment variables in Vercel**

In the Vercel project settings → Environment Variables, add:
```
NEXT_PUBLIC_SUPABASE_URL      = (from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_ANON_KEY = (from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY     = (from Supabase dashboard)
```

- [ ] **Step 4: Configure Supabase auth redirect URL**

In Supabase dashboard → Authentication → URL Configuration:
- **Site URL:** `https://your-vercel-domain.vercel.app`
- **Redirect URLs:**
  - `https://your-vercel-domain.vercel.app/admin`
  - `http://localhost:3000/admin` ← required for magic link to work during local development

- [ ] **Step 5: Verify production deploy**

Open the Vercel URL. Test:
- Home page loads with recipe grid
- Recipe detail opens and shows TikTok embed
- Cooking mode works on mobile
- Admin login sends magic link
- Admin can create and publish a recipe

- [ ] **Step 6: Final commit with any prod fixes**

```bash
git add -A && git commit -m "feat: production deploy configuration"
git push
```

---

## Done ✅

At this point the app is live with:
- Mobile-first recipe catalogue
- TikTok video embed on every recipe
- Interactive step-by-step cooking mode with Wake Lock
- Admin panel secured by magic-link auth (Fran's email only)
- Automatic TikTok metadata import
- ISR (revalidate every 60s) for fast page loads
- WCAG AA compliant color contrast
- 404 pages on all dynamic routes
