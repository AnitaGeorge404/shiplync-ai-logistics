import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  accountType: "individual" | "business";
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  login: (userData?: Partial<UserProfile>) => void;
  logout: () => void;
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  pendingRedirect: (() => void) | null;
}

const DEFAULT_USER: UserProfile = {
  id: "USR-94821",
  name: "Aditi Kapoor",
  email: "aditi.kapoor@example.com",
  phone: "+91 98765 43210",
  accountType: "individual",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("shiplync_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem("shiplync_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("shiplync_user");
    }
  }, [user]);

  const login = (customData?: Partial<UserProfile>) => {
    const updatedUser: UserProfile = {
      ...DEFAULT_USER,
      ...customData,
    };
    setUser(updatedUser);
    setIsAuthModalOpen(false);
    
    if (pendingRedirect) {
      pendingRedirect();
      setPendingRedirect(null);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const openAuthModal = (onSuccess?: () => void) => {
    if (onSuccess) {
      setPendingRedirect(() => onSuccess);
    } else {
      setPendingRedirect(null);
    }
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
        login,
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
