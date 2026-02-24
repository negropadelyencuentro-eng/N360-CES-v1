# N360 CES — Sistema de Gestión de Gimnasio

Panel de gestión premium para el Centro de Entrenamiento Especializado N360.

## Stack

- **Vite** + **React 19**
- **Tailwind CSS v3**
- **Supabase** (PostgreSQL + Storage)
- **DM Sans** (tipografía premium)

## Estructura

```
src/
├── context/
│   └── AuthContext.jsx       # Auth global con localStorage
├── lib/
│   └── supabase.js           # Cliente Supabase
├── components/
│   └── ui/
│       └── index.jsx         # StatCard, Table, Modal, Badge, Loader...
├── pages/
│   ├── Login.jsx             # Login por username + password
│   ├── profesor/
│   │   ├── ProfesorDashboard.jsx
│   │   └── components/
│   │       ├── Sidebar.jsx   # Sidebar colapsable (mobile ready)
│   │       ├── Topbar.jsx
│   │       ├── Overview.jsx  # Stats en tiempo real
│   │       ├── Alumnos.jsx   # Tabla con búsqueda
│   │       ├── Rutinas.jsx   # Upload de PDF a Supabase Storage
│   │       └── Asistencias.jsx # Registro de asistencia
│   └── alumno/
│       └── AlumnoDashboard.jsx # Vista simplificada para alumnos
```

## Setup

1. Clonar el proyecto y copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

2. Completar con tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

3. Instalar dependencias y correr:

```bash
npm install
npm run dev
```

## Tablas Supabase necesarias

```sql
-- Usuarios
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text unique not null,
  password text not null,
  role text check (role in ('PROFESOR', 'ALUMNO')) not null,
  status text default 'ACTIVO',
  gym_id uuid,
  created_at timestamptz default now()
);

-- Rutinas
create table routines (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id),
  profesor_id uuid references users(id),
  gym_id uuid,
  nombre text,
  file_url text,
  created_at timestamptz default now()
);

-- Asistencias
create table attendances (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id),
  gym_id uuid,
  date date not null,
  status text default 'PRESENTE',
  created_at timestamptz default now()
);
```

## Storage Supabase

Crear un bucket llamado `routines` (privado) para almacenar los PDFs.

## Roles

| Rol | Vista |
|-----|-------|
| `PROFESOR` | Dashboard completo con sidebar, gestión de alumnos, rutinas y asistencias |
| `ALUMNO` | Vista simplificada: rutina asignada + historial de asistencias |

## Próximos pasos recomendados

- [ ] Hash de contraseñas (bcrypt en edge functions)
- [ ] Row Level Security (RLS) en Supabase
- [ ] Gestión de múltiples gimnasios (gym_id)
- [ ] Estadísticas avanzadas
- [ ] Notificaciones
