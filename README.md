# 📊 CMI Backend - Executive KPI Engine

> **Backend profesional para gestión de indicadores estratégicos (CMI / KPI) con arquitectura multi-tenant y dashboard ejecutivo**

---

## 🚀 Descripción

Sistema backend construido con **NestJS 11** y **Prisma ORM** para la gestión de indicadores de gestión (KPIs) orientados a cuadros de mando integrales (CMI). Proporciona una arquitectura escalable, multi-tenant, con motor de ejecución automatizada y dashboard ejecutivo listo para consumo por frontend.

---

## 🏗 Arquitectura Tecnológica

| Capa | Tecnología |
|------|------------|
| **Framework** | NestJS 11 |
| **Lenguaje** | TypeScript 5.7 |
| **ORM** | Prisma 6.19 |
| **Base de Datos** | PostgreSQL |
| **Validación** | class-validator, class-transformer |
| **Testing** | Jest, Supertest |
| **Linting** | ESLint 9, Prettier |
| **Scheduler** | @nestjs/schedule |

---

## 📦 Características Principales

### ✅ Multi-Tenant
- Aislamiento de datos por tenant mediante header `x-tenant-id`
- Middleware global para validación de tenant
- Arquitectura lista para SaaS

### ✅ Modelo de Datos Profesional
- **Tenant**: Organización/cliente
- **IndicatorType**: Clasificación de indicadores (Esencial, Estratégico)
- **Process**: Procesos de negocio (QA, DEV, OPS)
- **Objective**: Objetivos estratégicos
- **Indicator**: Indicadores con configuración flexible
- **IndicatorValue**: Valores históricos con target
- **Source**: Fuentes de datos externas (APIs)
- **ExecutionLog**: Auditoría completa de ejecuciones

### ✅ Dashboard Ejecutivo
- **Executive Score**: Puntuación global 0-100
- **Summary**: Resumen de estado
- **Heatmap**: Por proceso
- **Objective Scores**: Por objetivo estratégico
- **Indicators Vencidos**: Alertas de indicadores pendientes
- **Execution Stats**: Estadísticas de ejecución

### ✅ Evaluación Automática
- **Tendencia**: UP / DOWN / STABLE
- **Estado**: OK / WARNING / CRITICAL
- **Dirección**: HIGHER_IS_BETTER / LOWER_IS_BETTER
- **Cumplimiento**: % vs Target
- **Variación**: vs periodo anterior

### ✅ Automatización
- Scheduler diario (2 AM)
- Ejecución bajo demanda
- Detección automática de indicadores vencidos
- Historial de ejecuciones

---

## 📁 Estructura del Proyecto

```
cmi-backend-inddame icadores/
├── prisma/
│   ├── schema.prisma          # Modelo de datos
│   ├── seed.ts                # Seed idempotente profesional
│   └── migrations/            # Migraciones de BD
├── src/
│   ├── modules/
│   │   ├── common/            # Middleware, utilidades
│   │   ├── dashboard/         # Dashboard ejecutivo
│   │   ├── indicators/        # CRUD indicadores
│   │   ├── indicator-value/   # Gestión de valores
│   │   ├── indicator-type/    # Tipos de indicadores
│   │   ├── process/           # Procesos
│   │   ├── objective/         # Objetivos
│   │   ├── sources/           # Fuentes de datos
│   │   ├── execution/         # Motor de ejecución
│   │   └── automation/        # Scheduler
│   ├── prisma/                # Módulo Prisma
│   ├── app.module.ts
│   └── main.ts
├── test/                      # Tests E2E
└── dist/                      # Build compilado
```

---

## 🔧 Instalación

### Prerrequisitos
- Node.js 20+
- PostgreSQL 14+
- npm o pnpm

### Pasos

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd cmi-backend-indicadores

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con DATABASE_URL

# 4. Ejecutar migraciones
npx prisma migrate dev

# 5. Seed de datos iniciales
npx prisma db seed

# 6. Iniciar servidor desarrollo
npm run start:dev
```

El servidor correrá en `http://localhost:3000`

---

## 📡 API Endpoints

### Dashboard Ejecutivo

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/dashboard/executive` | Dashboard ejecutivo completo |
| `GET` | `/dashboard/summary` | Resumen global |
| `GET` | `/dashboard/overdue` | Indicadores vencidos |
| `GET` | `/dashboard/execution-stats` | Estadísticas de ejecución |
| `GET` | `/dashboard/process-heatmap` | Heatmap por proceso |
| `GET` | `/dashboard/objective-scores` | Puntuación por objetivo |

### Indicadores

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/indicators` | Crear indicador |
| `GET` | `/indicators` | Listar todos |
| `GET` | `/indicators/:id` | Obtener uno |
| `GET` | `/indicators/:id/history` | Historial |
| `PATCH` | `/indicators/:id` | Actualizar |
| `PATCH` | `/indicators/:id/toggle` | Activar/desactivar |
| `DELETE` | `/indicators/:id` | Eliminar (soft) |
| `POST` | `/indicators/:id/values` | Crear valor |

