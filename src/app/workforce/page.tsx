"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";

type TrainingMaterial = {
  title?: string;
  type?: "link" | "pdf" | "video";
  url?: string;
  description?: string;
};

type RequiredScreening = {
  _id: string;
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
  trainingMaterials?: TrainingMaterial[];
};

type Application = {
  _id: string;
  positionTitle: string;
  category: string;
  workerStatus: string;
  applicationStatus: string;
  attemptCount: number;
  maxAttempts: number;
  totalEarnings: number;
  pendingEarnings: number;
  payRate: number;
  trainingMaterials?: TrainingMaterial[];
  screening?: RequiredScreening | null;
  requiredScreenings?: RequiredScreening[];
  assignedProjects?: Array<{
    _id: string;
    title: string;
    description?: string;
    payRate?: number;
    payType?: string;
    deadline?: string;
    status: string;
  }>;
  completedProjects?: Array<{
    _id: string;
    title: string;
    payRate?: number;
    earningsCredited?: number;
    completedAt?: string;
  }>;
  screeningsCompleted?: Array<{
    screeningId?: string;
    completedAt?: string;
    score?: number;
    passed?: boolean | null;
    submissionStatus?: string;
  }>;
};

type WorkspaceProfileResponse =
  | {
      hasProfile: false;
      applications: [];
      message?: string;
    }
  | {
      hasProfile: true;
      applications: Application[];
      stats: {
        totalEarnings: number;
        workEarnings: number;
        affiliateEarnings: number;
        pendingEarnings: number;
        projectsCompleted: number;
        jobsApplied: number;
      };
    };

type AvailableScreeningsResponse = {
  screenings: Array<{
    _id: string;
    title: string;
    description?: string;
    timeLimit?: number;
    passingScore?: number;
    trainingMaterials?: TrainingMaterial[];
    completed?: boolean;
    completedAt?: string;
  }>;
};

type MyProjectsResponse = {
  projects: Array<{
    _id: string;
    title: string;
    status: string;
    projectType?: string;
    payRate?: number;
    payType?: string;
    createdAt?: string;
  }>;
};

