"use client";

import Card from "@/components/Card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export default function ProfilePage() {
  const { user, isAuthenticated, ready } = useAuth();
  const { toast } = useToast();

  const email = String(user?.email || "").trim();
  const role = String(user?.role || "user").trim();
  const createdAt = (user as any)?.createdAt
    ? new Date((user as any).createdAt)
    : null;

  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      toast("Email copied", "success");
    } catch {
      toast("Failed to copy", "error");
    }
  };

  if (!ready) {
    return <div className="u-container text-sm text-[#9CA3AF]">Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="u-container">
        <Card title="Profile">
          <p className="text-sm text-[#9CA3AF]">You’re not logged in.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="u-container space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      <Card>
        <div className="space-y-4">
          <div>
            <p className="text-xs tracking-widest text-slate-300">EMAIL</p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <p className="text-slate-100 font-medium break-all">
                {email || "—"}
              </p>
              {email && (
                <button
                  type="button"
                  onClick={copyEmail}
                  className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10"
                >
                  Copy email
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs tracking-widest text-slate-300">ROLE</p>
            <p className="mt-1 text-slate-100 font-medium capitalize">{role}</p>
          </div>

          <div>
            <p className="text-xs tracking-widest text-slate-300">CREATED</p>
            <p className="mt-1 text-slate-100 font-medium">
              {createdAt ? createdAt.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Created date appears if your session includes it.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
