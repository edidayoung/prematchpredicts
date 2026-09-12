import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isAuthenticated, logout } from "@/lib/auth";
import { LayoutDashboard, TrendingUp, LogOut, Menu, X, Target, Flame, Settings, Wallet, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { getBoard } from "@/lib/picks.functions";
import { updateHeartbeat, cleanupSession } from "@/lib/session-tracker";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  // Initialize sidebar state after mount to avoid hydration mismatch
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    getBoard().then((data) => {
      setStreak(data.stats.streak);
    });
  }, []);

  // Heartbeat: Update session every 30 seconds
  useEffect(() => {
    // Initial heartbeat
    updateHeartbeat();
    
    // Set interval for heartbeat
    const interval = setInterval(() => {
      updateHeartbeat();
    }, 30000); // 30 seconds
    
    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      cleanupSession(); // Remove session when user closes/leaves
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const tabs = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "Predictions", path: "/dashboard/predictions", icon: TrendingUp },
    { name: "Kelly Criterion", path: "/dashboard/kelly", icon: Wallet },
    { name: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
    { name: "Hits", path: "/dashboard/hits", icon: Target },
    { name: "Admin", path: "/dashboard/admin", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header with close button on mobile */}
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-border px-6">
            <div className="flex-1 flex justify-center">
              <img src="/Logo.png" alt="PrematchPredicts" className="h-14 w-auto" />
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute right-6"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);

              return (
                <button
                  key={tab.path}
                  onClick={() => navigate({ to: tab.path })}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#10B981] text-white"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{tab.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Streak Indicator */}
          {streak !== 0 && (
            <div className="mx-4 mb-3 shrink-0 rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`relative rounded-lg p-1.5 ${
                  streak > 0 ? "bg-success/20" : "bg-destructive/20"
                }`}>
                  <Flame className={`h-4 w-4 ${
                    streak > 0 ? "text-success" : "text-destructive"
                  }`} />
                  <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${
                    streak > 0 ? "text-success" : "text-destructive"
                  }`}>
                    {Math.abs(streak)}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Current Streak</p>
                  <p className={`text-sm font-bold ${
                    streak > 0 ? "text-success" : "text-destructive"
                  }`}>
                    {Math.abs(streak)} {streak > 0 ? "Win" : "Loss"}{Math.abs(streak) > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Section */}
          <div className="shrink-0 border-t border-border p-4">
            <div className="mb-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">Logged in as</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">Admin</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 border-border hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header with hamburger */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card p-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-secondary"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/Logo.png" alt="PrematchPredicts" className="h-6 w-auto" />
        </div>

        {/* Page content - Scrollable with smooth transitions */}
        <div className="flex-1 overflow-y-auto">
          <div className="animate-in fade-in duration-300">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
