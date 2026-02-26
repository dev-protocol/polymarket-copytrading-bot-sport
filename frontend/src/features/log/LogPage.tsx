import type { TradeLog } from "../../types/state";

interface LogPageProps {
  logs: TradeLog[];
}

export function LogPage({ logs }: LogPageProps) {
  const rows = [...logs].reverse();
  return (
    <div className="flex-1 overflow-auto overflow-x-auto min-h-0 flex flex-col">
      <p className="text-[11px] text-[#666] mb-2 shrink-0">Showing {logs.length} log entries (newest first).</p>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left text-[#888] font-medium border-b border-[#333]">Time</th>
            <th className="p-2 text-left text-[#888] font-medium border-b border-[#333]">Tag</th>
            <th className="p-2 text-left text-[#888] font-medium border-b border-[#333]">Side</th>
            <th className="p-2 text-left text-[#888] font-medium border-b border-[#333]">Outcome</th>
            <th className="p-2 text-left text-[#888] font-medium border-b border-[#333]">Size</th>
            <th className="p-2 text-left text-[#888] font-medium border-b border-[#333]">Price</th>
            <th className="p-2 text-left text-[#888] font-medium border-b border-[#333]">Market</th>
            <th className="p-2 text-left text-[#888] font-medium border-b border-[#333]">Target</th>
            <th className="p-2 text-left text-[#888] font-medium border-b border-[#333]">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.time}-${i}`} className="border-b border-[#333]">
              <td className="p-2">{r.time.slice(11, 19)}</td>
              <td className="p-2">{r.tag}</td>
              <td className={`p-2 font-medium ${r.side === "BUY" ? "text-[#6f6]" : "text-[#f66]"}`}>
                {r.side}
              </td>
              <td className="p-2">{r.outcome}</td>
              <td className="p-2 tabular-nums">
                {r.size != null && r.size !== "" ? Number(r.size).toFixed(2) : r.size ?? ""}
              </td>
              <td className="p-2">{r.price}</td>
              <td className="p-2 text-[#ccc] break-words">{r.slug}</td>
              <td className="p-2 font-mono text-[11px] text-[#8af] break-all">
                {r.targetAddress ?? ""}
              </td>
              <td className="p-2">{r.copyStatus ?? r.extra ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
