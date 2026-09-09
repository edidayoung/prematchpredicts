import { createFileRoute } from "@tanstack/react-router";
import { getBoard, type Pick } from "@/lib/picks.functions";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/predictions")({
  loader: () => getBoard(),
  component: PredictionsPage,
});

function StatusTag({ status }: { status: string }) {
  const tone =
    status === "won"
      ? "bg-success/15 text-success border-success/30"
      : status === "lost"
        ? "bg-destructive/15 text-destructive border-destructive/30"
        : status === "push"
          ? "bg-muted text-muted-foreground border-border"
          : "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30";
  const label = status === "pending" ? "Awaiting result" : status.toUpperCase();
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Confidence
        </span>
        <span className="font-mono text-2xl font-bold text-[#10B981]">{value}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div 
          className="h-full rounded-full bg-[#10B981]" 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
}

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
            <StatusTag status={pick.status} />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {pick.sport_title}
            </span>
            <span className="text-sm text-muted-foreground">
              {tipOff(pick.commence_time)}
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

          {/* Final Score & Result (if settled) */}
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
                    profit && profit > 0 
                      ? "text-success" 
                      : profit && profit < 0 
                        ? "text-destructive" 
                        : "text-muted-foreground"
                  }`}>
                    {profit !== null ? `${profit > 0 ? '+' : ''}₦${profit.toFixed(2)}` : '₦0.00'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confidence */}
          <ConfidenceMeter value={pick.confidence} />

          {/* Analysis */}
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Analysis
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {pick.reasoning}
            </p>
          </div>

          {/* Bookmaker */}
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Bookmaker</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{pick.bookmaker}</p>
          </div>

          {/* Model Status */}
          {pick.reasoning.includes('STATISTICAL MODEL') ? (
            <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-2 text-xs">
              <span className="font-semibold text-success">✅ Using Real Team Stats</span>
              <span className="ml-2 text-success/80">- Prediction based on historical performance data</span>
            </div>
          ) : (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs">
              <span className="font-semibold text-yellow-600">⚠️ Stats Not Available</span>
              <span className="ml-2 text-yellow-600/80">- Using bookmaker odds only</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function tipOff(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TodayCard({ pick }: { pick: Pick }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[#10B981] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
          Pick of the day
        </span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {pick.sport_title}
        </span>
        <StatusTag status={pick.status} />
      </div>

      <h2 className="mt-5 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
        {pick.away_team} <span className="text-muted-foreground">at</span> {pick.home_team}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Tip-off {tipOff(pick.commence_time)}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Bookmaker</p>
          <p className="mt-1 truncate text-lg font-semibold text-foreground">{pick.bookmaker}</p>
        </div>
      </div>

      <div className="mt-6">
        <ConfidenceMeter value={pick.confidence} />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-secondary/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Analysis
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {pick.reasoning}
        </p>
      </div>

      {/* Model Status Indicator */}
      {pick.reasoning.includes('STATISTICAL MODEL') ? (
        <div className="mt-4 rounded-xl border border-success/30 bg-success/10 px-4 py-2 text-xs">
          <span className="font-semibold text-success">✅ Using Real Team Stats</span>
          <span className="ml-2 text-success/80">- Prediction based on historical performance data</span>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs">
          <span className="font-semibold text-yellow-600">⚠️ Stats Not Available</span>
          <span className="ml-2 text-yellow-600/80">- Using bookmaker odds only</span>
        </div>
      )}
    </article>
  );
}

function PredictionsPage() {
  const { today, history, message } = Route.useLoaderData();
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null);
  
  // Auto-refresh every 5 minutes
  useAutoRefresh(5);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Daily Predictions</h1>
        <p className="mt-2 text-muted-foreground">
          One carefully selected prediction every day, priced around 2.0 odds
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          {message}
        </div>
      )}

      {/* Today's Pick */}
      {today ? (
        <TodayCard pick={today} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <p className="text-lg font-semibold">No qualifying game yet today</p>
          <p className="mt-2 text-sm">Check back closer to tip-off time</p>
        </div>
      )}

      {/* Past Picks */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-foreground">Past Picks</h2>
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">
              The record starts building from the first settled pick
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {history.map((pick) => {
                const profit = pick.profit != null ? Number(pick.profit) : null;
                
                return (
                  <button
                    key={pick.id}
                    onClick={() => setSelectedPick(pick)}
                    className="group rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-[#10B981]/50 hover:shadow-md cursor-pointer"
                  >
                    {/* Status Badge */}
                    <div className="mb-3">
                      <StatusTag status={pick.status} />
                    </div>

                    {/* Teams */}
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-[#10B981] transition-colors">
                      {pick.away_team} <span className="text-muted-foreground">@</span> {pick.home_team}
                    </h3>

                    {/* Date */}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(pick.pick_date).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </p>

                    {/* Selection & Odds */}
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-foreground">
                        {pick.selection} {Number(pick.line)}
                      </span>
                      <span className="font-mono font-semibold text-success">
                        {Number(pick.odds).toFixed(2)}
                      </span>
                    </div>

                    {/* Profit */}
                    {profit !== null && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className={`font-mono text-sm font-bold text-center ${
                          profit > 0 
                            ? "text-success" 
                            : profit < 0 
                              ? "text-destructive" 
                              : "text-muted-foreground"
                        }`}>
                          {profit > 0 ? '+' : ''}₦{profit.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {selectedPick && (
        <PickDetailModal 
          pick={selectedPick} 
          open={!!selectedPick} 
          onClose={() => setSelectedPick(null)} 
        />
      )}
    </div>
  );
}
