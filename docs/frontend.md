# Frontend - NextJS 16

## Estructura

```
frontend/
├── src/
│   ├── app/                    # App Router (NextJS 16)
│   │   ├── layout.tsx          # Layout raíz
│   │   ├── page.tsx            # SPA principal (todas las vistas)
│   │   └── globals.css         # Estilos globales
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   └── auth.ts             # Cognito auth
│   └── types/
│       └── index.ts            # Tipos TypeScript
├── tests/
│   └── unit/
│       └── page.test.tsx       # Test básico
├── package.json                # pnpm
├── tsconfig.json               # TypeScript 7
├── vitest.config.ts            # Vitest config
├── vitest.d.ts                 # Tipos Vitest
├── biome.json                  # Biome (lint + format)
└── next.config.mjs             # NextJS config
```

## Stack

| Componente | Versión |
|---|---|
| NextJS | 16.x (App Router, Turbopack) |
| React | 19.x |
| TypeScript | 7.x |
| Vitest | 3.x |
| Biome | 2.x (lint + format) |
| Estilos | CSS Modules (globals.css) |

## Comandos

```bash
# Desarrollo
pnpm dev              # Iniciar dev server (puerto 3000)

# Build
pnpm build            # Build estático para S3

# Lint + Format
pnpm lint             # Verificar código
pnpm lint:fix         # Auto-corregir errores
pnpm format           # Formatear código

# Tests
pnpm test             # Ejecutar tests
pnpm test:watch       # Ejecutar tests en watch mode
```

## Biome

Lint y formatter unificado. Configurado en `biome.json`.

**Reglas:**
- Indentación: 2 espacios
- Comillas: simples
- Punto y coma: siempre
- Línea máxima: 100 caracteres
- Reglas recomendadas habilitadas

**Comandos útiles:**
```bash
pnpm lint             # Verificar sin modificar
pnpm lint:fix         # Auto-corregir (safe fixes)
pnpm format           # Formatear todo
```

## Páginas

| Ruta | Descripción |
|---|---|
| `/` | SPA principal con navegación via useState (home, login, dashboard, merchants/new, merchants/detail) |

**Nota**: La aplicación es un SPA (Single Page Application) con todas las vistas en un solo archivo `page.tsx`. No hay router de NextJS.

## API Client

Ubicado en `src/lib/api.ts`. Configurado para conectar con FLOCI localmente.

```typescript
import { api } from '@/lib/api'

// GET
const { data, success } = await api.get<Merchant[]>('/merchants')

// POST
const { data, success } = await api.post<Merchant>('/merchants', { ruc: '12345678901' })
```

## Types

Ubicados en `src/types/index.ts`. Definen los modelos de dominio:
- `Merchant` - Comercio
- `Seller` - Vendedor
- `MerchantStatus` - Estados del comercio
- `ApiResponse<T>` - Respuesta estándar de la API
