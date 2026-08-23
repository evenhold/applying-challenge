# Seguridad — Mini Onboarding

## OWASP Top 10 — Mapeo por Componente

### A01:2021 — Broken Access Control

| Componente | Riesgo | Mitigación |
|-----------|--------|------------|
| API Gateway | Acceso no autorizado | Cognito JWT Authorizer en todas las rutas excepto /health |
| DynamoDB | Acceso a datos de otros sellers | `condition: sellerId = :currentSeller` en queries |
| IDOR | Cambiar merchantId en URL para acceder a otros | **Authorization server-side**: sellerId del JWT === merchant.sellerId |
| Frontend | Información expuesta en cliente | Solo datos necesarios en responses |

**Implementación:**
```typescript
// En cada Lambda handler
const sellerId = event.requestContext.authorizer?.claims?.sub
if (!sellerId) return { statusCode: 401 }

// En cada operación con merchant específico
const merchant = await getMerchant(merchantId)
if (merchant.sellerId !== sellerId) return { statusCode: 403 }

// En DynamoDB query (listar merchants)
ExpressionAttributeValues: {
  ':sellerId': `SELLER#${sellerId}`  // Siempre filtrar por seller
}
```

### A02:2021 — Cryptographic Failures

| Componente | Riesgo | Mitigación |
|-----------|--------|------------|
| HTTPS | Datos en tránsito | CloudFront fuerza HTTPS, API Gateway solo HTTPS |
| Cognito | Passwords storage | Cognito hashea bcrypt internamente |
| Secrets | Credenciales expuestas | IAM Roles (nunca hardcoded), FLOCI para dev |
| DynamoDB | Datos en reposo | Encryption at rest habilitado por defecto |

### A03:2021 — Injection

| Componente | Riesgo | Mitigación |
|-----------|--------|------------|
| API input | SQL/NoSQL injection | DynamoDB usa parametrización nativa |
| RUC input | Malformación | Validación server-side (módulo 11) |
| Headers | Header injection | API Gateway valida headers |

**Implementación:**
```typescript
// Validación de RUC (no confiar en input del cliente)
if (!validateRuc(ruc)) {
  return { statusCode: 400, body: 'Invalid RUC' }
}

// DynamoDB no tiene injection — usa API parametrizada
await docClient.send(new PutCommand({
  TableName: TABLE_NAME,
  Item: { PK: id, SK: 'PROFILE', ... }
}))
```

### A04:2021 — Insecure Design

| Decisión | Justificación |
|----------|---------------|
| Serverless (Lambda) | No hay servidor que comprometer |
| Cognito | No reinventamos auth |
| SQS DLQ | Fallos no se pierden |
| Single-table DynamoDB | Menos superficie de ataque |

### A05:2021 — Security Misconfiguration

| Componente | Configuración segura |
|-----------|---------------------|
| API Gateway | CORS restrictivo en producción, solo origins permitidos |
| Lambda | Runtime más reciente (Node.js 24), minimal permissions |
| DynamoDB | Encryption at rest, point-in-time recovery |
| S3 | Block public access, encryption |
| CloudFront | WAF habilitado |

### A06:2021 — Vulnerable Components

| Medida | Implementación |
|--------|----------------|
| Dependencias | `pnpm audit` en CI, dependabot |
| Lock files | `pnpm-lock.yaml` versionado |
| Docker images | Tags específicas, no `latest` en producción |

### A07:2021 — Auth Failures

| Protección | Implementación |
|-----------|----------------|
| Brute force | Cognito account lockout tras 5 intentos |
| Token theft | Tokens en memoria (no localStorage), expiry 1h |
| Refresh tokens | Rotation, expiry 30 días |
| MFA | Optional, configurable por usuario |

### A08:2021 — Data Integrity Failures

| Capa | Protección |
|------|------------|
| SQS messages | JSON schema validation en consumer |
| DynamoDB writes | Condition expressions |
| API requests | Input validation en Lambda |

### A09:2021 — Logging Failures

| Componente | Logging |
|-----------|---------|
| API Gateway | Access logs → CloudWatch |
| Lambda | Structured logs (JSON) → CloudWatch |
| DynamoDB | CloudTrail para operaciones |
| X-Ray | Tracing end-to-end |

### A10:2021 — SSRF

| Componente | Riesgo | Mitigación |
|-----------|--------|------------|
| Lambda enricher | HTTP a SUNAT | Whitelist de URLs permitidas, timeout 5s |
| Frontend | Fetch a API | Solo API_URL configurada |

## Pen Testing — Consideraciones

### Qué esperar que un pentester intente

1. **JWT manipulation**: Modificar claims en el token → Cognito valida firma
2. **IDOR**: Cambiar merchantId en URL → DynamoDB filtra por sellerId
3. **RUC bypass**: Enviar RUC inválido → validación módulo 11 server-side
4. **SQS injection**: Mensaje malformado → JSON schema validation
5. **Privilege escalation**: Seller intenta acceder a merchants de otro → condition expressions

### Controles que debe respetar

- [ ] CORS no permite `*` en producción
- [ ] Rate limiting en API Gateway
- [ ] WAF bloquea OWASP Top 10
- [ ] No hay secrets en código fuente
- [ ] No hay datos sensibles en logs
- [ ] HTTPS everywhere
- [ ] Input validation en todas las entradas
