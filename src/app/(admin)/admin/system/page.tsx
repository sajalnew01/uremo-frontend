"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import {
  MetricsRibbon,
  DataGrid,
  Badge,
  ConfirmModal,
  type Column,
} from "@/design-system";
import { emitToast } from "@/hooks/useToast";

type Tab = "analytics" | "users" | "blogs" | "settings" | "tools";

export default function SystemEngine() {
  const [tab, setTab] = useState<Tab>("analytics");
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    msg: string;
    fn: () => Promise<unknown>;
    variant?: "primary" | "danger";
  } | null>(null);

  /* ─── Blog form ─── */
  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    content: "",
    tags: "",
    featuredImage: "",
  });
  const [editBlogId, setEditBlogId] = useState<string | null>(null);

  /* ─── Settings form ─── */
  const [settingsJson, setSettingsJson] = useState("");

  /* ─── QUERIES ─── */
  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: ["admin-analytics-dashboard"],
    queryFn: () =>
      apiRequest<Record<string, unknown>>(
        EP.ADMIN_ANALYTICS_DASHBOARD,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "analytics",
  });

  const { data: healthData } = useQuery({
    queryKey: ["admin-analytics-health"],
    queryFn: () =>
      apiRequest<Record<string, unknown>>(
        EP.ADMIN_ANALYTICS_HEALTH,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "analytics",
  });

  const { data: chartsData } = useQuery({
    queryKey: ["admin-analytics-charts"],
    queryFn: () =>
      apiRequest<Record<string, unknown>>(
        EP.ADMIN_ANALYTICS_CHARTS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "analytics",
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () =>
      apiRequest<{ users: Record<string, unknown>[] }>(
        EP.ADMIN_USERS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "users",
  });

  const { data: blogsData, isLoading: blogsLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: () =>
      apiRequest<{ blogs: Record<string, unknown>[] }>(
        EP.ADMIN_BLOGS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "blogs",
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () =>
      apiRequest<Record<string, unknown>>(
        EP.ADMIN_SETTINGS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "settings",
  });

  /* ─── MUTATIONS ─── */
  const actionMut = useMutation({
    mutationFn: async ({
      url,
      method,
      body,
    }: {
      url: string;
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: unknown;
    }) => apiRequest(url, method, body, true),
    onSuccess: () => {
      emitToast("Action completed", "success");
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmAction(null);
      setBlogForm({
        title: "",
        slug: "",
        content: "",
        tags: "",
        featuredImage: "",
      });
      setEditBlogId(null);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const saveBlog = () => {
    const body = {
      title: blogForm.title,
      slug: blogForm.slug,
      content: blogForm.content,
      tags: blogForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      featuredImage: blogForm.featuredImage || undefined,
    };
    if (editBlogId) {
      actionMut.mutate({
        url: EP.ADMIN_BLOG_BY_ID(editBlogId),
        method: "PUT",
        body,
      });
    } else {
      actionMut.mutate({ url: EP.ADMIN_BLOGS, method: "POST", body });
    }
  };

  const saveSettings = () => {
    try {
      const parsed = JSON.parse(settingsJson);
      actionMut.mutate({ url: EP.ADMIN_SETTINGS, method: "PUT", body: parsed });
    } catch {
      emitToast("Invalid JSON", "error");
    }
  };

  /* ─── METRICS ─── */
  const metrics = [
    {
      label: "Total Users",
      value: ((dashboardData as Record<string, unknown>)?.totalUsers ??
        usersData?.users?.length ??
        "—") as string | number,
    },
    {
      label: "Total Orders",
      value: ((dashboardData as Record<string, unknown>)?.totalOrders ??
        "—") as string | number,
    },
    {
      label: "Revenue",
      value: `$${Number((dashboardData as Record<string, unknown>)?.totalRevenue ?? 0).toFixed(2)}`,
      color: "var(--color-success)",
    },
    {
      label: "Health",
      value: healthData ? "OK" : "—",
      color: "var(--color-success)",
    },
  ];

  /* ─── COLUMNS ─── */
  const userCols: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    {
      key: "role",
      header: "Role",
      render: (r) => <Badge status={String(r.role)} />,
    },
    { key: "country", header: "Country" },
    {
      key: "createdAt",
      header: "Joined",
      render: (r) => new Date(String(r.createdAt)).toLocaleDateString(),
    },
  ];

  const blogCols: Column<Record<string, unknown>>[] = [
    { key: "title", header: "Title", sortable: true },
    { key: "slug", header: "Slug" },
    {
      key: "tags",
      header: "Tags",
      render: (r) => {
        const tags = r.tags as string[] | undefined;
        return tags?.join(", ") ?? "—";
      },
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(String(r.createdAt)).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          <button
            className="u-btn u-btn-ghost u-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditBlogId(String(r._id));
              setBlogForm({
                title: String(r.title || ""),
                slug: String(r.slug || ""),
                content: String(r.content || ""),
                tags: ((r.tags as string[]) || []).join(", "),
                featuredImage: String(r.featuredImage || ""),
              });
            }}
          >
            Edit
          </button>
          <button
            className="u-btn u-btn-danger u-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmAction({
                title: "Delete Blog",
                msg: `Delete "${r.title}"?`,
                variant: "danger",
                fn: () =>
                  actionMut.mutateAsync({
                    url: EP.ADMIN_BLOG_BY_ID(String(r._id)),
                    method: "DELETE",
                  }),
              });
            }}
          >
            Del
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "var(--space-5)" }}>
      <h1 className="u-heading-1" style={{ marginBottom: "var(--space-4)" }}>
        System Engine
      </h1>

      <MetricsRibbon metrics={metrics} loading={dashLoading} />

      <div className="tab-bar" style={{ marginTop: "var(--space-4)" }}>
        {(["analytics", "users", "blogs", "settings", "tools"] as Tab[]).map(
          (t) => (
            <button
              key={t}
              className={`tab-bar-item ${tab === t ? "tab-bar-item--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ),
        )}
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        {/* Analytics */}
        {tab === "analytics" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-5)",
            }}
          >
            <div className="u-card">
              <h3
                className="u-heading-3"
                style={{ marginBottom: "var(--space-3)" }}
              >
                Dashboard Data
              </h3>
              {dashLoading ? (
                <div className="u-spinner" />
              ) : (
                <pre
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(dashboardData, null, 2)}
                </pre>
              )}
            </div>
            {chartsData && (
              <div className="u-card">
                <h3
                  className="u-heading-3"
                  style={{ marginBottom: "var(--space-3)" }}
                >
                  Charts Data
                </h3>
                <pre
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(chartsData, null, 2)}
                </pre>
              </div>
            )}
            {healthData && (
              <div className="u-card">
                <h3
                  className="u-heading-3"
                  style={{ marginBottom: "var(--space-3)" }}
                >
                  System Health
                </h3>
                <pre
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(healthData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <DataGrid
            columns={userCols}
            data={(usersData?.users ?? []) as Record<string, unknown>[]}
            loading={usersLoading}
            rowKey={(r) => String(r._id)}
          />
        )}

        {/* Blogs */}
        {tab === "blogs" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-5)",
            }}
          >
            {/* Blog Form */}
            <div className="u-card" style={{ maxWidth: 600 }}>
              <h3
                className="u-heading-3"
                style={{ marginBottom: "var(--space-3)" }}
              >
                {editBlogId ? "Edit Blog" : "Create Blog"}
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <div className="auth-field">
                  <label className="u-label">Title</label>
                  <input
                    className="u-input"
                    value={blogForm.title}
                    onChange={(e) =>
                      setBlogForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                </div>
                <div className="auth-field">
                  <label className="u-label">Slug</label>
                  <input
                    className="u-input"
                    value={blogForm.slug}
                    onChange={(e) =>
                      setBlogForm((f) => ({ ...f, slug: e.target.value }))
                    }
                  />
                </div>
                <div className="auth-field">
                  <label className="u-label">Tags (comma-separated)</label>
                  <input
                    className="u-input"
                    value={blogForm.tags}
                    onChange={(e) =>
                      setBlogForm((f) => ({ ...f, tags: e.target.value }))
                    }
                  />
                </div>
                <div className="auth-field">
                  <label className="u-label">Featured Image URL</label>
                  <input
                    className="u-input"
                    value={blogForm.featuredImage}
                    onChange={(e) =>
                      setBlogForm((f) => ({
                        ...f,
                        featuredImage: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="auth-field">
                  <label className="u-label">Content (HTML)</label>
                  <textarea
                    className="u-input"
                    rows={8}
                    value={blogForm.content}
                    onChange={(e) =>
                      setBlogForm((f) => ({ ...f, content: e.target.value }))
                    }
                  />
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button
                    className="u-btn u-btn-primary"
                    disabled={
                      !blogForm.title || !blogForm.slug || actionMut.isPending
                    }
                    onClick={saveBlog}
                  >
                    {editBlogId ? "Update" : "Create"}
                  </button>
                  {editBlogId && (
                    <button
                      className="u-btn u-btn-ghost"
                      onClick={() => {
                        setEditBlogId(null);
                        setBlogForm({
                          title: "",
                          slug: "",
                          content: "",
                          tags: "",
                          featuredImage: "",
                        });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            <DataGrid
              columns={blogCols}
              data={(blogsData?.blogs ?? []) as Record<string, unknown>[]}
              loading={blogsLoading}
              rowKey={(r) => String(r._id)}
            />
          </div>
        )}

        {/* Settings */}
        {tab === "settings" && (
          <div className="u-card" style={{ maxWidth: 600 }}>
            <h3
              className="u-heading-3"
              style={{ marginBottom: "var(--space-3)" }}
            >
              Platform Settings
            </h3>
            {settingsLoading ? (
              <div className="u-spinner" />
            ) : (
              <>
                <pre
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "pre-wrap",
                    marginBottom: "var(--space-4)",
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(settingsData, null, 2)}
                </pre>
                <div className="auth-field">
                  <label className="u-label">Update Settings (JSON)</label>
                  <textarea
                    className="u-input"
                    rows={6}
                    placeholder='{"key": "value"}'
                    value={settingsJson}
                    onChange={(e) => setSettingsJson(e.target.value)}
                  />
                </div>
                <button
                  className="u-btn u-btn-primary"
                  style={{ marginTop: "var(--space-2)" }}
                  disabled={!settingsJson || actionMut.isPending}
                  onClick={saveSettings}
                >
                  Save Settings
                </button>
              </>
            )}
          </div>
        )}

        {/* Tools */}
        {tab === "tools" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
              maxWidth: 500,
            }}
          >
            <div className="u-card">
              <h3
                className="u-heading-3"
                style={{ marginBottom: "var(--space-2)" }}
              >
                Test Email
              </h3>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-3)",
                }}
              >
                Send a test email to verify Resend integration.
              </p>
              <button
                className="u-btn u-btn-primary u-btn-sm"
                onClick={() =>
                  setConfirmAction({
                    title: "Send Test Email",
                    msg: "Send a test email?",
                    fn: () =>
                      actionMut.mutateAsync({
                        url: EP.ADMIN_TEST_EMAIL,
                        method: "POST",
                      }),
                  })
                }
              >
                Send Test Email
              </button>
            </div>

            <div
              className="u-card"
              style={{ borderColor: "var(--color-error)" }}
            >
              <h3
                className="u-heading-3"
                style={{
                  marginBottom: "var(--space-2)",
                  color: "var(--color-error)",
                }}
              >
                Danger Zone
              </h3>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-3)",
                }}
              >
                These actions are irreversible.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="u-btn u-btn-danger u-btn-sm"
                  onClick={() =>
                    setConfirmAction({
                      title: "Reset Wallets",
                      msg: "WARNING: This will reset ALL wallet data. Are you sure?",
                      variant: "danger",
                      fn: () =>
                        actionMut.mutateAsync({
                          url: EP.ADMIN_RESET_WALLETS,
                          method: "POST",
                        }),
                    })
                  }
                >
                  Reset Wallets
                </button>
                <button
                  className="u-btn u-btn-danger u-btn-sm"
                  onClick={() =>
                    setConfirmAction({
                      title: "Reset Affiliate",
                      msg: "WARNING: This will reset ALL affiliate data. Are you sure?",
                      variant: "danger",
                      fn: () =>
                        actionMut.mutateAsync({
                          url: EP.ADMIN_RESET_AFFILIATE,
                          method: "POST",
                        }),
                    })
                  }
                >
                  Reset Affiliate
                </button>
                <button
                  className="u-btn u-btn-danger u-btn-sm"
                  onClick={() =>
                    setConfirmAction({
                      title: "Reset All Test Data",
                      msg: "WARNING: This will reset ALL test data. This is IRREVERSIBLE.",
                      variant: "danger",
                      fn: () =>
                        actionMut.mutateAsync({
                          url: EP.ADMIN_RESET_ALL,
                          method: "POST",
                        }),
                    })
                  }
                >
                  Reset All
                </button>
              </div>
            </div>

            <div className="u-card">
              <h3
                className="u-heading-3"
                style={{ marginBottom: "var(--space-2)" }}
              >
                Service Repair
              </h3>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-3)",
                }}
              >
                Repair legacy service data.
              </p>
              <button
                className="u-btn u-btn-secondary u-btn-sm"
                onClick={() =>
                  setConfirmAction({
                    title: "Repair Legacy Services",
                    msg: "Run legacy service repair?",
                    fn: () =>
                      actionMut.mutateAsync({
                        url: EP.ADMIN_SERVICE_REPAIR,
                        method: "POST",
                      }),
                  })
                }
              >
                Run Repair
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ""}
        message={confirmAction?.msg ?? ""}
        variant={confirmAction?.variant}
        onConfirm={() => confirmAction?.fn() ?? Promise.resolve()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
