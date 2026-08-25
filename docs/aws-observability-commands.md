# Observability — Comandos AWS

Comandos para consultar logs, traces y métricas de Mini Onboarding en AWS.

Todos los comandos usan `docker compose` con `.env.production` para autenticación automática.

---

## Quick Start

```bash
# Abreviatura para todos los comandos
export AWSCLI="docker compose --env-file .env.production run --rm awscli"
$AWSCLI sts get-caller-identity --region us-east-1
```

---

## 1. CloudWatch Logs (Lambda function logs)

```bash
# Logs del merchants Lambda (últimos 5 minutos)
docker compose --env-file .env.production run --rm awscli logs tail \
  /aws/lambda/mini-onboarding-dev-merchants \
  --since 5m \
  --region us-east-1 \
  --format short

# Logs del enricher Lambda
docker compose --env-file .env.production run --rm awscli logs tail \
  /aws/lambda/mini-onboarding-dev-enricher \
  --since 1h \
  --region us-east-1 \
  --format short

# Buscar solo errores
docker compose --env-file .env.production run --rm awscli logs filter-log-events \
  --log-group-name /aws/lambda/mini-onboarding-dev-merchants \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-east-1

# Buscar por merchant ID específico
docker compose --env-file .env.production run --rm awscli logs filter-log-events \
  --log-group-name /aws/lambda/mini-onboarding-dev-enricher \
  --filter-pattern '"merchantId"' \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-east-1

# Ver todos los log groups de Lambda
docker compose --env-file .env.production run --rm awscli logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/mini-onboarding \
  --region us-east-1

# Logs del enricher con contexto de email
docker compose --env-file .env.production run --rm awscli logs tail \
  /aws/lambda/mini-onboarding-dev-enricher \
  --since 30m \
  --region us-east-1 \
  --format short \
  | grep -i "email\|enrich\|Processing"
```

---

## 2. X-Ray (Distributed Tracing)

```bash
# Obtener traces recientes
docker compose --env-file .env.production run --rm awscli xray get-trace-summaries \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --region us-east-1

# Obtener un trace específico por ID
docker compose --env-file .env.production run --rm awscli xray get-trace \
  --trace-id "1-XXXXXXXX-XXXXXXXXXXXXXXXX" \
  --region us-east-1

# Ver reglas de sampling
docker compose --env-file .env.production run --rm awscli xray get-sampling-rules \
  --region us-east-1

# Service map (servicios conectados)
docker compose --env-file .env.production run --rm awscli xray get-service-graph \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --region us-east-1

# Groups de traces
docker compose --env-file .env.production run --rm awscli xray get-groups \
  --region us-east-1

# Insights de performance
docker compose --env-file .env.production run --rm awscli xray get-insight-events \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --region us-east-1
```

---

## 3. API Gateway Access Logs

```bash
# Access logs de API Gateway
docker compose --env-file .env.production run --rm awscli logs tail \
  /aws/apigateway/mini-onboarding-dev \
  --since 1h \
  --region us-east-1 \
  --format short

# Filtrar solo errores 5xx
docker compose --env-file .env.production run --rm awscli logs filter-log-events \
  --log-group-name /aws/apigateway/mini-onboarding-dev \
  --filter-pattern '"status": [502, 503, 504]' \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-east-1

# Filtrar por método HTTP
docker compose --env-file .env.production run --rm awscli logs filter-log-events \
  --log-group-name /aws/apigateway/mini-onboarding-dev \
  --filter-pattern '"httpMethod": "DELETE"' \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-east-1

# Ver todos los log groups de API Gateway
docker compose --env-file .env.production run --rm awscli logs describe-log-groups \
  --log-group-name-prefix /aws/apigateway \
  --region us-east-1

# Latencia de API Gateway
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --dimensions Name=ApiName,Value=mini-onboarding-dev-api \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average Maximum \
  --region us-east-1
```

---

## 4. CloudWatch Metrics

### Lambda

```bash
# Invocaciones merchants Lambda
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Errores enricher Lambda
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=mini-onboarding-dev-enricher \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Duration merchants Lambda
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average Maximum \
  --region us-east-1

# Throttles
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Throttles \
  --dimensions Name=FunctionName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Dead Letter Errors (enricher)
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name DeadLetterErrors \
  --dimensions Name=FunctionName,Value=mini-onboarding-dev-enricher \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

### DynamoDB

```bash
# Read Capacity Units
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Write Capacity Units
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedWriteCapacityUnits \
  --dimensions Name=TableName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Latencia (GetItem)
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name SuccessfulRequestLatency \
  --dimensions Name=TableName,Value=mini-onboarding-dev-merchants Name=OperationName,Value=GetItem \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average Maximum \
  --region us-east-1

# Throttled requests
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ThrottledRequests \
  --dimensions Name=TableName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

### SQS

