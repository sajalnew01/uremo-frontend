"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import Link from "next/link";
import type { Blog } from "@/types";

export default function BlogsPage() {
  const { data, isLoading, error } = useQuery<{ blogs: Blog[] }>({
    queryKey: ["blogs"],
    queryFn: () => apiRequest(EP.BLOGS),
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Blog</h1>
        <p className="page-subtitle">Insights, guides, and updates from the UREMO team.</p>
      </div>

      {isLoading ? (
        <div className="page-loading"><div className="u-spinner" /> Loading...</div>
      ) : error ? (
        <div className="page-empty">Failed to load blogs.</div>
      ) : !data?.blogs?.length ? (
        <div className="page-empty">No blog posts yet. Stay tuned!</div>
      ) : (
        <div className="u-grid u-grid-3">
          {data.blogs.map((blog) => (
            <Link
              key={blog._id}
              href={`/blogs/${blog.slug}`}
              className="svc-card"
            >
              {blog.featuredImage && (
                <img
                  src={blog.featuredImage}
                  alt={blog.title}
                  className="svc-card-img"
                  loading="lazy"
                />
              )}
              <div className="svc-card-body">
                <div className="svc-card-title">{blog.title}</div>
                {blog.excerpt && (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)", lineHeight: "var(--leading-relaxed)" }}>
                    {blog.excerpt.slice(0, 120)}{blog.excerpt.length > 120 ? "..." : ""}
                  </p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="svc-card-cat">{blog.category}</span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
