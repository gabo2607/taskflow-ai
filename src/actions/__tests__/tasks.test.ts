import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks must be declared before the module under test is imported.
// vi.mock calls are hoisted automatically by Vitest.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/embed-task", () => ({ embedTask: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { getTasks, createTask, updateTaskStatus } from "../tasks";
import { createClient } from "@/lib/supabase/server";
import { embedTask } from "@/lib/embed-task";
import { revalidatePath } from "next/cache";
import { type Task } from "@/types/tasks";

const mockCreateClient = vi.mocked(createClient);
const mockEmbedTask = vi.mocked(embedTask);
const mockRevalidatePath = vi.mocked(revalidatePath);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_USER = { id: "user-1", email: "test@example.com" };

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    user_id: "user-1",
    title: "Test Task",
    description: null,
    priority: "medium",
    status: "todo",
    position: 0,
    due_date: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// Supabase fluent chain: every builder method returns `self`.
// Terminal operations (.single / direct await) pop from a shared queue.
let _results: Array<Record<string, unknown>> = [];

function makeChain(): Record<string, unknown> {
  const self: Record<string, unknown> = {
    select: () => self,
    insert: () => self,
    update: () => self,
    eq: () => self,
    order: () => self,
    limit: () => self,
    single: vi.fn(() => {
      const result = _results.shift() ?? { data: null, error: null };
      return Promise.resolve(result);
    }),
    // Thenable so `await chain.update(...).eq(...)` resolves correctly
    then: (
      onFulfilled: (v: unknown) => unknown,
      onRejected?: (e: unknown) => unknown
    ) => {
      const result = _results.shift() ?? { data: null, error: null };
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };
  return self;
}

function mockClientWith(user: typeof MOCK_USER | null = MOCK_USER) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn(() => makeChain()),
  };
}

// ─── getTasks ─────────────────────────────────────────────────────────────────

describe("getTasks", () => {
  beforeEach(() => {
    _results = [];
    vi.clearAllMocks();
  });

  it("returns empty array when user is not authenticated", async () => {
    mockCreateClient.mockResolvedValue(
      mockClientWith(null) as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getTasks();

    expect(result).toEqual([]);
  });

  it("returns tasks ordered by position", async () => {
    const tasks = [makeTask({ id: "1", position: 0 }), makeTask({ id: "2", position: 1 })];
    _results.push({ data: tasks, error: null });
    mockCreateClient.mockResolvedValue(
      mockClientWith() as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getTasks();

    expect(result).toEqual(tasks);
  });

  it("throws on database error", async () => {
    _results.push({ data: null, error: { message: "DB error" } });
    mockCreateClient.mockResolvedValue(
      mockClientWith() as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(getTasks()).rejects.toThrow("DB error");
  });
});

// ─── createTask ───────────────────────────────────────────────────────────────

describe("createTask", () => {
  beforeEach(() => {
    _results = [];
    vi.clearAllMocks();
  });

  it("throws when user is not authenticated", async () => {
    mockCreateClient.mockResolvedValue(
      mockClientWith(null) as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(createTask("Test", "medium")).rejects.toThrow("No autenticado");
  });

  it("creates task at position 0 when no existing tasks", async () => {
    const newTask = makeTask({ id: "new-1", title: "Test", position: 0 });
    _results.push({ data: null, error: null }); // position query → no existing
    _results.push({ data: newTask, error: null }); // insert result
    mockCreateClient.mockResolvedValue(
      mockClientWith() as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await createTask("Test", "medium");

    expect(result.position).toBe(0);
    expect(mockEmbedTask).toHaveBeenCalledWith(newTask);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("creates task at next position when tasks already exist", async () => {
    const newTask = makeTask({ id: "new-2", position: 3 });
    _results.push({ data: { position: 2 }, error: null }); // existing max position
    _results.push({ data: newTask, error: null }); // insert result
    mockCreateClient.mockResolvedValue(
      mockClientWith() as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await createTask("Test", "low");

    expect(result.position).toBe(3);
  });

  it("throws on insert error", async () => {
    _results.push({ data: null, error: null }); // position query
    _results.push({ data: null, error: { message: "Insert failed" } });
    mockCreateClient.mockResolvedValue(
      mockClientWith() as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(createTask("Test", "high")).rejects.toThrow("Insert failed");
  });
});

// ─── updateTaskStatus ─────────────────────────────────────────────────────────

describe("updateTaskStatus", () => {
  beforeEach(() => {
    _results = [];
    vi.clearAllMocks();
  });

  it("updates status and revalidates /dashboard", async () => {
    _results.push({ error: null });
    mockCreateClient.mockResolvedValue(
      mockClientWith() as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await updateTaskStatus("task-1", "done");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("throws on database error", async () => {
    _results.push({ error: { message: "Update failed" } });
    mockCreateClient.mockResolvedValue(
      mockClientWith() as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(updateTaskStatus("task-1", "in_progress")).rejects.toThrow(
      "Update failed"
    );
  });
});
