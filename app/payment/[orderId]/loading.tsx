export default function PaymentLoading() {
  return (
    <div className="u-container max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="h-8 w-40 rounded bg-white/10 animate-pulse" />
        <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
              <div>
                <div className="h-4 w-24 rounded bg-white/10 animate-pulse mb-1" />
                <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="card space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-white/10 animate-pulse" />
          ))}
        </div>
        <div className="card space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 rounded bg-white/10 animate-pulse" />
          ))}
        </div>
      </div>

      <div className="h-10 rounded bg-white/10 animate-pulse" />
    </div>
  );
}
