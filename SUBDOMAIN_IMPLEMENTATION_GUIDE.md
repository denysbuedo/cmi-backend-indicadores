# 📋 GUÍA DE IMPLEMENTACIÓN - MULTI-TENANT CON SUBDOMINIOS

## 🎯 RESUMEN EJECUTIVO

El backend multi-tenant con subdominios está **100% implementado y funcional**. Esta guía explica cómo el frontend debe integrar la estrategia de subdominios.

---

## 🏗️ ARQUITECTURA IMPLEMENTADA

### **Estrategia: Subdominios**

```
https://mes.tudominio.com  →  Tenant MES
https://uci.tudominio.com  →  Tenant UCI
https://empresaA.tudominio.com  →  Tenant Empresa A
```

### **Ventajas:**
- ✅ Aislamiento total de datos entre tenants
- ✅ Cada cliente tiene su URL dedicada
- ✅ Cookies y localStorage aislados por subdominio
- ✅ Más seguro y profesional
- ✅ Escalable a cientos de tenants

---

## 🔧 ENDPOINTS IMPLEMENTADOS

### **1. Buscar Tenant por Subdominio (PÚBLICO)**

```http
GET /tenants/by-subdomain/:subdomain
Authorization: NO REQUERIDA
```

**Request:**
```bash
curl -X GET http://localhost:3000/tenants/by-subdomain/mes
```

**Response Exitosa (200 OK):**
```json
{
  "id": "3b692cf9-6668-4b34-a547-6c9f8c629b23",
  "name": "MES",
  "code": "MES",
  "subdomain": "mes",
  "active": true,
  "createdAt": "2026-02-14T17:11:02.181Z",
  "updatedAt": "2026-03-26T00:00:00.000Z",
  "_count": {
    "processes": 8,
    "objectives": 3,
    "indicators": 20,
    "users": 5
  }
}
```

**Response Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Tenant no encontrado para este subdominio",
  "error": "Not Found"
}
```

---

### **2. Login (Ahora con subdominio)**

```http
POST /auth/login
Content-Type: application/json
```

**Request:**
```json
{
  "email": "admin@cmi.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "2da22c8d-5ce3-4689-86d9-2c5f19c54b32",
    "email": "admin@cmi.com",
    "fullName": "Administrador del Sistema",
    "role": "SUPER_ADMIN"
  },
  "tenants": [
    {
      "tenantId": "3b692cf9-6668-4b34-a547-6c9f8c629b23",
      "tenantCode": "MES",
      "tenantName": "MES",
      "role": "ADMIN"
    }
  ]
}
```

---

### **3. Endpoints de Recursos (CON X-TENANT-ID)**

**Todos los endpoints de recursos AHORA REQUIEREN `x-tenant-id`:**

```http
GET /processes
Authorization: Bearer <TOKEN>
x-tenant-id: 3b692cf9-6668-4b34-a547-6c9f8c629b23  // ← OBLIGATORIO
```

**Endpoints que requieren `x-tenant-id`:**
- `GET /processes`
- `GET /objectives`
- `GET /indicators`
- `GET /dashboard/executive`
- `GET /dashboard/summary`
- `POST /indicators`
- `PUT /indicators/:id`
- `DELETE /indicators/:id`
- etc...

---

## 📝 IMPLEMENTACIÓN EN EL FRONTEND

### **PASO 1: Detectar subdominio al cargar la app**

```typescript
// src/utils/tenantDetector.ts
export function detectTenantFromSubdomain(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // mes.tudominio.com → ["mes", "tudominio", "com"]
  if (parts.length > 2) {
    return parts[0].toLowerCase(); // "mes"
  }
  
  return null; // No hay subdominio
}
```

---

### **PASO 2: Buscar tenant al iniciar la aplicación**

```typescript
// src/main.tsx (ANTES de renderizar la app)
import { detectTenantFromSubdomain } from './utils/tenantDetector';

