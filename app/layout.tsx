import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StatusBanner from "@/components/StatusBanner";
import { SidebarProvider } from "@/components/SidebarContext";
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
            <StatusBanner />
            <Navbar />
            <ToastViewport />
            <div className="flex min-h-[calc(100vh-56px)] relative">
              <Sidebar />
              <main className="flex-1 relative z-10 u-page">{children}</main>
            </div>
          </SidebarProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
