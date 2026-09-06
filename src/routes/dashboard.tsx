import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { isAuthenticated, logout } from "@/lib/auth";
import { LayoutDashboard, TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const tabs = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "Predictions", path: "/dashboard/predictions", icon: TrendingUp },
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center border-b border-border px-6">
            <img src="/Logo.png" alt="PrematchPredicts" className="h-10 w-auto" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);
              
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate({ to: tab.path })}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#10B981] text-white"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-border p-4">
            <div className="mb-3 rounded-xl bg-secondary/40 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Admin</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-2 border-border hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
