export default function DealsLoading() {
  return (
    <div className="u-container max-w-6xl">
      <div className="mb-6">
        <div className="h-8 w-40 rounded bg-white/10 animate-pulse" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-white/10 animate-pulse" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card">
            <div className="h-36 rounded-xl bg-white/10 animate-pulse" />
            <div className="mt-4 h-5 w-3/4 rounded bg-white/10 animate-pulse" />
            <div className="mt-2 h-4 w-2/3 rounded bg-white/10 animate-pulse" />
            <div className="mt-4 h-4 w-1/2 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
