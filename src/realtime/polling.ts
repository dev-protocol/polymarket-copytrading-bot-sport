import { DATA_API } from "../constant";
import { AppConfig, LeaderTrade } from "../types";

interface Position {
  asset: string;
  conditionId: string;
  size: number;
  curPrice: number;
  slug?: string;
  outcome?: string;
  endDate?: string;
}

function isExpired(endDate?: string): boolean {
  if (!endDate) return false;
  const t = new Date(endDate).getTime();
  return !isNaN(t) && t < Date.now();
}

interface PositionSnapshot {
  [asset: string]: {
    size: number;
    curPrice: number;
    slug?: string;
    outcome?: string;
    conditionId: string;
    endDate?: string;
  };
}

export function fmtTime(): string {
  return new Date().toISOString();
}

function logPositionsAll(user: string, curr: PositionSnapshot): void {
  const prefix = `${fmtTime()} | INIT | ${user}`;
  const entries = Object.entries(curr).map(
    ([asset, c]) => `  ${c.slug ?? asset.slice(0, 12) + "…"} ${c.outcome ?? "?"} size ${c.size} @ ${c.curPrice}`
  );
  console.log(entries.length ? `${prefix}\n${entries.join("\n")}` : `${prefix} | (none)`);
}

function logPositionChanges(user: string, curr: PositionSnapshot, prev: PositionSnapshot): void {
  const prefix = `${fmtTime()} | POS | ${user}`;
  const lines: string[] = [];
  for (const [asset, c] of Object.entries(curr)) {
    const p = prev[asset];
    const prevSize = p?.size ?? 0;
    const delta = c.size - prevSize;
    if (delta !== 0) {
      const sign = delta > 0 ? "+" : "";
      const slug = c.slug ?? asset.slice(0, 12) + "…";
      const outcome = c.outcome ?? "?";
      lines.push(`  ${slug} ${outcome} ${sign}${delta} @ ${c.curPrice}`);
    }
  }
  for (const asset of Object.keys(prev)) {
    if (!(asset in curr)) {
      const p = prev[asset];
      const slug = p?.slug ?? asset.slice(0, 12) + "…";
      const outcome = p?.outcome ?? "?";
      lines.push(`  ${slug} ${outcome} -${p.size} @ ${p.curPrice}`);
    }
  }
  console.log(lines.length ? `${prefix}\n${lines.join("\n")}` : `${prefix} | (no changes)`);
}

const POSITIONS_PAGE_SIZE = 500;
const POSITIONS_MAX_OFFSET = 10_000;

async function fetchPositions(user: string): Promise<Position[]> {
  const all: Position[] = [];
  let offset = 0;
  while (offset <= POSITIONS_MAX_OFFSET) {
    const url = `${DATA_API}/positions?user=${encodeURIComponent(user)}&limit=${POSITIONS_PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`positions ${res.status}`);
    const page = (await res.json()) as Position[];
    const valid = page.filter(
      (p) =>
        p.asset &&
        p.size > 0 &&
        (p.curPrice ?? 0) > 0 &&
        !isExpired(p.endDate)
    );
    all.push(...valid);
    if (page.length < POSITIONS_PAGE_SIZE) break;
    offset += POSITIONS_PAGE_SIZE;
  }
  return all;
}

export function runPositionPolling(
  config: AppConfig,
  onTrade: (trade: LeaderTrade, fromUser: string) => void
): void {
  const targets = config.copy.targetAddresses.map((a) => a.toLowerCase());
  const prev: Record<string, PositionSnapshot> = {};
  const intervalMs = Math.max(5000, config.copy.pollIntervalSec * 1000);

  async function poll() {
    for (const user of targets) {
      try {
        const positions = await fetchPositions(user);
        const curr: PositionSnapshot = {};
        for (const p of positions) {
          curr[p.asset] = {
            size: p.size,
            curPrice: p.curPrice,
            slug: p.slug,
            outcome: p.outcome,
            conditionId: p.conditionId,
            endDate: p.endDate,
          };
        }

        const pprev = prev[user];
        if (!pprev) {
          prev[user] = curr;
          logPositionsAll(user, curr);
          continue;
        }
        logPositionChanges(user, curr, pprev);
        for (const [asset, c] of Object.entries(curr)) {
          const s = pprev[asset]?.size ?? 0;
          const delta = c.size - s;
          if (delta > 0) {
            const trade: LeaderTrade = {
              id: `${user}-${asset}-${Date.now()}`,
              asset_id: asset,
              market: c.conditionId,
              side: "BUY",
              size: String(delta),
              price: String(c.curPrice),
              match_time: String(Date.now()),
              slug: c.slug,
              outcome: c.outcome,
              endDate: c.endDate,
            };
            onTrade(trade, user);
          } else if (delta < 0 && s > 0) {
            const trade: LeaderTrade = {
              id: `${user}-${asset}-${Date.now()}`,
              asset_id: asset,
              market: c.conditionId,
              side: "SELL",
              size: String(-delta),
              price: String(c.curPrice),
              match_time: String(Date.now()),
              slug: c.slug,
              outcome: c.outcome,
              endDate: c.endDate,
            };
            onTrade(trade, user);
          }
        }
        for (const asset of Object.keys(pprev)) {
          if (!(asset in curr)) {
            const s = pprev[asset];
            const trade: LeaderTrade = {
              id: `${user}-${asset}-${Date.now()}`,
              asset_id: asset,
              market: s.conditionId,
              side: "SELL",
              size: String(s.size),
              price: String(s.curPrice),
              match_time: String(Date.now()),
              slug: s.slug,
              outcome: s.outcome,
              endDate: s.endDate,
            };
            onTrade(trade, user);
          }
        }
        prev[user] = curr;
      } catch (e) {
        console.error(`${fmtTime()} | poll ${user}`, e?.message ?? e);
      }
    }
  }

  console.log(`${fmtTime()} | polling ${targets.length} targets every ${config.copy.pollIntervalSec}s`);
  poll();
  setInterval(poll, intervalMs);
}
