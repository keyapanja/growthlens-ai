export function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="glass-panel h-72 rounded-3xl" />
      <div className="grid gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="glass-panel h-56 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="glass-panel h-80 rounded-3xl" />
        <div className="glass-panel h-80 rounded-3xl" />
      </div>
    </div>
  );
}
