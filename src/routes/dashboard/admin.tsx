import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getBoard, settlePick, type Pick } from "@/lib/picks.functions";
import { getKellyTrackers, deleteKellyTracker, type KellyTracker } from "@/lib/kelly.functions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { verifyAdminPin, isAdminAuthenticated } from "@/lib/admin-auth";
import { getActiveSessions } from "@/lib/session-tracker";
import { Users, Settings } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/admin")({
  loader: async () => {
    const board = await getBoard();
    const kellyTrackers = await getKellyTrackers();
    return { board, kellyTrackers };
  },
  component: AdminPage,
});

function AdminPage() {
  const { board, kellyTrackers } = Route.useLoaderData() as any;
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Admin PIN protection
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  
  // Active users
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);
  
  // Settlement state
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null);
  const [settlementStatus, setSettlementStatus] = useState("");
  const [finalTotal, setFinalTotal] = useState("");
  const [settling, setSettling] = useState(false);

  // Delete confirmation state
  const [trackerToDelete, setTrackerToDelete] = useState<KellyTracker | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const pendingPicks = board.history.filter((p: Pick) => p.status === "pending");

  // Check if admin is already authenticated
  useEffect(() => {
    setIsAuthorized(isAdminAuthenticated());
  }, []);

  // Fetch active users every 10 seconds
  useEffect(() => {
    if (!isAuthorized) return;
    
    const fetchUsers = async () => {
      const sessions = await getActiveSessions();
      setActiveUsers(sessions);
      setUserCount(sessions.length);
    };
    
    fetchUsers(); // Initial fetch
    const interval = setInterval(fetchUsers, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [isAuthorized]);

  const handlePinSubmit = () => {
    if (verifyAdminPin(pin)) {
      setIsAuthorized(true);
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Try again.");
      setPin("");
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
        }
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

  const handleDeleteTracker = async () => {
    if (!trackerToDelete) return;
    
    // Check if user typed the tracker name correctly
    if (deleteConfirmation !== trackerToDelete.name) {
      setError("Tracker name doesn't match. Deletion cancelled.");
      setTrackerToDelete(null);
      setDeleteConfirmation("");
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteKellyTracker({ data: { trackerId: trackerToDelete.id } });
      setMessage(`Tracker "${trackerToDelete.name}" deleted successfully`);
      setTrackerToDelete(null);
      setDeleteConfirmation("");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError("Failed to delete tracker");
    } finally {
      setDeleting(false);
    }
  };

  // Show PIN entry if not authorized
  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10">
                <Settings className="h-8 w-8 text-[#10B981]" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter 6-digit PIN to access admin panel
              </p>
            </div>

            <div className="mt-6">
              <Label className="text-sm font-medium text-foreground">PIN Code</Label>
              <div className="mt-3 flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={pin}
                  onChange={(value) => setPin(value)}
                  onComplete={handlePinSubmit}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {pinError && (
                <p className="mt-3 text-center text-sm text-destructive">{pinError}</p>
              )}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Session expires after 30 minutes of inactivity
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-9">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage predictions, settle games, and view active users
        </p>
      </header>

      {/* Active Users Box */}
      <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-6 w-6 text-[#10B981]" />
          <h2 className="text-xl font-bold text-foreground">Active Users</h2>
        </div>
        
        <div className="rounded-2xl border border-border bg-secondary/40 p-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-[#10B981]">{userCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {userCount === 1 ? "User" : "Users"} Online
            </p>
          </div>
          
          {activeUsers.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Logins:</p>
              {activeUsers.slice(0, 5).map((session, idx) => (
                <div key={session.session_id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-3">
                  <span className="text-sm text-foreground">Session {idx + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.last_seen).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
                {pendingPicks.map((pick: Pick) => (
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

      {/* Instructions */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">About Manual Settlement</h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Manual Settlement:</strong> After games finish, check the final total score and mark picks as Won, Lost, or Push.
          </p>
          <p>
            <strong className="text-foreground">API Conservation:</strong> Manual settlement saves API credits. The system only uses 1 API call per day to generate picks.
          </p>
          <p className="pt-2 text-xs">
            💡 <strong>Tip:</strong> Monitor your API usage at{" "}
            <a 
              href="https://the-odds-api.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-[#10B981]"
            >
              the-odds-api.com
            </a>
          </p>
        </div>
      </section>

      {/* Kelly Tracker Management */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Kelly Criterion Trackers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage all Kelly Criterion bankroll trackers
        </p>

        {kellyTrackers.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No Kelly trackers created yet
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {kellyTrackers.map((tracker: KellyTracker) => {
              const profitLoss = Number(tracker.current_bankroll) - Number(tracker.starting_bankroll);
              const isProfit = profitLoss >= 0;
              
              return (
                <div
                  key={tracker.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{tracker.name}</p>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Current: ₦{Number(tracker.current_bankroll).toLocaleString()}</span>
                      <span className={isProfit ? "text-success" : "text-destructive"}>
                        {isProfit ? "+" : ""}₦{Math.abs(profitLoss).toLocaleString()}
                      </span>
                      <span>{tracker.total_bets} bets</span>
                      <span>{tracker.wins}W-{tracker.losses}L</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setTrackerToDelete(tracker)}
                    className="ml-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
      
      {/* Delete Tracker Confirmation Dialog */}
      <AlertDialog open={!!trackerToDelete} onOpenChange={(open) => {
        if (!open) {
          setTrackerToDelete(null);
          setDeleteConfirmation("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Delete Kelly Tracker?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to permanently delete the tracker <strong>"{trackerToDelete?.name}"</strong>.
              </p>
              <p className="text-destructive font-semibold">
                This action cannot be undone. All bet history will be lost.
              </p>
              <div className="mt-4">
                <Label htmlFor="delete-confirmation" className="text-foreground">
                  Type the tracker name to confirm:
                </Label>
                <Input
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={trackerToDelete?.name || ""}
                  className="mt-2"
                  disabled={deleting}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteTracker();
              }}
              disabled={deleting || deleteConfirmation !== trackerToDelete?.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
