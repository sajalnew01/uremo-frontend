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
  title: "UREMO",
  description: "Professional service marketplace",
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
