import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const ROLE_HOME: Record<string, string> = {
  customer: "/customer",
  delivery_agent: "/driver",
  hub_staff: "/hub",
  admin: "/admin",
};

// Gates an entire portal behind a real session — shown before any portal
// shell, nav, or data renders, so an unauthenticated visitor sees the
// login page first, never a peek at the app shell underneath.
export function RequireAuth({ roles, children }: { roles?: string[]; children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Captured once, at the path the visitor actually wanted — pathname itself
  // is NOT a safe effect dependency here: navigating to /login changes it,
  // which would re-fire this effect and overwrite the saved redirect with
  // "/login" before the user ever logs in.
  const intendedPath = useRef(pathname);

  const wrongRole = !isLoading && isAuthenticated && roles && user && !roles.includes(user.role ?? "");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      if (pathname.startsWith("/login")) return;
      navigate({ to: "/login", search: { redirect: intendedPath.current } as any });
      return;
    }
    if (wrongRole) {
      navigate({ to: ROLE_HOME[user!.role ?? ""] ?? "/" });
    }
  }, [isLoading, isAuthenticated, wrongRole, pathname, navigate, user]);

  if (isLoading || !isAuthenticated || wrongRole) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your session…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
