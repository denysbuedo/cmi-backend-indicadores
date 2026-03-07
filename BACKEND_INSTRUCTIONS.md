# 📋 Instrucciones para Backend - Dashboard Ejecutivo con Procesos

## 🎯 Objetivo

Agregar información de **procesos** al endpoint del Dashboard Ejecutivo para que el frontend pueda mostrar el estado de los procesos junto con los indicadores.

---

## 🔧 Endpoint a Modificar

### `GET /dashboard/executive`

**Respuesta actual:**
```json
{
  "summary": {
    "totalIndicators": 48,
    "ok": 35,
    "warning": 8,
    "critical": 5
  },
  "executiveScore": 84.7,
  "indicators": [...]
}
```

**Respuesta requerida:**
```json
{
  "summary": {
    "totalIndicators": 48,
    "ok": 35,
    "warning": 8,
    "critical": 5
  },
  "executiveScore": 84.7,
  "indicators": [...],
  "processes": {
    "total": 3,
    "ok": 2,
    "warning": 1,
    "critical": 0,
    "avgScore": 78.3,
    "list": [
      {
        "id": "uuid-1",
        "code": "QA",
        "name": "Quality Assurance",
        "score": 85.2,
        "status": "OK",
        "indicatorCount": 12,
        "trend": "UP"
      },
      {
        "id": "uuid-2",
        "code": "DEV",
        "name": "Desarrollo",
        "score": 62.5,
        "status": "WARNING",
        "indicatorCount": 18,
        "trend": "DOWN"
      },
      {
        "id": "uuid-3",
        "code": "OPS",
        "name": "Operaciones",
        "score": 88.1,
        "status": "OK",
        "indicatorCount": 18,
        "trend": "STABLE"
      }
    ]
  }
}
```

---

## 📊 Estructura de Datos

### `ProcessSummary` (objeto `processes`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total` | number | Cantidad total de procesos |
| `ok` | number | Procesos con estado OK |
| `warning` | number | Procesos con estado WARNING |
| `critical` | number | Procesos con estado CRITICAL |
| `avgScore` | number | Score promedio de todos los procesos |
| `list` | ProcessDashboardItem[] | Lista detallada de procesos |

### `ProcessDashboardItem` (cada proceso en `list`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | ID único del proceso |
| `code` | string | Código del proceso (ej: "QA", "DEV") |
| `name` | string | Nombre completo del proceso |
| `score` | number | Score calculado del proceso (0-100) |
| `status` | "OK" \| "WARNING" \| "CRITICAL" | Estado basado en el score |
| `indicatorCount` | number | Cantidad de indicadores del proceso |
| `trend` | "UP" \| "DOWN" \| "STABLE" | Tendencia vs período anterior (opcional) |

---

## 🧮 Cálculos Requeridos

### 1. **Score por Proceso**

El score de cada proceso debe calcularse como el **promedio ponderado** de los indicadores asociados a ese proceso:

```typescript
processScore = sum(indicator.compliancePercent * indicator.weight) / sum(indicator.weight)
```

### 2. **Estado del Proceso**

Basado en el score calculado:

```typescript
if (processScore >= 80) status = "OK"
else if (processScore >= 60) status = "WARNING"
else status = "CRITICAL"
```

### 3. **Conteo de Estados**

```typescript
ok = processes.filter(p => p.status === "OK").length
warning = processes.filter(p => p.status === "WARNING").length
critical = processes.filter(p => p.status === "CRITICAL").length
```

### 4. **Score Promedio**

```typescript
avgScore = processes.reduce((sum, p) => sum + p.score, 0) / processes.length
```

### 5. **Tendencia (Opcional)**

Comparar el score actual con el del período anterior:

```typescript
if (currentScore > previousScore + 5) trend = "UP"
else if (currentScore < previousScore - 5) trend = "DOWN"
else trend = "STABLE"
```

---

## 💡 Implementación Sugerida (NestJS/TypeScript)

### Service Method

```typescript
async getExecutiveDashboard(tenantId: string): Promise<ExecutiveDashboardResponse> {
  // 1. Obtener indicadores (ya existente)
  const indicators = await this.getIndicators(tenantId);
  
  // 2. Obtener procesos con sus indicadores
  const processes = await this.processRepository.find({
    where: { tenantId, active: true },
    relations: ['indicators']
  });
  
  // 3. Calcular score por proceso
  const processList = processes.map(process => {
    const processIndicators = indicators.filter(i => i.processId === process.id);
    
    const totalWeight = processIndicators.reduce((sum, i) => sum + i.weight, 0);
    const weightedScore = processIndicators.reduce(
      (sum, i) => sum + (i.compliancePercent * i.weight),
      0
    );
    
    const score = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    let status: IndicatorStatus;
    if (score >= 80) status = 'OK';
    else if (score >= 60) status = 'WARNING';
    else status = 'CRITICAL';
    
    return {
      id: process.id,
      code: process.code,
      name: process.name,
      score: parseFloat(score.toFixed(1)),
      status,
      indicatorCount: processIndicators.length,
      trend: 'STABLE' // Calcular comparando con período anterior
    };
  });
  
  // 4. Calcular resumen de procesos
  const processSummary: ProcessSummary = {
    total: processList.length,
    ok: processList.filter(p => p.status === 'OK').length,
    warning: processList.filter(p => p.status === 'WARNING').length,
    critical: processList.filter(p => p.status === 'CRITICAL').length,
    avgScore: parseFloat(
      (processList.reduce((sum, p) => sum + p.score, 0) / processList.length).toFixed(1)
    ),
    list: processList
  };
  
  // 5. Retornar respuesta completa
  return {
    summary: {
      totalIndicators: indicators.length,
      ok: indicators.filter(i => i.status === 'OK').length,
      warning: indicators.filter(i => i.status === 'WARNING').length,
      critical: indicators.filter(i => i.status === 'CRITICAL').length
    },
    executiveScore: this.calculateExecutiveScore(indicators),
    indicators: this.mapIndicators(indicators),
    processes: processSummary
  };
}
```

---

## 🧪 Testing

### Response Validation

Verificar que la respuesta incluya:

- [ ] `processes` existe
- [ ] `processes.total` es número
- [ ] `processes.ok + processes.warning + processes.critical === processes.total`
- [ ] `processes.avgScore` está entre 0 y 100
- [ ] `processes.list` es array
- [ ] Cada item en `list` tiene: id, code, name, score, status, indicatorCount

### Edge Cases

- [ ] Si no hay procesos → `processes.list = []`, `total = 0`, `avgScore = 0`
- [ ] Si un proceso no tiene indicadores → `score = 0`, `status = "CRITICAL"`
- [ ] Si todos los procesos están OK → `ok = total`, `warning = 0`, `critical = 0`

---

## 📝 Notas Importantes

1. **Campo opcional**: El frontend está diseñado para trabajar incluso si `processes` no existe en la respuesta (usa valores por defecto).

2. **Performance**: Si hay muchos procesos, considerar paginar o limitar la lista a los primeros 10-20 procesos.

3. **Cache**: Este endpoint puede ser cacheado por 5-10 minutos ya que no requiere datos en tiempo real.

4. **Tenant**: Asegurarse de filtrar todos los datos por `tenantId`.

---

## 🚀 Una vez Implementado

1. Actualizar la versión del backend
2. Avisar al equipo de frontend
3. El frontend automáticamente mostrará los datos de procesos

---

## 📞 Contacto

Cualquier duda sobre la implementación, consultar con el equipo de frontend.

**Frontend ya está listo para recibir estos datos.** ✅