```bash
# Estado de la cola (mensajes pendientes + stuck)
docker compose --env-file .env.production run --rm awscli sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/459321894062/mini-onboarding-dev-enrichment \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible ApproximateNumberOfMessagesDelayed \
  --region us-east-1

# Messages Sent
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name NumberOfMessagesSent \
  --dimensions Name=QueueName,Value=mini-onboarding-dev-enrichment \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Messages Received
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name NumberOfMessagesReceived \
  --dimensions Name=QueueName,Value=mini-onboarding-dev-enrichment \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Age of Oldest Message (indicador de procesamiento lento)
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name ApproximateAgeOfOldestMessage \
  --dimensions Name=QueueName,Value=mini-onboarding-dev-enrichment \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Maximum \
  --region us-east-1
```

### Cognito

```bash
# Sign-ups
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/Cognito \
  --metric-name SignUpSuccesses \
  --dimensions Name=UserPool,Value=us-east-1_S33rLXlec \
  --start-time $(date -d '1 day ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 3600 \
  --statistics Sum \
  --region us-east-1

# Sign-ins
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/Cognito \
  --metric-name SignInSuccesses \
  --dimensions Name=UserPool,Value=us-east-1_S33rLXlec \
  --start-time $(date -d '1 day ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 3600 \
  --statistics Sum \
  --region us-east-1

# Token refreshes
docker compose --env-file .env.production run --rm awscli cloudwatch get-metric-statistics \
  --namespace AWS/Cognito \
  --metric-name TokenRefreshSuccesses \
  --dimensions Name=UserPool,Value=us-east-1_S33rLXlec \
  --start-time $(date -d '1 day ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

---

## 5. Alarmas

```bash
# Estado de alarmas
docker compose --env-file .env.production run --rm awscli cloudwatch describe-alarms \
  --alarm-name-prefix mini-onboarding \
  --region us-east-1

# Historial de una alarma
docker compose --env-file .env.production run --rm awscli cloudwatch describe-alarm-history \
  --alarm-name mini-onboarding-dev-enricher-errors \
  --region us-east-1

# Ver alarmas activas (estado ALARM)
docker compose --env-file .env.production run --rm awscli cloudwatch describe-alarms \
  --alarm-name-prefix mini-onboarding \
  --state-value ALARM \
  --region us-east-1
```

---

## 6. Dashboard

```bash
# Ver dashboard (JSON)
docker compose --env-file .env.production run --rm awscli cloudwatch get-dashboard \
  --dashboard-name mini-onboarding-dev-main \
  --region us-east-1

# Abrir en navegador
echo "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=mini-onboarding-dev-main"
```

---

## 7. Resumen rápido

```bash
echo "=== CLOUDWATCH LOGS (merchants) ===" && \
docker compose --env-file .env.production run --rm awscli logs tail \
  /aws/lambda/mini-onboarding-dev-merchants \
  --since 5m --region us-east-1 --format short 2>/dev/null | tail -3 && \
echo "" && \
echo "=== CLOUDWATCH LOGS (enricher) ===" && \
docker compose --env-file .env.production run --rm awscli logs tail \
  /aws/lambda/mini-onboarding-dev-enricher \
  --since 5m --region us-east-1 --format short 2>/dev/null | tail -3 && \
echo "" && \
echo "=== API GATEWAY LOGS ===" && \
docker compose --env-file .env.production run --rm awscli logs tail \
  /aws/apigateway/mini-onboarding-dev \
  --since 5m --region us-east-1 --format short 2>/dev/null | tail -3 && \
echo "" && \
echo "=== SQS STATUS ===" && \
docker compose --env-file .env.production run --rm awscli sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/459321894062/mini-onboarding-dev-enrichment \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
  --region us-east-1 2>/dev/null | grep -E "Number" && \
echo "" && \
echo "=== ALARM STATUS ===" && \
docker compose --env-file .env.production run --rm awscli cloudwatch describe-alarms \
  --alarm-name-prefix mini-onboarding \
  --region us-east-1 2>/dev/null | grep -E "StateValue|AlarmName" && \
echo "" && \
echo "=== X-RAY RECENT TRACES ===" && \
docker compose --env-file .env.production run --rm awscli xray get-trace-summaries \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --region us-east-1 2>/dev/null | grep -E "Id|Duration|Http" | head -10
```

---

## Referencia de namespaces

| Namespace | Métricas | Dimensión |
|-----------|----------|-----------|
| `AWS/Lambda` | Invocations, Errors, Duration, Throttles, DeadLetterErrors | FunctionName |
| `AWS/DynamoDB` | ConsumedReadCapacity, ConsumedWriteCapacity, ThrottledRequests | TableName, OperationName |
| `AWS/SQS` | NumberOfMessagesSent, Received, Deleted, AgeOfOldestMessage | QueueName |
| `AWS/ApiGateway` | Latency, IntegrationLatency, Count, 4XXError, 5XXError | ApiName, Stage, Method |
| `AWS/Cognito` | SignUpSuccesses, TokenRefreshSuccesses, SignInSuccesses | UserPool |

## Referencia de log groups

| Log Group | Contenido |
|-----------|-----------|
| `/aws/lambda/mini-onboarding-dev-merchants` | Logs del handler merchants (requests, errors) |
| `/aws/lambda/mini-onboarding-dev-enricher` | Logs del enricher (processing, email, errors) |
| `/aws/apigateway/mini-onboarding-dev` | Access logs de API Gateway (requestId, method, status, latency) |
