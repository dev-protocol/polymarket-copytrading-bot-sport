import { ClobClient, OrderType, Side } from "@polymarket/clob-client";
import type { LeaderTrade, ActivityTradePayload } from "../types";

/** Returns { size, price } for BUY when filled (for exit tracking), else void. */
export async function copyTrade(
  client: ClobClient,
  trade: LeaderTrade,
  multiplier: number,
  chainId: number,
  buyAmountLimitInUsd: number = 0
): Promise<{ size: number; price: number } | void> {
  let sizeNum = parseFloat(trade.size);
  const priceNum = parseFloat(trade.price);
  let amount =
    trade.side === Side.BUY ? sizeNum * priceNum * multiplier : sizeNum * multiplier;

  if (trade.side === Side.BUY && buyAmountLimitInUsd > 0) {
    const amountUsd = sizeNum * priceNum * multiplier;
    if (amountUsd > buyAmountLimitInUsd) {
      amount = buyAmountLimitInUsd;
      sizeNum = buyAmountLimitInUsd / priceNum;
    }
  }

  if (amount <= 0) return;

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
    return { size: sizeNum, price: priceNum };
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
