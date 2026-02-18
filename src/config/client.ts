import { Wallet } from "ethers";
import { ClobClient, Chain } from "@polymarket/clob-client";
import { SignatureType } from "@polymarket/order-utils";
import type { AppConfig } from "../types";

export async function createClient(config: AppConfig): Promise<ClobClient> {
  const { clobHost, chainId, walletPrivateKey, proxyWalletAddress, signatureType } = config;
  const chain = chainId === 137 ? Chain.POLYGON : Chain.AMOY;
  const pk = walletPrivateKey.startsWith("0x") ? walletPrivateKey : "0x" + walletPrivateKey;
  const wallet = new Wallet(pk);
  const sigType = signatureType as SignatureType;
  const funder = proxyWalletAddress || undefined;
  const tempClient = new ClobClient(clobHost, chain, wallet, undefined, sigType, funder);
  const creds = await tempClient.createOrDeriveApiKey();
  return new ClobClient(clobHost, chain, wallet, creds, sigType, funder);
}
