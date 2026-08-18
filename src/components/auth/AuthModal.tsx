import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoginForm } from "./LoginForm";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, pendingRedirect } = useAuth();

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-md p-6 overflow-hidden border-border bg-background shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Sign in to ShipLync</DialogTitle>
          <DialogDescription>
            Authentication required to access shipment booking and tracking features.
          </DialogDescription>
        </DialogHeader>
        <LoginForm
          onSuccess={() => {
            closeAuthModal();
          }}
          compact
        />
      </DialogContent>
    </Dialog>
  );
};