export default function WorkforcePage() {
  const isAuthed = useRequireAuth();
  const qc = useQueryClient();
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["workspace", "profile"],
    queryFn: async () =>
      apiRequest<WorkspaceProfileResponse>(
        EP.WORKSPACE_PROFILE,
        "GET",
        undefined,
        true,
      ),
    enabled: Boolean(isAuthed),
  });

  const screeningsQuery = useQuery({
    queryKey: ["workspace", "screenings"],
    queryFn: async () =>
      apiRequest<AvailableScreeningsResponse>(
        EP.WORKSPACE_SCREENINGS,
        "GET",
        undefined,
        true,
      ),
    enabled: Boolean(isAuthed),
  });

  const projectsQuery = useQuery({
    queryKey: ["workspace", "projects"],
    queryFn: async () =>
      apiRequest<MyProjectsResponse>(
        EP.WORKSPACE_PROJECTS,
        "GET",
        undefined,
        true,
      ),
    enabled: Boolean(isAuthed),
  });

  const markTrainingMutation = useMutation({
    mutationFn: async (appId: string) =>
      apiRequest<{ ok: boolean; message?: string; workerStatus?: string }>(
        EP.WORKSPACE_APP_TRAINING(appId),
        "PUT",
        {},
        true,
      ),
    onSuccess: async (data) => {
      setActionMsg(data.message || "Training marked as viewed");
      await qc.invalidateQueries({ queryKey: ["workspace", "profile"] });
    },
    onError: (e) => {
      setActionMsg(
        e instanceof Error ? e.message : "Failed to update training status",
      );
    },
  });

  const profile = profileQuery.data;
  const apps: Application[] = useMemo(() => {
    if (!profile || profile.hasProfile === false) return [];
    return profile.applications || [];
  }, [profile]);

  if (!isAuthed) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Workforce</div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              Profile, lifecycle status, screenings, and projects.
            </div>
          </div>
          <Link
            href="/workforce/earnings"
            className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
          >
            View Earnings
          </Link>
        </div>

        {actionMsg ? (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm">
            {actionMsg}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        {profileQuery.isLoading ? (
          <div className="text-sm text-[var(--muted)]">Loading profile...</div>
        ) : profileQuery.isError ? (
          <div className="text-sm text-[var(--muted)]">
            Failed to load workforce profile.
          </div>
        ) : !profile ? (
          <div className="text-sm text-[var(--muted)]">No data.</div>
        ) : profile.hasProfile === false ? (
          <div className="space-y-3">
            <div className="text-sm text-[var(--muted)]">
              {profile.message || "No workspace profile yet."}
            </div>
            <Link
              href="/marketplace"
              className="inline-flex w-fit rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
            >
              Go to Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Total Earnings
                </div>
                <div className="mt-2 text-sm font-semibold">
                  ${profile.stats.totalEarnings.toFixed(2)}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Pending
                </div>
                <div className="mt-2 text-sm font-semibold">
                  ${profile.stats.pendingEarnings.toFixed(2)}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Projects Completed
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {profile.stats.projectsCompleted}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Jobs Applied
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {profile.stats.jobsApplied}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Applications
              </div>
              <div className="mt-3 space-y-3">
                {apps.map((app) => (
                  <div
                    key={app._id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">
                          {app.positionTitle || "Application"}
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          Category:{" "}
                          <span className="text-white">
                            {app.category || "—"}
                          </span>{" "}
                          · Worker status:{" "}
                          <span className="text-white">{app.workerStatus}</span>{" "}
                          · App status:{" "}
                          <span className="text-white">
                            {app.applicationStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs">
                          Attempts: {app.attemptCount}/{app.maxAttempts}
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs">
                          Earnings: ${Number(app.totalEarnings || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {app.trainingMaterials &&
                    app.trainingMaterials.length > 0 ? (
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                          Training Materials
                        </div>
                        <div className="mt-2 space-y-1">
                          {app.trainingMaterials.map((m, idx) => (
                            <a
                              key={idx}
                              href={m.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm hover:bg-[var(--panel-2)]"
                            >
                              <div className="font-semibold">
                                {m.title || "Material"}
                              </div>
                              <div className="text-xs text-[var(--muted)]">
                                {m.type || "link"}
                                {m.description ? ` · ${m.description}` : ""}
                              </div>
                            </a>
                          ))}
                        </div>

                        {app.workerStatus === "screening_unlocked" ? (
                          <button
                            type="button"
                            disabled={markTrainingMutation.isPending}
                            onClick={() => {
                              setActionMsg(null);
                              markTrainingMutation.mutate(app._id);
                            }}
                            className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                          >
                            {markTrainingMutation.isPending
                              ? "Updating..."
                              : "Mark Training Viewed"}
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {app.requiredScreenings &&
                    app.requiredScreenings.length > 0 ? (
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                          Required Screenings
                        </div>
                        <div className="mt-2 space-y-2">
                          {app.requiredScreenings.map((s) => (
                            <div
                              key={s._id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                            >
                              <div>
                                <div className="text-sm font-semibold">
                                  {s.title}
                                </div>
                                <div className="text-xs text-[var(--muted)]">
                                  Time limit: {s.timeLimit ?? "—"}m · Passing
                                  score: {s.passingScore ?? "—"}%
                                </div>
                              </div>
                              <Link
                                href={`/workforce/screening/${s._id}?positionId=${encodeURIComponent(app._id)}`}
                                className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
                              >
                                Open
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {app.assignedProjects && app.assignedProjects.length > 0 ? (
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                          Assigned Projects
                        </div>
                        <div className="mt-2 space-y-2">
                          {app.assignedProjects.map((p) => (
                            <div
                              key={p._id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                            >
                              <div>
                                <div className="text-sm font-semibold">
                                  {p.title}
                                </div>
                                <div className="text-xs text-[var(--muted)]">
                                  Status: {p.status}
                                </div>
                              </div>
                              <Link
                                href={`/workforce/project/${p._id}`}
                                className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
                              >
                                Open
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}

                {apps.length === 0 ? (
                  <div className="text-sm text-[var(--muted)]">
                    No applications found.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="text-sm font-semibold">Available Screenings</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Screenings available for your category.
          </div>

          <div className="mt-3 space-y-2">
            {screeningsQuery.isLoading ? (
              <div className="text-sm text-[var(--muted)]">Loading...</div>
            ) : screeningsQuery.isError ? (
              <div className="text-sm text-[var(--muted)]">
                Failed to load screenings.
              </div>
            ) : (screeningsQuery.data?.screenings || []).length === 0 ? (
              <div className="text-sm text-[var(--muted)]">
                No screenings available.
              </div>
            ) : (
              (screeningsQuery.data?.screenings || []).map((s) => (
                <div
                  key={s._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {s.timeLimit ?? "—"}m · pass {s.passingScore ?? "—"}%
                      {s.completed ? " · completed" : ""}
                    </div>
                  </div>
                  <Link
                    href={`/workforce/screening/${s._id}`}
                    className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
                  >
                    Open
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="text-sm font-semibold">Projects</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Projects assigned to you.
          </div>

          <div className="mt-3 space-y-2">
            {projectsQuery.isLoading ? (
              <div className="text-sm text-[var(--muted)]">Loading...</div>
            ) : projectsQuery.isError ? (
              <div className="text-sm text-[var(--muted)]">
                Failed to load projects.
              </div>
            ) : (projectsQuery.data?.projects || []).length === 0 ? (
              <div className="text-sm text-[var(--muted)]">
                No projects assigned.
              </div>
            ) : (
              (projectsQuery.data?.projects || []).map((p) => (
                <div
                  key={p._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-semibold">{p.title}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Status: {p.status}
                      {p.projectType ? ` · ${p.projectType}` : ""}
                    </div>
                  </div>
                  <Link
                    href={`/workforce/project/${p._id}`}
                    className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
                  >
                    Open
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
