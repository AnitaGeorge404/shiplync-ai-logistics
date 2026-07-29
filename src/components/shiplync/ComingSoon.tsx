import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";

export function ComingSoon({ title, back }: { title: string; back: string }) {
  return (
    <div className="max-w-2xl mx-auto py-16">
      <div className="card-elevated p-10 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 grid place-items-center text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This surface is part of the ShipLync roadmap. Core flows are live in the primary dashboards — the AI Coordinator is training on this workflow now.
        </p>
        <div className="mt-5">
          <Link to={back}>
            <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
