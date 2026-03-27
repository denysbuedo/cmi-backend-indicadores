# 📋 REQUERIMIENTO PARA FRONTEND - Habilitar TENANT_ADMIN

**Fecha:** 27 de marzo de 2026  
**Prioridad:** 🔴 ALTA  
**Estado Backend:** ✅ COMPLETADO Y TESTEADO

---

## 🎯 OBJETIVO

Habilitar que los usuarios con rol **TENANT_ADMIN** puedan:
1. Acceder a las páginas de administración de usuarios
2. Crear usuarios que se asignen automáticamente a su tenant
3. Crear/editar procesos, objetivos e indicadores de su tenant

---

## ✅ ESTADO DEL BACKEND

**Todos los endpoints están implementados y funcionando:**

| Endpoint | Estado | Prueba |
|----------|--------|--------|
| `POST /processes` | ✅ Funciona | Guarda tenantId automáticamente |
| `POST /objectives` | ✅ Funciona | Guarda tenantId automáticamente |
| `POST /indicators` | ✅ Funciona | Guarda tenantId automáticamente |
| `POST /users` | ✅ Funciona | TENANT_ADMIN puede crear usuarios |
| `GET /users/:id` | ✅ Funciona | Retorna asignaciones del usuario |

**Pruebas realizadas:**
```bash
# 1. Crear proceso → ✅ Funciona
POST /processes
Headers: { Authorization: Bearer TOKEN, x-tenant-id: UUID }
Response: { id: "...", tenantId: "UUID" }

# 2. Crear usuario → ✅ Funciona
POST /users
Headers: { Authorization: Bearer TOKEN, x-tenant-id: UUID }
Response: { id: "...", tenants: [{ tenantId: "UUID", role: "VIEWER" }] }
```

---

## 🔧 CAMBIOS REQUERIDOS EN EL FRONTEND

### **1. UsersAdminPage.tsx**

**Archivo:** `src/pages/Admin/UsersAdminPage.tsx`

**Cambio requerido:**
```typescript
// ACTUALMENTE:
const canCreate = user?.role === 'SUPER_ADMIN';

// DEBERÍA SER:
const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';
```

**Explicación:**
- TENANT_ADMIN debe poder crear usuarios de su tenant
- El backend se encarga de validar que el usuario se asigne al tenant correcto

---

### **2. ProcessesAdminPage.tsx**

**Archivo:** `src/pages/Admin/ProcessesAdminPage.tsx`

**Cambio requerido:**
```typescript
// ACTUALMENTE:
const canCreate = true;  // Temporal

// DEBERÍA SER:
const canCreate = user?.role !== 'USER';
```

**Explicación:**
- SUPER_ADMIN y TENANT_ADMIN pueden crear procesos
- USER solo puede ver (no crear/editar)

---

### **3. ObjectivesAdminPage.tsx**

**Archivo:** `src/pages/Admin/ObjectivesAdminPage.tsx`

**Cambio requerido:**
```typescript
// ACTUALMENTE:
const canCreate = true;  // Temporal

// DEBERÍA SER:
const canCreate = user?.role !== 'USER';
```

---

### **4. IndicatorsAdminPage.tsx** (si existe)

**Cambio requerido:**
```typescript
const canCreate = user?.role !== 'USER';
```

---

## 📊 MATRIZ DE PERMISOS

| Rol | Crear Usuarios | Crear Procesos | Crear Objetivos | Crear Indicadores |
|-----|----------------|----------------|-----------------|-------------------|
| **SUPER_ADMIN** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |
| **TENANT_ADMIN** | ✅ Sí (su tenant) | ✅ Sí (su tenant) | ✅ Sí (su tenant) | ✅ Sí (su tenant) |
| **USER** | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 🧪 PRUEBAS REQUERIDAS

### **Prueba 1: TENANT_ADMIN crea usuario**

```
1. Loguearse como TENANT_ADMIN
2. Ir a /admin/users
3. Click en "Nuevo Usuario"
4. Completar datos:
   - Email: usuario@tenant.com
   - Password: 123456
   - Nombre: Usuario Tenant
   - Rol: USER
5. Guardar
6. Verificar que el usuario se creó y está asignado al tenant
```

**Resultado esperado:** ✅ Usuario creado y asignado al tenant automáticamente

---

### **Prueba 2: TENANT_ADMIN crea proceso**

```
1. Loguearse como TENANT_ADMIN
2. Ir a /admin/processes
3. Click en "Nuevo Proceso"
4. Completar datos:
   - Código: TEST
   - Nombre: Proceso Test
   - Descripción: Prueba
5. Guardar
```

**Resultado esperado:** ✅ Proceso creado con tenantId automáticamente

---

### **Prueba 3: USER intenta crear usuario**

```
1. Loguearse como USER
2. Ir a /admin/users
3. Verificar que NO aparece el botón "Nuevo Usuario"
```

**Resultado esperado:** ✅ Botón oculto/deshabilitado para USER

---

## 🎯 COMPORTAMIENTO DEL BACKEND

### **Cuando TENANT_ADMIN crea un usuario:**

```typescript
// 1. Backend valida permisos
if (user.role === 'TENANT_ADMIN') {
  // 2. Valida que el tenant del header es el suyo
  const isOwnTenant = await validateTenantOwnership(userId, tenantId);
  if (!isOwnTenant) {
    throw new ForbiddenException('Solo puede crear usuarios en su tenant');
  }
}

// 3. Crea el usuario
const newUser = await prisma.user.create({...});

// 4. Asigna automáticamente al tenant
await prisma.userTenant.create({
  data: {
    userId: newUser.id,
    tenantId,  // ← Del header x-tenant-id
    role: 'VIEWER',
  },
});
```

**El frontend NO necesita enviar el tenantId en el body.**  
El backend lo toma automáticamente del header `x-tenant-id`.

---

## 📝 RESUMEN DE CAMBIOS

| Archivo | Cambio | Línea aproximada |
|---------|--------|------------------|
| `UsersAdminPage.tsx` | `canCreate` incluye TENANT_ADMIN | ~20-30 |
| `ProcessesAdminPage.tsx` | `canCreate` excluye USER | ~20-30 |
| `ObjectivesAdminPage.tsx` | `canCreate` excluye USER | ~20-30 |

---

## ⏰ TIEMPO ESTIMADO

**Implementación:** 30 minutos  
**Pruebas:** 15 minutos  
**Total:** 45 minutos

---

## 📞 CONSULTAS

Cualquier duda sobre este requerimiento:

1. Verificar que el AuthContext está enviando `x-tenant-id` en todas las peticiones
2. Verificar que el interceptor de axios está funcionando correctamente
3. Revisar `BACKEND_IMPLEMENTATION_COMPLETE.md` para más detalles del backend

---

**Firmado:**  
Equipo de Backend  
**Fecha:** 2026-03-27  
**Estado:** ✅ Backend completado - ⏳ Frontend pendiente
