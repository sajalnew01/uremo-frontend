import type { ReactNode } from "react";
import "./globals.css";

import { Providers } from "@/lib/providers";
import { ControlShell } from "@/ui/control/ControlShell";
import { Sidebar } from "@/ui/control/Sidebar";
import { TopBar } from "@/ui/control/TopBar";
import { MainViewport } from "@/ui/control/MainViewport";

export const metadata = {
  title: "UREMO Control Center",
  description: "Enterprise operations control center",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ControlShell>
            <Sidebar />
            <TopBar />
            <MainViewport>{children}</MainViewport>
          </ControlShell>
        </Providers>
      </body>
    </html>
  );
}
