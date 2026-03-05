"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function AgendaHeaderControls({
  currentDateStr,
  currentView,
}: {
  currentDateStr: string;
  currentView: "day" | "week";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleNavigate = (direction: "prev" | "next" | "today") => {
    const params = new URLSearchParams(searchParams.toString());
    
    let baseDate = new Date(`${currentDateStr}T12:00:00`);
    if (direction === "today") {
      baseDate = new Date();
    } else {
      const offset = currentView === "week" ? 7 : 1;
      const multiplier = direction === "next" ? 1 : -1;
      baseDate.setDate(baseDate.getDate() + offset * multiplier);
    }

    const yyyy = baseDate.getFullYear();
    const mm = String(baseDate.getMonth() + 1).padStart(2, "0");
    const dd = String(baseDate.getDate()).padStart(2, "0");
    
    params.set("date", `${yyyy}-${mm}-${dd}`);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleViewChange = (view: "day" | "week") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center rounded-lg border border-border-strong bg-surface p-1 shadow-sm">
        <button
          onClick={() => handleViewChange("day")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            currentView === "day"
              ? "bg-brand text-bg-base shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          Dia
        </button>
        <button
          onClick={() => handleViewChange("week")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            currentView === "week"
              ? "bg-brand text-bg-base shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          Semana
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleNavigate("today")}
          className="rounded-lg border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover shadow-sm"
        >
          Hoje
        </button>
        <div className="flex items-center rounded-lg border border-border-strong bg-surface shadow-sm overflow-hidden">
          <button
            onClick={() => handleNavigate("prev")}
            className="flex h-9 w-10 items-center justify-center border-r border-border-strong transition-colors hover:bg-surface-hover active:bg-surface"
          >
            <span className="material-symbols-outlined text-[20px] text-text-muted">
              chevron_left
            </span>
          </button>
          <button
            onClick={() => handleNavigate("next")}
            className="flex h-9 w-10 items-center justify-center transition-colors hover:bg-surface-hover active:bg-surface"
          >
            <span className="material-symbols-outlined text-[20px] text-text-muted">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
