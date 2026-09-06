import { createFileRoute } from "@tanstack/react-router";
import { getBoard, type Pick } from "@/lib/picks.functions";
import { TrendingUp, TrendingDown, Target, Wallet, Award, Activity } from "lucide-react";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";

export const Route = createFileRoute("/dashboard/")({
  loader: () => getBoard(),
  component: OverviewPage,
});

function OverviewPage() {
  const { stats, today, history } = Route.useLoaderData();
  
  // Auto-refresh every 5 minutes (no API calls, just database refresh)
  const lastRefresh = useAutoRefresh(5);

  // Get recent results (last 5)
  const recentResults = history.slice(0, 5).filter(p => p.status !== "pending");

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
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋
            </h1>
            <p className="mt-2 text-muted-foreground">
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today's Prediction */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#10B981]/10 p-3">
              <Target className="h-6 w-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Pick</p>
              <p className="text-2xl font-bold text-foreground">
                {today ? "Active" : "Pending"}
              </p>
            </div>
          </div>
          {today && (
            <div className="mt-4 rounded-xl bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground">Current Selection</p>
              <p className="mt-1 font-semibold text-foreground">
                {today.selection} {Number(today.line)}
              </p>
            </div>
          )}
        </div>

        {/* Win Rate */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#10B981]/10 p-3">
              <Award className="h-6 w-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold text-foreground">
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
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#10B981]/10 p-3">
              <Wallet className="h-6 w-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bankroll</p>
              <p className="text-2xl font-bold text-foreground">
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
            <span className={`text-sm font-semibold ${stats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {stats.profit >= 0 ? '+' : ''}₦{stats.profit.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">total profit</span>
          </div>
        </div>

        {/* Total Odds */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-3">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Predictions</p>
              <p className="text-2xl font-bold text-foreground">{stats.settled}</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {stats.settled} picks settled
          </div>
        </div>

        {/* ROI */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/10 p-3">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ROI</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.roi.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Return on investment
          </div>
        </div>

        {/* Pushes */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-500/10 p-3">
              <Target className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pushes</p>
              <p className="text-2xl font-bold text-foreground">{stats.pushes}</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Exact line hits
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Recent Results</h2>
          <a
            href="/dashboard/predictions"
            className="text-sm font-medium text-[#10B981] hover:underline"
          >
            View All
          </a>
        </div>

        {recentResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No settled picks yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentResults.map((pick) => (
              <div
                key={pick.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {pick.away_team} @ {pick.home_team}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pick.selection} {Number(pick.line)} @ {Number(pick.odds).toFixed(2)} · {pick.pick_date}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {pick.profit != null && (
                    <span
                      className={`font-mono text-sm font-semibold ${
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
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
              </div>
            ))}
          </div>
        )}
      </div>

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
