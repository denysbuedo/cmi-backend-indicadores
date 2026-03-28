# 📋 REQUERIMIENTO TÉCNICO PARA BACKEND

## Multi-Tenant: Asignación Automática de Tenant y Permisos de Usuario

---

**Fecha:** 26 de marzo de 2026  
**Versión:** 1.0  
**Prioridad:** 🔴 **ALTA** (Bloqueante para producción)  
**Impacto:** Arquitectura multi-tenant completa

---

## 🎯 OBJETIVO

Completar la implementación multi-tenant para que:

1. ✅ Los recursos (procesos, objetivos, indicadores) se asignen **automáticamente** al tenant del usuario que los crea
2. ✅ Los **TENANT_ADMIN** puedan crear usuarios de su tenant
3. ✅ El aislamiento de datos entre tenants sea **total**

---

## 📝 PROBLEMA 1: Recursos no tienen tenantId automático

### **Situación Actual**

Cuando un usuario crea un proceso/objetivo/indicador:

```http
# Frontend envía:
POST /processes
Headers: {
  "Authorization": "Bearer <token>",
  "x-tenant-id": "3b692cf9-6668-4b34-a547-6c9f8c629b23"
}
Body: {
  "code": "TEST",
  "name": "Proceso Test"
}
```

**Problema:**
```typescript
// Backend actualmente:
// ❌ NO guarda el tenantId en la base de datos
// ❌ El proceso queda "huérfano" sin tenant
```

### **¿Por qué es un problema?**

| Problema | Impacto |
|----------|---------|
| **Aislamiento de datos** | Sin tenantId, no podemos filtrar recursos por tenant |
| **Seguridad** | Usuarios de un tenant podrían ver recursos de otro tenant |
| **Multi-tenant** | La arquitectura completa se basa en que cada recurso pertenezca a un tenant |
| **Dashboard** | El executive score mezclaría datos de todos los tenants |

### **Solución Requerida**

En **TODOS** los endpoints de CREACIÓN (POST), el backend debe:

```typescript
// processes.controller.ts (EJEMPLO)
@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() createProcessDto: CreateProcessDto,
  @Headers('x-tenant-id') tenantId: string,  // ← 1. Obtener del header
  @User() user: User,  // ← 2. Usuario logueado
) {
  // 3. Validar que el usuario tiene acceso a este tenant
  const hasAccess = await this.validateTenantAccess(user.id, tenantId);
  if (!hasAccess) {
    throw new UnauthorizedException('No tiene acceso a este tenant');
  }

  // 4. Asignar tenantId automáticamente
  return this.processesService.create({
    ...createProcessDto,
    tenantId,  // ← 5. Guardar en la BD
  });
}
```

---

## 📝 PROBLEMA 2: TENANT_ADMIN no puede crear usuarios

### **Situación Actual**

```typescript
// Solo SUPER_ADMIN puede crear usuarios
POST /users
{
  "email": "usuario@empresa.com",
  "password": "123456",
  "fullName": "Usuario Test",
  "role": "USER"
}

// TENANT_ADMIN intenta crear usuario:
// ❌ Error 403 Forbidden
// ❌ No tiene permiso para acceder a /users
```

### **¿Por qué es un problema?**

| Problema | Impacto |
|----------|---------|
| **Autonomía** | Cada tenant debería poder gestionar sus propios usuarios |
| **Escalabilidad** | SUPER_ADMIN no debería tener que crear todos los usuarios manualmente |
| **Casos de uso reales** | En una empresa, el admin local debería poder dar de alta empleados |
| **Multi-tenant** | Un tenant aislado debería ser autosuficiente |

### **Solución Requerida**

Permitir que **TENANT_ADMIN** cree usuarios de **SU tenant**:

```typescript
// users.controller.ts
@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() createUserDto: CreateUserDto,
  @User() user: User,  // Usuario logueado
  @Headers('x-tenant-id') tenantId: string,
) {
  // 1. Validar permisos
  if (user.role === 'USER') {
    throw new ForbiddenException('Los usuarios normales no pueden crear usuarios');
  }

  // 2. Si es TENANT_ADMIN, forzar que el usuario sea de su tenant
  if (user.role === 'TENANT_ADMIN') {
    // Validar que el tenant del header es el suyo
    const isOwnTenant = await this.validateTenantOwnership(user.id, tenantId);
    if (!isOwnTenant) {
      throw new ForbiddenException('Solo puede crear usuarios en su tenant');
    }
  }

  // 3. Si es SUPER_ADMIN, puede crear en cualquier tenant
  // (ya viene el tenantId en el header)

  // 4. Crear usuario
  const newUser = await this.usersService.create({
    ...createUserDto,
  });

  // 5. Asignar usuario al tenant
  await this.userTenantService.assign(newUser.id, tenantId, {
    role: createUserDto.role === 'TENANT_ADMIN' ? 'VIEWER' : 'USER'
  });

  return newUser;
}
```

