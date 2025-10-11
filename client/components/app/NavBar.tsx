import { Bell, Code2, Moon, Sun, LogOut, Settings, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResponsive } from "@/hooks/useResponsive";

export function NavBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isMobile } = useResponsive();
  const onFeed = pathname === "/feed";
  const [dark, setDark] = useState(false);
  
  useEffect(() => {
    const root = document.documentElement;
    const initial = localStorage.getItem("theme") === "dark";
    setDark(initial);
    root.classList.toggle("dark", initial);
  }, []);
  
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Don't show navbar on auth pages
  if (['/login', '/signup', '/forgot-password'].includes(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/feed" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand text-brand-foreground shadow-sm">
            <Code2 className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">ARTIFYHUB</span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-card hover:bg-muted transition-colors"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          {!onFeed && (
            <Link
              to="/feed"
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
          )}
          
          {user && (
            <>
              <Link
                to="/activity"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border bg-card hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-brand text-[11px] font-semibold text-brand-foreground px-1.5 flex items-center justify-center">
                  3
                </span>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-sm font-medium">
                        {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 
                         user?.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-sm font-medium">
                        {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 
                         user?.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">
                        {user?.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile/me" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile/edit" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}