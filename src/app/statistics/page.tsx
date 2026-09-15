"use client";

import React from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Flame,
  TrendingUp,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Award,
  Zap,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface DayChartItem {
  day: string;
  date: string;
  total: number;
  completed: number;
  rate: number;
}

interface StatsData {
  today: {
    total: number;
    completed: number;
    remaining: number;
    percentage: number;
  };
  weeklyRate: number;
  monthlyRate: number;
  streak: number;
  totalCompleted: number;
  activeRecurring: number;
  weeklyChart: DayChartItem[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch stats");
  return json as StatsData;
};

export default function StatisticsPage() {
  const { data: stats, isLoading, error } = useSWR<StatsData>(
    "/api/statistics",
    fetcher
  );

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Productivity Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your discipline, completion streaks, and task velocity over time
        </p>
      </div>

      {isLoading ? (
        <StatsSkeleton />
      ) : !stats ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>Failed to load analytics data.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Key KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border bg-card shadow-xs hover:border-amber-500/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Current Streak
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                      <Flame className="h-4 w-4 fill-amber-500" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-foreground">
                      {stats.streak}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1.5 font-medium">
                      {stats.streak === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {stats.streak > 0 ? "Keep the flame burning!" : "Complete a task today to ignite!"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Tasks Done */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.3 }}
            >
              <Card className="border-border bg-card shadow-xs hover:border-success/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tasks Finished
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-foreground">
                      {stats.totalCompleted}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1.5 font-medium">
                      total
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    All-time completed checklist items
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Weekly Completion Rate */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.3 }}
            >
              <Card className="border-border bg-card shadow-xs hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      7-Day Rate
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-foreground">
                      {stats.weeklyRate}%
                    </span>
                  </div>
                  <Progress value={stats.weeklyRate} className="h-1.5 mt-2" />
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Habits / Rollback Daily */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.3 }}
            >
              <Card className="border-border bg-card shadow-xs hover:border-violet-500/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Daily Habits
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-foreground">
                      {stats.activeRecurring}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1.5 font-medium">
                      habits
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Auto-recreated each morning at 5 AM
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* 7-Day Performance Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Last 7 Days Performance
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    Avg: {stats.weeklyRate}% completed
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-6 pb-2 min-h-[190px]">
                  {stats.weeklyChart.map((day, i) => {
                    const heightPercent = day.total > 0 ? Math.max(day.rate, 12) : 6;
                    return (
                      <div key={day.date} className="flex flex-col items-center gap-2">
                        {/* Tooltip / Label */}
                        <span className="text-[11px] font-bold text-foreground">
                          {day.total > 0 ? `${day.rate}%` : "—"}
                        </span>

                        {/* Bar Container */}
                        <div className="w-full max-w-[48px] h-32 bg-muted/40 rounded-xl flex items-end p-1 overflow-hidden relative group">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            className={`w-full rounded-lg transition-colors ${
                              day.rate === 100
                                ? "bg-gradient-to-t from-success to-emerald-400"
                                : day.rate >= 50
                                ? "bg-gradient-to-t from-primary to-indigo-400"
                                : day.total > 0
                                ? "bg-gradient-to-t from-amber-500 to-amber-400"
                                : "bg-muted-foreground/20"
                            }`}
                          />
                        </div>

                        {/* Day Label */}
                        <span className="text-xs font-semibold text-muted-foreground">
                          {day.day}
                        </span>

                        {/* Fraction */}
                        <span className="text-[10px] text-muted-foreground/70">
                          {day.completed}/{day.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Productivity Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 border-border bg-card">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Monthly Consistency</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Over the last 30 days, you achieved a <strong>{stats.monthlyRate}%</strong> task completion rate. Consistent execution beats occasional intensity.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-border bg-card">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Habit Compound Effect</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    You have <strong>{stats.activeRecurring} active recurring habits</strong> enrolled in Rollback Daily. Habits compound into remarkable lifestyle improvements.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}
