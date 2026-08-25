import { createServer, type IncomingMessage } from 'node:http';
import { importSPKI, jwtVerify } from 'jose';
import { findHandler, getRegisteredRoutes } from './router.js';
import type { LambdaEvent, LambdaResponse } from './types/index.js';
import { logger, createChildLogger } from './lib/logger.js';

const log = createChildLogger('server');
const PORT = Number(process.env.PORT || 3001);

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
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

function extractBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization) return undefined;
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return undefined;
  return parts[1];
}

async function validateJwtToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const issuer = process.env.AUTH_MOCK === 'true'
      ? undefined
      : `http://localhost:4566/${process.env.COGNITO_USER_POOL_ID}`;

    if (!issuer) return null;

    const { payload } = await jwtVerify(token, async (header) => {
      const JWKS_URI = `http://localhost:4566/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
      const response = await fetch(JWKS_URI);
      const jwks = await response.json() as { keys: Array<{ kty: string; kid: string; n: string; e: string }> };
      const key = jwks.keys.find((k) => k.kid === header.kid);
      if (!key) throw new Error('Key not found');
      return importSPKI(
        `-----BEGIN PUBLIC KEY-----\n${Buffer.from(JSON.stringify({ kty: key.kty, n: key.n, e: key.e })).toString('base64')}\n-----END PUBLIC KEY-----`,
        'RS256',
      );
    }, { issuer });

    return payload;
  } catch {
    return null;
  }
}

function toLambdaEvent(
  req: IncomingMessage,
  body: string,
  params: Record<string, string>,
  claims?: Record<string, unknown>,
): LambdaEvent {
  return {
    httpMethod: req.method ?? 'GET',
    path: parsePath(req.url ?? '/'),
    body,
    headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
    pathParameters: Object.keys(params).length > 0 ? params : undefined,
    queryStringParameters: {},
    requestContext: {
      authorizer: claims ? { claims: claims as { sub: string; email: string } } : undefined,
    },
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
  const start = Date.now();
  const path = parsePath(req.url ?? '/');
  const match = findHandler(req.method ?? 'GET', path);

  if (!match) {
    log.warn({ method: req.method, path }, 'Route not found');
    sendResponse(res, notFoundResponse());
    return;
  }

  const body = await readBody(req);

  let claims: Record<string, unknown> | undefined;
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);
  if (token) {
    const validatedClaims = await validateJwtToken(token);
    if (validatedClaims) {
      claims = validatedClaims;
    }
  }

  const event = toLambdaEvent(req, body, match.params, claims);
  const response = await match.handler(event);

  const duration = Date.now() - start;
  log.info({
    method: req.method,
    path,
    status: response.statusCode,
    duration,
    sellerId: claims?.sub,
  }, 'Request handled');

  sendResponse(res, response);
});

server.listen(PORT, () => {
  log.info({ port: PORT }, 'Backend dev server started');
  for (const route of getRegisteredRoutes()) {
    log.debug({ method: route.method, pattern: route.pattern }, 'Route registered');
  }
});
