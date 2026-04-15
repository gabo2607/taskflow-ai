/**
 * BAD CODE — Ejemplo con 6+ violaciones SOLID
 *
 * Contexto: versión hipotética de KanbanBoard que concentra demasiadas
 * responsabilidades. NO es el código real del proyecto.
 *
 * Violaciones marcadas: [S] [O] [I] [D] con número de línea de referencia.
 */

"use client";

import { useState, useEffect } from "react";

// ─── [I] ISP VIOLATION ────────────────────────────────────────────────────────
// Props gigantes: no todos los consumidores usan todos los campos.
// TaskCard simple solo necesita `task` y `onMove`, pero recibe 10 props.
interface TaskCardProps {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  onMove: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAssign: (id: string, userId: string) => void;
  showAssignee: boolean;   // nunca usado en la vista de kanban
  showComments: boolean;   // nunca usado en la vista de kanban
  compact: boolean;        // nunca usado en la vista de kanban
}

// ─── [S] SRP VIOLATION #1 ─────────────────────────────────────────────────────
// Este componente hace: fetch, filtrado, ordenado, embedding, render.
// Tiene múltiples razones para cambiar.
export function KanbanBoard({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<TaskCardProps[]>([]);
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ─── [S] SRP VIOLATION #2 + [D] DIP VIOLATION ───────────────────────────
  // Fetch directo con URL hardcodeada dentro del componente de presentación.
  // Debería estar en un Server Action o un hook separado.
  useEffect(() => {
    fetch(`/api/tasks?userId=${userId}`)          // DIP: dependencia concreta
      .then((r) => r.json())
      .then((data) => setTasks(data));
  }, [userId]);

  // ─── [O] OCP VIOLATION #1 ────────────────────────────────────────────────
  // Para agregar un nuevo estado (ej: "review") hay que modificar esta función.
  // Debería ser una lookup table en src/types/tasks.ts.
  function getColumnStyle(status: string): string {
    switch (status) {
      case "todo":        return "border-blue-500 bg-blue-500/10";
      case "in_progress": return "border-yellow-500 bg-yellow-500/10";
      case "done":        return "border-green-500 bg-green-500/10";
      default:            return "border-gray-500 bg-gray-500/10";
    }
  }

  // ─── [O] OCP VIOLATION #2 ────────────────────────────────────────────────
  // Idem para prioridad — ya existe PRIORITY_CONFIG en el proyecto pero no se usa.
  function getPriorityLabel(priority: string): string {
    if (priority === "low")      return "BAJA";
    if (priority === "medium")   return "MEDIA";
    if (priority === "high")     return "ALTA";
    if (priority === "critical") return "CRÍTICA";
    return "DESCONOCIDA";
  }

  // ─── [S] SRP VIOLATION #3 ────────────────────────────────────────────────
  // Lógica de ordenado dentro del componente. Debería estar en useTasksByStatus.
  function getSortedTasks(list: TaskCardProps[]) {
    return [...list].sort((a, b) => {
      const order = ["critical", "high", "medium", "low"];
      const diff = order.indexOf(a.priority) - order.indexOf(b.priority);
      return sortOrder === "asc" ? diff : -diff;
    });
  }

  // ─── [S] SRP VIOLATION #4 + [D] DIP VIOLATION ───────────────────────────
  // Lógica de embedding acoplada al componente de UI.
  // Llama a un endpoint externo hardcodeado — viola DIP y SRP.
  async function handleTaskUpdate(id: string, newStatus: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    // Debería ser un Server Action, no fetch directo
    await fetch("/api/tasks/update", {
      method: "PATCH",
      body: JSON.stringify({ id, status: newStatus }),
    });

    // El embedding no pertenece aquí
    await fetch("/api/embed", {
      method: "POST",
      body: JSON.stringify({ taskId: id }),
    });
  }

  const filtered = tasks.filter(
    (t) => filter === "all" || t.status === filter
  );
  const sorted = getSortedTasks(filtered);

  return (
    <div>
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">Todos</option>
        <option value="todo">Por hacer</option>
        <option value="in_progress">En progreso</option>
        <option value="done">Terminado</option>
      </select>

      <div className="grid grid-cols-3 gap-4">
        {["todo", "in_progress", "done"].map((status) => (
          <div key={status} className={`border rounded-xl p-4 ${getColumnStyle(status)}`}>
            <h2>{status}</h2>
            {sorted
              .filter((t) => t.status === status)
              .map((task) => (
                <div key={task.id}>
                  <span>{getPriorityLabel(task.priority)}</span>
                  <p>{task.title}</p>
                  <button onClick={() => handleTaskUpdate(task.id, "done")}>
                    Mover
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
