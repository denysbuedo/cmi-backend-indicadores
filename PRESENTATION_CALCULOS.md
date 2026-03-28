# 📊 SISTEMA CMI - CÁLCULOS Y FÓRMULAS

## Presentación Técnica del Sistema de Indicadores

---

## 🎯 1. CÁLCULO DE CUMPLIMIENTO DE INDICADORES

### **Fórmula Básica**

El cumplimiento de cada indicador se calcula comparando el **valor real** vs el **valor objetivo (target)**:

```typescript
// Para indicadores donde "MAYOR ES MEJOR" (ej: ventas, producción)
cumplimiento = (valor_real / target) × 100

// Para indicadores donde "MENOR ES MEJOR" (ej: defectos, errores)
cumplimiento = (target / valor_real) × 100
```

### **Ejemplos Prácticos**

#### **Ejemplo 1: HIGHER_IS_BETTER (Mayor es mejor)**
```
Indicador: Ventas Mensuales
Target: $100,000
Valor Real: $85,000

cumplimiento = (85,000 / 100,000) × 100 = 85%
```

#### **Ejemplo 2: LOWER_IS_BETTER (Menor es mejor)**
```
Indicador: Tasa de Defectos
Target: 5%
Valor Real: 3%

cumplimiento = (5 / 3) × 100 = 166.7%  ← ¡Sobrecumplimiento!
```

### **Características Clave**

✅ **Permite sobrecumplimiento**: Si el valor real supera al target, el cumplimiento puede ser >100%

✅ **Mínimo en 0**: `cumplimiento = Math.max(0, compliance)` - Nunca es negativo

✅ **Sin target**: Si no hay target definido, el cumplimiento es `null`

---

## 📈 2. ESTADOS DE LOS INDICADORES

### **Umbrales de Estado**

| Estado | Rango de Cumplimiento | Color |
|--------|----------------------|-------|
| **OK** | ≥ 80% | 🟢 Verde |
| **WARNING** | ≥ 60% y < 80% | 🟡 Amarillo |
| **CRITICAL** | < 60% | 🔴 Rojo |
| **NO_DATA** | Sin datos | ⚪ Gris |

### **Ejemplos**

```
✅ OK:         cumplimiento = 95%  →  Verde
⚠️  WARNING:   cumplimiento = 72%  →  Amarillo
❌ CRITICAL:   cumplimiento = 45%  →  Rojo
```

---

## 🎚️ 3. PESO (WEIGHT) DE INDICADORES

### **Propósito**

Cada indicador tiene un **peso (weight)** que determina su importancia relativa en el cálculo del score.

### **Reglas**

- **Rango típico**: 1 a 10 (puede ser cualquier número positivo)
- **Peso mayor** = Más impacto en el score final
- **Validación**: La suma de pesos de indicadores por proceso no debe exceder 100

### **Ejemplo de Pesos**

| Indicador | Peso | Importancia |
|-----------|------|-------------|
| Ventas | 8 | Alta |
| Satisfacción Cliente | 6 | Media |
| Defectos | 4 | Baja |

---

## 🏆 4. SCORE DE PROCESOS

### **Fórmula**

El score de cada proceso es el **promedio ponderado** del cumplimiento de sus indicadores:

```
score_proceso = Σ(cumplimiento_indicador × peso) / Σ(peso)
```

### **Ejemplo Detallado**

**Proceso: VENTAS**

| Indicador | Cumplimiento | Peso | Cumplimiento × Peso |
|-----------|-------------|------|---------------------|
| Ventas Mensuales | 85% | 8 | 680 |
| Nuevos Clientes | 92% | 6 | 552 |
| Satisfacción | 78% | 4 | 312 |
| **TOTAL** | | **18** | **1544** |

```
score_proceso = 1544 / 18 = 85.8%
```

### **Estado del Proceso**

| Score | Estado |
|-------|--------|
| ≥ 80 | 🟢 OK |
| ≥ 60 | 🟡 WARNING |
| < 60 | 🔴 CRITICAL |

---

## 🎯 5. SCORE DE OBJETIVOS ESTRATÉGICOS

### **Fórmula**

El score de cada objetivo es el **promedio ponderado** del cumplimiento de sus indicadores:

```
score_objetivo = Σ(cumplimiento_indicador × peso) / Σ(peso)
```

### **Ejemplo**

**Objetivo: "Aumentar rentabilidad"**

| Indicador | Cumplimiento | Peso | Cumplimiento × Peso |
|-----------|-------------|------|---------------------|
| Margen Neto | 90% | 7 | 630 |
| ROI | 85% | 5 | 425 |
| Reducción Costos | 70% | 3 | 210 |
| **TOTAL** | | **15** | **1265** |

```
score_objetivo = 1265 / 15 = 84.3%
```

