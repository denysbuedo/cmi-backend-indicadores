# 📋 Instrucciones para Backend - Dashboard Ejecutivo

## 🎯 Objetivo

Agregar información de **procesos** y **objetivos** al endpoint del Dashboard Ejecutivo para que el frontend pueda mostrar una vista completa del estado de la organización.

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
  },
  "objectives": [
    {
      "objectiveId": "uuid-obj-1",
      "objectiveCode": "O1",
      "objectiveName": "Mejorar la calidad del producto",
      "weightedScore": 82.5,
      "worstStatus": "OK",
      "indicatorCount": 5,
      "trend": "UP"
    },
    {
      "objectiveId": "uuid-obj-2",
      "objectiveCode": "O2",
      "objectiveName": "Optimizar tiempos de entrega",
      "weightedScore": 65.0,
      "worstStatus": "WARNING",
      "indicatorCount": 4,
      "trend": "DOWN"
    },
    {
      "objectiveId": "uuid-obj-3",
      "objectiveCode": "O3",
      "objectiveName": "Incrementar satisfacción del cliente",
      "weightedScore": 45.0,
      "worstStatus": "CRITICAL",
      "indicatorCount": 3,
      "trend": "STABLE"
    }
  ]
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
| `trend` | "UP" \| "DOWN" \| "STABLE" | Tendencia vs período anterior |

### `ObjectiveDashboardItem` (cada objetivo en `objectives`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `objectiveId` | string (UUID) | ID único del objetivo |
| `objectiveCode` | string | Código del objetivo (ej: "O1", "O2") |
| `objectiveName` | string | Nombre completo del objetivo |
| `weightedScore` | number | Score ponderado del objetivo (0-100) |
| `worstStatus` | "OK" \| "WARNING" \| "CRITICAL" | Peor estado entre sus indicadores |
| `indicatorCount` | number | Cantidad de indicadores asociados |
| `trend` | "UP" \| "DOWN" \| "STABLE" | Tendencia vs período anterior **(NUEVO)** |

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

### 3. **Score Ponderado por Objetivo**

El score de cada objetivo es el **promedio ponderado** de sus indicadores:

```typescript
objectiveScore = sum(indicator.compliancePercent * indicator.weight) / sum(indicator.weight)
```

### 4. **Peor Estado por Objetivo**

El estado del objetivo es el **peor estado** entre todos sus indicadores:

```typescript
// Si algún indicador está CRITICAL → objetivo CRITICAL
// Si algún indicador está WARNING (y ninguno CRITICAL) → objetivo WARNING
// Si todos están OK → objetivo OK
worstStatus = indicators.some(i => i.status === 'CRITICAL') ? 'CRITICAL'
  : indicators.some(i => i.status === 'WARNING') ? 'WARNING'
  : 'OK'
```

### 5. **Conteo de Estados (Procesos)**

```typescript
ok = processes.filter(p => p.status === "OK").length
warning = processes.filter(p => p.status === "WARNING").length
critical = processes.filter(p => p.status === "CRITICAL").length
```

### 6. **Score Promedio (Procesos)**

```typescript
avgScore = processes.reduce((sum, p) => sum + p.score, 0) / processes.length
```

### 7. **Tendencia para Procesos**

Comparar el score actual con el del período anterior:

```typescript
if (currentScore > previousScore + 5) trend = "UP"
else if (currentScore < previousScore - 5) trend = "DOWN"
else trend = "STABLE"
```

### 8. **Tendencia para Objetivos (NUEVO)**

Comparar el score actual del objetivo con el del período anterior:

