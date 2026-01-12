export default function BuyServiceLoading() {
  return (
    <div className="u-container">
      <div className="mb-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="h-8 w-48 rounded bg-white/10 animate-pulse mb-2" />
            <div className="h-5 w-72 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card">
            <div className="h-40 rounded-lg bg-white/10 animate-pulse mb-4" />
            <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse mb-2" />
            <div className="h-4 w-full rounded bg-white/5 animate-pulse mb-3" />
            <div className="h-4 w-2/3 rounded bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
