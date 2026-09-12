import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getKellyTrackers, createKellyTracker, calculateKellyStake, type KellyTracker } from "@/lib/kelly.functions";
import { getBoard } from "@/lib/picks.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrendingUp, Wallet, Plus, ChevronRight } from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";

export const Route = createFileRoute("/dashboard/kelly")({
  loader: async () => {
    const trackers = await getKellyTrackers();
    const board = await getBoard();
    return { trackers, board };
  },
  component: KellyPage,
  pendingComponent: () => (
    <div className="min-h-screen p-8">
      {/* Show header immediately */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kelly Criterion</h1>
          <p className="text-muted-foreground">
            Mathematically optimal bet sizing for each pick based on your bankroll and the model's edge
          </p>
        </div>
      </div>
      {/* Loader for content */}
      <PageLoader fullScreen={false} />
    </div>
  ),
});

function CreateTrackerDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [bankroll, setBankroll] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Please enter a tracker name");
      return;
    }

    const bankrollNum = Number(bankroll);
    if (!bankrollNum || bankrollNum <= 0) {
      setError("Please enter a valid bankroll amount");
      return;
    }

    setCreating(true);
    setError("");

    try {
      await createKellyTracker({
        data: {
          name: name.trim(),
          startingBankroll: bankrollNum,
        },
      });

      setOpen(false);
      setName("");
      setBankroll("");
      onCreated();
    } catch (err: any) {
      setError(err.message || "Failed to create tracker");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Kelly Tracker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Kelly Criterion Tracker</DialogTitle>
          <DialogDescription>
            Start tracking your bankroll with the Half Kelly strategy. Once created, the tracker cannot be modified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tracker-name">Tracker Name</Label>
            <Input
              id="tracker-name"
              placeholder="e.g., Main Portfolio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="starting-bankroll">Starting Bankroll (₦)</Label>
            <Input
              id="starting-bankroll"
              type="number"
              min="1"
              step="100"
              placeholder="e.g., 20000"
              value={bankroll}
              onChange={(e) => setBankroll(e.target.value)}
              disabled={creating}
            />
          </div>

          <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm">
            <p className="font-semibold text-foreground">Half Kelly Strategy</p>
            <p className="mt-1 text-muted-foreground">
              Automatically applies Half Kelly sizing to each settled pick. This balances growth with bankroll protection.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full"
          >
            {creating ? "Creating..." : "Lock In & Start Tracking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TrackerCard({ tracker }: { tracker: KellyTracker }) {
  const profitLoss = Number(tracker.current_bankroll) - Number(tracker.starting_bankroll);
  const profitLossPercent = (profitLoss / Number(tracker.starting_bankroll)) * 100;
  const isProfit = profitLoss >= 0;

  const winRate = tracker.total_bets > 0
    ? ((tracker.wins / tracker.total_bets) * 100).toFixed(1)
    : "0.0";

  return (
    <Link
      to="/dashboard/kelly/$trackerId"
      params={{ trackerId: tracker.id }}
      className="group block"
    >
      <div className="rounded-2xl border border-border bg-card p-6 shadow-lg transition-all hover:border-[#10B981]/50 hover:shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-[#10B981] transition-colors">
              {tracker.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Started {new Date(tracker.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="rounded-full bg-[#10B981]/10 p-2">
            <Wallet className="h-5 w-5 text-[#10B981]" />
          </div>
        </div>

        {/* Current Bankroll */}
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Current Bankroll
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-foreground">
            ₦{Number(tracker.current_bankroll).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-sm font-semibold ${isProfit ? "text-success" : "text-destructive"}`}>
              {isProfit ? "+" : ""}₦{Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs ${isProfit ? "text-success" : "text-destructive"}`}>
              ({isProfit ? "+" : ""}{profitLossPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Bets</p>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">{tracker.total_bets}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="mt-1 font-mono text-lg font-bold text-success">{winRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className={`mt-1 font-mono text-lg font-bold ${Number(tracker.roi) >= 0 ? "text-success" : "text-destructive"}`}>
              {Number(tracker.roi) >= 0 ? "+" : ""}{Number(tracker.roi).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Record */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {tracker.wins}W - {tracker.losses}L{tracker.pushes > 0 ? ` - ${tracker.pushes}P` : ""}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#10B981] transition-colors" />
        </div>

        {/* Strategy Badge */}
        <div className="mt-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 px-3 py-1 text-xs font-semibold text-[#10B981]">
            <TrendingUp className="h-3 w-3" />
            Half Kelly Strategy
          </span>
        </div>
      </div>
    </Link>
  );
}

function KellyPage() {
  const { trackers, board } = Route.useLoaderData();

  const handleTrackerCreated = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kelly Criterion</h1>
          <p className="text-muted-foreground">
            Mathematically optimal bet sizing for each pick based on your bankroll and the model's edge
          </p>
        </div>
        <CreateTrackerDialog onCreated={handleTrackerCreated} />
      </div>

      {/* Today's Kelly Recommendations */}
      {board.today && board.today.status === "pending" && trackers.length > 0 && (
        <section className="mb-8 rounded-2xl border border-[#10B981]/30 bg-[#10B981]/5 p-6">
          <h2 className="text-xl font-bold text-foreground">📊 Today's Kelly Stakes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recommended stakes for today's pick based on Half Kelly strategy
          </p>

          {/* Today's Pick Info */}
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Today's Pick</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {board.today.away_team} @ {board.today.home_team}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {board.today.selection} {Number(board.today.line)} @ {Number(board.today.odds).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Confidence</p>
                <p className="mt-1 text-2xl font-bold text-[#10B981]">{board.today.confidence}%</p>
              </div>
            </div>

            {board.today.edge !== null && board.today.adjusted_win_prob !== null && (
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Edge</p>
                  <p className="mt-1 font-mono font-semibold text-success">
                    {(Number(board.today.edge) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Win Probability</p>
                  <p className="mt-1 font-mono font-semibold text-foreground">
                    {(Number(board.today.adjusted_win_prob) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Kelly Stakes for Each Tracker */}
          <div className="mt-4 space-y-3">
            {trackers.map((tracker) => {
              if (!board.today.edge || !board.today.adjusted_win_prob) {
                return null;
              }

              const { stake, kellyPercentage } = calculateKellyStake(
                Number(tracker.current_bankroll),
                Number(board.today.odds),
                Number(board.today.adjusted_win_prob),
                Number(tracker.kelly_fraction)
              );

              return (
                <div
                  key={tracker.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-semibold text-foreground">{tracker.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Bankroll: ₦{Number(tracker.current_bankroll).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Recommended Stake</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[#10B981]">
                      ₦{stake.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ({(kellyPercentage * 100).toFixed(1)}% Kelly × 0.5)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 p-3 text-xs text-[#10B981]">
            💡 <strong>Note:</strong> These stakes will be automatically tracked when the game is settled by admin.
          </div>
        </section>
      )}

      {/* No Pick Today Message */}
      {!board.today && trackers.length > 0 && (
        <div className="mb-8 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No pick available for today. Check back tomorrow for Kelly recommendations.
          </p>
        </div>
      )}

      {/* Trackers Grid */}
      {trackers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Trackers Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first Kelly Criterion tracker to start managing your bankroll scientifically.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trackers.map((tracker) => (
            <TrackerCard key={tracker.id} tracker={tracker} />
          ))}
        </div>
      )}
    </div>
  );
}
