"use client";

import useSWR from "swr";
import { Task, TaskStats, CreateTaskInput, UpdateTaskInput, TaskFilter } from "@/lib/types";
import { toast } from "sonner";

interface TasksResponse {
  data: Task[];
  stats: TaskStats;
  date: string;
}

const fetcher = async (url: string): Promise<TasksResponse> => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch tasks");
  return json;
};

export function useTasks(options?: {
  date?: string;
  filter?: TaskFilter;
  priority?: string;
}) {
  const dateStr = options?.date || "";
  const filter = options?.filter || "all";
  const priority = options?.priority || "";

  const queryParams = new URLSearchParams();
  if (dateStr) queryParams.set("date", dateStr);
  if (filter && filter !== "all") queryParams.set("filter", filter);
  if (priority && priority !== "all") queryParams.set("priority", priority);

  const url = `/api/tasks?${queryParams.toString()}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<TasksResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 3000,
    }
  );

  const tasks = data?.data || [];
  const stats: TaskStats = data?.stats || {
    total: 0,
    completed: 0,
    remaining: 0,
    percentage: 0,
  };

  // Toggle complete with optimistic update
  const toggleTask = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic UI update
    await mutate(
      (current) => {
        if (!current) return current;
        const updatedTasks = current.data.map((t) =>
          t.id === id ? { ...t, completed: newStatus } : t
        );
        const completed = updatedTasks.filter((t) => t.completed).length;
        const total = updatedTasks.length;
        return {
          ...current,
          data: updatedTasks,
          stats: {
            total,
            completed,
            remaining: total - completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          },
        };
      },
      false
    );

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: newStatus }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update task");
      }

      await mutate();
      return true;
    } catch (err) {
      toast.error("Failed to update task status");
      await mutate();
      return false;
    }
  };

  // Create task
  const createTask = async (input: CreateTaskInput) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create task");

      toast.success("Task created!");
      await mutate();
      return json.data as Task;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create task";
      toast.error(message);
      throw err;
    }
  };

  // Update task details
  const updateTask = async (id: string, input: UpdateTaskInput) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...input }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update task");

      toast.success("Task updated!");
      await mutate();
      return json.data as Task;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update task";
      toast.error(message);
      throw err;
    }
  };

  // Delete task
  const deleteTask = async (id: string, deleteRecurring = false) => {
    try {
      const res = await fetch(
        `/api/tasks?id=${id}&delete_recurring=${deleteRecurring}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete task");
      }

      toast.success("Task deleted");
      await mutate();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete task";
      toast.error(message);
      return false;
    }
  };

  // Batch reorder tasks
  const reorderTasks = async (taskIds: string[]) => {
    try {
      const res = await fetch("/api/tasks/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds }),
      });

      if (!res.ok) throw new Error("Failed to reorder tasks");
      await mutate();
    } catch (err) {
      toast.error("Failed to save task order");
      await mutate();
    }
  };

  // Trigger manual rollback
  const triggerRollback = async () => {
    try {
      const res = await fetch("/api/rollback", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Rollback failed");

      toast.success(json.message || "Rollback completed!");
      await mutate();
      return json;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to trigger rollback";
      toast.error(message);
      return null;
    }
  };

  return {
    tasks,
    stats,
    isLoading,
    isValidating,
    error,
    mutate,
    toggleTask,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    triggerRollback,
  };
}
