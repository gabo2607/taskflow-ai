/**
 * GOOD CODE — Versión corregida con SOLID aplicado
 *
 * Muestra cómo el mismo dominio (Kanban de tareas) se estructura
 * respetando los 5 principios. Sigue los patrones del proyecto real.
 */

"use client";

// ─── TYPES ────────────────────────────────────────────────────────────────────

// [I] ISP: interfaces mínimas por responsabilidad
interface TaskDisplayProps {
  task: Task;
}

interface TaskActionProps {
  onMove: (id: string, status: TaskStatus) => Promise<void>;
}

// Los componentes declaran solo lo que usan
type TaskCardProps = TaskDisplayProps & TaskActionProps;

// ─── DATA-DRIVEN CONFIG (OCP) ─────────────────────────────────────────────────
// [O] OCP: agregar un estado nuevo = un objeto en KANBAN_COLUMNS + entrada en
// COLUMN_STYLES. Ningún componente necesita modificarse.
// (En el proyecto real esto vive en src/types/tasks.ts)

import { KANBAN_COLUMNS, PRIORITY_CONFIG, type Task, type TaskStatus } from "@/types/tasks";

const COLUMN_STYLES: Record<TaskStatus, string> = {
  todo:        "border-blue-500/30   bg-blue-500/5",
  in_progress: "border-yellow-500/30 bg-yellow-500/5",
  done:        "border-green-500/30  bg-green-500/5",
};

// ─── SINGLE-RESPONSIBILITY HOOKS ──────────────────────────────────────────────

// [S] SRP: cada hook tiene una sola razón de cambio

// Hook: gestión de estado + optimistic update (igual que en el proyecto real)
// [D] DIP: recibe `updateFn` como parámetro → desacoplado del Server Action concreto
import { useState } from "react";

function useMoveTask(
  initialTasks: Task[],
  updateFn: (id: string, status: TaskStatus) => Promise<void>  // abstracción, no implementación
) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  async function moveTask(taskId: string, newStatus: TaskStatus) {
    const previous = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await updateFn(taskId, newStatus);   // llama a la abstracción, no al fetch
    } catch {
      setTasks(previous);
    }
  }

  return { tasks, moveTask };
}

// Hook: agrupación por estado (igual que en el proyecto real, ya era correcto)
import { useMemo } from "react";

function useTasksByStatus(tasks: Task[]) {
  return useMemo(() => {
    // [O] OCP: derivado de KANBAN_COLUMNS → no hardcodea "todo"/"in_progress"/"done"
    return Object.fromEntries(
      KANBAN_COLUMNS.map((col) => [
        col.id,
        tasks
          .filter((t) => t.status === col.id)
          .sort((a, b) => a.position - b.position),
      ])
    ) as Record<TaskStatus, Task[]>;
  }, [tasks]);
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

// [S] SRP: solo muestra la tarjeta — no sabe de DnD ni de fetch
function TaskCard({ task, onMove }: TaskCardProps) {
  const { label, className } = PRIORITY_CONFIG[task.priority];  // [O] OCP

  return (
    <div className="rounded-lg p-3 bg-white/5 space-y-1">
      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${className}`}>
        {label}
      </span>
      <p className="text-sm text-white">{task.title}</p>
      {task.description && (
        <p className="text-xs text-neutral-400 line-clamp-2">{task.description}</p>
      )}
    </div>
  );
}

// [S] SRP: columna solo renderiza — no sabe de estado global
function KanbanColumn({
  id,
  label,
  tasks,
  onMove,
}: {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onMove: TaskActionProps["onMove"];
}) {
  return (
    <div className={`border rounded-xl p-4 space-y-3 ${COLUMN_STYLES[id]}`}>
      <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">
        {label} <span className="text-neutral-500">({tasks.length})</span>
      </h2>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onMove={onMove} />
      ))}
    </div>
  );
}

// ─── ORCHESTRATOR COMPONENT ───────────────────────────────────────────────────

// [S] SRP: KanbanBoard solo orquesta — delega render a KanbanColumn,
//          estado a useMoveTask, agrupación a useTasksByStatus.
// [D] DIP: recibe `updateTaskStatus` como prop → en tests se puede inyectar un mock
import { updateTaskStatus } from "@/actions/tasks";

type KanbanBoardProps = {
  initialTasks: Task[];
  // Permite inyectar una implementación alternativa (test, Storybook, etc.)
  updateFn?: (id: string, status: TaskStatus) => Promise<void>;
};

export function KanbanBoard({
  initialTasks,
  updateFn = updateTaskStatus,   // [D] DIP: default real, overridable en tests
}: KanbanBoardProps) {
  const { tasks, moveTask } = useMoveTask(initialTasks, updateFn);
  const tasksByStatus = useTasksByStatus(tasks);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {KANBAN_COLUMNS.map((col) => (   // [O] OCP: data-driven, no switch
        <KanbanColumn
          key={col.id}
          id={col.id}
          label={col.label}
          tasks={tasksByStatus[col.id]}
          onMove={moveTask}
        />
      ))}
    </div>
  );
}

/**
 * RESUMEN DE MEJORAS APLICADAS
 * ─────────────────────────────
 * S  Responsabilidades separadas: useMoveTask, useTasksByStatus, TaskCard,
 *    KanbanColumn, KanbanBoard tienen una sola razón de cambio cada uno.
 *
 * O  COLUMN_STYLES y PRIORITY_CONFIG son lookup tables. Agregar "review" como
 *    nuevo estado = agregar una entrada, sin tocar ningún componente.
 *
 * L  TaskCard acepta `task: Task` sin asumir campos extra. Cualquier Task
 *    válida funciona sin romper el componente.
 *
 * I  TaskCardProps = TaskDisplayProps & TaskActionProps (solo lo necesario).
 *    Sin props "showAssignee", "compact" ni similares que nadie usa.
 *
 * D  useMoveTask recibe `updateFn` como parámetro. KanbanBoard expone `updateFn`
 *    prop con default al Server Action real → testable sin reescribir el hook.
 */
