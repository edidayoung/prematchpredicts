import { createFileRoute } from "@tanstack/react-router";
import { getBoard, type Pick } from "@/lib/picks.functions";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/hits")({
  loader: () => getBoard(),
  component: HitsPage,
});

function HitsPage() {
  const { history } = Route.useLoaderData();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useAutoRefresh(5);

  // Create a map of date -> pick for quick lookups
  const picksByDate = history.reduce((acc, pick) => {
    acc[pick.pick_date] = pick;
    return acc;
  }, {} as Record<string, Pick>);

  // Get calendar data for current month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  
  // Add empty slots for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return "✓";
      case "lost":
        return "✗";
      case "push":
        return "−";
      case "pending":
        return "⋯";
      default:
        return "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "bg-success/20 border-success text-success";
      case "lost":
        return "bg-destructive/20 border-destructive text-destructive";
      case "push":
        return "bg-muted border-border text-muted-foreground";
      case "pending":
        return "bg-[#10B981]/20 border-[#10B981] text-[#10B981]";
      default:
        return "bg-secondary/40 border-border text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Hits Calendar</h1>
        <p className="mt-2 text-muted-foreground">
          Visual history of all your predictions
        </p>
      </div>

      {/* Calendar Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="rounded-lg border border-border bg-card p-2 transition-colors hover:bg-secondary/40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-foreground">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="rounded-lg border border-border bg-card px-3 py-1 text-sm font-medium transition-colors hover:bg-secondary/40"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="rounded-lg border border-border bg-card p-2 transition-colors hover:bg-secondary/40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-border bg-card p-6">
        {/* Day Names Header */}
        <div className="mb-4 grid grid-cols-7 gap-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateKey = formatDateKey(year, month, day);
            const pick = picksByDate[dateKey];
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`group relative aspect-square rounded-lg border transition-all ${
                  pick
                    ? `${getStatusColor(pick.status)} border-2 cursor-pointer hover:scale-105 hover:shadow-lg`
                    : "border-dashed border-border bg-secondary/10"
                } ${isToday ? "ring-2 ring-[#10B981] ring-offset-2" : ""}`}
                title={
                  pick
                    ? `${pick.away_team} @ ${pick.home_team} - ${pick.status.toUpperCase()}`
                    : ""
                }
              >
                {/* Day Number */}
                <div className="absolute left-1 top-1 text-xs font-semibold text-foreground">
                  {day}
                </div>

                {/* Status Icon */}
                {pick && (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-2xl font-bold">
                      {getStatusIcon(pick.status)}
                    </span>
                  </div>
                )}

                {/* Hover Tooltip */}
                {pick && (
                  <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg border border-border bg-card p-3 shadow-lg group-hover:block w-64">
                    <p className="text-xs font-semibold text-foreground">
                      {pick.away_team} @ {pick.home_team}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pick.selection} {Number(pick.line)} @ {Number(pick.odds).toFixed(2)}
                    </p>
                    {pick.profit != null && (
                      <p
                        className={`mt-1 text-xs font-semibold ${
                          Number(pick.profit) > 0
                            ? "text-success"
                            : Number(pick.profit) < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }`}
                      >
                        {Number(pick.profit) > 0 ? "+" : ""}₦{Number(pick.profit).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-success bg-success/20">
            <span className="text-lg font-bold text-success">✓</span>
          </div>
          <span className="text-sm font-medium text-foreground">Win</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-destructive bg-destructive/20">
            <span className="text-lg font-bold text-destructive">✗</span>
          </div>
          <span className="text-sm font-medium text-foreground">Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-border bg-muted">
            <span className="text-lg font-bold text-muted-foreground">−</span>
          </div>
          <span className="text-sm font-medium text-foreground">Push</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#10B981] bg-[#10B981]/20">
            <span className="text-lg font-bold text-[#10B981]">⋯</span>
          </div>
          <span className="text-sm font-medium text-foreground">Pending</span>
        </div>
      </div>
    </div>
  );
}
