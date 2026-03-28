# 🚀 RELEASE NOTES - v1.7.0

**Fecha:** 27 de marzo de 2026  
**Versión:** 1.7.0  
**Tipo:** 🔥 MAJOR FEATURE RELEASE

---

## 🎯 RESUMEN EJECUTIVO

La versión **v1.7.0** completa la implementación de la **arquitectura multi-tenant** con soporte para subdominios y gestión de usuarios por tenant.

---

## ✨ NUEVAS FUNCIONALIDADES

### **1. Multi-Tenant con Subdominios** 🏢

- ✅ Cada tenant tiene su subdominio único (ej: `mes.tudominio.com`)
- ✅ Aislamiento total de datos entre tenants
- ✅ Endpoint público para detectar tenant por subdominio
- ✅ SSL wildcard soportado

**Endpoints:**
```http
GET /tenants/by-subdomain/:subdomain  # Público, sin auth
```

---

### **2. TENANT_ADMIN Puede Crear Usuarios** 👥

- ✅ TENANT_ADMIN puede crear usuarios de su tenant
- ✅ Asignación automática al tenant
- ✅ Validación de permisos implementada
- ✅ USER no puede crear usuarios

**Endpoints:**
```http
POST /users  # Con x-tenant-id header
GET /users/:id  # Retorna asignaciones del usuario
```

---

### **3. Asignación Automática de Tenant** 🎯

Todos los recursos creados se asignan automáticamente al tenant:

- ✅ Procesos
- ✅ Objetivos
- ✅ Indicadores
- ✅ Usuarios

**No es necesario enviar tenantId en el body.** El backend lo toma del header `x-tenant-id`.

---

## 🔧 CAMBIOS TÉCNICOS

### **Base de Datos**

**Nuevas Tablas:**
- `User` (usuarios del sistema)
- `UserTenant` (relación usuario-tenant)
- `UserProcess` (relación usuario-proceso)
- `UserObjective` (relación usuario-objetivo)
- `UserIndicator` (relación usuario-indicador)

**Cambios en Tablas Existentes:**
- `Tenant`: Agregado campo `subdomain` (UNIQUE)

**Migraciones:**
- `20260324151741_add_users_and_tenants`
- `20260326000000_add_subdomain_to_tenant`

---

### **Nuevos Módulos**

| Módulo | Archivos | Propósito |
|--------|----------|-----------|
| **Auth** | 10 archivos | Login, registro, JWT guard |
| **Tenants** | 5 archivos | CRUD de tenants + subdomain |
| **Users** | 8 archivos | CRUD de usuarios + asignaciones |

---

### **Endpoints Nuevos**

| Método | Endpoint | Auth | Tenant | Descripción |
|--------|----------|------|--------|-------------|
| `POST` | `/auth/login` | ❌ | ❌ | Login de usuario |
| `POST` | `/auth/register` | ❌ | ❌ | Registro de usuario |
| `POST` | `/auth/change-password` | ✅ | ❌ | Cambiar password |
| `GET` | `/tenants/by-subdomain/:subdomain` | ❌ | ❌ | Buscar tenant por subdominio |
| `POST` | `/users` | ✅ | ✅ | Crear usuario (TENANT_ADMIN puede) |
| `GET` | `/users/:id` | ✅ | ✅ | Ver usuario con asignaciones |
| `PUT` | `/indicators/:id/values/:valueId` | ✅ | ✅ | Actualizar valor de indicador |
| `DELETE` | `/indicators/:id/values/:valueId` | ✅ | ✅ | Eliminar valor de indicador |

---

## 📊 MATRIZ DE PERMISOS

| Rol | Crear Usuarios | Crear Procesos | Crear Objetivos | Crear Indicadores |
|-----|----------------|----------------|-----------------|-------------------|
| **SUPER_ADMIN** | ✅ Cualquier tenant | ✅ Cualquier tenant | ✅ Cualquier tenant | ✅ Cualquier tenant |
| **TENANT_ADMIN** | ✅ Su tenant | ✅ Su tenant | ✅ Su tenant | ✅ Su tenant |
| **USER** | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 🧪 PRUEBAS REALIZADAS

### **✅ Test 1: Crear proceso con tenantId**
```bash
POST /processes
Response: { tenantId: "UUID" }  ← Correcto
```