### Ejecución

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/execution/indicator/:id/run` | Ejecutar indicador |

### Procesos, Objetivos, Tipos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/processes` | Listar procesos |
| `GET` | `/objectives` | Listar objetivos |
| `GET` | `/indicator-types` | Listar tipos |

---

## 🔐 Multi-Tenant

Todas las peticiones requieren el header:

```
x-tenant-id: <UUID_DEL_TENANT>
```

El middleware valida automáticamente la existencia del tenant y lo inyecta en cada request.

---

## 🌱 Seed de Datos

El seed crea automáticamente:

- **Tenant**: MES
- **Tipos**: Esencial (ESS), Estratégico (STR)
- **Procesos**: QA, DEV, OPS
- **Objetivos**: Reducir defectos, Mejorar productividad, Aumentar estabilidad
- **12 Indicadores** con histórico 2021-2026:
  - BUG_RATE, TEST_COVERAGE, DEFECT_DENSITY, ESCAPED_DEFECTS
  - COMMITS, LEAD_TIME, DEPLOY_FREQ, CODE_REVIEW_TIME
  - INCIDENTS, MTTR, AVAILABILITY, ERROR_RATE

---

## 📊 Executive Score

Se calcula como:

```
Executive Score = Promedio(cumplimiento %) de indicadores con target
```

- Máximo: **100**
- Mínimo: **0**
- Solo incluye indicadores con `target` definido

---

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests unitarios (watch mode)
npm run test:watch

# Tests con cobertura
npm run test:cov

# Tests E2E
npm run test:e2e
```

---

## 🛠 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar en modo normal |
| `npm run start:dev` | Desarrollo con watch |
| `npm run start:debug` | Debug con watch |
| `npm run start:prod` | Producción |
| `npm run lint` | Linting con auto-fix |
| `npm run format` | Formatear código |
| `npm run test` | Ejecutar tests |
| `npm run seed` | Ejecutar seed |

---

## 📈 Modelos de Datos

### Enums Principales

```typescript
enum HttpMethod { GET, POST, PUT, DELETE }
enum IndicatorUnit { NUMBER, PERCENT }
enum SourceRole { DATA, NUMERATOR, DENOMINATOR }
enum IndicatorStatus { OK, WARNING, CRITICAL }
enum EvaluationDirection { HIGHER_IS_BETTER, LOWER_IS_BETTER }
```

### Relaciones Clave

- **Tenant** → 1:N → Indicator, Process, Objective, IndicatorType, Source, IndicatorValue, ExecutionLog
- **Indicator** → N:M → Objective (vía IndicatorObjective)
- **Indicator** → N:M → Source (vía IndicatorSource, con rol)
- **Indicator** → 1:N → IndicatorValue (histórico)

---

## 🔒 CORS Configurado

```typescript
origins: [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]
```

Permite conexión desde frontend React/Vite en puerto 5173.

---

## 📦 Dependencias Principales

```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/schedule": "^6.1.1",
  "@nestjs/axios": "^4.0.1",
  "@prisma/client": "^6.19.2",
  "class-validator": "^0.14.3",
  "class-transformer": "^0.5.1",
  "reflect-metadata": "^0.2.2"
}
```

---

## 🚀 Próximos Pasos (Roadmap)

- [ ] JWT multi-tenant authentication
- [ ] Alertas automáticas por email/webhook
- [ ] Scheduler dinámico (configurable por UI)
- [ ] Frontend React con gráficos ejecutivos
- [ ] Despliegue SaaS-ready (Docker + Kubernetes)
- [ ] Export a Excel/PDF
- [ ] Dashboard comparativo entre tenants

---

## 📚 Git Workflow

Ver [`GIT_WORKFLOW_CMI.md`](./GIT_WORKFLOW_CMI.md) para el flujo de trabajo con Git.

**Resumen:**
- `main` → Rama estable (producción)
- `dev` → Desarrollo activo
- PR obligatorio de `dev` → `main`

---

## 👨‍💻 Autor

**Denys Buedo Hidalgo**  
Executive KPI Engine

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados.

NestJS es [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

---

## 🆘 Soporte

- **Documentación NestJS**: https://docs.nestjs.com
- **Discord NestJS**: https://discord.gg/G7Qnnhy
- **Prisma Docs**: https://www.prisma.io/docs

---

<div align="center">

**CMI Backend - Executive KPI Engine**  
*Arquitectura limpia. Escalable. Profesional.*

</div>
