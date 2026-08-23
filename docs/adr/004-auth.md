# ADR-004: Autenticación — Cognito User Pools

## Estado

Aprobado

## Contexto

El challenge requiere "autenticación y autorización de usuarios". Necesitamos:

- Login/logout para sellers
- JWT tokens para API Gateway
- User management (registro, recuperación de contraseña)
- Integración nativa con AWS

## Decisión

**Amazon Cognito User Pools** + **API Gateway JWT Authorizer**.

### Configuración

- **User Pool**: `mini-onboarding-sellers`
- **App Client**: `mini-onboarding-web`
- **Sign-in attributes**: email
- **Password policy**: 8+ chars, mayúscula, minúscula, número
- **MFA**: Optional (configurable por seller)
- **JWT expiration**: 1 hora (access token), 30 días (refresh token)

### Flujo de auth

```
1. Seller ingresa email + password
2. Frontend llama Cognito: POST /auth/login
3. Cognito retorna: accessToken, refreshToken, idToken
4. Frontend guarda tokens en memoria (no localStorage)
5. Cada request API incluye: Authorization: Bearer <accessToken>
6. API Gateway valida JWT con Cognito Authorizer
7. Lambda recibe claims: sub, email
```

### Autorización en Lambda

```typescript
const sellerId = event.requestContext.authorizer?.claims?.sub;
if (!sellerId) {
  return { statusCode: 401, body: "Unauthorized" };
}
```

## Alternativas evaluadas

| Solución          | Pros                               | Contras                       | Decisión    |
| ----------------- | ---------------------------------- | ----------------------------- | ----------- |
| Cognito           | Nativo AWS, JWT, MFA, social login | Vendor lock-in, UI limitada   | **Elegido** |
| Auth0             | Feature-rich, multi-tenant         | Costo adicional, external     | No          |
| JWT custom (jose) | Control total                      | Must manage secrets, rotation | No          |
| IAM roles         | AWS-native                         | No para end users             | No          |

## Consecuencias

- Cognito maneja registro, login, refresh, MFA — no reinventamos rueda
- API Gateway JWT Authorizer valida tokens en edge — Lambda no carga
- Si queremos UI de login custom, usamos Amplify UI o construimos con formularios
- El costo es bajo: $0.0055/mes por MAU activo (primeros 50K gratis)
