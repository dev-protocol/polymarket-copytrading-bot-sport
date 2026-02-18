import type { AppConfig, LeaderTrade } from "../types";

/**
 * Returns true if the trade passes all filters and should be copied.
 * - revertTrade: when false, only copy BUYs (skip SELLs).
 * - entryTradeSec: skip if leader's trade is older than N seconds.
 * - tradeSecFromResolve: skip if market endDate is within N seconds from now.
 */
export function shouldCopyTrade(config: AppConfig, trade: LeaderTrade): boolean {
  const { copy, filter } = config;

  if (trade.side === "SELL" && !copy.revertTrade) return false;

  if (filter.entryTradeSec > 0) {
    const matchTime = parseInt(trade.match_time, 10) || 0;
    const matchTimeMs = matchTime >= 1e12 ? matchTime : matchTime * 1000;
    const ageSec = (Date.now() - matchTimeMs) / 1000;
    if (matchTime > 0 && ageSec > filter.entryTradeSec) return false;
  }

  if (filter.tradeSecFromResolve > 0 && trade.endDate) {
    const endMs = new Date(trade.endDate).getTime();
    if (!isNaN(endMs)) {
      const secToResolve = (endMs - Date.now()) / 1000;
      if (secToResolve < filter.tradeSecFromResolve) return false;
    }
  }

  return true;
}
