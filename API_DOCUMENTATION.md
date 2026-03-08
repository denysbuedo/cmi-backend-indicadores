# 📡 CMI Backend - API Documentation

> **Documentación detallada de todos los servicios publicados en la API**

---

## Tabla de Contenidos

1. [Información General](#información-general)
2. [Autenticación Multi-Tenant](#autenticación-multi-tenant)
3. [Dashboard Ejecutivo](#dashboard-ejecutivo)
4. [Indicadores](#indicadores)
5. [Ejecución](#ejecución)
6. [Procesos](#procesos)
7. [Objetivos Estratégicos](#objetivos-estratégicos)
8. [Tipos de Indicador](#tipos-de-indicador)
9. [Fuentes de Datos](#fuentes-de-datos)
10. [Valores de Indicadores](#valores-de-indicadores)
11. [Automatización](#automatización)
12. [Modelos de Datos](#modelos-de-datos)
13. [Códigos de Estado y Respuestas](#códigos-de-estado-y-respuestas)

---

## Información General

| Parámetro | Valor |
|-----------|-------|
| **Base URL** | `http://localhost:3000` |
| **Framework** | NestJS 11 |
| **Formato** | JSON |
| **CORS** | Habilitado para `localhost:5173` |

---

## Autenticación Multi-Tenant

### Header Requerido

Todas las peticiones deben incluir el header:

```
x-tenant-id: <UUID_DEL_TENANT>
```

### Middleware

El `TenantMiddleware` valida:
- Presencia del header
- Existencia del tenant en la base de datos
- Inyección del `tenantId` en cada request

### Respuestas de Error

| Código | Mensaje |
|--------|---------|
| `400` | `x-tenant-id header is required` |
| `404` | `Tenant not found` |

---

## Dashboard Ejecutivo

**Base:** `/dashboard`

### 1. Dashboard Ejecutivo Completo

```http
GET /dashboard/executive
```

**Descripción:**  
Retorna el dashboard completo con Executive Score, lista de indicadores ordenados por criticidad, tendencia, cumplimiento y variación. Incluye información detallada de cada indicador con su histórico.

**Respuesta:**
```json
{
  "summary": {
    "totalIndicators": 12
  },
  "executiveScore": 87.45,
  "indicators": [
    {
      "id": "uuid",
      "code": "BUG_RATE",
      "name": "Tasa de Errores",
      "unit": "PERCENT",
      "weight": 3,
      "objectives": [
        {
          "objective": {
            "id": "uuid",
            "code": "REDUCE_DEFECTS",
            "name": "Reducir defectos"
          }
        }
      ],
      "processId": "uuid",
      "processName": "QA",
      "latestValue": 2.5,
      "compliancePercent": 95.5,
      "status": "OK",
      "history": [
        {
          "periodEnd": "2026-01-31T23:59:59Z",
          "value": 2.5,
          "target": 3,
          "status": "OK"
        }
      ]
    }
  ],
  "processes": {
    "total": 3,
    "ok": 2,
    "warning": 1,
    "critical": 0,
    "avgScore": 84.5,
    "list": [
      {
        "id": "uuid-proceso",
        "code": "QA",
        "name": "Quality Assurance",
        "score": 85.2,
        "status": "OK",
        "indicatorCount": 4,
        "trend": "UP"
      },
      {
        "id": "uuid-proceso",
        "code": "DEV",
        "name": "Desarrollo",
        "score": 62.5,
        "status": "WARNING",
        "indicatorCount": 4,
        "trend": "DOWN"
      },
      {
        "id": "uuid-proceso",
        "code": "OPS",
        "name": "Operaciones",
        "score": 88.1,
        "status": "OK",
        "indicatorCount": 4,
        "trend": "STABLE"
      }
    ]
  },
  "objectives": [
    {
      "objectiveId": "uuid-obj-1",
      "objectiveCode": "REDUCE_DEFECTS",
      "objectiveName": "Reducir defectos",
      "weightedScore": 82.5,
      "worstStatus": "OK",
      "indicatorCount": 3
    },
    {
      "objectiveId": "uuid-obj-2",
      "objectiveCode": "IMPROVE_PRODUCTIVITY",
      "objectiveName": "Mejorar productividad",
      "weightedScore": 65.0,
      "worstStatus": "WARNING",
      "indicatorCount": 4
    },
    {
      "objectiveId": "uuid-obj-3",
      "objectiveCode": "INCREASE_STABILITY",
      "objectiveName": "Aumentar estabilidad",
      "weightedScore": 45.0,
      "worstStatus": "CRITICAL",
      "indicatorCount": 5
    }
  ]
}
```

**Campos Clave:**
- `executiveScore`: Puntuación global 0-100 (promedio ponderado de cumplimiento)
- `compliancePercent`: % de cumplimiento vs target
- `status`: `OK` | `WARNING` | `CRITICAL` | `NO_DATA`

---

### 2. Resumen Global

```http
GET /dashboard/summary
```

**Descripción:**  
Resumen global de todos los indicadores del tenant agrupados por estado.

**Respuesta:**
```json
{
  "totalIndicators": 12,
  "ok": 8,
  "warning": 2,
  "critical": 2
}
```

---

### 3. Indicadores Vencidos

```http
GET /dashboard/overdue
```

**Descripción:**  
Lista indicadores que están vencidos o pendientes de ejecución según su frecuencia configurada.

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "code": "COMMITS",
    "name": "Commits Semanales",
    "expectedNextUpdate": "2026-02-15T00:00:00Z"
  }
]
```

---

### 4. Estadísticas de Ejecución

```http
GET /dashboard/execution-stats
```

**Descripción:**  
Estadísticas detalladas sobre las ejecuciones de indicadores (logs de ejecución).

**Respuesta:**
```json
{
  "totalExecutions": 150,
  "okExecutions": 120,
  "warningExecutions": 20,
  "criticalExecutions": 10
}
```

---

### 5. Heatmap por Proceso

```http
GET /dashboard/process-heatmap
```

**Descripción:**  
Heatmap de indicadores agrupados por proceso con puntuación ponderada, estado y tendencia.

**Respuesta:**
```json
[
  {
    "processId": "uuid",
    "processCode": "QA",
    "processName": "Quality Assurance",
    "score": 85.5,
    "status": "OK",
    "indicatorCount": 4,
    "evaluableCount": 4,
    "noDataCount": 0,
    "okPercent": 75,
    "trend": "UP"
  }
]
```

**Estados:**
- `OK`: Score >= 80
- `WARNING`: Score >= 60 y < 80
- `CRITICAL`: Score < 60
- `NO_DATA`: Sin datos evaluables

**Tendencias:**
- `UP`: Variación positiva > 1%
- `DOWN`: Variación negativa > 1%
- `FLAT`: Variación <= 1%

---

### 6. Puntuación por Objetivo

```http
GET /dashboard/objective-scores
```

**Descripción:**  
Puntuación de cumplimiento por cada objetivo estratégico con histórico y tendencia.

**Respuesta:**
```json
[
  {
    "objectiveId": "uuid",
    "objectiveCode": "REDUCE_DEFECTS",
    "objectiveName": "Reducir defectos",
    "weightedScore": 88.5,
    "executiveHealthPercent": 89,
    "worstStatus": "OK",
    "indicatorCount": 3,
    "okCount": 2,
    "warningCount": 1,
    "criticalCount": 0,
    "trend": "UP",
    "series": []
  }
]
```

---

## Indicadores

**Base:** `/indicators`

### 1. Crear Indicador

```http
POST /indicators
```

**Body:**
```json
{
  "code": "NEW_KPI",
  "name": "Nuevo KPI de Ejemplo",
  "description": "Descripción del nuevo indicador",
  "unit": "PERCENT",
  "decimals": 1,
  "weight": 3,
  "frequencyMonths": 12,
  "evaluationDirection": "HIGHER_IS_BETTER",
  "processId": "uuid-del-proceso",
  "indicatorTypeId": "uuid-del-tipo",
  "objectiveIds": ["uuid-objetivo-1", "uuid-objetivo-2"]
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `code` | string | ✅ | Código único del indicador |
| `name` | string | ✅ | Nombre descriptivo |
| `description` | string | ❌ | Descripción detallada |
| `unit` | enum | ✅ | `NUMBER` o `PERCENT` |
| `decimals` | number | ✅ | Cantidad de decimales (≥0) |
| `weight` | number | ✅ | Peso/prioridad (≥0) |
| `frequencyMonths` | number | ❌ | Frecuencia en meses |
| `frequencyDays` | number | ❌ | Frecuencia en días |
| `evaluationDirection` | enum | ✅ | `HIGHER_IS_BETTER` o `LOWER_IS_BETTER` |
| `processId` | UUID | ✅ | ID del proceso padre |
| `indicatorTypeId` | UUID | ✅ | ID del tipo de indicador |
| `objectiveIds` | UUID[] | ✅ | Lista de IDs de objetivos |

**Respuesta:** Objeto `Indicator` completo con `id`, `createdAt`, `updatedAt`.

---

### 2. Listar Todos los Indicadores

```http
GET /indicators
```

**Descripción:**  
Lista todos los indicadores activos del tenant (excluye soft-deleted).

**Respuesta:** Array de objetos `Indicator`.

---

### 3. Obtener Indicador por ID

```http
GET /indicators/:id
```

**Descripción:**  
Obtiene un indicador específico por su UUID.

**Respuesta:** Objeto `Indicator` completo.

---

### 4. Historial de Indicador

```http
GET /indicators/:id/history
```

**Descripción:**  
Historial de valores del indicador (últimos 6 periodos ordenados cronológicamente).

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "value": 85.5,
    "target": 90,
    "periodStart": "2026-01-01T00:00:00Z",
    "periodEnd": "2026-12-31T23:59:59Z",
    "status": "WARNING",
    "error": null,
    "createdAt": "2026-01-15T10:30:00Z"
  }
]
```

---

### 5. Actualizar Indicador

```http
PATCH /indicators/:id
```

**Body (campos opcionales):**
```json
{
  "name": "Nombre Actualizado",
  "description": "Nueva descripción",
  "weight": 5,
  "frequencyMonths": 6,
  "evaluationDirection": "LOWER_IS_BETTER"
}
```

**Descripción:**  
Actualiza campos específicos de un indicador (partial update).

---

### 6. Activar/Desactivar Indicador

```http
PATCH /indicators/:id/toggle
```

**Descripción:**  
Cambia el estado `active` del indicador (true ↔ false).

**Respuesta:** Indicador actualizado.

---

### 7. Eliminar Indicador (Soft Delete)

```http
DELETE /indicators/:id
```

**Descripción:**  
Elimina lógicamente un indicador estableciendo `deletedAt`. No borra físicamente los datos.

---

### 8. Crear Valor de Indicador

```http
POST /indicators/:id/values
```

**Body:**
```json
{
  "value": 85.5,
  "target": 90,
  "periodStart": "2026-01-01T00:00:00Z",
  "periodEnd": "2026-12-31T23:59:59Z"
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `value` | number | ✅ | Valor medido del indicador |
| `target` | number | ❌ | Valor objetivo/target |
| `periodStart` | datetime | ✅ | Inicio del periodo |
| `periodEnd` | datetime | ✅ | Fin del periodo |

**Cálculo Automático de Estado:**
- `OK`: Cumplimiento ≥ 80%
- `WARNING`: Cumplimiento ≥ 60% y < 80%
- `CRITICAL`: Cumplimiento < 60%

---

## Ejecución

**Base:** `/execution`

### 1. Ejecutar Indicador

```http
POST /execution/indicator/:id/run
```

**Descripción:**  
Ejecuta manualmente un indicador para obtener su valor actual. El sistema:

1. Registra el inicio de la ejecución en `ExecutionLog`
2. Evalúa el último valor registrado
3. Calcula automáticamente:
   - **Estado**: OK/WARNING/CRITICAL
   - **Tendencia**: UP/DOWN/STABLE
   - **Cumplimiento**: % vs target
   - **Variación**: vs periodo anterior
4. Registra el resultado con duración y mensaje

**Respuesta:**
```json
{
  "id": "uuid-log",
  "indicatorId": "uuid-indicador",
  "status": "SUCCESS",
  "message": "Indicator executed successfully",
  "startedAt": "2026-03-05T10:00:00Z",
  "finishedAt": "2026-03-05T10:00:01Z",
  "durationMs": 150
}
```

---

## Procesos

**Base:** `/processes`

### 1. Crear Proceso

```http
POST /processes
```

**Body:**
```json
{
  "code": "HR",
  "name": "Recursos Humanos",
  "description": "Proceso de gestión de talento humano"
}
```

---

### 2. Listar Procesos

```http
GET /processes
```

**Descripción:**  
Lista todos los procesos del tenant (excluye eliminados).

---

### 3. Actualizar Proceso

```http
PATCH /processes/:id
```

**Body:**
```json
{
  "name": "Nuevo Nombre",
  "description": "Nueva descripción"
}
```

---

### 4. Activar/Desactivar Proceso

```http
PATCH /processes/:id/toggle
```

---

### 5. Eliminar Proceso

```http
DELETE /processes/:id
```

**Descripción:** Soft delete (establece `deletedAt`).

---

## Objetivos Estratégicos

**Base:** `/objectives`

### 1. Crear Objetivo

```http
POST /objectives
```

**Body:**
```json
{
  "code": "NEW_OBJECTIVE",
  "name": "Nuevo Objetivo Estratégico",
  "description": "Descripción del objetivo"
}
```

---

### 2. Listar Objetivos

```http
GET /objectives
```

---

### 3. Actualizar Objetivo

```http
PATCH /objectives/:id
```

---

### 4. Activar/Desactivar Objetivo

```http
PATCH /objectives/:id/toggle
```

---

### 5. Eliminar Objetivo

```http
DELETE /objectives/:id
```

---

## Tipos de Indicador

**Base:** `/indicator-types`

### 1. Crear Tipo

```http
POST /indicator-types
```

**Body:**
```json
{
  "code": "TACTICAL",
  "name": "Táctico",
  "description": "Indicadores de nivel táctico"
}
```

---

### 2. Listar Tipos

```http
GET /indicator-types
```

---

### 3. Obtener Tipo por ID

```http
GET /indicator-types/:id
```

---

### 4. Actualizar Tipo

```http
PATCH /indicator-types/:id
```

---

### 5. Eliminar Tipo

```http
DELETE /indicator-types/:id
```

---

## Fuentes de Datos

**Base:** `/sources`

### 1. Crear Fuente

```http
POST /sources
```

**Body:**
```json
{
  "name": "API GitHub",
  "description": "Conexión a API de GitHub para métricas",
  "endpoint": "https://api.github.com/repos/{owner}/{repo}/stats",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer TOKEN"
  },
  "queryParams": {
    "per_page": "100"
  },
  "bodyTemplate": {
    "key": "value"
  },
  "timeout": 5000,
  "active": true
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ | Nombre de la fuente |
| `description` | string | ❌ | Descripción |
| `endpoint` | URL | ✅ | Endpoint de la API |
| `method` | enum | ✅ | `GET`, `POST`, `PUT`, `DELETE` |
| `headers` | object | ❌ | Headers personalizados |
| `queryParams` | object | ❌ | Query parameters |
| `bodyTemplate` | object | ❌ | Template para body (POST/PUT) |
| `timeout` | number | ❌ | Timeout en ms (≥100, default 5000) |
| `active` | boolean | ❌ | Estado activo (default true) |

---

### 2. Listar Fuentes

```http
GET /sources
```

---

### 3. Obtener Fuente por ID

```http
GET /sources/:id
```

---

## Valores de Indicadores

**Base:** `/indicators/:id/values`

Los valores se gestionan a través del endpoint de indicadores:

- **Crear:** `POST /indicators/:id/values` (ver sección Indicadores)
- **Consultar:** `GET /indicators/:id/history`

---

## Automatización

### Scheduler Automático

El sistema ejecuta automáticamente un job programado:

**Cron:** `EVERY_DAY_AT_2AM` (2:00 AM diariamente)

**Lógica:**
1. Obtiene todos los tenants activos
2. Para cada tenant, obtiene indicadores activos
3. Verifica si cada indicador requiere ejecución:
   - Sin valores registrados → Ejecutar
   - Fecha esperada superada → Ejecutar
4. Ejecuta mediante `ExecutionService`

**Frecuencia:**
- `frequencyDays`: Cada N días
- `frequencyMonths`: Cada N meses

---

## Modelos de Datos

### Enums

```typescript
enum HttpMethod {
  GET,
  POST,
  PUT,
  DELETE
}

enum IndicatorUnit {
  NUMBER,
  PERCENT
}

enum SourceRole {
  DATA,
  NUMERATOR,
  DENOMINATOR
}

enum IndicatorStatus {
  OK,
  WARNING,
  CRITICAL
}

enum EvaluationDirection {
  HIGHER_IS_BETTER,
  LOWER_IS_BETTER
}
```

### Tenant

```typescript
{
  id: string (UUID),
  name: string,
  code: string (unique),
  active: boolean,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Indicator

```typescript
{
  id: string (UUID),
  code: string,
  name: string,
  description: string?,
  unit: IndicatorUnit,
  decimals: number,
  active: boolean,
  weight: number,
  deletedAt: DateTime?,
  frequencyMonths: number?,
  frequencyDays: number?,
  evaluationDirection: EvaluationDirection,
  tenantId: string,
  indicatorTypeId: string,
  processId: string,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### IndicatorValue

```typescript
{
  id: string (UUID),
  indicatorId: string,
  tenantId: string,
  value: Decimal,
  target: Decimal?,
  periodStart: DateTime,
  periodEnd: DateTime,
  status: IndicatorStatus,
  error: string?,
  createdAt: DateTime
}
```

### Process

```typescript
{
  id: string (UUID),
  code: string,
  name: string,
  description: string?,
  active: boolean,
  deletedAt: DateTime?,
  tenantId: string,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Objective

```typescript
{
  id: string (UUID),
  code: string,
  name: string,
  description: string?,
  active: boolean,
  deletedAt: DateTime?,
  tenantId: string,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### IndicatorType

```typescript
{
  id: string (UUID),
  code: string,
  name: string,
  description: string?,
  active: boolean,
  tenantId: string
}
```

### Source

```typescript
{
  id: string (UUID),
  name: string,
  description: string?,
  endpoint: string (URL),
  method: HttpMethod,
  headers: Json?,
  queryParams: Json?,
  bodyTemplate: Json?,
  timeout: number,
  active: boolean,
  tenantId: string,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### ExecutionLog

```typescript
{
  id: string (UUID),
  tenantId: string,
  indicatorId: string,
  startedAt: DateTime,
  finishedAt: DateTime?,
  durationMs: number?,
  status: string,  // SUCCESS | ERROR
  message: string?,
  createdAt: DateTime
}
```

### Relaciones

```
Tenant (1) → (N) Indicator
Tenant (1) → (N) Process
Tenant (1) → (N) Objective
Tenant (1) → (N) IndicatorType
Tenant (1) → (N) Source
Tenant (1) → (N) IndicatorValue
Tenant (1) → (N) ExecutionLog

Indicator (N) ↔ (N) Objective (vía IndicatorObjective)
Indicator (N) ↔ (N) Source (vía IndicatorSource, con rol)
Indicator (1) → (N) IndicatorValue
Indicator (1) → (N) ExecutionLog
```

---

## Códigos de Estado y Respuestas

### HTTP Status Codes

| Código | Significado | Uso |
|--------|-------------|-----|
| `200` | OK | Petición exitosa |
| `201` | Created | Recurso creado exitosamente |
| `400` | Bad Request | Datos inválidos o header faltante |
| `404` | Not Found | Recurso no encontrado |
| `500` | Internal Server Error | Error del servidor |

### Errores Comunes

```json
// Tenant no encontrado
{
  "statusCode": 404,
  "message": "Tenant not found",
  "error": "Not Found"
}

// Header faltante
{
  "statusCode": 400,
  "message": "x-tenant-id header is required",
  "error": "Bad Request"
}

// Validación fallida
{
  "statusCode": 400,
  "message": ["code must be a string", "name is required"],
  "error": "Bad Request"
}
```

---

## Ejemplos de Uso

### Flujo Completo

```bash
# 1. Obtener tenant ID (post-seed)
# Consultar BD para obtener UUID del tenant 'MES'

# 2. Listar indicadores existentes
curl -X GET http://localhost:3000/indicators \
  -H "x-tenant-id: <UUID>"

# 3. Crear nuevo indicador
curl -X POST http://localhost:3000/indicators \
  -H "x-tenant-id: <UUID>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CUSTOMER_SAT",
    "name": "Satisfacción del Cliente",
    "unit": "PERCENT",
    "decimals": 1,
    "weight": 5,
    "evaluationDirection": "HIGHER_IS_BETTER",
    "processId": "<UUID>",
    "indicatorTypeId": "<UUID>",
    "objectiveIds": ["<UUID>"]
  }'

# 4. Crear valor para el indicador
curl -X POST http://localhost:3000/indicators/<ID>/values \
  -H "x-tenant-id: <UUID>" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 87.5,
    "target": 90,
    "periodStart": "2026-01-01T00:00:00Z",
    "periodEnd": "2026-01-31T23:59:59Z"
  }'

# 5. Ejecutar indicador manualmente
curl -X POST http://localhost:3000/execution/indicator/<ID>/run \
  -H "x-tenant-id: <UUID>"

# 6. Consultar dashboard ejecutivo
curl -X GET http://localhost:3000/dashboard/executive \
  -H "x-tenant-id: <UUID>"
```

---

## Postman Collection

Importar `postman-collection.json` para tener todas las peticiones pre-configuradas.

**Variables:**
- `baseUrl`: `http://localhost:3000`
- `tenantId`: UUID del tenant (configurar manualmente post-seed)

---

## Health Check

```http
GET /health
```

**Respuesta:**
```json
{
  "status": "ok"
}
```

---

<div align="center">

**CMI Backend API**  
*Documentación generada el 5 de marzo de 2026*

</div>
