export interface CopyConfig {
  targetAddress: string;
  targetAddresses: string[];
  sizeMultiplier: number;
  pollIntervalSec: number;
  /** When false, only copy BUYs (ignore leader sells) */
  revertTrade: boolean;
}

export interface FilterConfig {
  /** Max USD per copied trade (0 = no limit) */
  buyAmountLimitInUsd: number;
  /** Only copy if leader traded within last N sec (0 = no filter) */
  entryTradeSec: number;
  /** Skip if market resolves within N sec (0 = no filter) */
  tradeSecFromResolve: number;
}

export interface ExitConfig {
  /** Take profit at this % gain (0 = disabled) */
  takeProfit: number;
  /** Stop loss at this % loss (0 = disabled) */
  stopLoss: number;
  /** Trailing stop at this % (0 = disabled) */
  trailingStop: number;
}

export interface AppConfig {
  clobHost: string;
  chainId: number;
  simulationMode: boolean;
  walletPrivateKey: string;
  proxyWalletAddress: string;
  /** Resolved: proxy or EOA address for positions/exit */
  walletAddress: string;
  signatureType: number;
  copy: CopyConfig;
  filter: FilterConfig;
  exit: ExitConfig;
}

export interface LeaderTrade {
  id: string;
  asset_id: string;
  market: string;
  side: string;
  size: string;
  price: string;
  match_time: string;
  slug?: string;
  eventSlug?: string;
  outcome?: string;
  title?: string;
  /** Market end/resolution time (ISO); used for trade_sec_from_resolve filter */
  endDate?: string;
}

export interface ActivityTradePayload {
  asset?: string;
  conditionId?: string;
  proxyWallet?: string;
  side?: string;
  size?: number;
  price?: number;
  timestamp?: number;
  transactionHash?: string;
  slug?: string;
  eventSlug?: string;
  outcome?: string;
  title?: string;
}
