export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
