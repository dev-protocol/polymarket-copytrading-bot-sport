import { ReactNode } from "react";

interface LayoutProps {
  nav: ReactNode;
  header: ReactNode;
  main: ReactNode;
  aside?: ReactNode;
}

export function Layout({ nav, header, main, aside }: LayoutProps) {
  return (
    <div className="flex h-screen max-h-screen overflow-hidden">
      <nav className="w-[140px] shrink-0 border-r border-[#333] bg-[#1a1a1a] flex flex-col">
        {nav}
      </nav>
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden p-3 gap-2">
        <header className="shrink-0 flex items-center gap-3">{header}</header>
        <div className="flex flex-1 min-h-0 overflow-hidden gap-0">
          <main className="flex-1 min-w-0 overflow-hidden flex flex-col">{main}</main>
          {aside != null && (
            <aside className="w-[420px] min-w-[320px] shrink-0 overflow-hidden flex flex-col p-3">
              {aside}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
