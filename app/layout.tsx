import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StatusBanner from "@/components/StatusBanner";
import Footer from "@/components/Footer";
import { SidebarProvider } from "@/components/sidebar/SidebarProvider";
import { ToastProvider } from "@/hooks/useToast";
import ToastViewport from "@/components/ToastViewport";
import JarvisWidget from "@/components/jarvisx/JarvisWidget";

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
    icon: [
      { url: "/brand/favicon.png", type: "image/png" },
      { url: "/brand/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/brand/apple-touch.png", type: "image/png", sizes: "180x180" },
    ],
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
      <body className="overflow-x-hidden">
        <ToastProvider>
          <SidebarProvider>
            <Navbar />
            <ToastViewport />
            <div className="pt-12 lg:pt-14">
              <div className="lg:grid lg:grid-cols-[260px_1fr] min-h-[calc(100vh-48px)] lg:min-h-[calc(100vh-56px)]">
                <div className="hidden lg:block" />
                <main className="min-w-0 relative z-10 u-page">
                  <div className="hidden lg:block">
                    <StatusBanner />
                  </div>
                  {children}
                </main>
              </div>

              <Sidebar />
            </div>

            <Footer />
            <JarvisWidget />
          </SidebarProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
