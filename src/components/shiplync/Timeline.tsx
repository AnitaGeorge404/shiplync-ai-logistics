import { Check } from "lucide-react";

type Event = {
  key: string;
  label: string;
  time: string;
  location?: string;
  note?: string;
  done: boolean;
};

export function Timeline({ events }: { events: Event[] }) {
  return (
    <ol className="relative">
      {events.map((e, i) => (
        <li key={e.key} className="pl-10 pb-6 relative">
          {i < events.length - 1 && (
            <span
              className={`absolute left-[15px] top-6 bottom-0 w-px ${e.done ? "bg-primary/50" : "bg-border"}`}
            />
          )}
          <span
            className={`absolute left-1 top-1 h-7 w-7 rounded-full grid place-items-center border-2 ${
              e.done ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"
            }`}
          >
            {e.done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
          </span>
          <div className="flex items-center justify-between gap-4">
            <div className={`text-sm font-medium ${e.done ? "" : "text-muted-foreground"}`}>{e.label}</div>
            <div className="text-xs text-muted-foreground shrink-0">{e.time}</div>
          </div>
          {(e.location || e.note) && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {e.location && <span>{e.location}</span>}
              {e.location && e.note && <span className="mx-1.5">·</span>}
              {e.note && <span>{e.note}</span>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
