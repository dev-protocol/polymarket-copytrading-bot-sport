export interface CopyConfig {
  targetAddress: string;
  targetAddresses: string[];
  sizeMultiplier: number;
  pollIntervalSec: number;
  revertTrade: boolean;
}

export interface FilterConfig {
  buyAmountLimitInUsd: number;
  entryTradeSec: number;
  tradeSecFromResolve: number;
}

export interface ExitConfig {
  takeProfit: number;
  stopLoss: number;
  trailingStop: number;
}

export interface UiConfig {
  deltaHighlightSec: number;
  deltaAnimationSec: number;
}

export interface AppConfig {
  clobHost: string;
  chainId: number;
  port: number;
  simulationMode: boolean;
  walletPrivateKey: string;
  proxyWalletAddress: string;
  walletAddress: string;
  signatureType: number;
  copy: CopyConfig;
  filter: FilterConfig;
  exit: ExitConfig;
  ui?: UiConfig;
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
