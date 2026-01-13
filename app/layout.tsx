import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StatusBanner from "@/components/StatusBanner";
import { SidebarProvider } from "@/components/sidebar/SidebarProvider";
import { ToastProvider } from "@/hooks/useToast";
import ToastViewport from "@/components/ToastViewport";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UREMO — Verified Digital Onboarding & Marketplace",
  description:
    "Buy trusted onboarding, KYC, and verification assistance services. Track orders with human verification and admin support. UREMO is your independent digital operations partner.",
  keywords: [
    "onboarding",
    "verification",
    "kyc",
    "digital services",
    "account setup",
    "manual operations",
    "marketplace",
    "service provider",
  ],
  metadataBase: new URL("https://uremo.online"),
  openGraph: {
    title: "UREMO — Verified Digital Onboarding & Marketplace",
    description:
      "Buy trusted onboarding, KYC, and verification assistance services. Track orders with human verification and admin support.",
    url: "https://uremo.online",
    siteName: "UREMO",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/brand/og.png",
        width: 1200,
        height: 630,
        alt: "UREMO — Verified Digital Onboarding & Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UREMO — Verified Digital Onboarding & Marketplace",
    description:
      "Buy trusted onboarding, KYC, and verification assistance services. Track orders with human verification and admin support.",
    images: ["/brand/og.png"],
  },
  icons: {
    icon: [{ url: "/brand/favicon.png", type: "image/png" }],
    apple: [{ url: "/brand/apple-touch.png", type: "image/png" }],
    other: [{ rel: "icon", url: "/icon.png", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <ToastProvider>
          <SidebarProvider>
            <Navbar />
            <ToastViewport />
            <div className="pt-14">
              <div className="md:grid md:grid-cols-[260px_1fr] min-h-[calc(100vh-56px)]">
                <div className="hidden md:block" />
                <main className="min-w-0 relative z-10 u-page">
                  <div className="hidden md:block">
                    <StatusBanner />
                  </div>
                  {children}
                </main>
              </div>

              <Sidebar />
            </div>
          </SidebarProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
