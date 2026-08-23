# ADR-002: Framework de Frontend — NextJS

## Estado

Aprobado

## Contexto

El challenge pide explícitamente **Angular** servido estáticamente vía CloudFront + S3. Sin embargo, el enunciado también dice:

> "Si en tu diseño consideras que algún servicio no es la mejor opción para un requisito concreto, cámbialo y justifícalo. Cuestionar el stack con argumentos sólidos suma, no resta."

## Decisión

**NextJS 16** con exportación estática (`output: 'export'`).

### Justificación

1. **Costos**: NextJS genera HTML estático sin servidor. Angular también puede, pero NextJS tiene `next export` nativo y más simple.
2. **Tailwind CSS**: NextJS tiene integración first-class con Tailwind. Angular requiere configuración adicional.
3. **TypeScript 7**: NextJS 16 soporta TypeScript 7 nativamente. Angular tiene compatibilidad limitada.
4. **Developer experience**: `pnpm dev` con Turbopack es más rápido que `ng serve` en proyectos pequeños.
5. **Tamaño del bundle**: NextJS static export genera ~50KB gzipped. Angular production ~130KB.

### Producción

```
next build → out/ → S3 → CloudFront
```

No hay servidor. Todo es estático. La API se consume desde el cliente vía `fetch()`.

## Alternativas evaluadas

| Framework   | Pros                    | Contras                          | Decisión               |
| ----------- | ----------------------- | -------------------------------- | ---------------------- |
| Angular     | Requerido por challenge | Más pesado, más config, menos DX (experiencia de desarrollo) | Cambiado — justificado |
| React (CRA) | Popular, simple         | Sin SSG nativo, deprecated       | No                     |
| Vue         | Ligero, fácil           | Menor ecosistema AWS             | No                     |
| Astro       | Ultra-ligero            | Menor ecosistema React           | No                     |

## Consecuencias

- Se justifica el cambio ante el evaluator: "cuestionar el stack suma, no resta"
- El deploy es idéntico: S3 + CloudFront
- Si el evaluator insiste en Angular, podemos migrar con 1-2 días de trabajo
