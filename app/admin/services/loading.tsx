export default function AdminServicesLoading() {
  return (
    <div className="u-container max-w-6xl">
      <div className="mb-8">
        <div className="h-8 w-48 rounded bg-white/10 animate-pulse mb-2" />
        <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card">
            <div className="h-40 rounded-lg bg-white/10 animate-pulse mb-4" />
            <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse mb-2" />
            <div className="h-4 w-full rounded bg-white/5 animate-pulse mb-3" />
            <div className="h-8 w-full rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
