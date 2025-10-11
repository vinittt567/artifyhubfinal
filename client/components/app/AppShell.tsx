import { ReactNode } from "react";
import { NavBar } from "@/components/app/NavBar";
import { BottomNav } from "@/components/app/BottomNav";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";

export function AppShell({
  children,
  centered,
  mainClassName,
}: {
  children: ReactNode;
  centered?: boolean;
  mainClassName?: string;
}) {
  const { isMobile } = useResponsive();
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavBar />
      <main
        className={cn(
          "flex-1 w-full",
          isMobile 
            ? "container max-w-full px-2 py-4" 
            : "container max-w-4xl px-4 py-6 mx-auto",
          centered && "grid place-items-center",
          mainClassName,
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}