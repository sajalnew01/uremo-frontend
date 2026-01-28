export default function WorkspaceLoading() {
  return (
    <div className="u-container max-w-6xl">
      <div className="card">
        <div className="h-6 w-44 rounded bg-white/10 animate-pulse" />
        <div className="mt-3 h-4 w-2/3 rounded bg-white/10 animate-pulse" />
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card">
            <div className="h-36 rounded-xl bg-white/10 animate-pulse" />
            <div className="mt-4 h-5 w-3/4 rounded bg-white/10 animate-pulse" />
            <div className="mt-2 h-4 w-2/3 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
