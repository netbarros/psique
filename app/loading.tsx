export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-4 text-center">
      <div className="mb-8 font-display text-2xl font-medium tracking-[0.16em] text-text-secondary/70">
        PSIQUE
      </div>
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-brand" />
      <p className="mt-4 text-xs text-text-muted">Preparando sua experiência...</p>
    </div>
  );
}
