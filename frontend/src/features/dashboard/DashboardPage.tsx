import type { BotState } from "../../types/state";

interface DashboardPageProps {
  state: BotState | null;
}

export function DashboardPage({ state }: DashboardPageProps) {
  const mode = state?.status?.mode ?? "—";
  const targets = state?.status?.targets ?? 0;
  const addresses = state?.status?.targetAddresses ?? [];
  const logs = state?.logs ?? [];
  const recent = [...logs].reverse().slice(0, 5);

  return (
    <div className="flex-1 overflow-auto text-[#888] p-4">
      <h1 className="text-lg font-medium text-[#ccc] mb-2">Dashboard</h1>
      <p className="text-sm mb-4">Overview and current status.</p>
      <div className="grid gap-3 max-w-md">
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3">
          <span className="text-xs text-[#666]">Mode</span>
          <p className="text-[#aaa]">{mode}</p>
        </div>
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3">
          <span className="text-xs text-[#666]">Targets</span>
          <p className="text-[#aaa]">{targets} target(s)</p>
          {addresses.length > 0 && (
            <div className="text-[#666] text-xs mt-1 font-mono break-all space-y-0.5">
              {addresses.map((addr) => (
                <p key={addr} className="break-all">{addr}</p>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3">
          <span className="text-xs text-[#666]">Recent activity</span>
          {recent.length === 0 ? (
            <p className="text-[#666] text-sm">No activity yet.</p>
          ) : (
            <ul className="text-[#aaa] text-sm mt-1 space-y-1">
              {recent.map((r, i) => (
                <li key={`${r.time}-${i}`}>
                  {r.time.slice(11, 19)} {r.side} {r.outcome} @ {r.price} — {r.slug ?? "—"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
