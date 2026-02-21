import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import "@/design-system/globals.css";

export const metadata: Metadata = {
  title: "UREMO — Digital Services Marketplace",
  description:
    "Buy, rent, and deal on verified digital accounts and services. Earn through microjobs and RLHF tasks.",
  icons: { icon: "/favicon-v2.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
