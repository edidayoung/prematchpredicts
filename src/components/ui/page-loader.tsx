/**
 * PageLoader Component
 * 
 * Displays animated logo during page navigation and data loading.
 * Uses the logo-splash.webm animation from public folder.
 */

interface PageLoaderProps {
  fullScreen?: boolean;
}

export function PageLoader({ fullScreen = true }: PageLoaderProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        {/* Animated Logo Video - Large but reasonable */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-48 w-48 object-contain sm:h-64 sm:w-64"
        >
          <source src="/logo-splash.webm" type="video/webm" />
        </video>
      </div>
    );
  }

  // Inline loader (for use within page content areas - shows below header)
  return (
    <div className="flex items-center justify-center py-32">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="h-32 w-32 object-contain sm:h-40 sm:w-40"
      >
        <source src="/logo-splash.webm" type="video/webm" />
      </video>
    </div>
  );
}
