import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";

export function ComingSoon({ title, back }: { title: string; back: string }) {
  return (
    <div className="max-w-lg mx-auto py-16">
      <div className="card-elevated p-8 text-center">
        <div className="mx-auto h-10 w-10 rounded-md bg-muted grid place-items-center text-muted-foreground">
          <Construction className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This module isn't built yet. Core flows are live in the primary dashboards.
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