```typescript
// Obtener score del período anterior para este objetivo
const previousObjectiveScore = await this.getObjectiveScoreByPeriod(
  objective.id, 
  previousPeriodId
);

const scoreDiff = currentScore - previousObjectiveScore;

if (scoreDiff > 5) trend = "UP";
else if (scoreDiff < -5) trend = "DOWN";
else trend = "STABLE";
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

  // 3. Obtener objetivos con sus indicadores
  const objectives = await this.objectiveRepository.find({
    where: { tenantId, active: true },
    relations: ['indicators']
  });

  // 4. Obtener scores del período anterior para comparación
  const previousPeriodIndicators = await this.getIndicators(tenantId, previousPeriodId);

  // 5. Calcular score por proceso
  const processList = processes.map(process => {
    const processIndicators = indicators.filter(i => i.processId === process.id);
    const previousProcessIndicators = previousPeriodIndicators.filter(i => i.processId === process.id);

    const totalWeight = processIndicators.reduce((sum, i) => sum + i.weight, 0);
    const weightedScore = processIndicators.reduce(
      (sum, i) => sum + (i.compliancePercent * i.weight),
      0
    );

    const score = totalWeight > 0 ? weightedScore / totalWeight : 0;

    // Calcular score anterior
    const prevTotalWeight = previousProcessIndicators.reduce((sum, i) => sum + i.weight, 0);
    const prevWeightedScore = previousProcessIndicators.reduce(
      (sum, i) => sum + (i.compliancePercent * i.weight),
      0
    );
    const previousScore = prevTotalWeight > 0 ? prevWeightedScore / prevTotalWeight : 0;

    let status: IndicatorStatus;
    if (score >= 80) status = 'OK';
    else if (score >= 60) status = 'WARNING';
    else status = 'CRITICAL';

    // Calcular tendencia
    const scoreDiff = score - previousScore;
    let trend: TrendDirection;
    if (scoreDiff > 5) trend = 'UP';
    else if (scoreDiff < -5) trend = 'DOWN';
    else trend = 'STABLE';

    return {
      id: process.id,
      code: process.code,
      name: process.name,
      score: parseFloat(score.toFixed(1)),
      status,
      indicatorCount: processIndicators.length,
      trend
    };
  });

  // 6. Calcular score, estado y tendencia por objetivo
  const objectiveList = objectives.map(objective => {
    const objectiveIndicators = indicators.filter(i => i.objectiveId === objective.id);
    const previousObjectiveIndicators = previousPeriodIndicators.filter(i => i.objectiveId === objective.id);

    const totalWeight = objectiveIndicators.reduce((sum, i) => sum + i.weight, 0);
    const weightedScore = objectiveIndicators.reduce(
      (sum, i) => sum + (i.compliancePercent * i.weight),
      0
    );

    const score = totalWeight > 0 ? weightedScore / totalWeight : 0;

    // Calcular score anterior
    const prevTotalWeight = previousObjectiveIndicators.reduce((sum, i) => sum + i.weight, 0);
    const prevWeightedScore = previousObjectiveIndicators.reduce(
      (sum, i) => sum + (i.compliancePercent * i.weight),
      0
    );
    const previousScore = prevTotalWeight > 0 ? prevWeightedScore / prevTotalWeight : 0;

    // Determinar el peor estado
    let worstStatus: IndicatorStatus = 'OK';
    if (objectiveIndicators.some(i => i.status === 'CRITICAL')) {
      worstStatus = 'CRITICAL';
    } else if (objectiveIndicators.some(i => i.status === 'WARNING')) {
      worstStatus = 'WARNING';
    }

    // Calcular tendencia
    const scoreDiff = score - previousScore;
    let trend: TrendDirection;
    if (scoreDiff > 5) trend = 'UP';
    else if (scoreDiff < -5) trend = 'DOWN';
    else trend = 'STABLE';

    return {
      objectiveId: objective.id,
      objectiveCode: objective.code,
      objectiveName: objective.name,
      weightedScore: parseFloat(score.toFixed(1)),
      worstStatus,
      indicatorCount: objectiveIndicators.length,
      trend  // NUEVO CAMPO
    };
  });

  // 7. Calcular resumen de procesos
  const processSummary: ProcessSummary = {
    total: processList.length,
    ok: processList.filter(p => p.status === 'OK').length,
    warning: processList.filter(p => p.status === 'WARNING').length,
    critical: processList.filter(p => p.status === 'CRITICAL').length,
    avgScore: parseFloat(
      (processList.reduce((sum, p) => sum + p.score, 0) / processList.length || 0).toFixed(1)
    ),
    list: processList
  };

  // 8. Retornar respuesta completa
  return {
    summary: {
      totalIndicators: indicators.length,
      ok: indicators.filter(i => i.status === 'OK').length,
      warning: indicators.filter(i => i.status === 'WARNING').length,
      critical: indicators.filter(i => i.status === 'CRITICAL').length
    },
    executiveScore: this.calculateExecutiveScore(indicators),
    indicators: this.mapIndicators(indicators),
    processes: processSummary,
    objectives: objectiveList
  };
}
```

---

## 🧪 Testing

### Response Validation

Verificar que la respuesta incluya:

#### Procesos:
- [ ] `processes` existe
- [ ] `processes.total` es número
- [ ] `processes.ok + processes.warning + processes.critical === processes.total`
- [ ] `processes.avgScore` está entre 0 y 100
- [ ] `processes.list` es array
- [ ] Cada item en `list` tiene: id, code, name, score, status, indicatorCount, **trend**

#### Objetivos:
- [ ] `objectives` existe (puede ser array vacío)
- [ ] `objectives` es un array
- [ ] Cada item tiene: objectiveId, objectiveCode, objectiveName, weightedScore, worstStatus, indicatorCount, **trend**

### Edge Cases

- [ ] Si no hay procesos → `processes.list = []`, `total = 0`, `avgScore = 0`
- [ ] Si no hay objetivos → `objectives = []`
- [ ] Si un proceso no tiene indicadores → `score = 0`, `status = "CRITICAL"`, `trend = "STABLE"`
- [ ] Si un objetivo no tiene indicadores → `score = 0`, `worstStatus = "OK"`, `trend = "STABLE"`
- [ ] Si todos los procesos están OK → `ok = total`, `warning = 0`, `critical = 0`
- [ ] Si no hay período anterior → todas las tendencias = `"STABLE"`

---

## 📝 Notas Importantes

1. **Campos opcionales**: El frontend está diseñado para trabajar incluso si `processes` o `objectives` no existen en la respuesta.

2. **Performance**:
   - Para procesos: el frontend muestra todos con scroll (max-h-64)
   - Para objetivos: el frontend muestra todos con scroll (max-h-64)
   - Considerar índices en las tablas para filtrar por `tenantId` y `periodId`

3. **Cache**: Este endpoint puede ser cacheado por 5-10 minutos ya que no requiere datos en tiempo real.

4. **Tenant**: Asegurarse de filtrar todos los datos por `tenantId`.

5. **Período anterior**: Para calcular tendencias, se necesita:
   - Identificar el período anterior al actual
   - Obtener los indicadores de ese período
   - Calcular scores y comparar

6. **Umbral de tendencia**: 
   - `> 5` puntos → UP (📈)
   - `< -5` puntos → DOWN (📉)
   - Entre -5 y 5 → STABLE (➡️)

---

## 🚀 Una vez Implementado

1. Actualizar la versión del backend
2. Avisar al equipo de frontend
3. El frontend automáticamente mostrará las tendencias en Objetivos

---

## 📞 Contacto

Cualquier duda sobre la implementación, consultar con el equipo de frontend.

**Frontend ya está listo para recibir estos datos.** ✅
