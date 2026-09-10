// Admin passcode authentication with 30min session
const ADMIN_PIN = "225588";
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export function verifyAdminPin(pin: string): boolean {
  if (pin === ADMIN_PIN) {
    const now = Date.now();
    sessionStorage.setItem("admin_auth", now.toString());
    return true;
  }
  return false;
}

export function isAdminAuthenticated(): boolean {
  const authTime = sessionStorage.getItem("admin_auth");
  
  if (!authTime) return false;
  
  const elapsed = Date.now() - parseInt(authTime, 10);
  
  if (elapsed > SESSION_DURATION) {
    // Session expired
    sessionStorage.removeItem("admin_auth");
    return false;
  }
  
  return true;
}

export function logoutAdmin() {
  sessionStorage.removeItem("admin_auth");
}
