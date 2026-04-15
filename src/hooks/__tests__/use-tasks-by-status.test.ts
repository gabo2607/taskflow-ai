import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTasksByStatus } from "../use-tasks-by-status";
import { type Task } from "@/types/tasks";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "1",
    user_id: "u1",
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

describe("useTasksByStatus", () => {
  it("returns empty arrays when there are no tasks", () => {
    const { result } = renderHook(() => useTasksByStatus([]));

    expect(result.current.todo).toEqual([]);
    expect(result.current.in_progress).toEqual([]);
    expect(result.current.done).toEqual([]);
  });

  it("groups tasks into their respective status buckets", () => {
    const tasks = [
      makeTask({ id: "1", status: "todo" }),
      makeTask({ id: "2", status: "in_progress" }),
      makeTask({ id: "3", status: "done" }),
    ];

    const { result } = renderHook(() => useTasksByStatus(tasks));

    expect(result.current.todo).toHaveLength(1);
    expect(result.current.in_progress).toHaveLength(1);
    expect(result.current.done).toHaveLength(1);
    expect(result.current.todo[0].id).toBe("1");
    expect(result.current.in_progress[0].id).toBe("2");
    expect(result.current.done[0].id).toBe("3");
  });

  it("sorts tasks by position within each column", () => {
    const tasks = [
      makeTask({ id: "b", status: "todo", position: 1 }),
      makeTask({ id: "a", status: "todo", position: 0 }),
      makeTask({ id: "d", status: "done", position: 1 }),
      makeTask({ id: "c", status: "done", position: 0 }),
    ];

    const { result } = renderHook(() => useTasksByStatus(tasks));

    expect(result.current.todo.map((t) => t.id)).toEqual(["a", "b"]);
    expect(result.current.done.map((t) => t.id)).toEqual(["c", "d"]);
  });

  it("places tasks with the same status in the same column", () => {
    const tasks = [
      makeTask({ id: "1", status: "in_progress", position: 0 }),
      makeTask({ id: "2", status: "in_progress", position: 1 }),
      makeTask({ id: "3", status: "in_progress", position: 2 }),
    ];

    const { result } = renderHook(() => useTasksByStatus(tasks));

    expect(result.current.in_progress).toHaveLength(3);
    expect(result.current.todo).toHaveLength(0);
    expect(result.current.done).toHaveLength(0);
  });

  it("recomputes when the tasks array reference changes", () => {
    const initial = [makeTask({ id: "1", status: "todo", position: 0 })];

    const { result, rerender } = renderHook(
      ({ tasks }) => useTasksByStatus(tasks),
      { initialProps: { tasks: initial } }
    );

    expect(result.current.todo).toHaveLength(1);

    const updated = [
      ...initial,
      makeTask({ id: "2", status: "todo", position: 1 }),
    ];
    rerender({ tasks: updated });

    expect(result.current.todo).toHaveLength(2);
  });
});
