# Backend - Node.js 24 + Lambda

## Estructura

```
backend/
├── src/
│   ├── handlers/
│   │   ├── health.ts          # GET /health
│   │   └── hello.ts           # GET /hello
│   └── types/
│       └── index.ts           # Tipos TypeScript
├── tests/
│   └── unit/
│       ├── health.test.ts     # Test health handler
│       └── hello.test.ts      # Test hello handler
├── package.json               # pnpm
├── tsconfig.json              # TypeScript 7
├── vitest.config.ts           # Vitest
└── biome.json                 # Biome (lint + format)
```

## Stack

| Componente | Versión |
|---|---|
| Node.js | 24.x |
| TypeScript | 7.x |
| Vitest | 3.x |
| Biome | 2.x |
| AWS SDK | 3.x |

## Comandos

```bash
# Desarrollo
pnpm dev              # Watch mode con tsx

# Build
pnpm build            # Compilar TypeScript

# Tests
pnpm test             # Ejecutar tests
pnpm test:watch       # Watch mode

# Lint
pnpm lint             # Verificar código
pnpm lint:fix         # Auto-corregir
```

## Handlers

| Handler | Método | Ruta | Descripción |
|---|---|---|---|
| health | GET | /health | Health check |
| hello | GET | /hello | Hello World |

## Types

Ubicados en `src/types/index.ts`:
- `LambdaEvent` - Evento de Lambda
- `LambdaResponse` - Respuesta de Lambda
- `Merchant` - Comercio
- `Seller` - Vendedor
- `ApiResponse<T>` - Respuesta estándar
