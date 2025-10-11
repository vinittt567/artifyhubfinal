import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ClayCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-card/80 p-6 shadow-[16px_16px_40px_rgba(0,0,0,0.18),_-12px_-12px_32px_rgba(255,255,255,0.05)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
