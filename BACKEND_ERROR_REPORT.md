# 🚨 REPORTE DE ERROR - Backend Multi-Tenant Auth

## 📋 Descripción del Problema

**Endpoint:** `POST /auth/login`  
**Error:** `400 Bad Request - x-tenant-id header is required`  
**Fecha:** 2025-03-25  
**Estado:** ❌ CRÍTICO - Bloquea todo el login

---

## 🔍 Evidencia del Frontend

### Request que se envía:

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@cmi.com",
  "password": "admin123"
}
```

**Headers enviados:**
- `Content-Type: application/json`
- **NO se envía `x-tenant-id`** (porque es un endpoint público de auth)

### Response del backend:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "statusCode": 400,
  "message": "x-tenant-id header is required",
  "error": "Bad Request"
}
```

---

## 🎯 Comportamiento Esperado

El endpoint `/auth/login` **NO debería requerir** el header `x-tenant-id` porque:

1. **El usuario aún no está autenticado** - No tiene token JWT
2. **No sabemos a qué tenant pertenece** hasta después del login
3. **Es un endpoint público** - Debería estar excluido del middleware de tenant

### Respuesta esperada:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "email": "admin@cmi.com",
    "fullName": "Administrador del Sistema",
    "role": "SUPER_ADMIN"
  },
  "tenants": [
    {
      "tenantId": "uuid-del-tenant",
      "tenantCode": "MES",
      "tenantName": "MES",
      "role": "ADMIN"
    }
  ]
}
```

---

## 🔧 Solución Requerida en el Backend

### Opción 1: Middleware con rutas públicas (RECOMENDADA)

```typescript
// tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  // Rutas públicas que NO requieren x-tenant-id
  private readonly publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/health',
  ];

  use(request: Request, response: Response, next: NextFunction) {
    const url = request.url;

    // 1. Verificar si es una ruta pública
    const isPublicRoute = this.publicRoutes.some(route => 
      url.startsWith(`/api/${route}`) || url.startsWith(`/${route}`)
    );

    if (isPublicRoute) {
      console.log(`✅ PUBLIC ROUTE: ${url} - Skipping tenant validation`);
      return next();
    }

    // 2. Para rutas protegidas, validar x-tenant-id
    const tenantId = request.headers['x-tenant-id'] as string;

    if (!tenantId) {
      console.error(`❌ MISSING TENANT: ${url}`);
      return response.status(400).json({
        statusCode: 400,
        message: 'x-tenant-id header is required',
        error: 'Bad Request',
      });
    }

    // 3. Validar que el tenant existe
    // ... validación del tenant ...

    console.log(`✅ TENANT VALIDATED: ${url} - Tenant: ${tenantId}`);
    next();
  }
}
```

### Opción 2: Decorador @Public() en NestJS

```typescript
// decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

```typescript
// guards/tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Obtener request
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    // 3. Validar tenant
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required');
    }

    // 4. Validar que el tenant existe
    const tenant = await this.tenantService.findOne(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // 5. Adjuntar tenant al request
    request.tenant = tenant;

    return true;
  }
}
```

```typescript
// auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  @Public()  // ← ESTE DECORADOR DEBE EXCLUIR LA VALIDACIÓN
  @Post('login')
  async login(@Body() dto: LoginDto) {
    // ...
  }

  @Public()  // ← ESTE TAMBIÉN
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // ...
  }
}
```

---

## 📊 Matriz de Endpoints - Headers Requeridos

| Endpoint | Método | ¿Requiere Auth? | ¿Requiere x-tenant-id? |
|----------|--------|-----------------|------------------------|
| `/auth/login` | POST | ❌ No | ❌ **NO** |
| `/auth/register` | POST | ❌ No | ❌ **NO** |
| `/auth/change-password` | POST | ✅ Sí (Bearer) | ❌ No |
| `/auth/me` | GET | ✅ Sí (Bearer) | ❌ No |
| `/tenants` | GET | ✅ Sí (Bearer) | ❌ No |
| `/tenants/:id` | GET | ✅ Sí (Bearer) | ❌ No |
| `/users` | GET | ✅ Sí (Bearer) | ❌ No |
| `/users/:id/tenants` | POST | ✅ Sí (Bearer) | ❌ No |
| `/indicators` | GET | ✅ Sí (Bearer) | ✅ **SÍ** |
| `/dashboard/executive` | GET | ✅ Sí (Bearer) | ✅ **SÍ** |
| `/processes` | GET | ✅ Sí (Bearer) | ✅ **SÍ** |
| `/objectives` | GET | ✅ Sí (Bearer) | ✅ **SÍ** |

### Regla General:

```
┌─────────────────────────────────────────────────────────────┐
│ TIPO DE ENDPOINT           │ AUTH  │ X-TENANT-ID           │
├─────────────────────────────────────────────────────────────┤
│ Auth (login, register)     │ ❌ No │ ❌ No                 │
│ Gestión (users, tenants)   │ ✅ Sí │ ❌ No (global)        │
│ Recursos (indicators, etc) │ ✅ Sí │ ✅ Sí (específico)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Pasos para Verificar el Fix

### 1. Verificar que el middleware excluye /auth/login

```typescript
// En el middleware, agregar logs:
console.log('🔍 URL:', request.url);
console.log('🔍 IS PUBLIC:', isPublicRoute);
console.log('🔍 TENANT ID:', request.headers['x-tenant-id']);
```

### 2. Probar el login desde Postman/Thunder Client

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@cmi.com\",\"password\":\"admin123\"}"
```

**Respuesta esperada:** `200 OK` con token JWT

### 3. Verificar logs del backend

Debería aparecer algo como:
```
[Nest] 12345  - 03/25/2026, 10:30:00 AM     LOG  ✅ PUBLIC ROUTE: /auth/login - Skipping tenant validation
[Nest] 12345  - 03/25/2026, 10:30:01 AM     LOG  ✅ Login successful: admin@cmi.com
```

---

## 📝 Checklist para el Equipo de Backend

- [ ] Verificar que el `TenantMiddleware` excluye `/auth/login`
- [ ] Verificar que el `TenantMiddleware` excluye `/auth/register`
- [ ] Verificar que el `TenantMiddleware` excluye `/health`
- [ ] Agregar logs en el middleware para debug
- [ ] Probar login sin `x-tenant-id` header
- [ ] Probar login CON `x-tenant-id` header (debería funcionar también)
- [ ] Verificar que los endpoints de recursos (`/indicators`, `/processes`, etc.) SÍ requieren `x-tenant-id`
- [ ] Reiniciar el backend después de los cambios (`npm run start:dev`)

---

## 🚀 Una vez Corregido

El frontend funcionará correctamente con este flujo:

```
1. Usuario ingresa email/password
   ↓
2. Frontend → POST /auth/login (sin x-tenant-id)
   ↓
3. Backend → Valida credenciales → Retorna token + tenants
   ↓
4. Frontend → Guarda token + tenants en localStorage
   ↓
5. Frontend → Redirige a /dashboard
   ↓
6. Próximas peticiones → Incluyen Authorization + x-tenant-id
```

---

## 📞 Contacto

**Equipo Frontend**  
Cualquier duda, estamos a disposición para coordinar.

---

**Fecha de reporte:** 2025-03-25  
**Prioridad:** 🔴 CRÍTICA  
**Impacto:** 100% - Todos los usuarios no pueden loguearse
