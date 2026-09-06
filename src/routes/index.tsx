import { createFileRoute } from "@tanstack/react-router";

import { getBoard, type Pick } from "@/lib/picks.functions";

export const Route = createFileRoute("/")({
  loader: () => getBoard(),
  head: () => ({
    meta: [
      { title: "PrematchPredict | Daily Sports Betting Pick" },
      {
        name: "description",
        content:
          "One sports betting pick every day, priced around two odds, with confidence score and full win-rate tracking.",
      },
      { property: "og:title", content: "PrematchPredict | Daily Sports Betting Pick" },
      {
        property: "og:description",
        content:
          "One sports betting pick every day, priced around two odds, with confidence score and full win-rate tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Board,
});

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

function StatusTag({ status }: { status: string }) {
  const tone =
    status === "won"
      ? "bg-success/15 text-success border-success/30"
      : status === "lost"
        ? "bg-destructive/15 text-destructive border-destructive/30"
        : status === "push"
          ? "bg-muted text-muted-foreground border-border"
          : "bg-accent/15 text-accent border-accent/30";
  const label = status === "pending" ? "Awaiting result" : status.toUpperCase();
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Confidence
        </span>
        <span className="font-mono text-2xl font-bold text-accent">{value}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
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
    <article className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground">
          Pick of the day
        </span>
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {pick.sport_title}
        </span>
        <StatusTag status={pick.status} />
      </div>

      <h2 className="mt-5 text-2xl font-bold leading-tight text-foreground sm:text-4xl">
        {pick.away_team} <span className="text-muted-foreground">at</span> {pick.home_team}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Tip-off {tipOff(pick.commence_time)}</p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Selection</p>
          <p className="mt-1 font-mono text-2xl font-bold text-foreground">
            {pick.selection} {Number(pick.line)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Odds</p>
          <p className="mt-1 font-mono text-2xl font-bold text-success">{Number(pick.odds).toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bookmaker</p>
          <p className="mt-1 truncate text-lg font-semibold text-foreground">{pick.bookmaker}</p>
        </div>
      </div>

      <div className="mt-7">
        <ConfidenceMeter value={pick.confidence} />
      </div>

      <p className="mt-6 border-l-2 border-accent/50 pl-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
        {pick.reasoning}
      </p>

      {/* Model Status Indicator */}
      {pick.reasoning.includes('STATISTICAL MODEL') ? (
        <div className="mt-4 rounded-xl border border-success/30 bg-success/10 px-4 py-2 text-xs">
          <span className="font-semibold text-success">✅ Using Real Team Stats</span>
          <span className="ml-2 text-success/80">- Prediction based on historical performance data</span>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs">
          <span className="font-semibold text-yellow-600">⚠️ Stats Not Available</span>
          <span className="ml-2 text-yellow-600/80">- Using bookmaker odds only. Run data sync for statistical predictions.</span>
        </div>
      )}
    </article>
  );
}

function Board() {
  const { today, history, stats, message } = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-9">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Two-odd daily</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
            Basketball over/under, one pick a day
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every day the bot scans basketball totals first, and when the courts are quiet it moves on to
            whatever else is playing, so there is a pick on the board every single day. Prices stay around
            two odds and every result is settled automatically below.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="/admin"
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10"
            >
              ⚙️ Admin
            </a>
          </div>
        </header>

        {message && (
          <p className="mb-6 rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            {message}
          </p>
        )}

        {today ? (
          <TodayCard pick={today} />
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No qualifying game yet today. Check back closer to tip-off time.
          </div>
        )}

        <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Win rate", value: `${stats.winRate.toFixed(1)}%` },
            { label: "Record", value: `${stats.wins}-${stats.losses}${stats.pushes ? `-${stats.pushes}` : ""}` },
            { label: "Bankroll", value: money(stats.bankroll) },
            { label: "Profit", value: money(stats.profit) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-mono text-xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </section>

        <p className="mt-3 text-xs text-muted-foreground">
          Simulated $10 flat stakes from a $100 starting bankroll. ROI {stats.roi.toFixed(1)}% over{" "}
          {stats.settled} settled picks
          {stats.streak !== 0 &&
            ` · current run: ${Math.abs(stats.streak)} ${stats.streak > 0 ? "win" : "loss"}${
              Math.abs(stats.streak) > 1 ? "es" : ""
            }`}
          .
        </p>

        <section className="mt-12">
          <h2 className="text-lg font-bold text-foreground">Past picks</h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              The record starts building from the first settled pick.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {history.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {p.away_team} at {p.home_team}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.pick_date} · {p.selection} {Number(p.line)} @ {Number(p.odds).toFixed(2)} ·{" "}
                      {p.confidence}% confidence
                      {p.final_total != null && ` · final total ${Number(p.final_total)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.profit != null && (
                      <span
                        className={`font-mono text-sm font-semibold ${
                          Number(p.profit) > 0
                            ? "text-success"
                            : Number(p.profit) < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }`}
                      >
                        {money(Number(p.profit))}
                      </span>
                    )}
                    <StatusTag status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-14 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
          For entertainment and tracking only. No betting model beats bookmakers reliably — stake only what
          you can afford to lose.
        </footer>
      </div>
    </main>
  );
}
