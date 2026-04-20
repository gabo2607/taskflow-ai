# Contributing to TaskFlow AI

## Branching strategy

```
main          ← producción (protegida, solo merge via PR)
  └── feat/<descripcion>     nueva funcionalidad
  └── fix/<descripcion>      corrección de bug
  └── chore/<descripcion>    mantenimiento (deps, config, docs)
  └── refactor/<descripcion> refactoring sin cambio de comportamiento
```

- Nunca hagas push directo a `main`.
- Una rama = un propósito. Mantén las ramas cortas y con PR pequeños.
- Nombra las ramas en kebab-case: `feat/delete-task`, `fix/embedding-stale-status`.

## Flujo de trabajo

```bash
# 1. Crea tu rama desde main actualizado
git switch main && git pull
git switch -c feat/mi-feature

# 2. Desarrolla y commitea
git add src/actions/tasks.ts
git commit -m "feat: add deleteTask server action"

# 3. Verifica que CI pasará antes de abrir la PR
npx eslint . --max-warnings 0
npx tsc --noEmit
npm run test:coverage
npm run build

# 4. Abre Pull Request hacia main
```

## Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

| Prefijo | Cuándo usarlo |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `chore:` | Mantenimiento, dependencias |
| `refactor:` | Refactoring sin cambio funcional |
| `test:` | Agregar o corregir tests |
| `docs:` | Solo documentación |

Ejemplos:
```
feat: add deleteTask server action with embedding cleanup
fix: call embedTask after updateTaskStatus to keep vectors in sync
chore: update voyage AI SDK to 0.3.0
test: add unit tests for use-move-task hook
```

## Pull Requests

- El título del PR debe seguir el mismo formato que los commits.
- Describe qué cambia y por qué (no el cómo — el código ya lo dice).
- El CI debe pasar (lint + tsc + coverage + build) antes de solicitar review.
- Mínimo un approval antes de merge.

## Reglas de código

Consulta la sección **Mandatory rules** en `CLAUDE.md`. Las más críticas:

- TypeScript strict — nunca uses `any`.
- `'use client'` solo cuando sea estrictamente necesario.
- Todas las mutaciones van en Server Actions (`src/actions/`).
- RLS habilitado en todas las tablas nuevas.
- Cuando agregues `deleteTask` o `updateTask`, llama a `embedTask` para mantener el vector store sincronizado.

## Tests

- Agrega tests unitarios en `src/**/__tests__/` para cualquier lógica nueva en `src/actions/`, `src/hooks/`, o `src/lib/`.
- Usa el helper `makeTask(overrides?)` como base para fixtures de tipo `Task`.
- Los tests E2E van en `e2e/` y usan Playwright (solo Chromium).
- El umbral de cobertura es 20% — no bajes de eso.

## Migraciones de base de datos

- Agrega migraciones SQL en `supabase/migrations/` con nombre `NNN_descripcion.sql` (siguiente número correlativo).
- Las funciones con acceso a datos deben ser `SECURITY DEFINER` y establecer `search_path = public`.
- RLS obligatorio en tablas nuevas.
