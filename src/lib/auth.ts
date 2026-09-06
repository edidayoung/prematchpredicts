// Simple authentication utilities
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("prematch_auth") === "authenticated";
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("prematch_auth");
  }
}

export function requireAuth(): void {
  if (!isAuthenticated()) {
    throw new Error("Authentication required");
  }
}
