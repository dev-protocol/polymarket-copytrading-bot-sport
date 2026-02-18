import type { ClobClient } from "@polymarket/clob-client";
import { OrderType, Side } from "@polymarket/clob-client";
import { BigNumber } from "../utils/math";
import type { AppConfig } from "../types";
import { DATA_API, EXIT_INTERVAL_MS, POSITIONS_MAX_OFFSET, POSITIONS_PAGE_SIZE } from "../constant";

interface Entry {
  entryPrice: BigNumber;
  size: BigNumber;
  maxPrice: BigNumber;
}

const entries = new Map<string, Entry>();

/** Called after a BUY is filled. (assetId, size, price). */
export function recordEntry(assetId: string, size: number, price: number): void {
  const sizeB = BigNumber(size);
  const priceB = BigNumber(price);
  const cur = entries.get(assetId);
  if (cur) {
    const newSize = cur.size.add(sizeB);
    cur.entryPrice = cur.entryPrice.mul(cur.size).add(priceB.mul(sizeB)).div(newSize);
    cur.size = newSize;
  } else {
    entries.set(assetId, { entryPrice: priceB, size: sizeB, maxPrice: priceB });
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
      const positions: Array<{ asset: string; size: number; curPrice: number }> = [];
      let offset = 0;
      while (offset <= POSITIONS_MAX_OFFSET) {
        const url = `${DATA_API}/positions?user=${encodeURIComponent(walletAddress)}&limit=${POSITIONS_PAGE_SIZE}&offset=${offset}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const page = (await res.json()) as Array<{ asset: string; size: number; curPrice: number }>;
        positions.push(...page);
        if (page.length < POSITIONS_PAGE_SIZE) break;
        offset += POSITIONS_PAGE_SIZE;
      }
      for (const p of positions) {
        const entry = entries.get(p.asset);
        if (!entry || entry.size.lte(0)) continue;
        const curPriceB = BigNumber(p.curPrice);
        const posSizeB = BigNumber(p.size);
        const sizeB = entry.size.lte(posSizeB) ? entry.size : posSizeB;
        if (sizeB.lte(0)) continue;
        const pnlPctB = curPriceB.minus(entry.entryPrice).div(entry.entryPrice).mul(100);
        const pnlPct = pnlPctB.toNumber();
        const e = entries.get(p.asset)!;
        if (curPriceB.gt(e.maxPrice)) e.maxPrice = curPriceB;
        const trailPctB = e.maxPrice.gt(0)
          ? e.maxPrice.minus(curPriceB).div(e.maxPrice).mul(100)
          : BigNumber(0);
        const trailPct = trailPctB.toNumber();

        let shouldSell = false;
        if (takeProfit > 0 && pnlPct >= takeProfit) shouldSell = true;
        if (stopLoss > 0 && pnlPct <= -stopLoss) shouldSell = true;
        if (trailingStop > 0 && trailPct >= trailingStop) shouldSell = true;
        if (!shouldSell) continue;

        const amount = sizeB.mul(curPriceB).toNumber();
        const tickSize = await client.getTickSize(p.asset);
        const negRisk = await client.getNegRisk(p.asset);
        await client.createAndPostMarketOrder(
          { tokenID: p.asset, amount, side: Side.SELL, orderType: OrderType.FOK },
          { tickSize, negRisk },
          OrderType.FOK
        );
        e.size = e.size.minus(sizeB);
        if (e.size.lte(0)) entries.delete(p.asset);
      }
    } catch (e) {
      console.error("exit check", e?.message ?? e);
    }
  }

  setInterval(check, EXIT_INTERVAL_MS);
  check();
}
