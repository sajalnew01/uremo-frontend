import { Metadata } from "next";
import BlogContent from "./BlogContent";

// PATCH_21: SEO metadata generation
type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://uremo-backend.onrender.com";

  try {
    const res = await fetch(`${apiUrl}/api/blogs/${slug}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (data?.ok && data?.blog) {
      return {
        title: `${data.blog.title} | UREMO Blog`,
        description: data.blog.excerpt || data.blog.title,
        openGraph: {
          title: data.blog.title,
          description: data.blog.excerpt || data.blog.title,
          images: data.blog.featuredImage ? [data.blog.featuredImage] : [],
          type: "article",
        },
        twitter: {
          card: "summary_large_image",
          title: data.blog.title,
          description: data.blog.excerpt || data.blog.title,
          images: data.blog.featuredImage ? [data.blog.featuredImage] : [],
        },
      };
    }
  } catch (err) {
    console.error("Failed to fetch blog metadata:", err);
  }

  return {
    title: "Blog | UREMO",
    description: "Read the latest articles on UREMO",
  };
}

export default async function BlogPage({ params }: Props) {
  const { slug } = await params;
  return <BlogContent slug={slug} />;
}
