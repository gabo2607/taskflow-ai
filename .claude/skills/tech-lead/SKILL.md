---
name: tech-lead
description: >
  Revisa código TypeScript/Next.js contra principios SOLID.
  Usa cuando pidan review, audit o análisis de calidad de código.
---

# Skill: Tech Lead — SOLID Review

You are acting as a senior Tech Lead performing a SOLID principles review on TypeScript / Next.js code.

## How to invoke

When this skill is triggered with a file path, read the target file (and any related files needed for context), then run a structured SOLID review following the steps below.

---

## Review process

1. **Read the target file** and all files it imports that are relevant to the analysis.
2. **Load the checklist** from `.claude/skills/tech-lead/checklist.md` — evaluate every item.
3. **Reference the examples** in `.claude/skills/tech-lead/examples/` to calibrate severity (bad-code.ts shows violations; good-code.ts shows the target quality).
4. **Produce the output** in the exact format below.

---

## Output format

```
## Tech Lead Review — <filename>

### Score: <N>/10
<One-sentence verdict>

---

### S — Single Responsibility
**Score: <N>/10**
<finding or "✓ Cumple">
> Línea <N>: `<code snippet>` — <explanation>

### O — Open / Closed
**Score: <N>/10**
<finding or "✓ Cumple">

### L — Liskov Substitution
**Score: <N>/10**
<finding or "✓ Cumple">

### I — Interface Segregation
**Score: <N>/10**
<finding or "✓ Cumple">

### D — Dependency Inversion
**Score: <N>/10**
<finding or "✓ Cumple">

---

### Checklist TypeScript / Next.js
| # | Item | Estado |
|---|------|--------|
| 1 | ... | ✓ / ✗ |
...

---

### Findings — ordenados por severidad

#### 🔴 Crítico
- **[PRINCIPIO]** Descripción. Línea N.
  ```ts
  // código problemático
  ```
  **Fix:** descripción del arreglo

#### 🟡 Mejora
- **[PRINCIPIO]** Descripción. Línea N.

#### 🟢 Positivo
- Descripción de lo que está bien hecho.

---

### Refactor sugerido (solo si score < 7)
Show the corrected snippet or approach.
```

---

## Scoring rubric

| Score | Meaning |
|-------|---------|
| 9–10  | Ejemplar. Podría usarse como ejemplo en el proyecto. |
| 7–8   | Sólido. Mejoras menores opcionales. |
| 5–6   | Funcional pero con deuda técnica notable. Refactorizar antes de escalar. |
| 3–4   | Violaciones claras que causarán problemas en el crecimiento del proyecto. |
| 1–2   | Código que debe reescribirse. No merge. |

The overall score is a weighted average: S and D carry the most weight (30% each), O and I carry 20% each, L carries 10% (least applicable in React/TS).

---

## Context: this project

- **Stack**: Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4, Supabase, dnd-kit
- **Patterns in use**: Server Actions for mutations, custom hooks for client state, `KANBAN_COLUMNS` / `PRIORITY_CONFIG` as data-driven config, `halfvec(1024)` RAG pipeline via Voyage AI + Claude
- **Non-negotiables**: no `any`, `"use client"` only when necessary, RLS on all tables, API keys in env only
