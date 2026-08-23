import { createServer, type IncomingMessage } from 'node:http';
import { findHandler, getRegisteredRoutes } from './router.js';
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
  const path = queryIndex >= 0 ? url.substring(0, queryIndex) : url;
  return decodeURIComponent(path);
}

async function readBody(req: IncomingMessage): Promise<string> {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body;
}

function toLambdaEvent(
  req: IncomingMessage,
  body: string,
  params: Record<string, string>,
): LambdaEvent {
  return {
    httpMethod: req.method ?? 'GET',
    path: parsePath(req.url ?? '/'),
    body,
    headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
    pathParameters: Object.keys(params).length > 0 ? params : undefined,
    queryStringParameters: {},
    requestContext: { authorizer: undefined },
  };
}

function notFoundResponse(): LambdaResponse {
  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: 'Not found' }),
  };
}

function sendResponse(res: NodeJS.WritableStream, response: LambdaResponse): void {
  const nodeRes = res as import('node:http').ServerResponse;
  nodeRes.writeHead(response.statusCode, response.headers);
  nodeRes.end(response.body);
}

const server = createServer(async (req, res) => {
  const path = parsePath(req.url ?? '/');
  const match = findHandler(req.method ?? 'GET', path);

  if (!match) {
    sendResponse(res, notFoundResponse());
    return;
  }

  const body = await readBody(req);
  const event = toLambdaEvent(req, body, match.params);
  const response = await match.handler(event);

  sendResponse(res, response);
});

server.listen(PORT, () => {
  console.log(`Backend dev server running on http://localhost:${PORT}`);
  for (const route of getRegisteredRoutes()) {
    console.log(`  ${route.method.padEnd(7)} ${route.pattern}`);
  }
});
