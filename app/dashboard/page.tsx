export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-slate-400 mb-8">
        Human-assisted onboarding, verification & manual operations.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold text-lg">Buy a Service</h3>
          <p className="text-sm text-slate-400 mt-2">
            Access manual onboarding & verification services.
          </p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg">My Orders</h3>
          <p className="text-sm text-slate-400 mt-2">
            Track payment, verification & completion status.
          </p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg">Apply to Work</h3>
          <p className="text-sm text-slate-400 mt-2">
            Join UREMO as a manual operations specialist.
          </p>
        </div>
      </div>
    </div>
  );
}
