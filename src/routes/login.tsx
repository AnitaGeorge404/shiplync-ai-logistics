import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/context/AuthContext";

const ROLE_HOME: Record<string, string> = {
  customer: "/customer",
  delivery_agent: "/driver",
  hub_staff: "/hub",
  admin: "/admin",
};

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — ShipLync Logistics" },
      { name: "description", content: "Sign in to your ShipLync account to book shipments, manage parcels and track deliveries." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });

  const destination = redirect || ROLE_HOME[user?.role ?? ""] || "/customer/book";

  // Previously this auto-navigated away the instant an already-authenticated
  // visitor loaded /login, with no way to reach the form underneath — so a
  // customer who clicked into e.g. Hub Operations while still signed in as
  // a customer got silently bounced back to /customer, which looked
  // identical to "I can't log in to any portal but Customer." Now it shows
  // an explicit choice instead of guessing for them.
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-card border rounded-lg p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            You're already signed in as <span className="font-medium text-foreground">{user.name}</span> ({user.role?.replace(/_/g, " ")}).
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: destination })}
              className="w-full rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90"
            >
              Continue to my portal
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Sign out and use a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-card border rounded-lg p-6 sm:p-8 shadow-sm">
        <LoginForm
          onSuccess={() => {
            navigate({ to: destination });
          }}
        />
      </div>
    </div>
  );
}
