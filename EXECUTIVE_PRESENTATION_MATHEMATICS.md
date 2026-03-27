# 📊 SISTEMA CMI - CÁLCULOS Y FÓRMULAS MATEMÁTICAS

## Documento Ejecutivo Técnico

**Versión:** 1.0  
**Fecha:** 26 de marzo de 2026  
**Clasificación:** Documento Técnico Ejecutivo

---

# TABLA DE CONTENIDOS

1. [Introducción](#1-introducción)
2. [Arquitectura de Datos](#2-arquitectura-de-datos)
3. [Fundamentos Matemáticos](#3-fundamentos-matemáticos)
4. [Cálculo de Cumplimiento](#4-cálculo-de-cumplimiento)
5. [Sistema de Estados](#5-sistema-de-estados)
6. [Agregación Ponderada](#6-agregación-ponderada)
7. [Executive Score](#7-executive-score)
8. [Análisis de Tendencias](#8-análisis-de-tendencias)
9. [Ejemplos Numéricos Detallados](#9-ejemplos-numéricos-detallados)
10. [Apéndice Matemático](#10-apéndice-matemático)

---

# 1. INTRODUCCIÓN

## 1.1 Propósito del Documento

Este documento describe **matemáticamente** el sistema de cálculo de indicadores de gestión (KPIs) implementado en el Sistema CMI (Cuadro de Mando Integral).

## 1.2 Alcance

El sistema calcula:
- Cumplimiento de indicadores individuales
- Scores de procesos (agrupación operativa)
- Scores de objetivos estratégicos (agrupación estratégica)
- Executive Score (score global de la organización)
- Tendencias temporales

## 1.3 Notación Matemática

| Símbolo | Significado |
|---------|-------------|
| **I** | Conjunto de indicadores |
| **i** | Un indicador específico (i ∈ I) |
| **vᵢ** | Valor real del indicador i |
| **tᵢ** | Target (objetivo) del indicador i |
| **wᵢ** | Peso (weight) del indicador i |
| **cᵢ** | Cumplimiento del indicador i |
| **d** | Dirección de evaluación (↑ o ↓) |

---

# 2. ARQUITECTURA DE DATOS

## 2.1 Modelo Jerárquico

```
┌─────────────────────────────────────────────────────────┐
│                    ORGANIZACIÓN                          │
│                    Executive Score                       │
└─────────────────────────────────────────────────────────┘
              ↓                     ↓
┌───────────────────────┐ ┌───────────────────────┐
│     PROCESO A         │ │     PROCESO B         │
│   Score: 85.2%        │ │   Score: 72.1%        │
├───────────────────────┤ ├───────────────────────┤
│ ┌─────┐ ┌─────┐      │ │ ┌─────┐ ┌─────┐      │
│ │ I₁  │ │ I₂  │ ...  │ │ │ I₅  │ │ I₆  │ ...  │
│ │85%  │ │92%  │      │ │ │78%  │ │65%  │      │
│ └─────┘ └─────┘      │ │ └─────┘ └─────┘      │
└───────────────────────┘ └───────────────────────┘
```

## 2.2 Entidades y Relaciones

### **Tenant (Organización)**
- Identificador único: `tenantId`
- Contiene múltiples procesos, objetivos e indicadores

### **Process (Proceso)**
- Identificador: `processId`
- Pertenece a un tenant: `tenantId`
- Contiene múltiples indicadores

### **Objective (Objetivo Estratégico)**
- Identificador: `objectiveId`
- Pertenece a un tenant: `tenantId`
- Relación M:N con indicadores

### **Indicator (Indicador)**
- Identificador: `indicatorId`
- Pertenece a un tenant: `tenantId`
- Pertenece a un proceso: `processId`
- Tiene dirección: `evaluationDirection ∈ {HIGHER_IS_BETTER, LOWER_IS_BETTER}`
- Tiene peso: `weight ∈ ℕ`
- Tiene unidad: `unit ∈ {NUMBER, PERCENT}`

### **IndicatorValue (Valor de Indicador)**
- Pertenece a un indicador: `indicatorId`
- Valor medido: `value ∈ ℝ⁺`
- Target: `target ∈ ℝ⁺`
- Periodo: `periodStart`, `periodEnd`
- Estado: `status ∈ {OK, WARNING, CRITICAL}`

---

# 3. FUNDAMENTOS MATEMÁTICOS

## 3.1 Función de Cumplimiento

Sea **I** el conjunto de todos los indicadores de un tenant:

**I = {i₁, i₂, ..., iₙ}**

Para cada indicador **i ∈ I**, definimos la función de cumplimiento **c(i)** como:

### **Caso 1: HIGHER_IS_BETTER (↑)**

Cuando un valor mayor indica mejor desempeño:

```
                    ⎧ vᵢ
                    ⎨ ──── × 100    si tᵢ ≠ 0
c(i) =  ↗ (i)  =    ⎩ tᵢ
                    ⎩
                    ⎩ null          si tᵢ = 0 o no definido
```

### **Caso 2: LOWER_IS_BETTER (↓)**

Cuando un valor menor indica mejor desempeño:

```
                    ⎧ tᵢ
                    ⎨ ──── × 100    si vᵢ ≠ 0
c(i) =  ↘ (i)  =    ⎩ vᵢ
                    ⎩
                    ⎩ null          si vᵢ = 0 o tᵢ no definido
```

### **Función Unificada**

Definimos la dirección **dᵢ ∈ {↑, ↓}** para cada indicador:

```
         ⎧ ↗ (i)    si dᵢ = HIGHER_IS_BETTER
c(i) =   ⎨ ↘ (i)    si dᵢ = LOWER_IS_BETTER
         ⎩ null     si no hay datos suficientes
```

## 3.2 Función de Acotamiento

Para garantizar que el cumplimiento no sea negativo:

```
c'(i) = max(0, c(i))
```

**Propiedades:**
- c'(i) ∈ [0, ∞)
- Permite sobrecumplimiento (c'(i) > 100)
- Garantiza no negatividad

---

# 4. CÁLCULO DE CUMPLIMIENTO

## 4.1 Algoritmo Detallado

```typescript
function calculateCompliance(
  value: number,
  target: number,
  direction: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER'
): number | null {
  // Caso 1: Sin target definido
  if (target === null || target === undefined || target === 0) {
    return null;
  }
  
  // Caso 2: HIGHER_IS_BETTER
  if (direction === 'HIGHER_IS_BETTER') {
    const compliance = (value / target) * 100;
    return Math.max(0, compliance);
  }
  
  // Caso 3: LOWER_IS_BETTER
  if (direction === 'LOWER_IS_BETTER') {
    // Evitar división por cero
    if (value === 0) {
      return null;
    }
    const compliance = (target / value) * 100;
    return Math.max(0, compliance);
  }
  
  return null;
}
```

## 4.2 Ejemplos Numéricos

### **Ejemplo 1: Ventas (HIGHER_IS_BETTER)**

```
Datos:
  v = $85,000 (valor real)
  t = $100,000 (target)
  d = HIGHER_IS_BETTER

Cálculo:
       85,000
c = ────────── × 100 = 0.85 × 100 = 85%
      100,000

Resultado: c = 85%  →  🟢 OK
```

### **Ejemplo 2: Defectos (LOWER_IS_BETTER)**

```
Datos:
  v = 3% (tasa de defectos real)
  t = 5% (target máximo aceptable)
  d = LOWER_IS_BETTER

Cálculo:
        5
c = ──────── × 100 = 1.6667 × 100 = 166.67%
        3

Resultado: c = 166.67%  →  🟢 OK (sobrecumplimiento)
```

### **Ejemplo 3: Sin Target**

```
Datos:
  v = 150
  t = null
  d = HIGHER_IS_BETTER

Cálculo:
c = null (no se puede calcular sin target)

Resultado: c = null  →  ⚪ NO_DATA
```

---

# 5. SISTEMA DE ESTADOS

## 5.1 Función de Estado

Definimos la función de estado **S(i)** para cada indicador **i**:

```
         ⎧ OK         si c'(i) ≥ 80
S(i) =   ⎨ WARNING    si 60 ≤ c'(i) < 80
         ⎩ CRITICAL   si c'(i) < 60
```

## 5.2 Umbrales

| Estado | Condición Matemática | Rango | Color |
|--------|---------------------|-------|-------|
| **OK** | c'(i) ≥ 80 | [80, ∞) | 🟢 Verde |
| **WARNING** | 60 ≤ c'(i) < 80 | [60, 80) | 🟡 Amarillo |
| **CRITICAL** | c'(i) < 60 | [0, 60) | 🔴 Rojo |
| **NO_DATA** | c(i) = null | - | ⚪ Gris |

## 5.3 Representación Gráfica

```
Cumplimiento (%)
    ↑
100 │                    ════════════════════ OK (🟢)
    │                    │
 80 │────────────────────┤
    │                    │ WARNING (🟡)
 60 │────────────────────┤
    │                    │
  0 │────────────────────┴─── CRITICAL (🔴)
    └────────────────────────────────────→
         0       60      80      100
```

---

# 6. AGREGACIÓN PONDERADA

## 6.1 Score de Proceso

Sea **P** un proceso con conjunto de indicadores **Iₚ = {i₁, i₂, ..., iₘ}**.

### **Fórmula del Score**

El score del proceso **P** se calcula como el promedio ponderado:

```
          Σ (c(i) × wᵢ)
         i∈Iₚ
Sₚ = ─────────────────
          Σ wᵢ
         i∈Iₚ
```

### **Desarrollo de la Sumatoria**

```
Sₚ = (c(i₁)×w₁ + c(i₂)×w₂ + ... + c(iₘ)×wₘ) / (w₁ + w₂ + ... + wₘ)
```

### **Ejemplo Detallado**

```
Proceso: VENTAS
Indicadores:
  i₁: Ventas Mensuales
      c(i₁) = 85%, w₁ = 8
  i₂: Nuevos Clientes
      c(i₂) = 92%, w₂ = 6
  i₃: Satisfacción
      c(i₃) = 78%, w₃ = 4

Cálculo del numerador:
  Σ(c × w) = (85 × 8) + (92 × 6) + (78 × 4)
           = 680 + 552 + 312
           = 1544

Cálculo del denominador:
  Σw = 8 + 6 + 4 = 18

Score final:
  Sₚ = 1544 / 18 = 85.78%
```

## 6.2 Score de Objetivo Estratégico

Sea **O** un objetivo estratégico con conjunto de indicadores **Iₒ = {j₁, j₂, ..., jₖ}**.

### **Fórmula del Score**

```
          Σ (c(j) × wⱼ)
         j∈Iₒ
Sₒ = ─────────────────
          Σ wⱼ
         j∈Iₒ
```

### **WorstStatus (Peor Estado)**

El estado del objetivo es el peor estado entre todos sus indicadores:

```
Sₒ₍status₎ = min(S(j₁), S(j₂), ..., S(jₖ))

Donde el orden es: CRITICAL < WARNING < OK
```

**Desarrollo:**

```
Si ∃ j ∈ Iₒ tal que S(j) = CRITICAL  →  Sₒ₍status₎ = CRITICAL
Si ∃ j ∈ Iₒ tal que S(j) = WARNING   →  Sₒ₍status₎ = WARNING
Si ∀ j ∈ Iₒ, S(j) = OK               →  Sₒ₍status₎ = OK
```

---

# 7. EXECUTIVE SCORE

## 7.1 Definición Formal

Sea **T** un tenant con conjunto de todos sus indicadores **Iₜ = {i₁, i₂, ..., iₙ}**.

### **Fórmula del Executive Score**

```
            Σ (c(i) × wᵢ)
           i∈Iₜ
ESₜ = ───────────────────
            Σ wᵢ
           i∈Iₜ
```

## 7.2 Propiedades Matemáticas

### **Propiedad 1: Rango**

```
ESₜ ∈ [0, ∞)

Pero típicamente: ESₜ ∈ [0, 200]
  - 0%: Todos los indicadores en 0%
  - 100%: Todos los indicadores exactamente en target
  - >100%: Sobrecumplimiento generalizado
```

### **Propiedad 2: Monotonicidad**

Si el cumplimiento de cualquier indicador mejora (y los demás permanecen constantes), entonces el Executive Score mejora:

```
Si c(iₖ) aumenta → ESₜ aumenta
```

### **Propiedad 3: Sensibilidad al Peso**

Indicadores con mayor peso tienen mayor impacto en el Executive Score:

```
∂ESₜ/∂wₖ = (c(iₖ) × Σw - Σ(c×w)) / (Σw)²

Si c(iₖ) > ESₜ → aumentar wₖ aumenta ESₜ
Si c(iₖ) < ESₜ → aumentar wₖ disminuye ESₜ
```

## 7.3 Ejemplo Completo

```
Organización: EMPRESA S.A.

Todos los indicadores:
┌──────────┬─────────────┬──────────┬────────┬─────────────┐
│ Indicador│ Cumplimiento│   Peso   │ c × w  │   Estado    │
├──────────┼─────────────┼──────────┼────────┼─────────────┤
│ VENT-001 │    85%      │    8     │  680   │   🟢 OK     │
│ DEF-001  │   166%      │    6     │  996   │   🟢 OK     │
│ SAT-001  │    80%      │    5     │  400   │   🟢 OK     │
│ ROI-001  │    88%      │    7     │  616   │   🟢 OK     │
│ PROD-001 │    65%      │    4     │  260   │   🟡 WARN   │
├──────────┴─────────────┴──────────┴────────┴─────────────┤
│ TOTAL:                    Σw = 30   Σ(c×w) = 2952         │
└───────────────────────────────────────────────────────────┘

Cálculo:
  ESₜ = 2952 / 30 = 98.4%

Interpretación:
  Executive Score = 98.4%  →  🟢 EXCELENTE
  La organización está operando casi en el target global.
```

---

# 8. ANÁLISIS DE TENDENCIAS

## 8.1 Función de Tendencia

Sea **Sₜ** el score en el periodo actual y **Sₜ₋₁** el score en el periodo anterior.

### **Definición de Tendencia**

```
ΔS = Sₜ - Sₜ₋₁

         ⎧ UP       si ΔS > +5
Trend =  ⎨ STABLE   si -5 ≤ ΔS ≤ +5
         ⎩ DOWN     si ΔS < -5
```

## 8.2 Umbral de Significancia

El umbral de **5 puntos porcentuales** se define para:

1. **Evitar ruido**: Pequeñas variaciones no se consideran tendencia
2. **Enfoque gerencial**: Solo cambios significativos requieren atención
3. **Estabilidad**: Previene cambios bruscos de estado

## 8.3 Ejemplos de Cálculo

### **Ejemplo 1: Mejora Significativa**

```
Periodo Anterior (t-1): Sₜ₋₁ = 75%
Periodo Actual (t):     Sₜ = 82%

ΔS = 82 - 75 = +7

Como ΔS > +5:
  Trend = UP 📈
```

### **Ejemplo 2: Empeoramiento Significativo**

```
Periodo Anterior (t-1): Sₜ₋₁ = 80%
Periodo Actual (t):     Sₜ = 73%

ΔS = 73 - 80 = -7

Como ΔS < -5:
  Trend = DOWN 📉
```

### **Ejemplo 3: Estabilidad**

```
Periodo Anterior (t-1): Sₜ₋₁ = 78%
Periodo Actual (t):     Sₜ = 79%

ΔS = 79 - 78 = +1

Como -5 ≤ ΔS ≤ +5:
  Trend = STABLE ➡️
```

---

# 9. EJEMPLOS NUMÉRICOS DETALLADOS

## 9.1 Caso de Estudio: Universidad Tecnológica

### **Estructura Organizacional**

```
Tenant: UNIVERSIDAD TECNOLÓGICA (UCI)
├── Proceso: DOCENCIA
│   ├── Indicador: Tasa Aprobación
│   ├── Indicador: Satisfacción Estudiantes
│   └── Indicador: Retención
├── Proceso: INVESTIGACIÓN
│   ├── Indicador: Publicaciones
│   └── Indicador: Proyectos Aprobados
└── Proceso: EXTENSIÓN
    ├── Indicador: Proyectos Comunitarios
    └── Indicador: Convenios Activos
```

### **Datos del Periodo**

| Código | Indicador | Target | Real | Dirección | Peso |
|--------|-----------|--------|------|-----------|------|
| DOC-01 | Tasa Aprobación | 85% | 82% | HIGHER | 8 |
| DOC-02 | Satisfacción | 90% | 88% | HIGHER | 6 |
| DOC-03 | Retención | 80% | 75% | HIGHER | 7 |
| INV-01 | Publicaciones | 50 | 62 | HIGHER | 5 |
| INV-02 | Proyectos | 20 | 18 | HIGHER | 4 |
| EXT-01 | Proyectos Com. | 30 | 35 | HIGHER | 3 |
| EXT-02 | Convenios | 40 | 42 | HIGHER | 3 |

### **Cálculo de Cumplimientos**

| Código | Cálculo | Cumplimiento | Estado |
|--------|---------|-------------|--------|
| DOC-01 | (82/85)×100 | 96.47% | 🟢 OK |
| DOC-02 | (88/90)×100 | 97.78% | 🟢 OK |
| DOC-03 | (75/80)×100 | 93.75% | 🟢 OK |
| INV-01 | (62/50)×100 | 124.00% | 🟢 OK |
| INV-02 | (18/20)×100 | 90.00% | 🟢 OK |
| EXT-01 | (35/30)×100 | 116.67% | 🟢 OK |
| EXT-02 | (42/40)×100 | 105.00% | 🟢 OK |

### **Scores por Proceso**

#### **Proceso DOCENCIA**

```
Indicadores: DOC-01, DOC-02, DOC-03

Numerador:
  Σ(c×w) = (96.47×8) + (97.78×6) + (93.75×7)
         = 771.76 + 586.68 + 656.25
         = 2014.69

Denominador:
  Σw = 8 + 6 + 7 = 21

Score:
  S_DOC = 2014.69 / 21 = 95.94%  →  🟢 OK
```

#### **Proceso INVESTIGACIÓN**

```
Indicadores: INV-01, INV-02

Numerador:
  Σ(c×w) = (124.00×5) + (90.00×4)
         = 620 + 360
         = 980

Denominador:
  Σw = 5 + 4 = 9

Score:
  S_INV = 980 / 9 = 108.89%  →  🟢 OK (sobrecumplimiento)
```

#### **Proceso EXTENSIÓN**

```
Indicadores: EXT-01, EXT-02

Numerador:
  Σ(c×w) = (116.67×3) + (105.00×3)
         = 350.01 + 315
         = 665.01

Denominador:
  Σw = 3 + 3 = 6

Score:
  S_EXT = 665.01 / 6 = 110.84%  →  🟢 OK (sobrecumplimiento)
```

### **Executive Score**

```
Todos los indicadores:

Numerador:
  Σ(c×w) = (96.47×8) + (97.78×6) + (93.75×7) + 
           (124.00×5) + (90.00×4) + (116.67×3) + (105.00×3)
         = 771.76 + 586.68 + 656.25 + 620 + 360 + 350.01 + 315
         = 3659.70

Denominador:
  Σw = 8 + 6 + 7 + 5 + 4 + 3 + 3 = 36

Executive Score:
  ES = 3659.70 / 36 = 101.66%  →  🟢 EXCELENTE

Interpretación:
  La universidad está operando por encima del target global (101.66%),
  lo que indica sobrecumplimiento generalizado en todos los procesos.
```

---

## 9.2 Análisis de Sensibilidad

### **Impacto de Cambiar un Peso**

**Escenario:** Aumentar peso de DOC-01 de 8 a 10

```
Nuevo cálculo:

Numerador:
  Σ(c×w) = (96.47×10) + (97.78×6) + (93.75×7) + ...
         = 964.70 + 586.68 + 656.25 + ...
         = 3852.64

Denominador:
  Σw = 10 + 6 + 7 + 5 + 4 + 3 + 3 = 38

Nuevo Executive Score:
  ES' = 3852.64 / 38 = 101.39%

Variación:
  ΔES = 101.39 - 101.66 = -0.27 puntos porcentuales
```

**Conclusión:** Aumentar el peso de un indicador con cumplimiento < ES disminuye ligeramente el ES.

---

# 10. APÉNDICE MATEMÁTICO

## 10.1 Demostración: Monotonicidad del Executive Score

**Teorema:** Si el cumplimiento de cualquier indicador aumenta, el Executive Score aumenta.

**Demostración:**

Sea ESₜ el Executive Score original:

```
       Σ(cᵢ × wᵢ)
ESₜ = ───────────
         Σwᵢ
```

Si el indicador k aumenta su cumplimiento en Δcₖ > 0:

```
       Σ(cᵢ × wᵢ) + (Δcₖ × wₖ)
ES'ₜ = ───────────────────────
             Σwᵢ
```

La diferencia es:

```
              (Δcₖ × wₖ)
ES'ₜ - ESₜ = ───────────  > 0  (porque Δcₖ > 0, wₖ > 0)
                 Σwᵢ
```

**Q.E.D.** ∎

---

## 10.2 Derivadas Parciales

### **Sensibilidad del Score de Proceso**

Sea Sₚ el score de un proceso:

```
       Σ(cᵢ × wᵢ)
Sₚ = ───────────
         Σwᵢ
```

La derivada parcial respecto al cumplimiento del indicador k:

```
∂Sₚ        wₖ
─── = ──────────  > 0
∂cₖ       Σwᵢ
```

**Interpretación:** El score del proceso es linealmente sensible al cumplimiento de cada indicador, con sensibilidad proporcional al peso del indicador.

---

## 10.3 Optimización del Executive Score

### **Problema de Optimización**

Maximizar el Executive Score sujeto a restricciones de recursos:

```
Maximizar:  ESₜ = Σ(cᵢ × wᵢ) / Σwᵢ

Sujeto a:
  Σ recursosᵢ ≤ Recursos_totales
  cᵢ = f(recursosᵢ)  (función de producción)
  cᵢ ≥ 0
```

### **Solución Óptima**

Asignar recursos prioritariamente a indicadores con:
1. **Mayor peso (wᵢ)**
2. **Menor cumplimiento actual (cᵢ)**
3. **Mayor elasticidad (∂cᵢ/∂recursosᵢ)**

---

## 10.4 Glosario de Términos

| Término | Símbolo | Definición |
|---------|---------|------------|
| **Cumplimiento** | c(i) | Porcentaje de logro del target |
| **Target** | tᵢ | Valor objetivo del indicador |
| **Valor Real** | vᵢ | Valor medido del indicador |
| **Peso** | wᵢ | Importancia relativa del indicador |
| **Dirección** | dᵢ | HIGHER_IS_BETTER o LOWER_IS_BETTER |
| **Executive Score** | ESₜ | Score global ponderado |
| **Tendencia** | Trend | Dirección del cambio (UP/DOWN/STABLE) |

---

## 10.5 Referencias Bibliográficas

1. **Kaplan, R. S., & Norton, D. P. (1996).** *The Balanced Scorecard: Translating Strategy into Action.* Harvard Business School Press.

2. **Niven, P. R. (2014).** *Balanced Scorecard Evolution: A Dynamic Approach to Strategy Execution.* Wiley.

3. **Prisma ORM Documentation.** (2026). *Multi-Tenant Architecture Patterns.* https://www.prisma.io/docs

4. **NestJS Documentation.** (2026). *Enterprise Architecture Patterns.* https://docs.nestjs.com

---

**Fin del Documento**

---

*Documento generado el 26 de marzo de 2026*  
*Sistema CMI - Executive KPI Engine*  
*Versión 1.6.0*
