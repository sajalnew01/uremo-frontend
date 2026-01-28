import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://uremo.online",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://uremo.online/avail-service",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://uremo.online/apply-to-work",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://uremo.online/login",
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 0.5,
    },
    {
      url: "https://uremo.online/signup",
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 0.5,
    },
  ];
}
