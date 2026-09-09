import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { syncData, getSyncStatus } from "@/lib/sync-data.functions";
import { getBoard, settlePick, type Pick } from "@/lib/picks.functions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin")({
  loader: async () => {
    const [status, board] = await Promise.all([getSyncStatus(), getBoard()]);
    return { status, board };
  },
  component: AdminPage,
});

function AdminPage() {
  const { status, board } = Route.useLoaderData();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Password protection
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // Settlement state
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null);
  const [settlementStatus, setSettlementStatus] = useState("");
  const [finalTotal, setFinalTotal] = useState("");
  const [settling, setSettling] = useState(false);

  const pendingPicks = board.history.filter((p) => p.status === "pending");

  const ADMIN_PASSWORD = "1"; // Change this to your desired password

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Try again.");
      setPasswordInput("");
    }
  };

  // Show password prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10">
                <svg
                  className="h-8 w-8 text-[#10B981]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter password to access admin panel
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-6">
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="mt-2"
                  autoFocus
                />
              </div>

              {passwordError && (
                <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/15 p-3 text-sm text-destructive">
                  {passwordError}
                </div>
              )}

              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-[#10B981] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#10B981]/90"
              >
                Unlock
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to dashboard
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const handleNBASync = async () => {
    setSyncing(true);
    setMessage(null);
    setError(null);

    try {
      const result = await syncData();
      if (result.success) {
        setMessage(result.message || "NBA Sync completed!");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError(result.error || "NBA Sync failed");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setSyncing(false);
    }
  };

  const handleSettlement = async () => {
    if (!selectedPick || !settlementStatus || finalTotal === "") {
      setError("Please fill all fields");
      return;
    }

    setSettling(true);
    setError(null);
    setMessage(null);

    try {
      const result = await settlePick({
        data: {
          pickId: selectedPick.id,
          status: settlementStatus,
          finalTotal: Number(finalTotal),
        },
      });

      if (result.success) {
        setMessage(`Pick settled as ${settlementStatus.toUpperCase()}! Profit: ₦${result.profit.toFixed(2)}`);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      setError(err.message || "Settlement failed");
    } finally {
      setSettling(false);
    }
  };



  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-9">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
            Data Management
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Sync NBA data and manually settle pending games.
          </p>
        </header>

        {/* Manual Settlement Section */}
        <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] sm:p-8">
          <h2 className="text-xl font-bold text-foreground">Manual Game Settlement</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Settle pending games manually to conserve API credits.
          </p>

          {pendingPicks.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No pending games to settle
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {/* Pending Picks List */}
              <div>
                <Label className="text-sm font-semibold text-foreground">Select Game</Label>
                <div className="mt-2 space-y-2">
                  {pendingPicks.map((pick) => (
                    <button
                      key={pick.id}
                      onClick={() => {
                        setSelectedPick(pick);
                        setSettlementStatus("");
                        setFinalTotal("");
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${
                        selectedPick?.id === pick.id
                          ? "border-[#10B981] bg-[#10B981]/10"
                          : "border-border bg-secondary/40 hover:bg-secondary/60"
                      }`}
                    >
                      <p className="font-semibold text-foreground">
                        {pick.away_team} @ {pick.home_team}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pick.pick_date} · {pick.selection} {Number(pick.line)} @ {Number(pick.odds).toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settlement Form */}
              {selectedPick && (
                <div className="space-y-4 rounded-2xl border border-border bg-secondary/20 p-6">
                  <h3 className="font-semibold text-foreground">
                    Settle: {selectedPick.away_team} @ {selectedPick.home_team}
                  </h3>

                  {/* Status Selector */}
                  <div>
                    <Label htmlFor="status">Result</Label>
                    <Select value={settlementStatus} onValueChange={setSettlementStatus}>
                      <SelectTrigger id="status" className="mt-2">
                        <SelectValue placeholder="Select result..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="won">Won ✅</SelectItem>
                        <SelectItem value="lost">Lost ❌</SelectItem>
                        <SelectItem value="push">Push (Void) ⚪</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Final Total Input */}
                  <div>
                    <Label htmlFor="finalTotal">Final Total Score</Label>
                    <Input
                      id="finalTotal"
                      type="number"
                      step="0.5"
                      placeholder="e.g., 3"
                      value={finalTotal}
                      onChange={(e) => setFinalTotal(e.target.value)}
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Selection: {selectedPick.selection} {Number(selectedPick.line)}
                    </p>
                  </div>

                  {/* Settle Button */}
                  <button
                    onClick={handleSettlement}
                    disabled={settling || !settlementStatus || finalTotal === ""}
                    className="w-full rounded-xl bg-[#10B981] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#10B981]/90 disabled:opacity-50"
                  >
                    {settling ? "Settling..." : "💾 Settle Game"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="mt-4 rounded-2xl border border-success/30 bg-success/15 p-4 text-sm text-success">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/15 p-4 text-sm text-destructive">
              ❌ {error}
            </div>
          )}
        </section>

        {/* Sync Status */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] sm:p-8">
          <h2 className="text-xl font-bold text-foreground">Current Status</h2>
          
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Teams</p>
              <p className="mt-1 font-mono text-2xl font-bold text-foreground">{status.teamsCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Team Stats</p>
              <p className="mt-1 font-mono text-2xl font-bold text-foreground">{status.statsCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Games</p>
              <p className="mt-1 font-mono text-2xl font-bold text-foreground">{status.gamesCount}</p>
            </div>
          </div>

          {/* API Usage Info */}
          <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
            <h3 className="text-sm font-bold text-yellow-600">⚠️ API Usage Note</h3>
            <div className="mt-3 space-y-2 text-sm text-yellow-600/90">
              <p>
                <strong>Current Setup:</strong> Free tier allows ~500 requests per month
              </p>
              <p>
                <strong>Daily Usage:</strong> 1 call to generate pick (manual settlement saves API calls)
              </p>
              <p>
                <strong>Monthly Estimate:</strong> ~30 calls (1 per day for pick generation)
              </p>
              <p className="pt-2 text-xs">
                💡 <strong>Tip:</strong> Manual settlement conserves API credits. Monitor your usage at{" "}
                <a 
                  href="https://the-odds-api.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-500"
                >
                  the-odds-api.com
                </a>
              </p>
            </div>
          </div>

          {status.lastUpdate && (
            <p className="mt-4 text-xs text-muted-foreground">
              Last updated: {new Date(status.lastUpdate).toLocaleString()}
            </p>
          )}

          {status.sampleTeams && status.sampleTeams.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sample Teams</p>
              <p className="mt-2 text-sm text-foreground">{status.sampleTeams.join(", ")}</p>
            </div>
          )}

          {/* Sync Button */}
          <div className="mt-8">
            <button
              onClick={handleNBASync}
              disabled={syncing}
              className="w-full rounded-2xl bg-accent px-6 py-3 font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {syncing ? "Syncing NBA... (30-60s)" : "🏀 Sync NBA Data"}
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div className="mt-4 rounded-2xl border border-success/30 bg-success/15 p-4 text-sm text-success">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/15 p-4 text-sm text-destructive">
              ❌ {error}
            </div>
          )}
        </section>



        {/* Instructions */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground">How It Works</h2>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">NBA Data:</strong> Sync once to fetch teams and recent game statistics from BallDontLie API. Used for basketball predictions.
            </p>
            <p>
              <strong className="text-foreground">Caching:</strong> All stats are cached in your database. Re-sync weekly to keep data fresh.
            </p>
            <p className="pt-2 text-xs">
              💡 <strong>Tip:</strong> Run sync once to initialize, then refresh weekly. The system uses cached data for fast predictions.
            </p>
          </div>
        </section>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-sm text-accent hover:underline"
          >
            ← Back to picks
          </a>
        </div>
      </div>
    </main>
  );
}
