import { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-card/80 p-6 shadow-[8px_8px_24px_rgba(0,0,0,0.25),_-8px_-8px_24px_rgba(255,255,255,0.03)] backdrop-blur">
      {children}
    </div>
  );
}