### **✅ Test 2: Crear usuario como TENANT_ADMIN**
```bash
POST /users
Response: { tenants: [{ tenantId: "UUID", role: "VIEWER" }] }  ← Correcto
```

### **✅ Test 3: Obtener usuario con asignaciones**
```bash
GET /users/:id
Response: { tenants: [...], processes: [...], objectives: [...], indicators: [...] }  ← Correcto
```

### **✅ Test 4: Subdomain detection**
```bash
GET /tenants/by-subdomain/mes
Response: { id: "UUID", name: "MES", subdomain: "mes" }  ← Correcto
```

---

## 📄 DOCUMENTACIÓN

### **Nuevos Documentos**

| Archivo | Propósito |
|---------|-----------|
| `EXECUTIVE_PRESENTATION_MATHEMATICS.pdf` | Presentación ejecutiva con fórmulas matemáticas |
| `SUBDOMAIN_IMPLEMENTATION_GUIDE.md` | Guía de implementación de subdominios para frontend |
| `FRONTEND_REQUIREMENT_TENANT_ADMIN.md` | Requerimientos para frontend (TENANT_ADMIN) |
| `MULTI_TENANT_IMPLEMENTATION_SUMMARY.md` | Resumen completo de la implementación |
| `BACKEND_IMPLEMENTATION_COMPLETE.md` | Estado del backend |
| `PRESENTATION_CALCULOS.md` | Guía de cálculos del sistema CMI |

---

## 📦 DEPENDENCIAS NUEVAS

```json
{
  "@nestjs/jwt": "^11.0.2",
  "@nestjs/passport": "^11.0.5",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.1",
  "@types/passport-jwt": "^4.0.1",
  "@types/bcrypt": "^5.0.2"
}
```

---

## ⚠️ CAMBIOS BREAKING

### **Middleware de Tenant**

**Antes:**
- `/users` estaba excluido del middleware
- No se inyectaba `x-tenant-id`

**Ahora:**
- `/users` requiere `x-tenant-id`
- Todas las peticiones (excepto auth) requieren `x-tenant-id`

**Impacto:** El frontend debe enviar `x-tenant-id` en TODAS las peticiones a `/users/*`.

---

## 🚀 MIGRACIÓN

### **Para Producción:**

```bash
# 1. Aplicar migraciones
npx prisma migrate deploy

# 2. Regenerar Prisma Client
npx prisma generate

# 3. Reiniciar servidor
npm run start:prod
```

### **Para Desarrollo:**

```bash
# 1. Ejecutar migraciones
npx prisma migrate dev

# 2. Seed (opcional)
npm run seed

# 3. Iniciar servidor
npm run start:dev
```

---

## 📋 CHECKLIST DE ACTUALIZACIÓN

- [x] Migraciones de BD aplicadas
- [x] Prisma Client regenerado
- [x] Nuevos módulos instalados
- [x] Documentación actualizada
- [x] Tests manuales aprobados
- [x] Tags de versión creados
- [ ] Frontend actualizado (pendiente)
- [ ] Deploy a producción (pendiente)

---

## 🎯 PRÓXIMOS PASOS

### **Frontend (Pendiente)**

1. Implementar detección de subdominio
2. Actualizar AuthContext para manejar tenant fijo
3. Habilitar TENANT_ADMIN en UsersAdminPage
4. Restringir creación por rol (ProcessesAdminPage, ObjectivesAdminPage)

**Documentación:** `FRONTEND_REQUIREMENT_TENANT_ADMIN.md`

### **Producción**

1. Configurar DNS wildcard (`*.tudominio.com`)
2. Obtener certificado SSL wildcard
3. Configurar variables de entorno
4. Deploy a producción

---

## 📞 SOPORTE

**Documentación Completa:**
- `README.md` - Inicio rápido
- `API_DOCUMENTATION.md` - API completa
- `SUBDOMAIN_IMPLEMENTATION_GUIDE.md` - Subdominios
- `FRONTEND_REQUIREMENT_TENANT_ADMIN.md` - Frontend

**Contacto:**
- Backend: Equipo Backend
- Frontend: Equipo Frontend

---

## 🙏 AGRADECIMIENTOS

Gracias a todo el equipo por hacer posible esta implementación.

---

**Firmado:**  
Equipo de Desarrollo  
**Fecha:** 2026-03-27  
**Versión:** v1.7.0  
**Estado:** ✅ PRODUCCIÓN READY
