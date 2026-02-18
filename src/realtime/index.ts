import { RealTimeDataClient } from "@polymarket/real-time-data-client";
import type { AppConfig, ActivityTradePayload } from "../types";
import { copyTrade, activityPayloadToLeaderTrade } from "../trading";
import { shouldCopyTrade } from "../filter";
import { recordEntry } from "../exit";
import type { ClobClient } from "@polymarket/clob-client";

const MAX_SEEN = 5000;

function fmtTime(): string {
  return new Date().toISOString();
}

export function logTrade(
  tag: string,
  trade: { side: string; size: string; price: string; asset_id: string; slug?: string; outcome?: string },
  extra?: string
): void {
  const slug = trade.slug ?? trade.asset_id.slice(0, 12) + "…";
  const outcome = trade.outcome ?? "?";
  const line = [fmtTime(), tag, trade.side, outcome, `size ${trade.size} @ ${trade.price}`, slug].join(" | ");
  console.log(extra ? `${line} | ${extra}` : line);
}

function pruneSeen(seen: Set<string>): void {
  if (seen.size <= MAX_SEEN) return;
  const arr = [...seen].slice(-MAX_SEEN / 2);
  seen.clear();
  arr.forEach((id) => seen.add(id));
}

export function runActivityStream(client: ClobClient | null, config: AppConfig): void {
  const target = config.copy.targetAddress.toLowerCase();
  const seen = new Set<string>();

  const rt = new RealTimeDataClient({
    autoReconnect: true,
    onConnect(rtClient) {
      console.log(`${fmtTime()} | stream connected, watching ${target}`);
      rtClient.subscribe({
        subscriptions: [{ topic: "activity", type: "trades" }],
      });
    },
    onMessage(_, message) {
      if (message.topic !== "activity" || message.type !== "trades") return;
      const p = message.payload as Record<string, unknown>;
      const proxy = (p.proxyWallet as string)?.toLowerCase();
      if (!proxy || proxy !== target) return;
      const trade = activityPayloadToLeaderTrade(p as ActivityTradePayload);
      if (!trade) return;
      if (seen.has(trade.id)) return;
      seen.add(trade.id);
      pruneSeen(seen);
      if (!shouldCopyTrade(config, trade)) return;
      if (config.simulationMode) {
        logTrade("SIM", trade, "skipped");
      } else if (client) {
        copyTrade(
          client,
          trade,
          config.copy.sizeMultiplier,
          config.chainId,
          config.filter.buyAmountLimitInUsd
        )
          .then((filled) => {
            if (filled && trade.side === "BUY") recordEntry(trade.asset_id, filled.size, filled.price);
            logTrade("LIVE", trade, "ok");
          })
          .catch((e) => {
            logTrade("LIVE", trade, "FAILED");
            console.error("  ", e?.message ?? e);
          });
      }
    },
  });
  rt.connect();
}
