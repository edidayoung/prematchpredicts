import { createFileRoute, Link } from "@tanstack/react-router";
import { getKellyTracker } from "@/lib/kelly.functions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/dashboard/kelly/$trackerId")({
  loader: async ({ params }) => {
    const data = await getKellyTracker({ data: { trackerId: params.trackerId } });
    return data;
  },
  component: TrackerDetailPage,
});

function TrackerDetailPage() {
  const { tracker, bets } = Route.useLoaderData();

  const profitLoss = Number(tracker.current_bankroll) - Number(tracker.starting_bankroll);
  const profitLossPercent = (profitLoss / Number(tracker.starting_bankroll)) * 100;
  const isProfit = profitLoss >= 0;

  const winRate = tracker.total_bets > 0
    ? ((tracker.wins / tracker.total_bets) * 100).toFixed(1)
    : "0.0";

  // Calculate what flat staking would have resulted in
  const flatStakeAmount = 100; // ₦100 per bet
  const flatTotalStaked = flatStakeAmount * tracker.total_bets;
  const flatProfit = bets.reduce((sum, bet) => {
    if (bet.result === "won") {
      return sum + (flatStakeAmount * (bet.profit / bet.stake)); // Scale profit
    } else if (bet.result === "lost") {
      return sum - flatStakeAmount;
    }
    return sum;
  }, 0);
  const flatBankroll = Number(tracker.starting_bankroll) + flatProfit;

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/dashboard/kelly">
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Trackers
          </Button>
        </Link>

        <h1 className="text-3xl font-black tracking-tight text-foreground">
          {tracker.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Started {new Date(tracker.created_at).toLocaleDateString()} with ₦{Number(tracker.starting_bankroll).toLocaleString()}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current Bankroll */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Current Bankroll
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">
            ₦{Number(tracker.current_bankroll).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-sm font-semibold ${isProfit ? "text-success" : "text-destructive"}`}>
              {isProfit ? "+" : ""}₦{Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-xs ${isProfit ? "text-success" : "text-destructive"}`}>
              ({isProfit ? "+" : ""}{profitLossPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Win Rate
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-success">
            {winRate}%
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tracker.wins}W - {tracker.losses}L{tracker.pushes > 0 ? ` - ${tracker.pushes}P` : ""}
          </p>
        </div>

        {/* ROI */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            ROI
          </p>
          <p className={`mt-2 font-mono text-2xl font-bold ${Number(tracker.roi) >= 0 ? "text-success" : "text-destructive"}`}>
            {Number(tracker.roi) >= 0 ? "+" : ""}{Number(tracker.roi).toFixed(1)}%
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            ₦{Number(tracker.total_staked).toLocaleString()} staked
          </p>
        </div>

        {/* Total Bets */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Bets
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">
            {tracker.total_bets}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Half Kelly strategy
          </p>
        </div>
      </div>

      {/* Comparison with Flat Staking */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Kelly vs Flat Staking Comparison</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          See how Half Kelly compares to betting a flat ₦{flatStakeAmount} on every pick
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Kelly */}
          <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#10B981]" />
              <p className="font-semibold text-[#10B981]">Half Kelly (Current)</p>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-foreground">
              ₦{Number(tracker.current_bankroll).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className={`mt-1 text-sm ${isProfit ? "text-success" : "text-destructive"}`}>
              {isProfit ? "+" : ""}₦{Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })} profit
            </p>
          </div>

          {/* Flat */}
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center gap-2">
              <Minus className="h-5 w-5 text-muted-foreground" />
              <p className="font-semibold text-muted-foreground">Flat ₦{flatStakeAmount} Stakes</p>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-foreground">
              ₦{flatBankroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className={`mt-1 text-sm ${flatProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {flatProfit >= 0 ? "+" : ""}₦{Math.abs(flatProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })} profit
            </p>
          </div>
        </div>

        {profitLoss > flatProfit && (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            ✅ Kelly is outperforming flat staking by ₦{(profitLoss - flatProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {/* Bet History */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Bet History</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All bets applied using Half Kelly strategy
        </p>

        {bets.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No bets yet. Bets will appear here as picks are settled after this tracker was created.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Stake</TableHead>
                  <TableHead className="text-right">Profit/Loss</TableHead>
                  <TableHead className="text-right">Bankroll After</TableHead>
                  <TableHead className="text-right">Kelly %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bets.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell className="font-medium">
                      {new Date(bet.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        bet.result === "won"
                          ? "bg-success/15 text-success"
                          : bet.result === "lost"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {bet.result === "won" ? "✅ Won" : bet.result === "lost" ? "❌ Lost" : "⚪ Push"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₦{Number(bet.stake).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${
                      Number(bet.profit) >= 0 ? "text-success" : "text-destructive"
                    }`}>
                      {Number(bet.profit) >= 0 ? "+" : ""}₦{Number(bet.profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₦{Number(bet.bankroll_after).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {(Number(bet.kelly_percentage) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
