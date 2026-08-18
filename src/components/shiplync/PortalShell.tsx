import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Bell, Search, Command, Package2, Moon, Sun, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export type NavItem = { to: string; label: string; icon: ReactNode; badge?: string };

type Props = {
  portal: "Customer" | "Delivery Partner" | "Hub Ops" | "Admin";
  accent: string;
  nav: NavItem[];
  children: ReactNode;
};

export function PortalShell({ portal, accent, nav, children }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout, openAuthModal } = useAuth();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <Link to="/" className="flex items-center gap-2.5 px-5 h-16 border-b">
          <div className="h-8 w-8 rounded-lg grid place-items-center text-white shadow-sm" style={{ background: accent }}>
            <Package2 className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display font-semibold tracking-tight leading-none">ShipLync</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{portal}</div>
          </div>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <span className="[&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <div className="rounded-lg p-3 bg-muted/60 border">
            <div className="text-xs font-medium">AI Coordinator</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Optimizing 1,284 shipments in real time
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
              <span className="text-[10px] text-muted-foreground">Live</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-background/70 backdrop-blur-md sticky top-0 z-20 flex items-center gap-3 px-4 lg:px-8">
          <div className="lg:hidden flex items-center gap-2 mr-1">
            <div className="h-7 w-7 rounded-md grid place-items-center text-primary-foreground bg-primary">
              <Package2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-display font-semibold">ShipLync</span>
          </div>
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shipments, tracking, drivers, hubs…"
              className="pl-9 pr-16 h-10 bg-muted/40 border-transparent focus-visible:bg-background"
            />
            <kbd className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => setDark((v) => !v)} aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </Button>
            {user ? (
              <div className="flex items-center gap-2 ml-1 cursor-pointer" onClick={logout} title="Click to sign out">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold shadow-sm">
                  {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <span className="text-xs font-medium hidden sm:inline-block max-w-[100px] truncate">
                  {user.name}
                </span>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => openAuthModal()}
                className="gap-1.5 text-xs h-8 ml-1"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </Button>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
