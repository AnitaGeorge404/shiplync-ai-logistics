import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Package2, LogIn, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/lib/api-hooks";

export type DriverNavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  /** Shown in the mobile bottom tab bar. Keep to 5 max for touch comfort. */
  primary?: boolean;
};

type Props = {
  nav: DriverNavItem[];
  children: ReactNode;
};

// Mobile-first shell for the Delivery Partner portal only — a real bottom
// tab bar for on-the-move phone use (PortalShell, shared with the other
// three portals, has no mobile nav at all) plus a desktop sidebar for
// parity when opened on a larger screen.
export function DriverShell({ nav, children }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout, openAuthModal } = useAuth();
  const { data: notifications = [] } = useNotifications();
  const unread = notifications.filter((n: { read: boolean }) => !n.read).length;

  const isActive = (to: string) => pathname === to || (to !== "/driver" && pathname.startsWith(to));
  const bottomItems = nav.filter((n) => n.primary).slice(0, 5);
  const pageTitle = nav.find((n) => isActive(n.to))?.label ?? "Delivery Partner";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <Link to="/driver" className="flex items-center gap-2.5 px-5 h-16 border-b shrink-0">
          <div className="h-8 w-8 rounded-lg grid place-items-center text-white shadow-sm bg-[oklch(0.68_0.16_155)]">
            <Package2 className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display font-semibold tracking-tight leading-none">ShipLync</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              Delivery Partner
            </div>
          </div>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active = isActive(item.to);
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
                {!!item.badge && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          {user ? (
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 rounded-lg p-2 hover:bg-sidebar-accent/60 text-left cursor-pointer"
            >
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold shrink-0">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{user.name}</div>
                <div className="text-[10px] text-muted-foreground">Sign out</div>
              </div>
            </button>
          ) : (
            <Button size="sm" className="w-full gap-1.5 text-xs" onClick={() => openAuthModal()}>
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </Button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — compact, no search bar: an agent on the move needs the
            next stop, not a global search box. */}
        <header className="h-14 border-b bg-background/95 backdrop-blur-md sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-6">
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-7 w-7 rounded-md grid place-items-center text-white bg-[oklch(0.68_0.16_155)]">
              <Package2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <h1 className="font-display font-semibold text-base flex-1 truncate">{pageTitle}</h1>
          <Link to="/driver/exceptions" className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </Link>
          {user ? (
            <button
              onClick={logout}
              className="hidden lg:flex items-center gap-2 cursor-pointer"
              title="Click to sign out"
            >
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
            </button>
          ) : (
            <Button
              size="sm"
              className="hidden lg:inline-flex gap-1.5 text-xs h-8"
              onClick={() => openAuthModal()}
            >
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </Button>
          )}
        </header>

        <main className="flex-1 p-4 pb-24 lg:p-8 lg:pb-8 max-w-3xl w-full mx-auto">{children}</main>

        {/* Mobile bottom tab bar */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur-md grid"
          style={{
            gridTemplateColumns: `repeat(${bottomItems.length}, minmax(0, 1fr))`,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {bottomItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] relative ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="relative [&>svg]:h-5 [&>svg]:w-5">
                  {item.icon}
                  {!!item.badge && (
                    <span className="absolute -top-1 -right-2 h-3.5 min-w-3.5 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold grid place-items-center">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
