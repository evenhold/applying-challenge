import { createServer, type IncomingMessage } from 'node:http';
import { handler as healthHandler } from './handlers/health.js';
import { handler as helloHandler } from './handlers/hello.js';
import type { LambdaEvent, LambdaResponse } from './types/index.js';

const PORT = Number(process.env.PORT || 3001);

function toEvent(req: IncomingMessage, body: string): LambdaEvent {
  return {
    httpMethod: req.method ?? 'GET',
    path: req.url ?? '/',
    body,
    headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
    pathParameters: {},
    queryStringParameters: {},
    requestContext: { authorizer: undefined },
  };
}

const routes: Record<string, (event: LambdaEvent) => Promise<LambdaResponse>> = {
  '/health': healthHandler,
  '/hello': helloHandler,
};

const server = createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;

  const event = toEvent(req, body);
  const handler = routes[event.path];

  const response = handler
    ? await handler(event)
    : {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' }),
      };

  res.writeHead(response.statusCode, response.headers);
  res.end(response.body);
});

server.listen(PORT, () => {
  console.log(`Backend dev server running on http://localhost:${PORT}`);
  console.log('  GET /health');
  console.log('  GET /hello');
});
