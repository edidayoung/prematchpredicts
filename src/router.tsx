import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { PageLoader } from "@/components/ui/page-loader";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Ensure data is properly loaded before showing content
        staleTime: 1000,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Use inline loader for route navigation (keeps sidebar visible)
    defaultPendingComponent: () => <PageLoader fullScreen={false} />,
    defaultPendingMs: 100, // Show loader quickly for responsive feel
    defaultPendingMinMs: 600, // Keep loader visible for smooth transitions
  });

  return router;
};
