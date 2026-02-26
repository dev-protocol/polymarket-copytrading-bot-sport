type Page = "dashboard" | "log" | "setting";

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

const PAGES: { id: Page; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "log", label: "Log" },
  { id: "setting", label: "Settings" },
];

export function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <div className="flex flex-col py-2">
      {PAGES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onNavigate(id)}
          className={`px-3 py-2 text-left text-sm border-l-3 border-transparent transition-colors ${
            current === id
              ? "text-[#8af] border-[#8af] bg-[#222]"
              : "text-[#888] hover:text-[#ccc]"
          }`}
          style={{ borderLeftWidth: "3px" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
