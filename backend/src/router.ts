import { handler as healthHandler } from './handlers/health.js';
import { handler as helloHandler } from './handlers/hello.js';
import { handler as merchantsHandler } from './handlers/merchants.js';
import type { LambdaEvent, LambdaResponse } from './types/index.js';

type Handler = (event: LambdaEvent) => Promise<LambdaResponse>;

interface Route {
  method: string;
  pattern: string;
  handler: Handler;
}

/**
 * Definición declarativa de rutas.
 * Cada ruta es: METHOD + pattern (con :param opcionales) + handler.
 */
const routes: Route[] = [
  { method: 'GET', pattern: '/health', handler: healthHandler },
  { method: 'GET', pattern: '/hello', handler: helloHandler },
  { method: 'POST', pattern: '/merchants', handler: merchantsHandler },
  { method: 'GET', pattern: '/merchants', handler: merchantsHandler },
  { method: 'GET', pattern: '/merchants/:id', handler: merchantsHandler },
  { method: 'PUT', pattern: '/merchants/:id', handler: merchantsHandler },
];

interface MatchResult {
  handler: Handler;
  params: Record<string, string>;
}

/**
 * Compara un path real con un pattern que puede tener params (:param).
 * Retorna si matchea y los params extraídos.
 *
 * Ejemplo:
 *   matchRoute('/merchants/123', '/merchants/:id')
 *   → { matched: true, params: { id: '123' } }
 *
 *   matchRoute('/merchants', '/merchants/:id')
 *   → { matched: false, params: {} }
 */
function matchRoute(
  path: string,
  pattern: string,
): { matched: boolean; params: Record<string, string> } {
  const pathParts = path.split('/');
  const patternParts = pattern.split('/');

  if (pathParts.length !== patternParts.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      // Es un param: extraer el nombre y guardar el valor
      const paramName = patternParts[i].slice(1);
      params[paramName] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      // Segmento fijo que no coincide
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}

/**
 * Busca el handler para un método + path.
 * Retorna el handler y los params extraídos, o null si no hay match.
 */
export function findHandler(method: string, path: string): MatchResult | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const { matched, params } = matchRoute(path, route.pattern);
    if (matched) {
      return { handler: route.handler, params };
    }
  }

  return null;
}

/**
 * Retorna todas las rutas registradas (para logging).
 */
export function getRegisteredRoutes(): Array<{ method: string; pattern: string }> {
  return routes.map(({ method, pattern }) => ({ method, pattern }));
}