async function bootstrap() {
  const subdomain = detectTenantFromSubdomain();
  
  if (subdomain) {
    try {
      // Buscar tenant por subdominio (endpoint público)
      const response = await fetch(`http://localhost:3000/tenants/by-subdomain/${subdomain}`);
      
      if (!response.ok) {
        throw new Error('Tenant no encontrado');
      }
      
      const tenant = await response.json();
      
      // Guardar tenant en localStorage
      localStorage.setItem('current_tenant_id', tenant.id);
      localStorage.setItem('current_tenant_code', tenant.code);
      localStorage.setItem('current_tenant_name', tenant.name);
      
      console.log('✅ Tenant detectado:', tenant.name);
      
    } catch (error) {
      console.error('❌ Error al detectar tenant:', error);
      // Redirigir a página de error o landing
    }
  }
  
  // Renderizar la aplicación
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  );
}

bootstrap();
```

---

### **PASO 3: Actualizar AuthContext**

```typescript
// src/context/AuthContext.tsx
import { detectTenantFromSubdomain } from '../utils/tenantDetector';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  
  // Cargar tenant al iniciar sesión
  useEffect(() => {
    const subdomain = detectTenantFromSubdomain();
    const storedTenantId = localStorage.getItem('current_tenant_id');
    
    if (subdomain && !storedTenantId) {
      // Si hay subdominio pero no tenant guardado, buscarlo
      fetch(`http://localhost:3000/tenants/by-subdomain/${subdomain}`)
        .then(res => res.json())
        .then(tenant => {
          localStorage.setItem('current_tenant_id', tenant.id);
          setCurrentTenant(tenant);
        })
        .catch(err => console.error('Error loading tenant:', err));
    } else if (storedTenantId) {
      // Cargar tenant desde localStorage
      setCurrentTenant({
        id: storedTenantId,
        code: localStorage.getItem('current_tenant_code'),
        name: localStorage.getItem('current_tenant_name'),
      });
    }
  }, []);
  
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user, tenants } = response.data;
    
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Con subdominios, el tenant es FIJO (no hay selector)
    // Usar el tenant del subdominio actual
    const subdomain = detectTenantFromSubdomain();
    if (subdomain && tenants.length > 0) {
      const tenant = tenants.find(t => 
        t.tenantCode?.toLowerCase() === subdomain.toLowerCase()
      );
      
      if (tenant) {
        localStorage.setItem('current_tenant_id', tenant.tenantId);
        setCurrentTenant(tenant);
      }
    }
    
    setUser(user);
  };
  
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, currentTenant, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

### **PASO 4: Interceptor de Axios (CRÍTICO)**

```typescript
// src/api/axios.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR PARA AGREGAR HEADERS AUTOMÁTICAMENTE
api.interceptors.request.use(
  (config) => {
    // NO agregar headers a endpoints de auth
    if (config.url?.includes('/auth/')) {
      return config;
    }
    
    // Endpoint público para buscar tenant por subdominio
    if (config.url?.includes('/tenants/by-subdomain/')) {
      return config;
    }
    
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('current_tenant_id');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
```

---

### **PASO 5: NO mostrar selector de tenant**

```typescript
// src/components/Header.tsx
export const Header = () => {
  const { user, currentTenant } = useAuth();
  
  return (
    <header>
      {/* Mostrar tenant actual (NO editable) */}
      <div className="tenant-info">
        🏢 {currentTenant?.name}
      </div>
      
      {/* NO hay selector de tenant - el tenant es FIJO por subdominio */}
      {/* El SUPER_ADMIN debe loguearse en diferentes subdominios para cambiar */}
    </header>
  );
};
```

---

## 🧪 FLUJO COMPLETO DE PRUEBA

### **1. Usuario entra a `https://mes.tudominio.com`**

```
┌─────────────────────────────────────────┐
│  mes.tudominio.com                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Frontend detecta subdominio "mes"      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  GET /tenants/by-subdomain/mes          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Backend retorna tenant MES             │
│  { id, name, code, subdomain }          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Frontend guarda tenant en localStorage │
└─────────────────────────────────────────┘
```

### **2. Usuario hace login**

