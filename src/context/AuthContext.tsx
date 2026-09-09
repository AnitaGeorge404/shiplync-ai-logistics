import React, { createContext, useContext, useState, useCallback } from "react";
import { authClient, useSession } from "@/lib/auth-client";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role?: string;
  accountType: "individual" | "business";
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  isLoading: boolean;
  /** Quick demo login used by the phone-OTP / social buttons. Real
   * DB-backed account, shared demo password — documented simplification,
   * see PROGRESS_REPORT.md. */
  login: (userData?: Partial<UserProfile> & { password?: string }) => Promise<void>;
  /** Real email/password sign-in used by the "Email Address" tab. */
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  logout: () => void;
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  pendingRedirect: (() => void) | null;
}

const DEMO_PASSWORD = "shiplync-demo-2026";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, isPending } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<(() => void) | null>(null);

  const user: UserProfile | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: (session.user as any).phone ?? "",
        avatar: session.user.image ?? undefined,
        role: (session.user as any).role ?? "customer",
        accountType: "individual",
      }
    : null;

  const runPendingRedirect = useCallback(() => {
    if (pendingRedirect) {
      pendingRedirect();
      setPendingRedirect(null);
    }
  }, [pendingRedirect]);

  const login = useCallback(
    async (customData?: Partial<UserProfile> & { password?: string }) => {
      const email = customData?.email ?? `guest.${Date.now()}@shiplync.demo`;
      const password = customData?.password ?? DEMO_PASSWORD;
      const name = customData?.name ?? email.split("@")[0];

      const signInResult = await authClient.signIn.email({ email, password });
      if (signInResult.error) {
        await authClient.signUp.email({ email, password, name });
      }
      setIsAuthModalOpen(false);
      runPendingRedirect();
    },
    [runPendingRedirect],
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const result = await authClient.signIn.email({ email, password });
      if (!result.error) {
        setIsAuthModalOpen(false);
        runPendingRedirect();
      }
      return { error: result.error?.message };
    },
    [runPendingRedirect],
  );

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await authClient.signUp.email({ name, email, password });
      if (!result.error) {
        setIsAuthModalOpen(false);
        runPendingRedirect();
      }
      return { error: result.error?.message };
    },
    [runPendingRedirect],
  );

  const logout = useCallback(() => {
    authClient.signOut();
  }, []);

  const openAuthModal = (onSuccess?: () => void) => {
    setPendingRedirect(onSuccess ? () => onSuccess : null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingRedirect(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthModalOpen,
        isLoading: isPending,
        login,
        loginWithEmail,
        registerWithEmail,
        logout,
        openAuthModal,
        closeAuthModal,
        pendingRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
