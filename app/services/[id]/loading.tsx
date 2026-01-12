export default function ServiceDetailsLoading() {
  return (
    <div className="u-container max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <div className="h-4 w-24 rounded bg-white/10 animate-pulse mb-3" />
          <div className="h-10 w-96 rounded bg-white/10 animate-pulse mb-3" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-20 rounded-full bg-white/10 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <div className="h-5 w-32 rounded bg-white/10 animate-pulse mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-4 w-full rounded bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="h-6 w-20 rounded bg-white/10 animate-pulse mb-3" />
          <div className="h-12 w-full rounded bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
