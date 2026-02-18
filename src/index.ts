import { loadConfig } from "./config";
import { createClient } from "./config/client";
import { runActivityStream, logTrade, runPositionPolling } from "./realtime";
import { copyTrade, shouldCopyTrade, recordEntry, runExitLoop } from "./trading";

async function run() {
  const config = loadConfig();
  const targets = config.copy.targetAddresses;
  if (!targets.length) {
    console.error("No targets. Set copy.target_address in trade.toml");
    process.exit(1);
  }
  if (!config.simulationMode) {
    if (!config.walletPrivateKey) {
      console.error("No wallet. Set WALLET_PRIVATE_KEY in .env");
      process.exit(1);
    }
    if (!config.proxyWalletAddress && config.signatureType !== 0) {
      console.error("Set PROXY_WALLET_ADDRESS in .env for proxy/Magic wallet");
      process.exit(1);
    }
  }

  const client = config.simulationMode ? null : await createClient(config);
  if (client && (config.exit.takeProfit > 0 || config.exit.stopLoss > 0 || config.exit.trailingStop > 0)) {
    runExitLoop(client, config);
  }

  if (targets.length === 1) {
    console.log(config.simulationMode ? "Simulation" : "Subscribe", "| 1 target");
    runActivityStream(client, config);
  } else {
    console.log(config.simulationMode ? "Simulation" : "Polling", `| ${targets.length} targets`);
    runPositionPolling(config, (trade, fromUser) => {
      if (!shouldCopyTrade(config, trade)) return;
      if (config.simulationMode) {
        logTrade("SIM", trade, `from ${fromUser.slice(0, 10)}… skipped`);
      } else if (client) {
        copyTrade(
          client,
          trade,
          config.copy.sizeMultiplier,
          config.chainId,
          config.filter.buyAmountLimitInUsd
        )
          .then((filled) => {
            if (filled && trade.side === "BUY") recordEntry(trade.asset_id, filled.size, filled.price);
            logTrade("LIVE", trade, `from ${fromUser.slice(0, 10)}… ok`);
          })
          .catch((e) => {
            logTrade("LIVE", trade, `from ${fromUser.slice(0, 10)}… FAILED`);
            console.error("  ", e?.message ?? e);
          });
      }
    });
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
