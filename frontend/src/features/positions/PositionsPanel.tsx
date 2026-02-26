import { useState, useMemo } from "react";
import type { PositionSummary } from "../../types/state";

interface PositionsPanelProps {
  targetAddresses: string[];
  positions: Record<string, PositionSummary[]>;
  deltaHighlightSec: number;
  deltaAnimationSec: number;
}

function fmtDuration(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function UserBlock({
  addr,
  positions: rawPos,
  deltaHighlightSec,
  deltaAnimationSec,
}: {
  addr: string;
  positions: PositionSummary[];
  deltaHighlightSec: number;
  deltaAnimationSec: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const recentByKey = useMemo(() => ({ current: {} as Record<string, number> }), []);
  const key = addr + "|";
  rawPos.forEach((p) => {
    const pk = key + (p.slug ?? "?") + "|" + (p.outcome ?? "?");
    if (p.delta != null && p.deltaAt)
      recentByKey.current[pk] = new Date(p.deltaAt).getTime();
  });
  const positions = useMemo(() => {
    const now = Date.now();
    return [...rawPos].sort((a, b) => {
      const aKey = key + (a.slug ?? "?") + "|" + (a.outcome ?? "?");
      const bKey = key + (b.slug ?? "?") + "|" + (b.outcome ?? "?");
      const aAt = a.deltaAt ? new Date(a.deltaAt).getTime() : recentByKey.current[aKey];
      const bAt = b.deltaAt ? new Date(b.deltaAt).getTime() : recentByKey.current[bKey];
      const aRecent = aAt && now - aAt < deltaHighlightSec * 1000 ? 1 : 0;
      const bRecent = bAt && now - bAt < deltaHighlightSec * 1000 ? 1 : 0;
      if (aRecent !== bRecent) return bRecent - aRecent;
      return 0;
    });
  }, [rawPos, key, deltaHighlightSec, recentByKey]);

  const mostRecentAt = positions.reduce(
    (acc, p) => (p.deltaAt ? Math.max(acc, new Date(p.deltaAt).getTime()) : acc),
    0
  );
  const atStr = mostRecentAt ? fmtDuration(new Date(mostRecentAt).toISOString()) : "";
  const summary = `${positions.length} position(s)${atStr ? ` • ${atStr}` : ""}`;

  return (
    <div className="mb-4 last:mb-0">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-1.5 w-full text-left hover:text-white cursor-pointer"
      >
        <span
          className={`text-[10px] text-[#666] transition-transform ${expanded ? "rotate-90 text-[#8af]" : ""}`}
        >
          ▶
        </span>
        <span className="font-mono text-[11px] text-[#8af] break-all">{addr}</span>
      </button>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="block w-full mt-1.5 mb-2 text-left text-[11px] p-2 bg-[#252525] border border-[#333] rounded cursor-pointer hover:bg-[#2a2a2a]"
      >
        {summary}
      </button>
      {expanded && (
        <div className="mt-2">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr>
                <th className="text-[#888] font-medium text-left py-1 pr-2 border-b border-[#333]">
                  Slug
                </th>
                <th className="text-[#888] font-medium text-left py-1 pr-2 border-b border-[#333]">
                  Outcome
                </th>
                <th className="text-[#888] font-medium text-left py-1 pr-2 border-b border-[#333]">
                  Size
                </th>
                <th className="text-[#888] font-medium text-left py-1 pr-2 border-b border-[#333]">
                  Price
                </th>
                <th className="text-[#888] font-medium text-right py-1 pr-0 border-b border-[#333]">
                  Δ
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => {
                const deltaCls =
                  p.delta != null
                    ? p.delta > 0
                      ? "text-[#6f6] font-semibold"
                      : "text-[#f66] font-semibold"
                    : "";
                const deltaStr =
                  p.delta != null ? (p.delta > 0 ? "+" : "") + Number(p.delta).toFixed(2) : "";
                const deltaStyle =
                  p.delta != null
                    ? { animation: `deltaFlash ${deltaAnimationSec}s ease-out forwards` }
                    : undefined;
                return (
                  <tr key={`${p.slug}-${p.outcome}-${i}`} className="border-b border-[#2a2a2a] last:border-0">
                    <td className="py-1 pr-2 text-[#ccc] break-words" title={p.slug}>
                      {p.slug ?? "?"}
                    </td>
                    <td className="py-1 pr-2 text-[#aaa] font-medium">{p.outcome ?? "?"}</td>
                    <td className="py-1 pr-2 text-[#888] tabular-nums whitespace-nowrap">
                      {p.size}
                    </td>
                    <td className="py-1 pr-2 text-[#888] tabular-nums whitespace-nowrap">
                      {p.curPrice}
                    </td>
                    <td className={`py-1 text-right tabular-nums min-w-[3.5em] ${deltaCls}`} style={deltaStyle}>
                      {deltaStr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function PositionsPanel({
  targetAddresses,
  positions,
  deltaHighlightSec,
  deltaAnimationSec,
}: PositionsPanelProps) {
  const users = targetAddresses?.length ? targetAddresses : Object.keys(positions);
  if (!users.length) {
    return (
      <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3 flex-1 min-h-0 flex flex-col overflow-hidden">
        <h3 className="text-[11px] text-[#888] uppercase mb-2">Live positions</h3>
        <p className="text-[#666] text-xs">No targets</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3 flex-1 min-h-0 flex flex-col overflow-hidden">
      <h3 className="text-[11px] text-[#888] uppercase mb-2">Live positions</h3>
      <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
        {users.map((addr) => {
          const posKey = Object.keys(positions).find(
            (k) => k.toLowerCase() === addr.toLowerCase()
          );
          const pos = posKey ? (positions[posKey] ?? []) : [];
          return (
            <UserBlock
              key={addr}
              addr={addr}
              positions={pos}
              deltaHighlightSec={deltaHighlightSec}
              deltaAnimationSec={deltaAnimationSec}
            />
          );
        })}
      </div>
    </div>
  );
}
