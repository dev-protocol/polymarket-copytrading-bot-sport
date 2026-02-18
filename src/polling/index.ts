const DATA_API = "https://data-api.polymarket.com";

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

function logPositions(user: string, curr: PositionSnapshot, tag: "INIT" | "POS"): void {
  const prefix = `${fmtTime()} | ${tag} | ${user}`;
  const entries = Object.entries(curr).map(
    ([asset, c]) => `  ${c.slug ?? asset.slice(0, 12) + "…"} ${c.outcome ?? "?"} size ${c.size} @ ${c.curPrice}`
  );
  console.log(entries.length ? `${prefix}\n${entries.join("\n")}` : `${prefix} | (none)`);
}

async function fetchPositions(user: string): Promise<Position[]> {
  const url = `${DATA_API}/positions?user=${encodeURIComponent(user)}&limit=500`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`positions ${res.status}`);
  const data = (await res.json()) as Position[];
  return data.filter(
    (p) =>
      p.asset &&
      p.size > 0 &&
      (p.curPrice ?? 0) > 0 &&
      !isExpired(p.endDate)
  );
}

export function runPositionPolling(
  client: import("@polymarket/clob-client").ClobClient | null,
  config: import("../types").AppConfig,
  onTrade: (trade: import("../types").LeaderTrade, fromUser: string) => void
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
          logPositions(user, curr, "INIT");
          continue;
        }
        logPositions(user, curr, "POS");
        for (const [asset, c] of Object.entries(curr)) {
          const s = pprev[asset]?.size ?? 0;
          const delta = c.size - s;
          if (delta > 0) {
            const trade: import("../types").LeaderTrade = {
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
            const trade: import("../types").LeaderTrade = {
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
            const trade: import("../types").LeaderTrade = {
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
