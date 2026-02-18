import "dotenv/config";
import * as toml from "@iarna/toml";
import * as fs from "fs";
import * as path from "path";
import { Wallet } from "ethers";
import type { AppConfig } from "../types";

const DEFAULT_HOST = "https://clob.polymarket.com";
const DEFAULT_CHAIN_ID = 137;
const DEFAULT_MULTIPLIER = 1;

function loadToml(): Partial<AppConfig> {
  const p = path.join(process.cwd(), "trade.toml");
  if (!fs.existsSync(p)) return {};
  const raw = fs.readFileSync(p, "utf-8");
  const data = toml.parse(raw) as Record<string, unknown>;
  const copy = data.copy as Record<string, unknown> | undefined;
  const filter = data.filter as Record<string, unknown> | undefined;
  const exit = data.exit as Record<string, unknown> | undefined;
  const rawTargets = copy?.target_address ?? copy?.target_addresses;
  const targets = Array.isArray(rawTargets)
    ? (rawTargets as string[]).filter((s): s is string => typeof s === "string")
    : typeof rawTargets === "string"
      ? [rawTargets]
      : [];
  const one = targets[0] ?? "";
  return {
    clobHost: (data.clob_host as string) ?? DEFAULT_HOST,
    chainId: (data.chain_id as number) ?? DEFAULT_CHAIN_ID,
    simulationMode: (data.simulation as boolean) ?? false,
    copy: {
      targetAddress: one,
      targetAddresses: targets,
      sizeMultiplier: (copy?.size_multiplier as number) ?? DEFAULT_MULTIPLIER,
      pollIntervalSec: (copy?.poll_interval_sec as number) ?? 30,
      revertTrade: (copy?.revert_trade as boolean) ?? true,
    },
    filter: {
      buyAmountLimitInUsd: (filter?.buy_amount_limit_in_usd as number) ?? 0,
      entryTradeSec: (filter?.entry_trade_sec as number) ?? 0,
      tradeSecFromResolve: (filter?.trade_sec_from_resolve as number) ?? 0,
    },
    exit: {
      takeProfit: (exit?.take_profit as number) ?? 0,
      stopLoss: (exit?.stop_loss as number) ?? 0,
      trailingStop: (exit?.trailing_stop as number) ?? 0,
    },
  };
}

export function loadConfig(): AppConfig {
  const fromToml = loadToml();
  const walletPrivateKey = (process.env.WALLET_PRIVATE_KEY ?? process.env.PRIVATE_KEY ?? "").trim();
  const proxyWalletAddress = (process.env.PROXY_WALLET_ADDRESS ?? process.env.FUNDER_ADDRESS ?? "").trim();
  const signatureType = parseInt(process.env.SIGNATURE_TYPE ?? "1", 10);
  const targets = fromToml.copy?.targetAddresses ?? [];
  const targetAddress = targets[0] ?? "";
  let walletAddress = "";
  if (walletPrivateKey) {
    const pk = walletPrivateKey.startsWith("0x") ? walletPrivateKey : "0x" + walletPrivateKey;
    try {
      walletAddress = new Wallet(pk).address;
    } catch {
      /* ignore */
    }
  }

  return {
    clobHost: fromToml.clobHost ?? DEFAULT_HOST,
    chainId: fromToml.chainId ?? DEFAULT_CHAIN_ID,
    simulationMode: fromToml.simulationMode ?? false,
    walletPrivateKey,
    proxyWalletAddress,
    walletAddress: proxyWalletAddress || walletAddress,
    signatureType,
    copy: {
      targetAddress,
      targetAddresses: targets,
      sizeMultiplier: fromToml.copy?.sizeMultiplier ?? DEFAULT_MULTIPLIER,
      pollIntervalSec: fromToml.copy?.pollIntervalSec ?? 30,
      revertTrade: fromToml.copy?.revertTrade ?? true,
    },
    filter: fromToml.filter ?? {
      buyAmountLimitInUsd: 0,
      entryTradeSec: 0,
      tradeSecFromResolve: 0,
    },
    exit: fromToml.exit ?? {
      takeProfit: 0,
      stopLoss: 0,
      trailingStop: 0,
    },
  };
}