### **WorstStatus (Peor Estado)**

El estado del objetivo es el **peor estado** entre todos sus indicadores:

```
Si hay 1+ indicadores en CRITICAL → objetivo CRITICAL 🔴
Si hay 1+ indicadores en WARNING (sin CRITICAL) → objetivo WARNING 🟡
Si todos están OK → objetivo OK 🟢
```

---

## 📊 6. EXECUTIVE SCORE (SCORE GENERAL DE LA ORGANIZACIÓN)

### **Fórmula**

El Executive Score es el **promedio ponderado** del cumplimiento de TODOS los indicadores del tenant:

```
executive_score = Σ(cumplimiento_indicador × peso) / Σ(peso)
```

### **Ejemplo Completo**

**Todos los indicadores de la organización:**

| Indicador | Proceso | Cumplimiento | Peso | Cumplimiento × Peso |
|-----------|---------|-------------|------|---------------------|
| Ventas | Ventas | 85% | 8 | 680 |
| Defectos | Calidad | 95% | 6 | 570 |
| Satisfacción | Servicio | 72% | 5 | 360 |
| ROI | Finanzas | 88% | 7 | 616 |
| Productividad | Operaciones | 65% | 4 | 260 |
| **TOTAL** | | | **30** | **2486** |

```
executive_score = 2486 / 30 = 82.9%
```

### **Interpretación**

| Executive Score | Estado General |
|-----------------|----------------|
| ≥ 80 | 🟢 Organización en estado ÓPTIMO |
| ≥ 60 | 🟡 Organización en estado DE ATENCIÓN |
| < 60 | 🔴 Organización en estado CRÍTICO |

---

## 📉 7. TENDENCIAS (TREND)

### **Cálculo**

La tendencia compara el score actual vs el score del **periodo anterior**:

```
diferencia = score_actual - score_anterior

Si diferencia > 5 → trend = "UP" 📈
Si diferencia < -5 → trend = "DOWN" 📉
Si -5 ≤ diferencia ≤ 5 → trend = "STABLE" ➡️
```

### **Ejemplos**

```
Periodo Anterior: 75%
Periodo Actual: 82%
diferencia = 82 - 75 = +7 → trend = "UP" 📈

Periodo Anterior: 80%
Periodo Actual: 73%
diferencia = 73 - 80 = -7 → trend = "DOWN" 📉

Periodo Anterior: 78%
Periodo Actual: 79%
diferencia = 79 - 78 = +1 → trend = "STABLE" ➡️
```

### **Aplicación**

- ✅ Se calcula para **Procesos**
- ✅ Se calcula para **Objetivos**
- ❌ NO se calcula para indicadores individuales (se muestra estado directo)

---

## 🔄 8. FRECUENCIA DE ACTUALIZACIÓN

### **Tipos de Frecuencia**

Cada indicador puede tener:

- **frequencyDays**: Se actualiza cada N días
- **frequencyMonths**: Se actualiza cada N meses

### **Detección de Indicadores Vencidos**

```typescript
fecha_proxima_actualizacion = fecha_fin_periodo + frecuencia

Si fecha_actual > fecha_proxima_actualizacion → indicador VENCIDO
```

### **Ejemplo**

```
Indicador: Ventas Mensuales
Periodo: 2026-01-01 a 2026-01-31
frequencyMonths: 1

Próxima actualización esperada: 2026-02-28

Si hoy es 2026-03-15 → INDICADOR VENCIDO ⚠️
```

---

## 📊 9. RESUMEN DE FÓRMULAS

### **Tabla Rápida**

| Concepto | Fórmula |
|----------|---------|
| **Cumplimiento** (HIGHER_IS_BETTER) | `(valor / target) × 100` |
| **Cumplimiento** (LOWER_IS_BETTER) | `(target / valor) × 100` |
| **Score Proceso** | `Σ(cumplimiento × peso) / Σ(peso)` |
| **Score Objetivo** | `Σ(cumplimiento × peso) / Σ(peso)` |
| **Executive Score** | `Σ(cumplimiento × peso) / Σ(peso)` |
| **Tendencia** | `score_actual - score_anterior` |

---

## 🎯 10. EJEMPLO COMPLETO DE CÁLCULO

### **Organización: EMPRESA S.A.**

#### **Nivel 1: Indicadores**

| Código | Nombre | Target | Valor | Cumplimiento | Peso | Estado |
|--------|--------|--------|-------|-------------|------|--------|
| VENT-001 | Ventas Mensuales | $100K | $85K | 85% | 8 | 🟢 OK |
| DEF-001 | Tasa Defectos | 5% | 3% | 166% | 6 | 🟢 OK |
| SAT-001 | Satisfacción | 90% | 72% | 80% | 5 | 🟢 OK |
| ROI-001 | ROI | 15% | 12% | 80% | 7 | 🟢 OK |
| PROD-001 | Productividad | 100 unid | 65 unid | 65% | 4 | 🟡 WARNING |

