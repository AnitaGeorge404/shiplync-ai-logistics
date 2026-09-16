import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Bell, Search, Command, Package2, Moon, Sun, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export type NavItem = { to: string; label: string; icon: ReactNode; badge?: string; section?: string };

type Props = {
  portal: "Customer" | "Delivery Partner" | "Hub Ops" | "Admin";
  nav: NavItem[];
  children: ReactNode;
};

export function PortalShell({ portal, nav, children }: Props) {
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
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <Link to="/" className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border">
          <div className="h-7 w-7 rounded-md grid place-items-center bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
            <Package2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm leading-none truncate">ShipLync</div>
            <div className="text-[10px] uppercase tracking-wide text-sidebar-foreground/60 mt-1">{portal}</div>
          </div>
        </Link>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map((item, i) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            const showSection = item.section && item.section !== nav[i - 1]?.section;
            return (
              <div key={item.to}>
                {showSection && (
                  <div className={`px-2.5 text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/40 ${i === 0 ? "pb-1.5" : "pt-3.5 pb-1.5"}`}>
                    {item.section}
                  </div>
                )}
                <Link
                  to={item.to}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <span className="[&>svg]:h-4 [&>svg]:w-4 shrink-0">{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] shrink-0">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-background sticky top-0 z-20 flex items-center gap-3 px-4 lg:px-6">
          <div className="lg:hidden flex items-center gap-2 mr-1">
            <div className="h-7 w-7 rounded-md grid place-items-center text-primary-foreground bg-primary">
              <Package2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-sm">ShipLync</span>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search shipments, tracking, drivers, hubs…"
              className="pl-8 pr-14 h-8 text-sm bg-muted/40 border-transparent focus-visible:bg-background"
            />
            <kbd className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDark((v) => !v)} aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </Button>
            {user ? (
              <button
                type="button"
                className="flex items-center gap-2 ml-1.5 cursor-pointer"
                onClick={logout}
                title="Click to sign out"
              >
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-semibold">
                  {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <span className="text-xs font-medium hidden sm:inline-block max-w-[100px] truncate">
                  {user.name}
                </span>
              </button>
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
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
