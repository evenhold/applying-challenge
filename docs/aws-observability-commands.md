# Observability — Comandos AWS

Comandos para consultar logs, traces y métricas de Mini Onboarding en AWS.

---

## Quick Start

```bash
# Reemplazar con tu profile o variables de entorno
export AWS_REGION=us-east-1
```

---

## 1. CloudWatch Logs (Lambda function logs)

```bash
# Logs del merchants Lambda (últimos 5 minutos)
aws logs tail \
  /aws/lambda/mini-onboarding-dev-merchants \
  --since 5m \
  --region us-east-1 \
  --format short

# Logs del enricher Lambda
aws logs tail \
  /aws/lambda/mini-onboarding-dev-enricher \
  --since 1h \
  --region us-east-1 \
  --format short

# Buscar solo errores
aws logs filter-log-events \
  --log-group-name /aws/lambda/mini-onboarding-dev-merchants \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-east-1

# Buscar por merchant ID específico
aws logs filter-log-events \
  --log-group-name /aws/lambda/mini-onboarding-dev-enricher \
  --filter-pattern '"merchantId"' \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-east-1

# Ver todas las funciones Lambda con logs
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/mini-onboarding \
  --region us-east-1

# Ver logs del enricher con contexto de email
aws logs tail \
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
aws xray get-trace-summaries \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --region us-east-1

# Obtener un trace específico por ID
aws xray get-trace \
  --trace-id "1-XXXXXXXX-XXXXXXXXXXXXXXXX" \
  --region us-east-1

# Ver reglas de sampling
aws xray get-sampling-rules \
  --region us-east-1

# Service map (servicios conectados)
aws xray get-service-graph \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --region us-east-1

# Groups de traces
aws xray get-groups \
  --region us-east-1

# Insights de performance
aws xray get-insight-events \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --region us-east-1
```

---

## 3. API Gateway Access Logs

```bash
# Access logs de API Gateway
aws logs tail \
  /aws/apigateway/mini-onboarding-dev \
  --since 1h \
  --region us-east-1 \
  --format short

# Filtrar solo errores 5xx
aws logs filter-log-events \
  --log-group-name /aws/apigateway/mini-onboarding-dev \
  --filter-pattern '"status": [502, 503, 504]' \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-east-1

# Filtrar por método HTTP
aws logs filter-log-events \
  --log-group-name /aws/apigateway/mini-onboarding-dev \
  --filter-pattern '"httpMethod": "DELETE"' \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-east-1

# Ver todos los log groups de API Gateway
aws logs describe-log-groups \
  --log-group-name-prefix /aws/apigateway \
  --region us-east-1

# Ver estadísticas de latencia de API Gateway
aws cloudwatch get-metric-statistics \
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
# Invocaciones de Lambda merchants
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Errores de Lambda enricher
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=mini-onboarding-dev-enricher \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Duration promedio de merchants Lambda
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average Maximum \
  --region us-east-1

# Throttles
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Throttles \
  --dimensions Name=FunctionName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Dead Letter Errors (enricher)
aws cloudwatch get-metric-statistics \
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
# Read Capacity Units consumidos
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Write Capacity Units consumidos
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedWriteCapacityUnits \
  --dimensions Name=TableName,Value=mini-onboarding-dev-merchants \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Read Latency (p50, p99)
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name SuccessfulRequestLatency \
  --dimensions Name=TableName,Value=mini-onboarding-dev-merchants Name=OperationName,Value=GetItem \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average Maximum \
  --region us-east-1

# Throttled requests
aws cloudwatch get-metric-statistics \
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
# Mensajes en cola
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/459321894062/mini-onboarding-dev-enrichment \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible ApproximateNumberOfMessagesDelayed \
  --region us-east-1

# Messages Sent
aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name NumberOfMessagesSent \
  --dimensions Name=QueueName,Value=mini-onboarding-dev-enrichment \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Messages Received
aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name NumberOfMessagesReceived \
  --dimensions Name=QueueName,Value=mini-onboarding-dev-enrichment \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Messages Deleted
aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name NumberOfMessagesDeleted \
  --dimensions Name=QueueName,Value=mini-onboarding-dev-enrichment \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Age of Oldest Message (indicador de procesamiento lento)
aws cloudwatch get-metric-statistics \
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
# Sign Up attempts
aws cloudwatch get-metric-statistics \
  --namespace AWS/Cognito \
  --metric-name SignUpSuccesses \
  --dimensions Name=UserPool,Value=us-east-1_S33rLXlec \
  --start-time $(date -d '1 day ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 3600 \
  --statistics Sum \
  --region us-east-1

# Token refreshes
aws cloudwatch get-metric-statistics \
  --namespace AWS/Cognito \
  --metric-name TokenRefreshSuccesses \
  --dimensions Name=UserPool,Value=us-east-1_S33rLXlec \
  --start-time $(date -d '1 day ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 3600 \
  --statistics Sum \
  --region us-east-1

# Failed authentications
aws cloudwatch get-metric-statistics \
  --namespace AWS/Cognito \
  --metric-name SignInSuccesses \
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
aws cloudwatch describe-alarms \
  --alarm-name-prefix mini-onboarding \
  --region us-east-1

# Historial de una alarma
aws cloudwatch describe-alarm-history \
  --alarm-name mini-onboarding-dev-enricher-errors \
  --region us-east-1

# Ver alarmas en estado ALARM
aws cloudwatch describe-alarms \
  --alarm-name-prefix mini-onboarding \
  --state-value ALARM \
  --region us-east-1
```

---

## 6. Dashboard

```bash
# Ver dashboard completo (JSON)
aws cloudwatch get-dashboard \
  --dashboard-name mini-onboarding-dev-main \
  --region us-east-1

# Abrir dashboard en navegador
echo "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=mini-onboarding-dev-main"
```

---

## 7. Resumen rápido (un solo comando)

```bash
echo "=== CLOUDWATCH LOGS (merchants) ===" && \
aws logs tail /aws/lambda/mini-onboarding-dev-merchants --since 5m --region us-east-1 --format short 2>/dev/null | tail -3 && \
echo "" && \
echo "=== CLOUDWATCH LOGS (enricher) ===" && \
aws logs tail /aws/lambda/mini-onboarding-dev-enricher --since 5m --region us-east-1 --format short 2>/dev/null | tail -3 && \
echo "" && \
echo "=== API GATEWAY LOGS ===" && \
aws logs tail /aws/apigateway/mini-onboarding-dev --since 5m --region us-east-1 --format short 2>/dev/null | tail -3 && \
echo "" && \
echo "=== SQS STATUS ===" && \
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/459321894062/mini-onboarding-dev-enrichment \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
  --region us-east-1 2>/dev/null | grep -E "Number" && \
echo "" && \
echo "=== ALARM STATUS ===" && \
aws cloudwatch describe-alarms \
  --alarm-name-prefix mini-onboarding \
  --region us-east-1 2>/dev/null | grep -E "StateValue|AlarmName" && \
echo "" && \
echo "=== X-RAY RECENT TRACES ===" && \
aws xray get-trace-summaries \
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
| `AWS/SES` | Bounces, Complaints, DeliveryAttempts | — |

---

## Referencia de log groups

| Log Group | Contenido |
|-----------|-----------|
| `/aws/lambda/mini-onboarding-dev-merchants` | Logs del handler merchants (requests, errors) |
| `/aws/lambda/mini-onboarding-dev-enricher` | Logs del enricher (processing, email, errors) |
| `/aws/apigateway/mini-onboarding-dev` | Access logs de API Gateway (requestId, method, status, latency) |