#### **Nivel 2: Procesos**

| Proceso | Indicadores | Score | Estado |
|---------|-------------|-------|--------|
| **Ventas** | VENT-001, SAT-001 | (85×8 + 80×5) / (8+5) = **83.1%** | 🟢 OK |
| **Calidad** | DEF-001 | (166×6) / 6 = **166%** | 🟢 OK |
| **Finanzas** | ROI-001 | (80×7) / 7 = **80%** | 🟢 OK |
| **Operaciones** | PROD-001 | (65×4) / 4 = **65%** | 🟡 WARNING |

#### **Nivel 3: Objetivos Estratégicos**

| Objetivo | Indicadores | Score | WorstStatus |
|----------|-------------|-------|-------------|
| **Crecimiento** | VENT-001, ROI-001 | (85×8 + 80×7) / (8+7) = **82.7%** | 🟢 OK |
| **Excelencia** | DEF-001, SAT-001, PROD-001 | (166×6 + 80×5 + 65×4) / (6+5+4) = **110%** | 🟡 WARNING |

#### **Nivel 4: Executive Score**

```
Executive Score = (85×8 + 166×6 + 80×5 + 80×7 + 65×4) / (8+6+5+7+4)
                = (680 + 996 + 400 + 560 + 260) / 30
                = 2896 / 30
                = 96.5%  ← 🟢 EXCELENTE
```

---

## 📋 11. PUNTOS CLAVE PARA LA PRESENTACIÓN

### **Para Directivos**

1. ✅ **Executive Score**: Un solo número que resume el estado de toda la organización
2. ✅ **Estados visuales**: 🟢🟡🔴 Fácil de interpretar
3. ✅ **Tendencias**: 📈📉 Permite ver evolución temporal
4. ✅ **Multi-nivel**: Indicador → Proceso → Objetivo → Organización

### **Para Gerentes de Área**

1. ✅ **Score por Proceso**: Estado de cada área
2. ✅ **Indicadores vencidos**: Alertas de lo que necesita actualización
3. ✅ **Pesos**: Permite priorizar lo más importante

### **Para Analistas**

1. ✅ **Fórmulas precisas**: Cálculos reproducibles
2. ✅ **Histórico**: Seguimiento temporal
3. ✅ **Dirección de evaluación**: HIGHER_IS_BETTER vs LOWER_IS_BETTER

---

## 🎤 12. SCRIPT SUGERIDO PARA PRESENTACIÓN

### **Apertura (2 min)**

> "Buenos días. Hoy les presento el Sistema CMI (Cuadro de Mando Integral), una herramienta que nos permite medir el desempeño de toda la organización en tiempo real."

### **Conceptos Clave (5 min)**

> "El sistema se basa en 4 niveles:
> 1. **Indicadores**: Métricas individuales con target y valor real
> 2. **Procesos**: Agrupaciones de indicadores por área
> 3. **Objetivos**: Metas estratégicas transversales
> 4. **Executive Score**: Score global de la organización"

### **Cálculos (5 min)**

> "Cada indicador se compara contra su target. Si el cumplimiento es ≥80%, está en verde. Entre 60-80%, amarillo. Menos de 60%, rojo.
>
> Los scores de procesos y objetivos son promedios ponderados, donde el peso determina la importancia de cada indicador."

### **Demo (10 min)**

> "Veamos el dashboard en acción. Aquí vemos el Executive Score actual: 82.9%. Esto significa que la organización está en estado ÓPTIMO.
>
> Si hacemos clic en este proceso, vemos sus indicadores y sus estados individuales..."

### **Cierre (3 min)**

> "El sistema CMI nos da una visión clara y objetiva del desempeño organizacional, permitiendo tomar decisiones basadas en datos reales y actualizados."

---

## 📊 13. DIAPOSITIVAS SUGERIDAS

1. **Portada** - Nombre del sistema + logo
2. **Objetivos** - ¿Qué mide el sistema?
3. **Arquitectura** - 4 niveles (Indicador → Proceso → Objetivo → Org)
4. **Fórmula de Cumplimiento** - Con ejemplos
5. **Estados** - Tabla de colores (🟢🟡🔴)
6. **Pesos** - Importancia relativa
7. **Score de Procesos** - Fórmula + ejemplo
8. **Score de Objetivos** - Fórmula + ejemplo
9. **Executive Score** - Fórmula + ejemplo global
10. **Tendencias** - 📈📉➡️
11. **Demo** - Capturas del dashboard
12. **Conclusiones** - Beneficios clave

---

**¿Necesitás que profundice en algún cálculo específico o que prepare ejemplos adicionales?** 🎯
