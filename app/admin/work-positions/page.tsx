"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

type WorkPosition = {
  _id: string;
  title: string;
  category: string;
  description?: string;
  requirements?: string;
  active?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

type Draft = {
  _id?: string;
  title: string;
  category: string;
  description: string;
  requirements: string;
  active: boolean;
  sortOrder: number;
};

const emptyDraft = (): Draft => ({
  title: "",
  category: "",
  description: "",
  requirements: "",
  active: true,
  sortOrder: 0,
});

export default function AdminWorkPositionsPage() {
  const { toast } = useToast();

  const [positions, setPositions] = useState<WorkPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<WorkPosition[]>(
        "/api/admin/work-positions",
        "GET",
        null,
        true,
      );
      setPositions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load positions");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of positions) {
      const c = String(p?.category || "").trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [positions]);

  const visiblePositions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return positions
      .filter((p) => {
        if (statusFilter === "active" && p.active === false) return false;
        if (statusFilter === "inactive" && p.active !== false) return false;
        if (categoryFilter !== "all") {
          if (String(p.category || "") !== categoryFilter) return false;
        }
        if (!q) return true;

        const hay = [p.title, p.category, p.description, p.requirements]
          .map((v) => String(v || "").toLowerCase())
          .join("\n");
        return hay.includes(q);
      })
      .sort((a, b) => {
        const aActive = a.active !== false;
        const bActive = b.active !== false;
        if (aActive !== bActive) return aActive ? -1 : 1;
        const aSort = Number.isFinite(Number(a.sortOrder))
          ? Number(a.sortOrder)
          : 0;
        const bSort = Number.isFinite(Number(b.sortOrder))
          ? Number(b.sortOrder)
          : 0;
        if (aSort !== bSort) return aSort - bSort;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });
  }, [positions, search, categoryFilter, statusFilter]);

  const openCreate = () => {
    setDraft(emptyDraft());
    setModalOpen(true);
  };

  const openEdit = (p: WorkPosition) => {
    setDraft({
      _id: p._id,
      title: String(p.title || ""),
      category: String(p.category || ""),
      description: String(p.description || ""),
      requirements: String(p.requirements || ""),
      active: p.active !== false,
      sortOrder: Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : 0,
    });
    setModalOpen(true);
  };

  const save = async () => {
    const title = draft.title.trim();
    const category = draft.category.trim();
    if (!title) return toast("Title is required", "error");
    if (!category) return toast("Category is required", "error");

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        category,
        description: draft.description.trim(),
        requirements: draft.requirements.trim(),
        active: Boolean(draft.active),
        sortOrder: Number(draft.sortOrder || 0),
      };

      if (draft._id) {
        await apiRequest(
          `/api/admin/work-positions/${draft._id}`,
          "PUT",
          payload,
          true,
        );
        toast("Position updated", "success");
      } else {
        await apiRequest("/api/admin/work-positions", "POST", payload, true);
        toast("Position created", "success");
      }

      setModalOpen(false);
      await load();
    } catch (e: any) {
      const msg = e?.message || "Save failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: WorkPosition) => {
    const ok = window.confirm(`Delete position “${p.title}”?`);
    if (!ok) return;

    try {
      await apiRequest(
        `/api/admin/work-positions/${p._id}`,
        "DELETE",
        null,
        true,
      );
      toast("Position deleted", "success");
      await load();
    } catch (e: any) {
      toast(e?.message || "Delete failed", "error");
    }
  };

  const toggleActive = async (p: WorkPosition) => {
    const nextActive = p.active === false;

    // Optimistic UI
    setPositions((cur) =>
      cur.map((x) => (x._id === p._id ? { ...x, active: nextActive } : x)),
    );

    try {
      await apiRequest(
        `/api/admin/work-positions/${p._id}`,
        "PUT",
        { active: nextActive },
        true,
      );
      toast(
        nextActive ? "Position activated" : "Position deactivated",
        "success",
      );
    } catch (e: any) {
      // Revert on error
      setPositions((cur) =>
        cur.map((x) => (x._id === p._id ? { ...x, active: p.active } : x)),
      );
      toast(e?.message || "Update failed", "error");
    }
  };

  return (
    <div className="u-container max-w-6xl space-y-6">
      {/* PATCH_79: Job Roles Header - Clear purpose and guidance */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💼</span>
            <div>
              <h1 className="text-3xl font-bold">Job Roles</h1>
              <p className="text-sm text-[#9CA3AF] mt-1">
                Define WHAT type of work exists and WHO can do it.
              </p>
            </div>
          </div>
          {/* PATCH_79: Flow guidance */}
          <p className="text-xs text-cyan-400/70 mt-2">
            Job Roles → Screenings → Workers. Each role defines eligibility requirements.
          </p>
        </div>

        <button type="button" onClick={openCreate} className="btn-primary">
          + New Job Role
        </button>
      </div>

      {/* PATCH_79: What is this page for? */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-slate-800/50 to-cyan-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1">About Job Roles</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Job Roles define <span className="text-cyan-400">types of work</span> available on your platform</li>
              <li>• Each role can have a <span className="text-amber-400">screening test</span> workers must pass before working</li>
              <li>• Workers apply for roles → Pass screening → Get assigned projects</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs text-[#9CA3AF]">Search</label>
            <input
              className="u-input mt-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, category, description…"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9CA3AF]">Category</label>
            <select
              className="u-input mt-2"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#9CA3AF]">Status</label>
            <select
              className="u-input mt-2"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-[#9CA3AF]">
          Showing {visiblePositions.length} of {positions.length}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : positions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-2xl border border-blue-500/20 bg-blue-500/10 flex items-center justify-center text-3xl text-blue-300 mb-4">
            💼
          </div>
          <h3 className="text-lg font-semibold text-white">No Job Roles Yet</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Job Roles define the types of work available on your platform.
            Workers will apply for these roles.
          </p>
          {/* PATCH_79: Clear next step */}
          <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 inline-block">
            <p className="text-sm text-cyan-300">
              👉 <span className="font-medium">Next Step:</span> Create your first job role to start accepting worker applications
            </p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={openCreate} className="btn-primary">
              + Create Job Role
            </button>
          </div>
        </div>
      ) : visiblePositions.length === 0 ? (
        <div className="card">
          <p className="text-sm text-[#9CA3AF]">
            No positions match your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visiblePositions.map((p) => (
            <div key={p._id} className="card">
              {/* PATCH_79: Job Role Header with Clear Status */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{p.title}</p>
                    {p.active === false ? (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-500/20 text-slate-400">Inactive</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    Category: {p.category}
                  </p>
                </div>
                <Link
                  href={`/admin/work-positions/${p._id}`}
                  className="btn-primary text-sm"
                >
                  Manage Role →
                </Link>
              </div>

              {/* PATCH_79: Key Info Panel - What admin needs to know */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {/* Screening Required? */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Screening Required?</div>
                  {(p as any).hasScreening ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400 text-lg">✓</span>
                      <span className="text-sm font-medium text-emerald-400">Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 text-lg">⚠️</span>
                      <Link
                        href={`/admin/workspace/screenings?category=${p.category}`}
                        className="text-sm font-medium text-amber-400 hover:underline"
                      >
                        Setup →
                      </Link>
                    </div>
                  )}
                </div>
                {/* Applicants */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Applicants</div>
                  <div className="text-lg font-bold text-white">
                    {(p as any).applicantCount || 0}
                  </div>
                </div>
                {/* Active Workers */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Active Workers</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {(p as any).activeWorkerCount || 0}
                  </div>
                </div>
              </div>

              {/* PATCH_79: Screening Banner - Only show if screening is required */}
              {(p as any).hasScreening && (
                <div className="mt-3 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-purple-300 flex items-center gap-2">
                    <span>🔒</span>
                    Workers must pass screening before they can work on projects
                  </p>
                </div>
              )}

              {/* View Workers Pipeline */}
              <div className="mt-4">
                <Link
                  href={`/admin/workforce?position=${p._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-500/20 transition-colors"
                >
                  <span>👥</span>
                  View Workers in Pipeline →
                </Link>
              </div>

              {p.description && (
                <p className="mt-3 text-sm text-slate-200">{p.description}</p>
              )}

              {/* PATCH_79: Secondary Actions - De-emphasized */}
              <details className="mt-4">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300">
                  Advanced: Edit or Deactivate
                </summary>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => toggleActive(p)}
                  >
                    {p.active === false ? "Activate" : "Deactivate"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => openEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => remove(p)}
                  >
                    Delete
                  </button>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#020617] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-semibold">
                  {draft._id ? "Edit position" : "New position"}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Fields are sanitized server-side.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-[#9CA3AF]">Title</label>
                  <input
                    className="u-input mt-2"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, title: e.target.value }))
                    }
                    placeholder="KYC / Onboarding Assistant"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9CA3AF]">
                    Category
                  </label>
                  <input
                    className="u-input mt-2"
                    value={draft.category}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, category: e.target.value }))
                    }
                    list="work-position-categories"
                    placeholder="operations_support"
                  />
                  <datalist id="work-position-categories">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#9CA3AF]">
                  Description
                </label>
                <textarea
                  className="u-input mt-2 min-h-[90px]"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="Short overview of the role"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9CA3AF]">
                  Requirements
                </label>
                <textarea
                  className="u-input mt-2 min-h-[120px]"
                  value={draft.requirements}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, requirements: e.target.value }))
                  }
                  placeholder="One per line recommended"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, active: e.target.checked }))
                    }
                  />
                  Active
                </label>

                <div>
                  <label className="block text-xs text-[#9CA3AF]">
                    Sort order
                  </label>
                  <input
                    className="u-input mt-2"
                    type="number"
                    value={draft.sortOrder}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        sortOrder: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-primary disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
