"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  StickyNote,
  Upload,
  RefreshCw,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Confetti } from "@/components/ui/confetti";
import { TaskFormDialog } from "@/components/checklist/task-form";
import { RollbackManagerDialog } from "@/components/checklist/rollback-manager";
import { useProfile } from "@/hooks/use-profile";
import { useTasks } from "@/hooks/use-tasks";
import { getGreeting, formatDisplayDate, getDailyQuote, formatDueTime, formatDateKey } from "@/lib/utils";
import { CreateTaskInput } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, isLoading: isProfileLoading, hasProfile } = useProfile();
  const { tasks, stats, isLoading: isTasksLoading, toggleTask, createTask, mutate } = useTasks();

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isProfileLoading && !hasProfile) {
      router.replace("/onboarding");
    }
  }, [isProfileLoading, hasProfile, router]);

  const handleToggle = async (id: string, current: boolean) => {
    const willBeComplete = !current;
    if (willBeComplete && stats.total > 0 && stats.completed + 1 === stats.total) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    await toggleTask(id, current);
  };

  const handleCreateTask = async (data: CreateTaskInput) => {
    await createTask(data);
  };

  if (isProfileLoading) {
    return <DashboardSkeleton />;
  }

  if (!profile) return null;

  const greeting = getGreeting();
  const dateStr = formatDisplayDate();
  const quote = getDailyQuote();

  const todayString = formatDateKey();

  return (
    <div className="space-y-8">
      <Confetti trigger={showConfetti} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {greeting},{" "}
            <span className="gradient-text">{profile.name.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">{dateStr}</p>
          <p className="text-sm text-muted-foreground/70 mt-1 italic max-w-xl">
            &ldquo;{quote}&rdquo;
          </p>
        </div>

        <Button
          onClick={() => setIsTaskFormOpen(true)}
          className="gap-2 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Quick Task
        </Button>
      </motion.div>

      {/* Today's Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Card className="overflow-hidden border-border/80 shadow-xs relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none rounded-xl" />
          <CardHeader className="relative pb-3 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Today&apos;s Productivity
            </CardTitle>
            {stats.total > 0 && stats.percentage === 100 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                <Sparkles className="h-3 w-3" />
                All Done!
              </span>
            )}
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-4">
              {/* Circular Progress Ring */}
              <div className="relative shrink-0 mx-auto sm:mx-0">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle
                    cx="44"
                    cy="44"
                    r="36"
                    fill="none"
                    stroke="hsl(var(--secondary))"
                    strokeWidth="7"
                  />
                  <circle
                    cx="44"
                    cy="44"
                    r="36"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - (stats.percentage || 0) / 100)}`}
                    transform="rotate(-90 44 44)"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold tracking-tight">{stats.percentage}%</span>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 flex-1">
                <div className="text-center p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>

                <div className="text-center p-3 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  </div>
                  <p className="text-2xl font-bold text-success">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>

                <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-amber-500">{stats.remaining}</p>
                  <p className="text-xs text-muted-foreground">Left</p>
                </div>
              </div>
            </div>

            <Progress value={stats.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.total === 0
                ? "No tasks scheduled for today. Click 'Add Task' or manage Rollback Daily!"
                : `${stats.completed} of ${stats.total} tasks completed today`}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            onClick={() => setIsTaskFormOpen(true)}
            className="h-auto flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 text-primary transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">Add Task</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/notes")}
            className="h-auto flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-500 transition-colors">
              <StickyNote className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">Add Note</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/documents")}
            className="h-auto flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-border hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-500 transition-colors">
              <Upload className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">Upload Doc</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsRollbackOpen(true)}
            className="h-auto flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-border hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 text-violet-500 transition-colors">
              <RefreshCw className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">Rollback Daily</span>
          </Button>
        </div>
      </motion.div>

      {/* Today's Tasks Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Today&apos;s Focus
          </h2>
          <Link
            href="/checklist"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            View all ({tasks.length})
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isTasksLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : tasks.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <CheckSquare className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">No tasks yet for today</p>
            <p className="text-xs text-muted-foreground mb-4">
              Kickstart your productivity by creating your first task or enabling recurring habits.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTaskFormOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Task
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3.5 rounded-xl border bg-card/70 hover:bg-card transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(task.id, task.completed)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      task.completed
                        ? "border-success bg-success text-success-foreground"
                        : "border-muted-foreground/30 hover:border-primary"
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="h-4 w-4 fill-current" />}
                  </button>
                  <span
                    className={`text-sm truncate ${
                      task.completed ? "line-through text-muted-foreground" : "font-medium"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.due_time && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDueTime(task.due_time)}
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${
                      task.priority === "high"
                        ? "bg-destructive/15 text-destructive"
                        : task.priority === "medium"
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-blue-500/15 text-blue-500"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Task Form Dialog */}
      <TaskFormDialog
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={handleCreateTask}
        currentDate={todayString}
      />

      {/* Rollback Manager Dialog */}
      <RollbackManagerDialog
        isOpen={isRollbackOpen}
        onClose={() => setIsRollbackOpen(false)}
        onRollbackTriggered={() => mutate()}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <div>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
