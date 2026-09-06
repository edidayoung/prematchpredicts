import { createFileRoute, Navigate } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  // Redirect to dashboard if authenticated, otherwise to login
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" />;
  }
  return <Navigate to="/login" />;
}
