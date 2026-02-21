"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import Link from "next/link";
import type { Blog } from "@/types";

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data, isLoading, error } = useQuery<{ blog: Blog }>({
    queryKey: ["blog", slug],
    queryFn: () => apiRequest(EP.BLOG_BY_SLUG(slug)),
    enabled: !!slug,
  });

  const blog = data?.blog;

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="page-loading"><div className="u-spinner" /> Loading...</div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="page-content">
        <div className="page-empty">Blog post not found.</div>
      </div>
    );
  }

  return (
    <div className="page-content-narrow" style={{ paddingTop: "var(--space-8)" }}>
      <Link href="/blogs" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)", display: "inline-block" }}>
        ← Back to Blog
      </Link>

      {blog.featuredImage && (
        <img
          src={blog.featuredImage}
          alt={blog.title}
          style={{
            width: "100%",
            maxHeight: 360,
            objectFit: "cover",
            borderRadius: "var(--radius-lg)",
            marginBottom: "var(--space-6)",
          }}
        />
      )}

      <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: "var(--weight-bold)", marginBottom: "var(--space-3)" }}>
        {blog.title}
      </h1>

      <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)", marginBottom: "var(--space-8)" }}>
        <span>{blog.category}</span>
        <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
      </div>

      {blog.tags && blog.tags.length > 0 && (
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-6)" }}>
          {blog.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "var(--text-xs)",
                padding: "2px var(--space-2)",
                background: "var(--color-bg-tertiary)",
                borderRadius: "var(--radius-full)",
                color: "var(--color-text-secondary)",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          fontSize: "var(--text-base)",
          color: "var(--color-text-secondary)",
          lineHeight: "var(--leading-relaxed)",
          whiteSpace: "pre-wrap",
        }}
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </div>
  );
}
