export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Spinning ring */}
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-[#10B981] border-t-transparent`}
        />
        {/* Favicon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/favicon.png"
            alt="Loading"
            className={size === "sm" ? "h-4 w-4" : size === "lg" ? "h-12 w-12" : "h-8 w-8"}
          />
        </div>
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
