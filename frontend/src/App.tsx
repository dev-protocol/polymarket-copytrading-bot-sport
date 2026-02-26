import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Sidebar } from "./components/Sidebar";
import { LogPage } from "./features/log/LogPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { PositionsPanel } from "./features/positions/PositionsPanel";
import { fetchState } from "./api/client";
import type { BotState } from "./types/state";

type Page = "dashboard" | "log" | "setting";

const STORAGE_PAGE = "copybot-page";

function getStoredPage(): Page {
  try {
    const p = localStorage.getItem(STORAGE_PAGE);
    if (p === "dashboard" || p === "log" || p === "setting") return p;
  } catch (_) {}
  return "log";
}

function savePage(page: Page) {
  try {
    localStorage.setItem(STORAGE_PAGE, page);
  } catch (_) {}
}

export default function App() {
  const [page, setPage] = useState<Page>(getStoredPage);
  const [state, setState] = useState<BotState | null>(null);

  useEffect(() => {
    const load = () => {
      fetchState()
        .then(setState)
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const handleNav = (p: Page) => {
    setPage(p);
    savePage(p);
  };

  const mode = state?.status?.mode ?? "";
  const targets = state?.status?.targets ?? 0;
  const targetAddresses = state?.status?.targetAddresses ?? [];
  const ui = state?.ui ?? { deltaHighlightSec: 10, deltaAnimationSec: 2 };

  return (
    <Layout
      nav={<Sidebar current={page} onNavigate={handleNav} />}
      header={
        <>
          <span
            className={`rounded px-2 py-1 text-xs ${
              mode === "Live" ? "bg-[#1a3d1a]" : "bg-[#3d3d1a]"
            } bg-[#2a2a2a]`}
          >
            {mode || "—"}
          </span>
          <div className="rounded bg-[#2a2a2a] px-2 py-1 text-xs flex flex-col gap-0.5">
            <span>{targets} target(s)</span>
            {targetAddresses.length > 0 && (
              <div className="font-mono text-[10px] text-[#888] break-all">
                {targetAddresses.map((addr) => (
                  <span key={addr} className="block">{addr}</span>
                ))}
              </div>
            )}
          </div>
        </>
      }
      main={
        <>
          <div
            className={`flex-1 min-h-0 flex flex-col overflow-hidden ${page !== "log" ? "hidden" : ""}`}
            data-page="log"
          >
            <LogPage logs={state?.logs ?? []} />
          </div>
          <div
            className={`flex-1 min-h-0 flex flex-col overflow-hidden ${page !== "dashboard" ? "hidden" : ""}`}
            data-page="dashboard"
          >
            <DashboardPage state={state} />
          </div>
          <div
            className={`flex-1 min-h-0 flex flex-col overflow-hidden ${page !== "setting" ? "hidden" : ""}`}
            data-page="setting"
          >
            <SettingsPage state={state} />
          </div>
        </>
      }
      aside={
        page === "log"
          ? state
            ? (
                <PositionsPanel
                  targetAddresses={state.status.targetAddresses ?? []}
                  positions={state.positions}
                  deltaHighlightSec={ui.deltaHighlightSec}
                  deltaAnimationSec={ui.deltaAnimationSec}
                />
              )
            : (
                <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3 flex-1 min-h-0 flex items-center justify-center text-[#666] text-sm">
                  Loading…
                </div>
              )
          : undefined
      }
    />
  );
}
