import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

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
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });

  const destination = redirect || ROLE_HOME[user?.role ?? ""] || "/customer/book";

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: destination });
    }
  }, [isAuthenticated, destination, navigate]);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-background border rounded-2xl p-6 sm:p-8 shadow-xl">
        <LoginForm
          onSuccess={() => {
            navigate({ to: destination });
          }}
        />
      </div>
    </div>
  );
}
