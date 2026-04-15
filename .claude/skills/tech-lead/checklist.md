# Checklist SOLID — TypeScript / Next.js

Use this checklist during every Tech Lead review. Mark each item ✓ (cumple) or ✗ (violación) and note the line number when ✗.

---

## S — Single Responsibility

| # | Item | Notas |
|---|------|-------|
| S1 | El componente/hook tiene un único motivo de cambio | |
| S2 | El fetch / llamada a Server Action NO vive dentro del componente render | |
| S3 | La lógica de filtrado/ordenado está extraída a un hook o utilidad | |
| S4 | El componente no mezcla lógica de negocio con lógica de presentación | |
| S5 | Cada hook encapsula una sola preocupación (no `useEverything`) | |

## O — Open / Closed

| # | Item | Notas |
|---|------|-------|
| O1 | Los colores/etiquetas de estado/prioridad se leen de `PRIORITY_CONFIG` / `KANBAN_COLUMNS`, no de `switch`/`if-else` en cadena | |
| O2 | Agregar un nuevo estado de tarea NO requiere modificar el componente, solo la config en `src/types/tasks.ts` | |
| O3 | Los handlers de eventos son componibles (aceptan callbacks externos) en lugar de hardcodear comportamiento | |
| O4 | No hay magic strings de status/priority duplicados fuera de `src/types/tasks.ts` | |

## L — Liskov Substitution

| # | Item | Notas |
|---|------|-------|
| L1 | Los componentes que reciben `task: Task` no esperan propiedades extra no definidas en el tipo | |
| L2 | Un subtipo de `Task` (si existiera) puede reemplazarlo sin romper la UI | |
| L3 | Las funciones que aceptan `TaskStatus` no hacen `as string` ni bypasses del tipo | |

## I — Interface Segregation

| # | Item | Notas |
|---|------|-------|
| I1 | Ningún componente recibe props que no usa (`showAssignee`, `editable`, etc. sin consumir) | |
| I2 | Los props se dividen por responsabilidad cuando un componente crece (ej: `TaskCardDisplayProps` vs `TaskCardActionProps`) | |
| I3 | Los hooks no retornan valores que el consumidor ignora sistemáticamente | |
| I4 | Los tipos de retorno de Server Actions son los mínimos necesarios (no un objeto gigante) | |

## D — Dependency Inversion

| # | Item | Notas |
|---|------|-------|
| D1 | Los hooks reciben sus dependencias (Server Actions, callbacks) como parámetros en lugar de importarlas directamente cuando la testabilidad importa | |
| D2 | Los componentes dependen de abstracciones (tipos/interfaces) no de implementaciones concretas | |
| D3 | La lógica de DnD es intercambiable: el hook `useKanbanDnd` recibe `moveTask` como parámetro (no llama directamente al Server Action) | |
| D4 | El cliente de Supabase se crea vía `createClient()` (factory), no se instancia directamente en los componentes | |

---

## Reglas adicionales TypeScript / Next.js

| # | Item | Notas |
|---|------|-------|
| TS1 | No hay uso de `any` (explícito o implícito vía `as unknown as X`) | |
| TS2 | Las props de componentes tienen tipos explícitos (no inferidos desde `React.FC`) | |
| TS3 | Los `try/catch` capturan el error con tipo o re-lanzan — no `catch {}` vacío que oculta errores | |
| TS4 | `useMemo` / `useCallback` se usan donde el cálculo es costoso, no como optimización prematura | |
| N1 | `"use client"` solo en el mínimo necesario — el resto son Server Components | |
| N2 | Las mutaciones van por Server Actions, nunca por `fetch` directo al cliente desde el componente | |
| N3 | `revalidatePath` se llama en la Server Action después de la mutación | |
