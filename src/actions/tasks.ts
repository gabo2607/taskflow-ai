"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type Task, type TaskStatus, type TaskPriority } from "@/types/tasks";
import { embedTask } from "@/lib/embed-task";

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

export async function createTask(
  title: string,
  priority: TaskPriority
): Promise<Task> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const { data: existing } = await supabase
    .from("tasks")
    .select("position")
    .eq("user_id", user.id)
    .eq("status", "todo")
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = existing ? existing.position + 1 : 0;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      priority,
      status: "todo",
      position,
      description: null,
      due_date: null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await embedTask(data as Task);

  revalidatePath("/dashboard");

  return data as Task;
}

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("position");

  if (error) throw new Error(error.message);

  return data ?? [];
}
