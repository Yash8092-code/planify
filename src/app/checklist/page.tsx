"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Confetti } from "@/components/ui/confetti";
import { TaskItem } from "@/components/checklist/task-item";
import { TaskFormDialog } from "@/components/checklist/task-form";
import { RollbackManagerDialog } from "@/components/checklist/rollback-manager";
import { useTasks } from "@/hooks/use-tasks";
import { Task, TaskFilter, CreateTaskInput } from "@/lib/types";

// Helper to get formatted date
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ChecklistPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const {
    tasks,
    stats,
    isLoading,
    toggleTask,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    mutate,
  } = useTasks({
    date: selectedDate,
    filter,
    priority: priorityFilter,
  });

  const isToday = selectedDate === getTodayString();

  // Date navigation handlers
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(prev.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    setSelectedDate(next.toISOString().split("T")[0]);
  };

  const handleGoToday = () => {
    setSelectedDate(getTodayString());
  };

  // Toggle task with confetti if completing last item
  const handleToggle = async (id: string, current: boolean) => {
    const willBeComplete = !current;
    if (willBeComplete && stats.total > 0 && stats.completed + 1 === stats.total) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    await toggleTask(id, current);
  };

  // Handle task submission (create or update)
  const handleTaskSubmit = async (data: CreateTaskInput) => {
    if (editingTask) {
      await updateTask(editingTask.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        due_time: data.due_time,
        rollback_daily: data.rollback_daily,
      });
      setEditingTask(null);
    } else {
      await createTask(data);
    }
  };

  // Handle Reordering
  const handleMove = async (index: number, direction: "up" | "down") => {
    const newTasks = [...tasks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTasks.length) return;

    const [moved] = newTasks.splice(index, 1);
    newTasks.splice(targetIndex, 0, moved);

    const taskIds = newTasks.map((t) => t.id);
    await reorderTasks(taskIds);
  };

  // Filter tasks by search query
  const displayedTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery]);

  return (
    <div className="space-y-6">
      <Confetti trigger={showConfetti} />

      {/* Top Header: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Checklist</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize and conquer your daily goals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRollbackOpen(true)}
            className="gap-1.5 h-9 text-xs border-primary/20 hover:border-primary/40 hover:bg-primary/5"
          >
            <RefreshCw className="h-3.5 w-3.5 text-primary" />
            Rollback Daily
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setIsTaskFormOpen(true);
            }}
            className="gap-1.5 h-9 text-xs shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Date Navigator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border bg-card/60">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">
              {isToday ? "Today" : formatDateDisplay(selectedDate)}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ({selectedDate})
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToday}
              className="h-7 text-xs"
            >
              Back to Today
            </Button>
          )}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Progress Card */}
      <div className="rounded-xl border bg-card p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Daily Progress</span>
          </div>
          <span className="text-xs font-semibold text-primary">
            {stats.percentage}% Completed
          </span>
        </div>

        <Progress value={stats.percentage} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {stats.total === 0
              ? "No tasks yet for this day."
              : `${stats.completed} of ${stats.total} tasks completed`}
          </span>
          {stats.remaining > 0 ? (
            <span>{stats.remaining} remaining</span>
          ) : stats.total > 0 ? (
            <span className="text-success font-medium">All tasks done! 🎉</span>
          ) : null}
        </div>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tabs: All / Active / Completed */}
        <Tabs
          value={filter}
          onValueChange={(val) => setFilter(val as TaskFilter)}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full md:w-auto h-9">
            <TabsTrigger value="all" className="text-xs">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">
              Active ({stats.remaining})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Done ({stats.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search & Priority Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks List Area */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : displayedTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title={
              searchQuery
                ? "No matching tasks"
                : filter === "completed"
                ? "No completed tasks yet"
                : filter === "active"
                ? "No active tasks left"
                : "No tasks for this day"
            }
            description={
              searchQuery
                ? "Try searching for a different keyword or clear your search."
                : isToday
                ? "Add your daily priorities or let Rollback Daily automatically recreate your habits."
                : "No tasks were scheduled for this date."
            }
            actionLabel={!searchQuery && isToday ? "Add First Task" : undefined}
            onAction={
              !searchQuery && isToday
                ? () => {
                    setEditingTask(null);
                    setIsTaskFormOpen(true);
                  }
                : undefined
            }
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {displayedTasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsTaskFormOpen(true);
                }}
                onDelete={(id) => deleteTask(id)}
                onMoveUp={() => handleMove(index, "up")}
                onMoveDown={() => handleMove(index, "down")}
                canMoveUp={index > 0}
                canMoveDown={index < displayedTasks.length - 1}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <TaskFormDialog
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        editingTask={editingTask}
        currentDate={selectedDate}
      />

      {/* Rollback Daily Manager Dialog */}
      <RollbackManagerDialog
        isOpen={isRollbackOpen}
        onClose={() => setIsRollbackOpen(false)}
        onRollbackTriggered={() => mutate()}
      />
    </div>
  );
}
