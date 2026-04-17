# Contribuir a TaskFlow AI

Gracias por tu interés en contribuir. Este documento explica cómo configurar el ambiente de desarrollo, las convenciones del proyecto y el proceso para abrir un PR.

---

## Ambiente de desarrollo

### Requisitos

- Node.js 20+
- npm 10+
- Cuenta en Supabase (proyecto propio para desarrollo)
- API keys: Anthropic, Voyage AI, Groq

### Primeros pasos

```bash
# 1. Fork + clone
git clone https://github.com/tu-usuario/taskflow-ai.git
cd taskflow-ai

# 2. Instalar dependencias
npm install

# 3. Variables de entorno
cp .env.example .env.local
# Editar .env.local con tus propias credenciales

# 4. Aplicar migraciones al proyecto Supabase de desarrollo
npx supabase db push

# 5. Iniciar servidor
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — deberías ver el login.

---

## Convenciones de commits

Seguimos **Conventional Commits**:

```
<tipo>(<ámbito opcional>): <descripción en imperativo>
```

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio de código sin fix ni feat |
| `test` | Agregar o corregir tests |
| `docs` | Solo documentación |
| `chore` | Tareas de build, CI, deps |
| `style` | Formato, punto y coma, sin cambio lógico |

**Ejemplos:**

```
feat(chat): agregar streaming de respuestas del asistente
fix(kanban): corregir posición al mover tarea entre columnas
test(actions): cubrir caso de error en createTask
docs: actualizar README con instrucciones de setup
chore(ci): agregar cache de npm en workflow
```

- Descripción en **español** o inglés (consistente por PR).
- Máximo ~72 caracteres en la primera línea.
- Sin punto al final.

---

## Tests antes de un PR

Antes de abrir un PR asegúrate de que todo pase localmente:

```bash
# 1. Lint sin warnings
npx eslint . --max-warnings 0

# 2. Type-check
npx tsc --noEmit

# 3. Tests unitarios con cobertura (umbral 80%)
npm run test:coverage

# 4. Tests E2E (requiere dev server corriendo en otra terminal)
npm run dev &
npm run test:e2e
```

El CI ejecuta exactamente los mismos pasos — si pasan localmente, pasarán en GitHub Actions.

### Cobertura

La cobertura se mide solo sobre `src/actions/**`, `src/hooks/**` y `src/lib/**`. Los componentes están excluidos. Si agregas código en esas capas, incluye tests.

---

## Branching strategy

```
main                    # Rama de producción — siempre deployable
├── feature/<nombre>    # Nueva funcionalidad
└── fix/<nombre>        # Corrección de bug
```

**Reglas:**

- Nunca hacer push directo a `main`.
- Las ramas deben partir de `main` actualizado.
- Nombre de rama en **kebab-case** descriptivo:
  - `feature/delete-task`
  - `feature/streaming-chat`
  - `fix/kanban-drag-position`
- Un PR por funcionalidad/fix — evitar PRs monolíticos.
- Squash merge al integrar en `main` para mantener el historial limpio.

### Flujo típico

```bash
git checkout main
git pull origin main
git checkout -b feature/mi-funcionalidad

# ... desarrollar, commitear ...

git push origin feature/mi-funcionalidad
# Abrir PR en GitHub contra main
```

---

## Checklist de PR

Antes de solicitar review, verifica:

- [ ] `npx eslint . --max-warnings 0` pasa
- [ ] `npx tsc --noEmit` pasa
- [ ] `npm run test:coverage` pasa con cobertura ≥ 80%
- [ ] Tests E2E pasan (si el cambio toca flujos de usuario)
- [ ] Variables de entorno nuevas están en `.env.example`
- [ ] Migraciones SQL nuevas están en `supabase/migrations/`
- [ ] El título del PR sigue Conventional Commits
- [ ] El PR describe **qué** cambia y **por qué**

---

## Reglas de código

- TypeScript estricto — nunca `any`.
- Server Components por defecto; `'use client'` solo cuando sea necesario.
- Server Actions para todas las mutaciones.
- RLS habilitado en todas las tablas de Supabase.
- Usar `KANBAN_COLUMNS` / `PRIORITY_CONFIG` en vez de strings hardcodeados.
- `useMemo` para cálculos pesados en el cliente.
- Todos los bloques `try/catch` deben manejar el error explícitamente.
- Sin comentarios obvios — solo comenta el **por qué** cuando no es evidente.

---

## Dudas

Abre un **Issue** con la etiqueta `question` antes de empezar a trabajar en algo grande, para alinear el approach con los mantenedores.
