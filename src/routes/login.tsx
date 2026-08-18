import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — ShipLync Logistics" },
      { name: "description", content: "Sign in to your ShipLync account to book shipments, manage parcels and track deliveries." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/customer/book" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-background border rounded-2xl p-6 sm:p-8 shadow-xl">
        <LoginForm
          onSuccess={() => {
            navigate({ to: "/customer/book" });
          }}
        />
      </div>
    </div>
  );
}
