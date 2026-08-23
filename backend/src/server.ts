import { createServer, type IncomingMessage } from 'node:http';
import { handler as healthHandler } from './handlers/health.js';
import { handler as helloHandler } from './handlers/hello.js';
import { handler as merchantsHandler } from './handlers/merchants.js';
import type { LambdaEvent, LambdaResponse } from './types/index.js';

const PORT = Number(process.env.PORT || 3001);

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
} as const;

function parsePath(url: string): string {
  const queryIndex = url.indexOf('?');
  return queryIndex >= 0 ? url.substring(0, queryIndex) : url;
}

function extractPathParam(path: string, pattern: string): string | null {
  const pathParts = path.split('/');
  const patternParts = pattern.split('/');
  if (pathParts.length !== patternParts.length) return null;
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) continue;
    if (pathParts[i] !== patternParts[i]) return null;
  }
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) return pathParts[i];
  }
  return null;
}

function toEvent(req: IncomingMessage, body: string): LambdaEvent {
  const path = parsePath(req.url ?? '/');
  let pathParameters: Record<string, string> | undefined;

  const idParam = extractPathParam(path, '/merchants/:id');
  if (idParam) {
    pathParameters = { id: idParam };
  }

  return {
    httpMethod: req.method ?? 'GET',
    path,
    body,
    headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
    pathParameters,
    queryStringParameters: {},
    requestContext: { authorizer: undefined },
  };
}

const staticRoutes: Record<string, (event: LambdaEvent) => Promise<LambdaResponse>> = {
  '/health': healthHandler,
  '/hello': helloHandler,
};

const merchantMethods: Record<string, (event: LambdaEvent) => Promise<LambdaResponse>> = {
  'POST /merchants': merchantsHandler,
  'GET /merchants': merchantsHandler,
  'GET /merchants/:id': merchantsHandler,
  'PUT /merchants/:id': merchantsHandler,
};

const server = createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;

  const event = toEvent(req, body);

  let handler = staticRoutes[event.path];
  if (!handler) {
    const routeKey = `${event.httpMethod} ${event.path}`;
    handler = merchantMethods[routeKey];
    if (!handler && event.pathParameters) {
      handler = merchantMethods[`${event.httpMethod} /merchants/:id`];
    }
  }

  const response = handler
    ? await handler(event)
    : {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Not found' }),
      };

  res.writeHead(response.statusCode, response.headers);
  res.end(response.body);
});

server.listen(PORT, () => {
  console.log(`Backend dev server running on http://localhost:${PORT}`);
  console.log('  GET  /health');
  console.log('  GET  /hello');
  console.log('  POST /merchants');
  console.log('  GET  /merchants');
  console.log('  GET  /merchants/:id');
  console.log('  PUT  /merchants/:id');
});
