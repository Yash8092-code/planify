"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RecurringTask } from "@/lib/types";
import { RefreshCw, Trash2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDueTime } from "@/lib/utils";

interface RollbackManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onRollbackTriggered?: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch");
  return json.data as RecurringTask[];
};

export function RollbackManagerDialog({
  isOpen,
  onClose,
  onRollbackTriggered,
}: RollbackManagerProps) {
  const { data: recurringTasks, error, isLoading, mutate } = useSWR<RecurringTask[]>(
    isOpen ? "/api/rollback" : null,
    fetcher
  );

  const [isTriggering, setIsTriggering] = useState(false);

  // Toggle active status
  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch("/api/rollback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !current }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(current ? "Paused recurring task" : "Activated recurring task");
      mutate();
    } catch (err) {
      toast.error("Failed to update recurring task");
    }
  };

  // Delete recurring task
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/rollback?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete recurring task");

      toast.success("Recurring template deleted");
      mutate();
    } catch (err) {
      toast.error("Failed to delete recurring task");
    }
  };

  // Manually trigger rollback now
  const handleRollbackNow = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/rollback", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Rollback failed");

      toast.success(json.message || "Rollback completed!");
      if (onRollbackTriggered) {
        onRollbackTriggered();
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Rollback failed";
      toast.error(msg);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Rollback Daily Manager
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Manage tasks that automatically reset and roll over every morning at 5:00 AM.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-y my-2 text-xs">
          <span className="text-muted-foreground">
            {recurringTasks ? `${recurringTasks.length} recurring template(s)` : "Loading..."}
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 text-xs"
            onClick={handleRollbackNow}
            disabled={isTriggering || !recurringTasks || recurringTasks.length === 0}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTriggering ? "animate-spin" : ""}`} />
            {isTriggering ? "Rolling Over..." : "Rollback Today Now"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-xs text-destructive p-4 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Failed to load recurring tasks. Ensure Supabase is configured.</span>
            </div>
          ) : !recurringTasks || recurringTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <RefreshCw className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-sm font-medium">No recurring tasks yet</p>
              <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">
                When adding a task, switch on &quot;Rollback Daily&quot; to make it repeat every day automatically.
              </p>
            </div>
          ) : (
            recurringTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card/60 hover:bg-card transition-colors gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium truncate ${
                        !task.active ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.due_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDueTime(task.due_time)}
                      </span>
                    )}
                    <span className={task.active ? "text-success font-medium" : "text-muted-foreground"}>
                      {task.active ? "Active" : "Paused"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={task.active}
                    onCheckedChange={() => handleToggleActive(task.id, task.active)}
                    aria-label="Toggle recurring task active"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(task.id)}
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
