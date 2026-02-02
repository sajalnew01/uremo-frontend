export default function ExploreServicesLoading() {
  return (
    <div className="u-container py-8">
      <div className="mb-8">
        <div className="h-6 w-40 rounded bg-white/10 animate-pulse mb-3" />
        <div className="h-10 w-96 rounded bg-white/10 animate-pulse mb-2" />
        <div className="h-5 w-80 rounded bg-white/5 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded bg-white/10 animate-pulse mb-3"
            />
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="h-40 rounded-lg bg-white/10 animate-pulse mb-4" />
              <div className="h-4 w-2/3 rounded bg-white/10 animate-pulse mb-2" />
              <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse mb-4" />
              <div className="h-10 rounded bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