```
┌─────────────────────────────────────────┐
│  Usuario ingresa email/password         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  POST /auth/login                       │
│  { email, password }                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Backend valida credenciales            │
│  Retorna token + user + tenants         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Frontend guarda token                  │
│  Usa tenant del subdominio actual       │
└─────────────────────────────────────────┘
```

### **3. Usuario navega a `/process`**

```
┌─────────────────────────────────────────┐
│  Usuario va a /process                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Frontend hace GET /processes           │
│  Headers:                               │
│  - Authorization: Bearer <token>        │
│  - x-tenant-id: <uuid-del-tenant-mes>   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Backend filtra procesos por tenantId   │
│  Retorna SOLO procesos del tenant MES   │
└─────────────────────────────────────────┘
```

---

## 📊 MATRIZ DE PERMISOS

| Rol | ¿Puede ver múltiples tenants? | ¿Ve recursos? |
|-----|-------------------------------|---------------|
| **SUPER_ADMIN** | ❌ NO (uno por subdominio) | ✅ Todos los del tenant actual |
| **TENANT_ADMIN** | ❌ NO (uno fijo) | ✅ Todos los del tenant |
| **USER** | ❌ NO (uno fijo) | ✅ Solo los asignados explícitamente |

**IMPORTANTE:** Con subdominios, **NINGÚN rol puede cambiar de tenant** desde la UI. Para cambiar de tenant, el usuario debe:
1. Cerrar sesión
2. Ir a `https://otro-tenant.tudominio.com`
3. Iniciar sesión nuevamente

---

## 🎯 CONFIGURACIÓN DE DNS (Para Producción)

### **Wildcard DNS**

```
*.tudominio.com  →  Apunta a la IP de tu servidor
```

**Ejemplo en Cloudflare:**
```
Type: A
Name: *
Content: <IP_DEL_SERVIDOR>
Proxy: Enabled
```

### **Certificado SSL Wildcard**

```bash
# Generar certificado wildcard
certbot certonly --wildcard -d tudominio.com
```

---

## 🧪 PRUEBAS LOCALES

### **Opción 1: Modificar hosts file**

```
# En /etc/hosts (Linux/Mac) o C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1  mes.localhost
127.0.0.1  uci.localhost
127.0.0.1  empresaA.localhost
```

Luego entrar a: `http://mes.localhost:5173`

### **Opción 2: Usar ngrok**

```bash
ngrok http 5173 --subdomain=mes
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Frontend:**
- [ ] Crear `tenantDetector.ts` para detectar subdominio
- [ ] Actualizar `main.tsx` para buscar tenant al cargar
- [ ] Actualizar `AuthContext` para manejar tenant fijo
- [ ] Crear interceptor de axios para agregar `x-tenant-id`
- [ ] Remover selector de tenant del Header
- [ ] Mostrar tenant actual como información (no editable)
- [ ] Probar flujo completo con 2 subdominios diferentes

### **Backend:**
- [x] Agregar campo `subdomain` a la tabla `Tenant`
- [x] Crear endpoint `GET /tenants/by-subdomain/:subdomain`
- [x] Hacer endpoint público (sin JWT)
- [x] Actualizar seed para incluir subdomain
- [x] Actualizar `JwtAuthGuard` para soportar rutas públicas
- [x] Todos los endpoints filtran por `x-tenant-id`

---

## 🚀 PRÓXIMOS PASOS

1. **Frontend:** Implementar los 5 pasos de esta guía
2. **Testing:** Probar con 2-3 subdominios diferentes
3. **DNS:** Configurar wildcard DNS en producción
4. **SSL:** Obtener certificado wildcard
5. **Deploy:** Desplegar a producción

---

## 📞 SOPORTE

Cualquier duda sobre la implementación, consultar con el equipo de backend.

**Endpoints documentados en:** `API_DOCUMENTATION.md`
**Código backend:** `src/modules/tenants/`

---

**Fecha:** 2026-03-26
**Versión:** 1.0
**Estado:** ✅ Backend completado - ⏳ Frontend pendiente
