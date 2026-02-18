import { ClobClient, OrderType, Side } from "@polymarket/clob-client";
import { BigNumber } from "../utils/math";
import type { LeaderTrade, ActivityTradePayload } from "../types";

/** Returns { size, price } for BUY when filled (for exit tracking), else void. */
export async function copyTrade(
  client: ClobClient,
  trade: LeaderTrade,
  multiplier: number,
  chainId: number,
  buyAmountLimitInUsd: number = 0
): Promise<{ size: number; price: number } | void> {
  const sizeB = BigNumber(trade.size);
  const priceB = BigNumber(trade.price);
  const multB = BigNumber(multiplier);
  let amountB =
    trade.side === Side.BUY ? sizeB.mul(priceB).mul(multB) : sizeB.mul(multB);
  let sizeOutB = sizeB;

  if (trade.side === Side.BUY && buyAmountLimitInUsd > 0) {
    const amountUsdB = sizeB.mul(priceB).mul(multB);
    const limitB = BigNumber(buyAmountLimitInUsd);
    if (amountUsdB.gt(limitB)) {
      amountB = limitB;
      sizeOutB = limitB.div(priceB);
    }
  }

  if (amountB.lte(0)) return;

  const amount = amountB.toNumber();
  const order = {
    tokenID: trade.asset_id,
    amount,
    side: trade.side as Side,
    orderType: OrderType.FOK as OrderType.FOK,
  };

  const tickSize = await client.getTickSize(trade.asset_id);
  const negRisk = await client.getNegRisk(trade.asset_id);
  await client.createAndPostMarketOrder(order, { tickSize, negRisk }, OrderType.FOK);

  if (trade.side === Side.BUY) {
    return { size: sizeOutB.toNumber(), price: priceB.toNumber() };
  }
}

export function activityPayloadToLeaderTrade(p: ActivityTradePayload): LeaderTrade | null {
  if (!p.asset || p.side == null || p.size == null || p.price == null) return null;
  const id = (p.transactionHash ?? "") + (p.timestamp ?? 0);
  return {
    id,
    asset_id: p.asset,
    market: p.conditionId ?? "",
    side: p.side,
    size: String(p.size),
    price: String(p.price),
    match_time: String(p.timestamp ?? 0),
    slug: p.slug,
    eventSlug: p.eventSlug,
    outcome: p.outcome,
    title: p.title,
  };
}