---

## 🔧 ENDPOINTS A MODIFICAR

### **1. Procesos**

```typescript
// POST /processes
// Requiere: x-tenant-id header
// Acción: Guardar process.tenantId = x-tenant-id

@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() dto: CreateProcessDto,
  @Headers('x-tenant-id') tenantId: string,
) {
  return this.service.create({ ...dto, tenantId });
}
```

### **2. Objetivos**

```typescript
// POST /objectives
// Requiere: x-tenant-id header
// Acción: Guardar objective.tenantId = x-tenant-id

@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() dto: CreateObjectiveDto,
  @Headers('x-tenant-id') tenantId: string,
) {
  return this.service.create({ ...dto, tenantId });
}
```

### **3. Indicadores**

```typescript
// POST /indicators
// Requiere: x-tenant-id header
// Acción: Guardar indicator.tenantId = x-tenant-id

@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() dto: CreateIndicatorDto,
  @Headers('x-tenant-id') tenantId: string,
) {
  return this.service.create({ ...dto, tenantId });
}
```

### **4. Usuarios**

```typescript
// POST /users
// Requiere: x-tenant-id header
// Acción:
// - SUPER_ADMIN: Puede crear en cualquier tenant
// - TENANT_ADMIN: Solo puede crear en su tenant
// - USER: No puede crear usuarios

@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() dto: CreateUserDto,
  @User() user: User,
  @Headers('x-tenant-id') tenantId: string,
) {
  // Validar permisos
  if (user.role === 'USER') {
    throw new ForbiddenException('No tiene permisos para crear usuarios');
  }

  // Si es TENANT_ADMIN, validar que es su tenant
  if (user.role === 'TENANT_ADMIN') {
    const isOwnTenant = await this.validateTenantOwnership(user.id, tenantId);
    if (!isOwnTenant) {
      throw new ForbiddenException('Solo puede crear usuarios en su tenant');
    }
  }

  // Crear usuario
  const newUser = await this.usersService.create({
    ...dto,
    tenantId,  // Se asigna automáticamente
  });

  // Asignar al tenant
  await this.userTenantService.assign(newUser.id, tenantId, 'USER');

  return newUser;
}
```

---

## 🧪 PRUEBAS REQUERIDAS

### **Prueba 1: Crear proceso como SUPER_ADMIN**

```bash
# 1. Login como SUPER_ADMIN
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmi.com","password":"admin123"}'

# 2. Crear proceso
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X POST http://localhost:3000/processes \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: 3b692cf9-6668-4b34-a547-6c9f8c629b23" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST","name":"Proceso Test"}'

# 3. Verificar en BD
SELECT * FROM processes WHERE code = 'TEST';
# Debería tener: tenantId = '3b692cf9-6668-4b34-a547-6c9f8c629b23'
```

**Resultado Esperado:** ✅ Proceso creado con tenantId correcto

---

### **Prueba 2: Crear proceso como TENANT_ADMIN**

```bash
# 1. Login como TENANT_ADMIN
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tenantadmin@mes.com","password":"123456"}'

# 2. Crear proceso
TOKEN="..."
curl -X POST http://localhost:3000/processes \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: 3b692cf9-6668-4b34-a547-6c9f8c629b23" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST2","name":"Proceso Test 2"}'

# 3. Verificar en BD
SELECT * FROM processes WHERE code = 'TEST2';
# Debería tener: tenantId = '3b692cf9-6668-4b34-a547-6c9f8c629b23'
```

**Resultado Esperado:** ✅ Proceso creado con tenantId correcto

---

### **Prueba 3: TENANT_ADMIN crea usuario**

```bash
# 1. Login como TENANT_ADMIN
# (mismo que arriba)

# 2. Crear usuario
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: 3b692cf9-6668-4b34-a547-6c9f8c629b23" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@mes.com",
    "password": "123456",
    "fullName": "Usuario MES",
    "role": "USER"
  }'

# 3. Verificar en BD
SELECT * FROM users WHERE email = 'usuario@mes.com';
SELECT * FROM user_tenants WHERE userId = '[USER_ID]';
# Debería tener: tenantId = '3b692cf9-6668-4b34-a547-6c9f8c629b23'
```

