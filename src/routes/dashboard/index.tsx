import { createFileRoute } from "@tanstack/react-router";
import { getBoard, type Pick } from "@/lib/picks.functions";
import { TrendingUp, TrendingDown, Target, Wallet, Award, Activity } from "lucide-react";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/")({
  loader: () => getBoard(),
  component: OverviewPage,
});

function PickDetailModal({ pick, open, onClose }: { pick: Pick; open: boolean; onClose: () => void }) {
  const profit = pick.profit != null ? Number(pick.profit) : null;
  const finalTotal = pick.final_total != null ? Number(pick.final_total) : null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {pick.away_team} <span className="text-muted-foreground">at</span> {pick.home_team}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Date */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-4 py-1.5 text-sm font-bold border ${
              pick.status === "won" ? "bg-success/15 text-success border-success/30" :
              pick.status === "lost" ? "bg-destructive/15 text-destructive border-destructive/30" :
              pick.status === "push" ? "bg-muted text-muted-foreground border-border" :
              "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
            }`}>
              {pick.status.toUpperCase()}
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {pick.sport_title}
            </span>
            <span className="text-sm text-muted-foreground">
              {new Date(pick.commence_time).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Selection Details */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Selection</p>
              <p className="mt-1 font-mono text-xl font-bold text-foreground">
                {pick.selection} {Number(pick.line)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Odds</p>
              <p className="mt-1 font-mono text-xl font-bold text-success">{Number(pick.odds).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Stake</p>
              <p className="mt-1 font-mono text-xl font-bold text-foreground">₦{Number(pick.stake).toFixed(2)}</p>
            </div>
          </div>

          {/* Final Score & Result */}
          {pick.status !== "pending" && finalTotal !== null && (
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Final Total</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-foreground">{finalTotal}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Profit/Loss</p>
                  <p className={`mt-1 font-mono text-2xl font-bold ${
                    profit && profit > 0 ? "text-success" : profit && profit < 0 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {profit !== null ? `${profit > 0 ? '+' : ''}₦${profit.toFixed(2)}` : '₦0.00'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Analysis */}
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analysis</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {pick.reasoning}
            </p>
          </div>

          {/* Bookmaker */}
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Bookmaker</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{pick.bookmaker}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OverviewPage() {
  const { stats, today, history } = Route.useLoaderData();
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null);
  
  // Auto-refresh every 5 minutes (no API calls, just database refresh)
  const lastRefresh = useAutoRefresh(5);

  // Get recent results (last 3)
  const recentResults = history.slice(0, 3).filter(p => p.status !== "pending");

  // Calculate streak info
  const streakText = stats.streak > 0 
    ? `${stats.streak} Win${stats.streak > 1 ? 's' : ''}`
    : stats.streak < 0 
    ? `${Math.abs(stats.streak)} Loss${Math.abs(stats.streak) > 1 ? 'es' : ''}`
    : "No Streak";

  const streakColor = stats.streak > 0 
    ? "text-success" 
    : stats.streak < 0 
    ? "text-destructive" 
    : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Here's your prediction overview. Keep winning!
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#10B981]" />
            <span>Live · Auto-refresh</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today's Prediction */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#10B981]/10 p-2 sm:p-3">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Today's Pick</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {today ? "Active" : "Pending"}
              </p>
            </div>
          </div>
          {today && (
            <div className="mt-4 rounded-xl bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground">Current Selection</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {today.selection} {Number(today.line)}
              </p>
            </div>
          )}
        </div>

        {/* Win Rate */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#10B981]/10 p-2 sm:p-3">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Win Rate</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {stats.winRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {stats.wins}W - {stats.losses}L
            </span>
            <span className={`font-semibold ${streakColor}`}>
              {streakText}
            </span>
          </div>
        </div>

        {/* Bankroll */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#10B981]/10 p-2 sm:p-3">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Bankroll</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                ₦{stats.bankroll.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {stats.profit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span className={`text-xs sm:text-sm font-semibold ${stats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {stats.profit >= 0 ? '+' : ''}₦{stats.profit.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">total profit</span>
          </div>
        </div>

        {/* Total Odds */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 sm:p-3">
              <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Predictions</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.settled}</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {stats.settled} picks settled
          </div>
        </div>

        {/* ROI */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/10 p-2 sm:p-3">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">ROI</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {stats.roi.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Return on investment
          </div>
        </div>

        {/* Pushes */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-500/10 p-2 sm:p-3">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Pushes</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.pushes}</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Exact line hits
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="mt-8">
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-bold text-foreground">Recent Results</h2>
          <a
            href="/dashboard/predictions"
            className="text-sm font-medium text-[#10B981] hover:underline"
          >
            View All
          </a>
        </div>

        {recentResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 sm:p-10 text-center">
            <p className="text-muted-foreground">No settled picks yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentResults.map((pick: Pick) => (
              <button
                key={pick.id}
                onClick={() => setSelectedPick(pick)}
                className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-3 transition-all hover:bg-secondary/40 hover:border-[#10B981]/50 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-foreground text-sm sm:text-base text-left">
                    {pick.away_team} @ {pick.home_team}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate text-left">
                    {pick.selection} {Number(pick.line)} @ {Number(pick.odds).toFixed(2)} · {pick.pick_date}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  {pick.profit != null && (
                    <span
                      className={`font-mono text-xs sm:text-sm font-semibold whitespace-nowrap ${
                        Number(pick.profit) > 0
                          ? "text-success"
                          : Number(pick.profit) < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {Number(pick.profit) > 0 ? "+" : ""}₦{Number(pick.profit).toFixed(2)}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 sm:px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                      pick.status === "won"
                        ? "bg-success/15 text-success"
                        : pick.status === "lost"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {pick.status.toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pick Detail Modal */}
      {selectedPick && (
        <PickDetailModal 
          pick={selectedPick} 
          open={!!selectedPick} 
          onClose={() => setSelectedPick(null)} 
        />
      )}

      {/* Keep going message */}
      {stats.streak > 0 && (
        <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-4">
          <p className="text-sm font-semibold text-success">
            🔥 You're on a {stats.streak}-game winning streak! Keep it up!
          </p>
        </div>
      )}
    </div>
  );
}
