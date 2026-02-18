import type { ClobClient } from "@polymarket/clob-client";
import { OrderType, Side } from "@polymarket/clob-client";
import type { AppConfig } from "../types";

const DATA_API = "https://data-api.polymarket.com";
const EXIT_INTERVAL_MS = 15_000;

interface Entry {
  entryPrice: number;
  size: number;
  maxPrice: number;
}

const entries = new Map<string, Entry>();

/** Called after a BUY is filled. (assetId, size, price). */
export function recordEntry(assetId: string, size: number, price: number): void {
  const cur = entries.get(assetId);
  if (cur) {
    cur.size += size;
    cur.entryPrice = (cur.entryPrice * (cur.size - size) + price * size) / cur.size;
  } else {
    entries.set(assetId, { entryPrice: price, size, maxPrice: price });
  }
}

export function runExitLoop(client: ClobClient, config: AppConfig): void {
  const { exit: exitConfig, walletAddress } = config;
  if (!walletAddress) return;
  const hasExit = exitConfig.takeProfit > 0 || exitConfig.stopLoss > 0 || exitConfig.trailingStop > 0;
  if (!hasExit) return;

  const takeProfit = exitConfig.takeProfit;
  const stopLoss = exitConfig.stopLoss;
  const trailingStop = exitConfig.trailingStop;

  async function check(): Promise<void> {
    try {
      const url = `${DATA_API}/positions?user=${encodeURIComponent(walletAddress)}&limit=500`;
      const res = await fetch(url);
      if (!res.ok) return;
      const positions = (await res.json()) as Array<{ asset: string; size: number; curPrice: number }>;
      for (const p of positions) {
        const entry = entries.get(p.asset);
        if (!entry || entry.size <= 0) continue;
        const curPrice = p.curPrice;
        const size = Math.min(entry.size, p.size);
        if (size <= 0) continue;
        const pnlPct = ((curPrice - entry.entryPrice) / entry.entryPrice) * 100;
        const e = entries.get(p.asset)!;
        if (curPrice > e.maxPrice) e.maxPrice = curPrice;
        const trailPct = e.maxPrice > 0 ? ((e.maxPrice - curPrice) / e.maxPrice) * 100 : 0;

        let shouldSell = false;
        if (takeProfit > 0 && pnlPct >= takeProfit) shouldSell = true;
        if (stopLoss > 0 && pnlPct <= -stopLoss) shouldSell = true;
        if (trailingStop > 0 && trailPct >= trailingStop) shouldSell = true;
        if (!shouldSell) continue;

        const amount = size * curPrice;
        const tickSize = await client.getTickSize(p.asset);
        const negRisk = await client.getNegRisk(p.asset);
        await client.createAndPostMarketOrder(
          { tokenID: p.asset, amount, side: Side.SELL, orderType: OrderType.FOK },
          { tickSize, negRisk },
          OrderType.FOK
        );
        e.size -= size;
        if (e.size <= 0) entries.delete(p.asset);
      }
    } catch (e) {
      console.error("exit check", e?.message ?? e);
    }
  }

  setInterval(check, EXIT_INTERVAL_MS);
  check();
}
