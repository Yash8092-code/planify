"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  RefreshCw,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";
import { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDueTime } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, current: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const priorityStyles = {
    high: {
      badge: "bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/20",
      dot: "bg-destructive",
      label: "High",
    },
    medium: {
      badge: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
      dot: "bg-amber-500",
      label: "Medium",
    },
    low: {
      badge: "bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
      dot: "bg-blue-500",
      label: "Low",
    },
  }[task.priority || "medium"];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border p-4 transition-all duration-200",
        task.completed
          ? "bg-card/40 border-border/40 opacity-70"
          : "bg-card border-border hover:border-primary/40 hover:shadow-xs"
      )}
    >
      {/* Custom Animated Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(task.id, task.completed)}
        className={cn(
          "relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          task.completed
            ? "border-success bg-success text-success-foreground shadow-xs shadow-success/30"
            : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
        )}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        <motion.div
          initial={false}
          animate={{ scale: task.completed ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        </motion.div>
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium transition-all duration-200 break-words",
              task.completed
                ? "line-through text-muted-foreground"
                : "text-foreground"
            )}
          >
            {task.title}
          </span>

          {/* Priority Badge */}
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 h-4.5 gap-1 font-medium", priorityStyles.badge)}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", priorityStyles.dot)} />
            {priorityStyles.label}
          </Badge>

          {/* Rollback Daily Badge */}
          {task.rollback_daily && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4.5 gap-1 font-medium border-primary/25 bg-primary/10 text-primary"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Rolls Daily
            </Badge>
          )}

          {/* Due Time */}
          {task.due_time && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80 font-normal">
              <Clock className="h-3 w-3" />
              {formatDueTime(task.due_time)}
            </span>
          )}
        </div>

        {/* Task Description */}
        {task.description && (
          <p
            className={cn(
              "mt-1 text-xs text-muted-foreground line-clamp-2 transition-all",
              task.completed && "line-through opacity-70"
            )}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Actions (Reorder + Menu) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Reorder Buttons (Visible on hover or mobile) */}
        <div
          className={cn(
            "flex items-center transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0 md:opacity-0 group-hover:opacity-100"
          )}
        >
          {onMoveUp && (
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
              title="Move Up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
              title="Move Down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
