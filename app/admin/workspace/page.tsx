"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";

/**
 * PATCH_44: Admin Workspace Hub
 * PATCH_49: Enhanced with better summary cards and UX
 * Central dashboard for managing workers, projects, screenings, and job roles
 */

interface WorkspaceStats {
  totalWorkers: number;
  activeWorkers: number;
  pendingApplicants: number;
  totalProjects: number;
  activeProjects: number;
  totalScreenings: number;
  workersWaitingScreening: number;
  workersReadyToWork: number;
  totalJobRoles: number;
}

const workspaceModules = [
  {
    title: "Workers",
    description: "View all workers and their status across job roles",
    href: "/admin/workspace/workers",
    icon: "WF",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
  },
  {
    title: "Projects",
    description: "Create, assign, and manage work projects",
    href: "/admin/workspace/projects",
    icon: "Proj",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
  },
  {
    title: "Screenings",
    description: "Create and manage screening tests for job roles",
    href: "/admin/workspace/screenings",
    icon: "Test",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
  },
  {
    title: "Job Roles",
    description: "Manage positions, applicants, and training materials",
    href: "/admin/work-positions",
    icon: "Role",
    color: "from-purple-500/20 to-violet-500/20",
    border: "border-purple-500/30",
  },
];

export default function AdminWorkspacePage() {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // PATCH_49: Enhanced stats loading with more granular counts
        const workersRes = await apiRequest<any>(
          "/api/admin/workspace/workers?limit=1",
          "GET",
          null,
          true,
        );
        const projectsRes = await apiRequest<any>(
          "/api/admin/workspace/projects?limit=1",
          "GET",
          null,
          true,
        );
        const screeningsRes = await apiRequest<any>(
          "/api/admin/workspace/screenings",
          "GET",
          null,
          true,
        );
        // PATCH_49: Get job roles count
        let jobRolesCount = 0;
        try {
          const jobRolesRes = await apiRequest<any[]>(
            "/api/admin/work-positions",
            "GET",
            null,
            true,
          );
          jobRolesCount = Array.isArray(jobRolesRes) ? jobRolesRes.length : 0;
        } catch {
          // Ignore errors
        }

        setStats({
          totalWorkers: workersRes.total || 0,
          activeWorkers: workersRes.activeCount || 0,
          pendingApplicants: workersRes.pendingCount || 0,
          totalProjects: projectsRes.total || 0,
          activeProjects: projectsRes.activeCount || 0,
          totalScreenings: screeningsRes.screenings?.length || 0,
          workersWaitingScreening: workersRes.waitingScreeningCount || 0,
          workersReadyToWork: workersRes.readyToWorkCount || 0,
          totalJobRoles: jobRolesCount,
        });
      } catch (e) {
        console.error("Failed to load workspace stats:", e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="u-container max-w-6xl">
      <PageHeader
        title="Workspace Management"
        description="Manage workers, projects, screenings, and job roles"
      />

      {/* PATCH_49: Enhanced Stats Overview with more metrics */}
      {!loading && stats && (
        <div className="space-y-4 mb-8">
          {/* Primary Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-2xl font-bold text-purple-400">
                {stats.totalJobRoles}
              </p>
              <p className="text-xs text-slate-400">Total Job Roles</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-amber-400">
                {stats.workersWaitingScreening || stats.pendingApplicants}
              </p>
              <p className="text-xs text-slate-400">
                Workers Waiting Screening
              </p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {stats.workersReadyToWork || 0}
              </p>
              <p className="text-xs text-slate-400">Workers Ready To Work</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-blue-400">
                {stats.activeProjects}
              </p>
              <p className="text-xs text-slate-400">Active Projects</p>
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center bg-slate-800/50">
              <p className="text-xl font-bold text-slate-300">
                {stats.totalWorkers}
              </p>
              <p className="text-xs text-slate-500">Total Workers</p>
            </div>
            <div className="card text-center bg-slate-800/50">
              <p className="text-xl font-bold text-slate-300">
                {stats.totalProjects}
              </p>
              <p className="text-xs text-slate-500">Total Projects</p>
            </div>
            <div className="card text-center bg-slate-800/50">
              <p className="text-xl font-bold text-slate-300">
                {stats.totalScreenings}
              </p>
              <p className="text-xs text-slate-500">Screenings</p>
            </div>
            <div className="card text-center bg-slate-800/50">
              <p className="text-xl font-bold text-slate-300">
                {stats.pendingApplicants}
              </p>
              <p className="text-xs text-slate-500">Pending Applicants</p>
            </div>
          </div>
        </div>
      )}

      {/* Module Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {workspaceModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <div
              className={`group p-6 rounded-2xl bg-gradient-to-br ${module.color} border ${module.border} hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full`}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {module.icon}
              </div>
              <h3 className="font-semibold text-lg text-white mb-2">
                {module.title}
              </h3>
              <p className="text-sm text-slate-400">{module.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-white/10">
        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/workspace/projects?action=create"
            className="btn-primary"
          >
            + Create Project
          </Link>
          <Link
            href="/admin/workspace/screenings?action=create"
            className="btn-secondary"
          >
            + Create Screening
          </Link>
          <Link href="/admin/applications" className="btn-secondary">
            View Applications
          </Link>
        </div>
      </div>
    </div>
  );
}
