
# 📘 Git Workflow Profesional – Proyecto CMI Backend

Este documento define el flujo estándar para trabajar correctamente con ramas `main` y `dev`.

---

# 🎯 Objetivo

- `main` → siempre estable (producción)
- `dev` → desarrollo activo
- Nunca trabajar directamente en `main`

---

# 🟢 PRIMERA CONFIGURACIÓN (UNA SOLA VEZ)

Si ya estás en `main`, crea y cambia a `dev`:

```bash
git checkout -b dev
git push -u origin dev
```

Luego en GitHub:

1. Ir a **Settings → Branches**
2. Proteger `main`
3. Activar:
   - Require pull request before merging
   - Require status checks (si los usas)

---

# 🚀 FLUJO DIARIO DE TRABAJO

Siempre trabajar en `dev`.

Verifica rama actual:

```bash
git branch
```

Si no estás en dev:

```bash
git checkout dev
```

---

## Guardar cambios

```bash
git add .
git commit -m "Descripción clara del cambio"
git push
```

---

# 🔁 PASAR CAMBIOS A MAIN (VERSIÓN ESTABLE)

Cuando `dev` esté estable:

1. Ir a GitHub
2. Crear Pull Request:
   - Base: `main`
   - Compare: `dev`
3. Revisar
4. Merge

Luego actualizar local:

```bash
git checkout main
git pull
git checkout dev
git merge main
```

---

# 🏷️ CREAR VERSIÓN ESTABLE (TAG)

Cuando el backend esté estable:

```bash
git checkout main
git tag v1.0.0
git push origin v1.0.0
```

---

# 📦 Recomendación Estratégica

Para tu caso actual:

1. Dejar backend estable en `main` como:
   - v1.0.0 → Backend listo para frontend
2. Continuar nuevas mejoras en `dev`
3. Trabajar frontend sin romper backend estable

---

# 🧠 Filosofía Profesional

- `main` nunca se rompe
- `dev` puede experimentar
- Cada merge a `main` es una versión real del producto

---

# 📌 Resumen Visual

dev  → desarrollo activo  
main → producción estable  

---

Sistema limpio. Escalable. Profesional.
