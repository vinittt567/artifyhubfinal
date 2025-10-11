import { Home, Search, MessageSquare, User, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";

export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { isMobile } = useResponsive();

  // Don't show bottom nav on auth pages or if user is not logged in
  if (!user || ['/login', '/signup', '/forgot-password'].includes(pathname)) {
    return null;
  }

  const items = [
    { to: "/feed", icon: Home, label: "Feed" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/messages", icon: MessageSquare, label: "Messages" },
    { to: "/profile/me", icon: User, label: "Profile" },
  ];

  // On mobile, show the traditional bottom nav
  if (isMobile) {
    return (
      <nav className="sticky bottom-0 z-40 w-full border-t bg-background">
        <div className="relative mx-auto grid max-w-3xl grid-cols-4 px-2 py-2">
          {items.map(({ to, icon: Icon, label }) => {
            // Check if current route matches or if we're on a sub-route
            const active = pathname === to || 
              (to === "/messages" && pathname.startsWith("/messages/")) ||
              (to === "/profile/me" && (pathname === "/profile/me" || pathname === "/profile/edit"));
              
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs transition-colors ${
                  active
                    ? "text-brand bg-brand/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className={active ? 'font-medium' : ''}>{label}</span>
              </Link>
            );
          })}

          <Link
            to="/create"
            className="group absolute -top-6 left-1/2 -translate-x-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full border bg-brand text-brand-foreground shadow-lg ring-1 ring-black/5 hover:scale-105 transition-transform"
            aria-label="Create post"
          >
            <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
          </Link>
        </div>
      </nav>
    );
  }

  // On desktop, show a sidebar-like navigation
  return (
    <nav className="hidden md:block sticky bottom-0 z-40 w-full border-t bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {items.map(({ to, icon: Icon, label }) => {
            // Check if current route matches or if we're on a sub-route
            const active = pathname === to || 
              (to === "/messages" && pathname.startsWith("/messages/")) ||
              (to === "/profile/me" && (pathname === "/profile/me" || pathname === "/profile/edit"));
              
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 rounded-md px-4 py-2 text-sm transition-colors ${
                  active
                    ? "text-brand bg-brand/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className={active ? 'font-medium' : ''}>{label}</span>
              </Link>
            );
          })}
          
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm hover:bg-brand/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}