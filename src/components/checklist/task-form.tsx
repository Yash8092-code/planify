"use client";

import React, { useState, useEffect } from "react";
import { Task, CreateTaskInput } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  editingTask?: Task | null;
  currentDate: string;
}

export function TaskFormDialog({
  isOpen,
  onClose,
  onSubmit,
  editingTask,
  currentDate,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueTime, setDueTime] = useState("");
  const [rollbackDaily, setRollbackDaily] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || "");
      setPriority(editingTask.priority);
      setDueTime(editingTask.due_time ? editingTask.due_time.substring(0, 5) : "");
      setRollbackDaily(editingTask.rollback_daily);
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueTime("");
      setRollbackDaily(false);
    }
    setError(null);
  }, [editingTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_time: dueTime || undefined,
        rollback_daily: rollbackDaily,
        task_date: editingTask ? editingTask.task_date : currentDate,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {editingTask ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-medium">
              Task Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="e.g., Morning workout, Review pull request..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="task-desc"
              placeholder="Add extra details, links, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Priority Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Priority Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((p) => {
                const isSelected = priority === p;
                const colors = {
                  low: isSelected
                    ? "border-blue-500 bg-blue-500/10 text-blue-500"
                    : "border-border hover:border-blue-500/30",
                  medium: isSelected
                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                    : "border-border hover:border-amber-500/30",
                  high: isSelected
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border hover:border-destructive/30",
                }[p];

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex items-center justify-center rounded-lg border py-2 text-xs font-medium capitalize transition-all",
                      colors
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Time */}
          <div className="space-y-1.5">
            <Label htmlFor="task-time" className="text-xs font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Due Time (Optional)
            </Label>
            <Input
              id="task-time"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Rollback Daily Switch */}
          <div className="flex items-start justify-between rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="space-y-0.5 pr-3">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-primary" />
                <Label htmlFor="rollback-toggle" className="text-xs font-semibold cursor-pointer">
                  Rollback Daily
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Recreate this task automatically every morning so your daily habits stay consistent.
              </p>
            </div>
            <Switch
              id="rollback-toggle"
              checked={rollbackDaily}
              onCheckedChange={setRollbackDaily}
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingTask
                ? "Save Changes"
                : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
