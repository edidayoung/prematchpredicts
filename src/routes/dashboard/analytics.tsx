import { createFileRoute } from "@tanstack/react-router";
import { getAnalytics } from "@/lib/analytics.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
  loader: async () => await getAnalytics(),
  pendingComponent: () => (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Show header immediately */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Deep dive into your model performance patterns
        </p>
      </div>
      {/* Loader for content */}
      <PageLoader fullScreen={false} />
    </div>
  ),
});

function AnalyticsPage() {
  const data = Route.useLoaderData();

  if (data.picksWithData === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Deep dive into your model performance patterns
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No analytics data available yet. Analytics will populate once you have settled picks with line edge and bookmaker spread data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Deep dive into your model performance patterns
        </p>
      </div>

      {/* Pattern Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Winning Patterns
            </CardTitle>
            <CardDescription>
              Conditions that lead to higher win rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.winningPatterns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No winning patterns detected yet. Need more data.
              </p>
            ) : (
              data.winningPatterns.map((pattern, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold">{pattern.name}</h4>
                    <Badge>{pattern.sampleSize}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">
                      {pattern.wins}-{pattern.picks - pattern.wins} ({pattern.winRate.toFixed(1)}%)
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {pattern.picks} picks
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Losing Patterns
            </CardTitle>
            <CardDescription>
              Conditions that lead to lower win rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.losingPatterns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No losing patterns detected. Model is consistent!
              </p>
            ) : (
              data.losingPatterns.map((pattern, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold">{pattern.name}</h4>
                    <Badge variant="destructive">{pattern.sampleSize}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">
                      {pattern.wins}-{pattern.picks - pattern.wins} ({pattern.winRate.toFixed(1)}%)
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {pattern.picks} picks
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Edge Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Win Rate by Line Edge
          </CardTitle>
          <CardDescription>
            How line advantages/disadvantages affect win rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
              <div>Range</div>
              <div className="text-center">Picks</div>
              <div className="text-center">W-L</div>
              <div className="text-center">Win Rate</div>
              <div className="text-center">Avg Edge</div>
            </div>
            {data.lineEdgeStats.map((stat) => (
              <div key={stat.range} className="grid grid-cols-5 gap-2 items-center">
                <div className="text-sm font-medium">{stat.rangeLabel}</div>
                <div className="text-center text-sm">{stat.picks}</div>
                <div className="text-center text-sm">
                  {stat.wins}-{stat.losses}
                </div>
                <div className="text-center">
                  <Badge variant={stat.winRate >= 70 ? "default" : stat.winRate >= 50 ? "secondary" : "destructive"}>
                    {stat.picks > 0 ? `${stat.winRate.toFixed(1)}%` : "-"}
                  </Badge>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {stat.picks > 0 ? stat.avgEdge.toFixed(2) : "-"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookmaker Spread Analysis - All Sports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Win Rate by Bookmaker Spread (All Sports)
          </CardTitle>
          <CardDescription>
            How bookmaker agreement affects win rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
              <div>Range</div>
              <div className="text-center">Picks</div>
              <div className="text-center">W-L</div>
              <div className="text-center">Win Rate</div>
              <div className="text-center">Avg Spread</div>
            </div>
            {data.spreadStats.map((stat) => (
              <div key={stat.range} className="grid grid-cols-5 gap-2 items-center">
                <div className="text-sm font-medium">{stat.rangeLabel}</div>
                <div className="text-center text-sm">{stat.picks}</div>
                <div className="text-center text-sm">
                  {stat.wins}-{stat.losses}
                </div>
                <div className="text-center">
                  <Badge variant={stat.winRate >= 70 ? "default" : stat.winRate >= 50 ? "secondary" : "destructive"}>
                    {stat.picks > 0 ? `${stat.winRate.toFixed(1)}%` : "-"}
                  </Badge>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {stat.picks > 0 ? stat.avgSpread.toFixed(2) : "-"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sport-Specific Spread Analysis */}
      {data.sportSpreadStats.map((sportStat) => (
        <Card key={sportStat.sport}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {sportStat.sport} - Bookmaker Spread
            </CardTitle>
            <CardDescription>
              Sport-specific spread analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>Range</div>
                <div className="text-center">Picks</div>
                <div className="text-center">W-L</div>
                <div className="text-center">Win Rate</div>
                <div className="text-center">Avg Spread</div>
              </div>
              {sportStat.stats.map((stat) => (
                <div key={stat.range} className="grid grid-cols-5 gap-2 items-center">
                  <div className="text-sm font-medium">{stat.rangeLabel}</div>
                  <div className="text-center text-sm">{stat.picks}</div>
                  <div className="text-center text-sm">
                    {stat.wins}-{stat.losses}
                  </div>
                  <div className="text-center">
                    <Badge variant={stat.winRate >= 70 ? "default" : stat.winRate >= 50 ? "secondary" : "destructive"}>
                      {stat.picks > 0 ? `${stat.winRate.toFixed(1)}%` : "-"}
                    </Badge>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {stat.picks > 0 ? stat.avgSpread.toFixed(2) : "-"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
