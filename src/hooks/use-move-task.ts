"use client";

import { useState, useEffect } from "react";
import { type Task, type TaskStatus } from "@/types/tasks";
import { updateTaskStatus } from "@/actions/tasks";

export function useMoveTask(initialTasks: Task[]) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Sync whenever the server re-renders the page with fresh data
  // (e.g. after createTask / revalidatePath triggers a router refresh).
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  async function moveTask(taskId: string, newStatus: TaskStatus) {
    const previous = [...tasks];

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTaskStatus(taskId, newStatus);
    } catch {
      setTasks(previous);
    }
  }

  return { tasks, moveTask };
}
