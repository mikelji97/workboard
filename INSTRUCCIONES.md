# 🚀 INSTRUCCIONES DE INSTALACIÓN — Dashboard Personal

Sigue estos pasos en orden. En ~15 minutos tendrás tu app online.

---

## PASO 1 — Crear proyecto en Supabase (tu base de datos)

1. Ve a **https://supabase.com** y crea una cuenta (puedes usar Google)
2. Haz clic en **"New Project"**
3. Ponle nombre: `dashboard-personal` (o lo que quieras)
4. Pon una contraseña para la base de datos (guárdala por si acaso)
5. Selecciona la región más cercana: **West EU (Ireland)** 
6. Haz clic en **"Create new project"** — espera ~2 minutos

---

## PASO 2 — Crear las tablas en Supabase

1. En tu proyecto de Supabase, ve a **SQL Editor** (icono en la barra lateral izquierda)
2. Haz clic en **"New query"**
3. **Copia y pega** TODO este bloque SQL y dale a **"Run"**:

```sql
-- ══════════════════════════════════════════
--  TABLAS DEL DASHBOARD PERSONAL
-- ══════════════════════════════════════════

-- Tabla de TAREAS
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  status text default 'pending' check (status in ('pending', 'doing', 'done')),
  created_at timestamptz default now()
);

-- Tabla de PROYECTOS
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#a78bfa',
  progress int default 0,
  total_tasks int default 0,
  completed_tasks int default 0,
  files jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Tabla de NOTAS / IDEAS
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  color text default '#a78bfa',
  pinned boolean default false,
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════
--  SEGURIDAD (Row Level Security)
--  Cada usuario solo ve SUS propios datos
-- ══════════════════════════════════════════

alter table public.tasks enable row level security;
alter table public.projects enable row level security;
alter table public.notes enable row level security;

-- Políticas para TASKS
create policy "Users read own tasks"   on public.tasks for select using (auth.uid() = user_id);
create policy "Users insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- Políticas para PROJECTS
create policy "Users read own projects"   on public.projects for select using (auth.uid() = user_id);
create policy "Users insert own projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users update own projects" on public.projects for update using (auth.uid() = user_id);
create policy "Users delete own projects" on public.projects for delete using (auth.uid() = user_id);

-- Políticas para NOTES
create policy "Users read own notes"   on public.notes for select using (auth.uid() = user_id);
create policy "Users insert own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users update own notes" on public.notes for update using (auth.uid() = user_id);
create policy "Users delete own notes" on public.notes for delete using (auth.uid() = user_id);
```

4. Deberías ver **"Success. No rows returned"** — eso es correcto

---

## PASO 3 — Copiar tus claves de Supabase

1. En Supabase, ve a **Settings** (rueda dentada abajo a la izquierda)
2. Haz clic en **"API"** en el menú lateral
3. Copia estos dos valores:

   | Qué copiar | Dónde está |
   |---|---|
   | **Project URL** | Sección "Project URL" — algo como `https://xxxx.supabase.co` |
   | **anon public key** | Sección "Project API keys" → la key que dice `anon` `public` |

4. Crea un archivo `.env.local` en la raíz del proyecto (junto a package.json) con:

```
VITE_SUPABASE_URL=https://tu-xxxx.supabase.co
VITE_SUPABASE_ANON=tu-clave-anon-aqui
```

---

## PASO 4 — (Opcional) Desactivar confirmación por email

Por defecto Supabase pide confirmar el email al registrarse. 
Para desarrollo o uso privado, puedes desactivarlo:

1. En Supabase → **Authentication** → **Providers** → **Email**
2. Desactiva **"Confirm email"**
3. Guarda

Así los usuarios podrán usar la app directamente al registrarse.

---

## PASO 5 — Instalar y probar en local

Necesitas tener **Node.js** instalado (v18+). Si no lo tienes: https://nodejs.org

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
# Instalar dependencias
npm install

# Arrancar en modo desarrollo
npm run dev
```

Se abrirá en **http://localhost:5173** — deberías ver la pantalla de login.

---

## PASO 6 — Desplegar en Vercel (tu enlace público)

### Opción A: Desde la interfaz web (más fácil)

1. Ve a **https://vercel.com** y crea una cuenta (puedes usar Google)
2. Haz clic en **"Add New" → "Project"**
3. Arrastra la carpeta del proyecto o conéctalo desde GitHub
4. En **"Environment Variables"**, añade:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON` = tu clave anon
5. Haz clic en **"Deploy"**
6. En 1-2 minutos tendrás tu URL tipo: **https://tu-dashboard.vercel.app**

### Opción B: Desde terminal (si te manejas)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel

# Seguir las instrucciones — te pedirá las variables de entorno
```

---

## PASO 7 — ¡Compartir!

Tu dashboard estará en una URL tipo `https://tu-app.vercel.app`

- Tú accedes con tu email y contraseña
- Cualquier otra persona puede entrar a esa URL, registrarse, y tendrá su propio espacio
- Los datos de cada usuario son 100% privados (Row Level Security)

---

## 📌 RESUMEN DE ARQUITECTURA

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Navegador  │────▶│    Vercel     │────▶│   Supabase   │
│  (React app) │     │  (hosting)   │     │  (BD + Auth) │
└──────────────┘     └──────────────┘     └──────────────┘
```

- **Frontend**: React + Tailwind + Vite (lo que acabamos de construir)
- **Hosting**: Vercel (sirve los archivos estáticos)
- **Backend**: Supabase (base de datos PostgreSQL + autenticación)
- **Coste**: 0€ en el plan gratuito de ambos

---

## ❓ PROBLEMAS COMUNES

**"Invalid login credentials"**
→ Revisa que el email y contraseña sean correctos. Si acabas de registrarte, 
  puede que necesites confirmar el email (ver Paso 4).

**"No se conecta / pantalla en blanco"**
→ Revisa que las claves en `.env.local` sean correctas y que hayas reiniciado 
  el servidor (`npm run dev`) después de crearlas.

**"Los datos no se guardan"**  
→ Revisa que hayas ejecutado el SQL del Paso 2 correctamente en Supabase.
  Ve a Table Editor en Supabase y comprueba que existen las tablas tasks, projects, notes.

**"Quiero cambiar el diseño"**
→ Todos los estilos están en `src/Dashboard.jsx` y `src/LoginPage.jsx`. 
  Los colores, textos y layout se pueden modificar fácilmente.
