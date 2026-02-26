import type { BotState } from "../../types/state";

interface SettingsPageProps {
  state: BotState | null;
}

export function SettingsPage({ state }: SettingsPageProps) {
  const mode = state?.status?.mode ?? "—";
  const targets = state?.status?.targets ?? 0;
  const addresses = state?.status?.targetAddresses ?? [];
  const wallet = state?.status?.wallet ?? "—";
  const ui = state?.ui ?? { deltaHighlightSec: 10, deltaAnimationSec: 2 };

  return (
    <div className="flex-1 overflow-auto text-[#888] p-4">
      <h1 className="text-lg font-medium text-[#ccc] mb-2">Settings</h1>
      <p className="text-sm mb-4">Current bot configuration (read-only).</p>
      <div className="flex flex-col gap-3 max-w-md">
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3 flex items-center justify-between gap-2">
          <span className="text-sm text-[#aaa]">Mode</span>
          <span className="text-xs text-[#ccc] font-medium">{mode}</span>
        </div>
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3 flex items-center justify-between gap-2">
          <span className="text-sm text-[#aaa]">Targets</span>
          <span className="text-xs text-[#ccc] tabular-nums">{targets}</span>
        </div>
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3 flex flex-col gap-1">
          <span className="text-sm text-[#aaa]">Target addresses</span>
          <span className="text-xs text-[#ccc] font-mono break-all">
            {addresses.length ? addresses.join(", ") : "—"}
          </span>
        </div>
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3 flex items-center justify-between gap-2">
          <span className="text-sm text-[#aaa]">Wallet</span>
          <span className="text-xs text-[#ccc] font-mono break-all max-w-[200px] truncate" title={wallet}>
            {wallet}
          </span>
        </div>
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3 flex items-center justify-between gap-2">
          <span className="text-sm text-[#aaa]">Delta highlight (sec)</span>
          <span className="text-xs text-[#ccc] tabular-nums">{ui.deltaHighlightSec}</span>
        </div>
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3 flex items-center justify-between gap-2">
          <span className="text-sm text-[#aaa]">Delta animation (sec)</span>
          <span className="text-xs text-[#ccc] tabular-nums">{ui.deltaAnimationSec}</span>
        </div>
      </div>
    </div>
  );
}
