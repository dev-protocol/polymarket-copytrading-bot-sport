export interface TradeLog {
  time: string;
  tag: string;
  side: string;
  outcome: string;
  size: string;
  price: string;
  slug: string;
  extra?: string;
  targetAddress?: string;
  copyStatus?: string;
}

export interface PositionSummary {
  slug: string;
  outcome: string;
  size: number;
  curPrice: number;
  delta?: number;
  deltaAt?: string;
}

export interface BotState {
  logs: TradeLog[];
  status: {
    mode: string;
    targets: number;
    wallet?: string;
    targetAddresses?: string[];
  };
  positions: Record<string, PositionSummary[]>;
  ui: { deltaHighlightSec: number; deltaAnimationSec: number };
}