**Resultado Esperado:** ✅ Usuario creado y asignado al tenant correcto

---

### **Prueba 4: TENANT_ADMIN intenta crear usuario en OTRO tenant**

```bash
# 1. Login como TENANT_ADMIN de MES
# 2. Intentar crear usuario con tenant de UCI
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: [UCI_TENANT_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@uci.com",
    "password": "123456",
    "fullName": "Usuario UCI",
    "role": "USER"
  }'

# 3. Debería retornar:
# HTTP 403 Forbidden
# {"message": "Solo puede crear usuarios en su tenant"}
```

**Resultado Esperado:** ✅ Error 403 - Acceso denegado

---

### **Prueba 5: USER intenta crear usuario**

```bash
# 1. Login como USER
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mes.com","password":"123456"}'

# 2. Intentar crear usuario
TOKEN="..."
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: 3b692cf9-6668-4b34-a547-6c9f8c629b23" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "otro@mes.com",
    "password": "123456",
    "fullName": "Otro Usuario",
    "role": "USER"
  }'

# 3. Debería retornar:
# HTTP 403 Forbidden
# {"message": "No tiene permisos para crear usuarios"}
```

**Resultado Esperado:** ✅ Error 403 - Acceso denegado

---

## 📊 RESUMEN DE CAMBIOS

| Endpoint | Cambio Requerido | Prioridad |
|----------|------------------|-----------|
| `POST /processes` | Guardar tenantId del header | 🔴 ALTA |
| `POST /objectives` | Guardar tenantId del header | 🔴 ALTA |
| `POST /indicators` | Guardar tenantId del header | 🔴 ALTA |
| `POST /users` | Permitir TENANT_ADMIN crear en su tenant | 🟡 MEDIA |

---

## 🎯 CRITERIOS DE ACEPTACIÓN

- [ ] Todo proceso creado tiene tenantId asignado automáticamente
- [ ] Todo objetivo creado tiene tenantId asignado automáticamente
- [ ] Todo indicador creado tiene tenantId asignado automáticamente
- [ ] TENANT_ADMIN puede crear usuarios de su tenant
- [ ] TENANT_ADMIN NO puede crear usuarios en otros tenants
- [ ] USER NO puede crear usuarios
- [ ] SUPER_ADMIN puede crear usuarios en cualquier tenant
- [ ] Todas las pruebas pasan exitosamente

---

## 📞 CONTACTO

**Equipo de Desarrollo:**

- **Frontend:** Ya implementado (envía x-tenant-id correctamente)
- **Backend:** Pendiente de implementación

**Fecha Límite:** Antes de pasar a producción

**Impacto:** 
- Sin estos cambios, el multi-tenant **no funciona correctamente**
- Los datos se mezclarían entre tenants
- TENANT_ADMIN no puede gestionar sus usuarios

---

## 📎 ANEXOS

### **A. Flujo Completo de Creación de Recurso**

```
1. Usuario logueado
   ↓
2. Frontend obtiene tenant de localStorage
   ↓
3. Frontend envía petición POST con headers:
   - Authorization: Bearer <token>
   - x-tenant-id: <tenant-uuid>
   ↓
4. Backend valida JWT
   ↓
5. Backend valida que usuario tiene acceso al tenant
   ↓
6. Backend crea recurso con tenantId
   ↓
7. Backend retorna recurso creado
   ↓
8. Frontend muestra recurso en la lista
```

### **B. Matriz de Permisos**

| Rol | Crear Procesos | Crear Objetivos | Crear Indicadores | Crear Usuarios |
|-----|----------------|-----------------|-------------------|----------------|
| **SUPER_ADMIN** | ✅ Sí (cualquier tenant) | ✅ Sí (cualquier tenant) | ✅ Sí (cualquier tenant) | ✅ Sí (cualquier tenant) |
| **TENANT_ADMIN** | ✅ Sí (su tenant) | ✅ Sí (su tenant) | ✅ Sí (su tenant) | ✅ Sí (su tenant) |
| **USER** | ❌ No | ❌ No | ❌ No | ❌ No |

---

**Firmado:**  
Equipo de Desarrollo  
**Fecha:** 2026-03-26  
**Versión:** 1.0
