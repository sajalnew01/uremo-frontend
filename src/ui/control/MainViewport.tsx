import type { ReactNode } from "react";

export function MainViewport({ children }: { children: ReactNode }) {
  return <main className="min-w-0 p-6">{children}</main>;
}
