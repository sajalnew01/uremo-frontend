export default function OrdersLoading() {
  return (
    <div className="u-container max-w-4xl">
      <div className="mb-6">
        <div className="h-8 w-40 rounded bg-white/10 animate-pulse mb-2" />
        <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div className="flex-1">
                <div className="h-5 w-48 rounded bg-white/10 animate-pulse mb-2" />
                <div className="h-4 w-32 rounded bg-white/5 animate-pulse mb-2" />
                <div className="h-4 w-40 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="h-6 w-24 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
