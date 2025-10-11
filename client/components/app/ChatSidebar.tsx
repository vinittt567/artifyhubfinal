import { cn } from "@/lib/utils";

export type Conversation = {
  id: string;
  user: { name: string; username: string; avatarUrl?: string; online?: boolean };
  last: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ChatSidebar({
  items,
  selectedId,
  onSelect,
}: {
  items: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-card/80 p-3 shadow-[16px_16px_40px_rgba(0,0,0,0.18),_-12px_-12px_32px_rgba(255,255,255,0.05)] backdrop-blur">
      <div className="space-y-1">
        {items.map((c) => {
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition",
                active ? "bg-brand/10" : "hover:bg-muted/50",
              )}
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-brand/10 text-brand grid place-items-center font-semibold">
                {c.user.avatarUrl ? (
                  <img src={c.user.avatarUrl} alt={c.user.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials(c.user.name)}</span>
                )}
                {c.user.online && (
                  <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border border-white/20 bg-emerald-500" />)
                }
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.last}</p>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
