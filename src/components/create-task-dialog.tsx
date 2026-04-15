"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createTask } from "@/actions/tasks";
import { type TaskPriority, PRIORITY_CONFIG } from "@/types/tasks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTitle("");
      setPriority("medium");
      setError(null);
    }
    setOpen(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createTask(title.trim(), priority);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear tarea");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="size-4" />
          Nueva Tarea
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="bg-[#1a1a2e] border-white/10 text-white max-w-sm"
      >
        <DialogHeader>
          <DialogTitle className="text-white font-semibold text-lg">
            Nueva Tarea
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="task-title" className="text-sm text-neutral-300">
              Título
            </label>
            <input
              id="task-title"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la tarea"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-green-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="task-priority" className="text-sm text-neutral-300">
              Prioridad
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
            >
              {(
                Object.entries(PRIORITY_CONFIG) as [
                  TaskPriority,
                  { label: string; className: string }
                ][]
              ).map(([value, { label }]) => (
                <option key={value} value={value} className="bg-[#1a1a2e]">
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="flex-1 text-sm text-neutral-400 hover:text-white border border-white/10 rounded-lg py-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
