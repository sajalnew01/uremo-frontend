"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";
import FaqAccordion from "@/components/ui/FaqAccordion";

interface Application {
  _id: string;
  status: "pending" | "approved" | "rejected";
}

type WorkPosition = {
  _id: string;
  title: string;
  category: string;
  description?: string;
  requirements?: string;
  active?: boolean;
};

export default function ApplyToWorkPage() {
  const { toast } = useToast();
  const { data: settings } = useSiteSettings();

  const ui =
    settings?.applyWork?.ui || DEFAULT_PUBLIC_SITE_SETTINGS.applyWork.ui;

  const [requestedPositionId, setRequestedPositionId] = useState<string>("");

  const [positions, setPositions] = useState<WorkPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [positionId, setPositionId] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [showForm, setShowForm] = useState(false);

  const [message, setMessage] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<Application | null>(null);
  const [checking, setChecking] = useState(true);

  // PATCH_47: Service context when coming from a service page
  const [serviceId, setServiceId] = useState<string>("");
  const [serviceTitle, setServiceTitle] = useState<string>("");
  const [fromService, setFromService] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      setRequestedPositionId(params.get("positionId") || "");

      // PATCH_47: Capture service context
      const svcId = params.get("serviceId") || "";
      const svcTitle = params.get("serviceTitle") || "";
      setServiceId(svcId);
      setServiceTitle(svcTitle);
      setFromService(!!svcId);
    } catch {
      setRequestedPositionId("");
    }
  }, []);

  const applyFaq =
    settings?.applyWork?.faq && settings.applyWork.faq.length
      ? settings.applyWork.faq
      : DEFAULT_PUBLIC_SITE_SETTINGS.applyWork.faq;

  const positionsById = useMemo(() => {
    const map = new Map<string, WorkPosition>();
    for (const p of positions) {
      if (p?._id) map.set(p._id, p);
    }
    return map;
  }, [positions]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of positions) {
      const c = String(p?.category || "").trim();
      if (c) set.add(c);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [positions]);

  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      if (categoryFilter === "all") return true;
      return String(p.category || "") === categoryFilter;
    });
  }, [positions, categoryFilter]);

  const hasPositions = positions.length > 0;

  const checkExisting = async () => {
    try {
      const app = await apiRequest("/api/apply-work/me", "GET", null, true);
      if (app) {
        setExisting(app);
      }
    } catch (err) {
      // No existing application
    } finally {
      setChecking(false);
    }
  };

  const loadPositions = async () => {
    setPositionsLoading(true);
    try {
      const data = await apiRequest<WorkPosition[]>(
        "/api/work-positions",
        "GET",
      );
      const list = Array.isArray(data) ? data : [];
      const activeOnly = list.filter((p) => p && p.active !== false);
      setPositions(activeOnly);

      const preferredId = requestedPositionId.trim();
      if (preferredId && activeOnly.some((p) => p._id === preferredId)) {
        setPositionId(preferredId);
      }
    } catch {
      setPositions([]);
    } finally {
      setPositionsLoading(false);
    }
  };

  useEffect(() => {
    const preferredId = requestedPositionId.trim();
    if (!preferredId) return;
    if (positions.some((p) => p._id === preferredId)) {
      setPositionId(preferredId);
    }
  }, [requestedPositionId, positions]);

  const submit = async () => {
    const selected = positionId ? positionsById.get(positionId) : null;

    if (!selected) {
      toast(ui.selectPositionRequiredText, "error");
      return;
    }

    if (!resume) {
      toast(ui.resumeRequiredText, "error");
      return;
    }

    const formData = new FormData();
    if (selected?._id) formData.append("positionId", selected._id);
    formData.append("message", message);
    formData.append("resume", resume);

    try {
      setLoading(true);
      await apiRequest("/api/apply-work", "POST", formData, true, true);

      toast(ui.successToast, "success");
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast(err.message || ui.submissionFailedText, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkExisting();
    loadPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return <div className="p-6">{ui.loadingPositionsText}</div>;
  }

  if (existing) {
    const statusColor = {
      pending: "bg-yellow-600",
      approved: "bg-green-600",
      rejected: "bg-red-600",
    };

    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">{ui.title}</h1>

        <Card title={ui.existingTitle}>
          <div className="space-y-3">
            <p className="text-sm text-[#9CA3AF]">{ui.existingBody}</p>

            <div>
              <span
                className={`${
                  statusColor[existing.status as keyof typeof statusColor]
                } text-white text-sm px-3 py-1 rounded`}
              >
                Status: {existing.status.toUpperCase()}
              </span>
            </div>

            {existing.status === "pending" && (
              <p className="text-xs text-[#9CA3AF]">{ui.existingPendingText}</p>
            )}

            {existing.status === "approved" && (
              <p className="text-xs text-green-400">
                {ui.existingApprovedText}
              </p>
            )}

            {existing.status === "rejected" && (
              <p className="text-xs text-red-400">{ui.existingRejectedText}</p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{ui.title}</h1>
        <p className="text-[#9CA3AF]">{ui.subtitle}</p>
      </div>

      {/* PATCH_47: Service context banner when coming from a service page */}
      {fromService && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💼</span>
            <div>
              <p className="font-medium text-blue-300">Applying from Service</p>
              {serviceTitle && (
                <p className="text-sm text-slate-300 mt-1">
                  You're applying to work on: <strong>{serviceTitle}</strong>
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Complete the application below to start earning by working on
                this service.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Application Form */}
      <Card title={ui.formTitle}>
        {/* Position picker (preferred) */}
        {positionsLoading ? (
          <div className="mb-4">
            <label className="text-sm text-[#9CA3AF] block mb-1">
              {ui.positionsLabel}
            </label>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#9CA3AF]">
              {ui.loadingPositionsText}
            </div>
          </div>
        ) : hasPositions ? (
          <div className="mb-6 space-y-4">
            <div>
              <label className="text-sm text-[#9CA3AF] block mb-1">
                {ui.filterByCategoryLabel}
              </label>
              <select
                className="u-select w-full"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? ui.allCategoriesText : c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-[#9CA3AF] block mb-2">
                {ui.selectPositionLabel}
              </label>
              <div className="space-y-3">
                {filteredPositions.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#9CA3AF]">
                    {ui.noPositionsFoundText}
                  </div>
                ) : (
                  filteredPositions.map((p) => {
                    const selected = positionId === p._id;
                    const reqLines = String(p.requirements || "")
                      .split(/\r?\n/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 6);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          setPositionId(p._id);
                          setShowForm(false);
                        }}
                        className={`w-full text-left rounded-xl border p-4 transition ${
                          selected
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">
                              {p.title}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-1">
                              {p.category}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              selected
                                ? "border-emerald-400 bg-emerald-400/20"
                                : "border-white/20"
                            }`}
                          >
                            {selected ? (
                              <span className="text-emerald-200 text-xs">
                                ✓
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {p.description ? (
                          <p className="mt-2 text-sm text-slate-200">
                            {p.description}
                          </p>
                        ) : null}

                        {reqLines.length ? (
                          <ul className="mt-3 space-y-1 text-xs text-[#9CA3AF]">
                            {reqLines.map((line) => (
                              <li key={line}>• {line}</li>
                            ))}
                          </ul>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                if (!positionId) {
                  toast(ui.selectPositionRequiredText, "error");
                  return;
                }
                setShowForm(true);
              }}
            >
              {ui.submitText}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#9CA3AF]">
            {ui.noPositionsFoundText}
          </div>
        )}

        {hasPositions && showForm ? (
          <div className="mt-6">
            {/* Message */}
            <div className="mb-4">
              <label className="text-sm text-[#9CA3AF] block mb-1">
                {ui.messageLabel}
              </label>
              <textarea
                className="w-full p-2 bg-transparent border border-[#1F2937] rounded"
                rows={4}
                placeholder={ui.messagePlaceholder}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Resume */}
            <div className="mb-6">
              <label className="text-sm text-[#9CA3AF] block mb-1">
                {ui.resumeLabel}
              </label>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                  className="text-sm text-slate-200"
                />
                <p className="mt-2 text-xs text-[#9CA3AF]">
                  {ui.resumeHelperText}
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={submit}
              disabled={loading}
              className="btn-primary disabled:opacity-50 w-full"
            >
              {loading ? ui.submittingText : ui.submitText}
            </button>
          </div>
        ) : null}
      </Card>

      {/* Trust Note */}
      <Card>
        <p className="text-xs text-[#9CA3AF]">{ui.trustNoteText}</p>
      </Card>

      <FaqAccordion title={ui.faqTitle} items={applyFaq} />
    </div>
  );
}
