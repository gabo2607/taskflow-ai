# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev             # Start dev server at localhost:3000
npm run build           # Production build (also runs type-check)
npm run start           # Start production server

# Unit / integration (Vitest + jsdom)
npm test                # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # Run with v8 coverage (80% threshold)
npx vitest run src/actions/__tests__/tasks.test.ts  # Run a single test file

# E2E (Playwright, Chromium only — requires dev server running)
npm run test:e2e        # Headless
npm run test:e2e:ui     # Interactive UI mode

# Other
npx eslint . --fix      # Lint and auto-fix
npx tsc --noEmit        # Type check only

# CI (same steps as GitHub Actions)
npx eslint . --max-warnings 0 && npx tsc --noEmit && npm run test:coverage && npm run build

# Deploy (Vercel CLI)
vercel                  # Preview deploy
vercel --prod           # Production deploy (manual)
```

## CI/CD

Pipeline at `.github/workflows/ci-cd.yml` has two jobs:

- **ci**: runs on every push/PR — lint → tsc → vitest --coverage → next build
- **deploy-production**: runs only on `main` after ci passes — vercel pull → vercel build --prod → vercel deploy --prod

Required GitHub secrets (Settings → Secrets and variables → Actions):
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `GROQ_API_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`

## Environment Variables

Requires a `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=        # chat action (claude-sonnet-4-5)
VOYAGE_API_KEY=           # embeddings via Voyage AI (voyage-3.5, 1024-dim)

# Required for E2E tests only
TEST_USER_EMAIL=
TEST_USER_PASSWORD=
```

## Architecture

**Next.js 15 App Router** with React 19 and TypeScript. All routes live under `src/app/`.

### Data flow

1. **Server Actions** (`src/actions/`) call Supabase directly using `createClient()` from `src/lib/supabase/server.ts`.
2. **Dashboard page** (`src/app/dashboard/page.tsx`) fetches tasks server-side via `getTasks()` and passes them to the `KanbanBoard` client component.
3. **KanbanBoard** (`src/components/kanban-board.tsx`) manages client state through three hooks in `src/hooks/`:
   - `useTasksByStatus` — groups tasks into the three columns
   - `useMoveTask` — calls `updateTaskStatus` server action with optimistic updates
   - `useKanbanDnd` — wraps dnd-kit events and delegates to `moveTask`

### Auth

- `middleware.ts` refreshes the Supabase session on every request (required for SSR auth).
- `src/app/dashboard/page.tsx` redirects unauthenticated users to `/login`.
- Two Supabase clients: `src/lib/supabase/server.ts` (Server Components/Actions) and `src/lib/supabase/client.ts` (browser).

### Key types

Defined in `src/types/tasks.ts`: `Task`, `TaskStatus` (`"todo" | "in_progress" | "done"`), `TaskPriority`. `KANBAN_COLUMNS` and `PRIORITY_CONFIG` are the display-layer constants — use these instead of hardcoding strings.

### UI

Tailwind CSS v4 (PostCSS). Shadcn components are in `src/components/ui/`. Dark theme with green accents — background `#0f0f1a`. Spanish labels throughout.

`kanban-board-static.tsx` is an unused static prototype (its own full-page layout with header). The live dashboard uses `KanbanBoard` (DnD version) with the header defined directly in `dashboard/page.tsx`.

### Task actions

`src/actions/tasks.ts` exposes `getTasks`, `updateTaskStatus`, and `createTask`. There is no `deleteTask` yet — add it there and call `embedTask` to keep the vector store in sync.

`createTask` sets `position = max(existing positions in "todo") + 1` and calls `embedTask` after insert. Entry point is `CreateTaskDialog` (`src/components/create-task-dialog.tsx`), rendered in the dashboard header.

### Hooks

`src/hooks/` contains the three client-side hooks used by `KanbanBoard`:
- `use-tasks-by-status.ts` — groups a flat `Task[]` into `{ todo, in_progress, done }`
- `use-move-task.ts` — holds task list state, applies optimistic updates, calls `updateTaskStatus`
- `use-kanban-dnd.ts` — wires dnd-kit sensors/events and delegates to `moveTask`

### RAG / Chat pipeline

`src/components/chat/` renders the chat UI. The input supports voice dictation via the browser Web Speech API (Chrome/Chromium only — `window.SpeechRecognition` / `webkitSpeechRecognition`, language `es-ES`). On submit it calls `chatWithTasks` (Server Action in `src/actions/chat.ts`), which:

1. Embeds the query via Voyage AI (`src/lib/embeddings.ts` → `embedQuery`)
2. Calls `searchTasks` (`src/actions/search.ts`) which runs the `match_task_embeddings` Supabase RPC
3. Passes retrieved task snippets as context to Claude (`claude-sonnet-4-5`) and returns the answer (blocking, not streaming)

When a task is created, `embedTask` (`src/lib/embed-task.ts`) is called to upsert its vector into `task_embeddings`. `taskToContent` in that file defines the text format (title + description + priority + status). Note: `embedTask` uses explicit delete-then-insert (not Supabase's `.upsert()`).

**Gap**: `updateTaskStatus` does NOT call `embedTask`, so the `status` field in the vector goes stale after a move. If you add `updateTask` (title/description edits), call `embedTask` there too.

`chatWithTasks` calls `searchTasks` with `matchThreshold=0.4` and `matchCount=8` — intentionally more permissive than `searchTasks`' own defaults (`0.5`, `5`).

### Database migrations

SQL migrations live in `supabase/migrations/` (numbered `004_`…). The `task_embeddings` table (migration `005`) uses `halfvec(1024)` with an HNSW cosine index and RLS. The `match_task_embeddings` function (migration `006`) is `SECURITY DEFINER` and must always set `search_path = public`.

### Tests

Unit tests live in `src/**/__tests__/*.test.ts`. Coverage is measured only for `src/actions/**`, `src/hooks/**`, and `src/lib/**` (80% threshold). Components are excluded from coverage.

E2E tests live in `e2e/`. `auth.setup.ts` authenticates directly via the Supabase REST API (bypassing the login UI) and saves the session cookie to `e2e/.auth/user.json`. The `chromium` project depends on `setup`, so auth runs first. Playwright auto-starts the dev server when none is already running.

### Mandatory rules

- TypeScript strict — never use `any`
- Server Components by default; `'use client'` only when required
- Server Actions for all mutations
- RLS enabled on all tables
- Use `KANBAN_COLUMNS` / `PRIORITY_CONFIG` constants instead of hardcoding status/priority strings
- `useMemo` for heavy computations
- All `try/catch` blocks must handle errors explicitly

When context grows long: use `/compact` before continuing, `/cost` after finishing a task.


