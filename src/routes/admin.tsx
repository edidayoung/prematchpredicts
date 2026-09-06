import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { syncData, getSyncStatus } from "@/lib/sync-data.functions";

export const Route = createFileRoute("/admin")({
  loader: () => getSyncStatus(),
  component: AdminPage,
});

function AdminPage() {
  const status = Route.useLoaderData();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-9">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
            Data Management
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Sync NBA team statistics and game data from BallDontLie API. This powers the prediction engine.
          </p>
        </header>

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
