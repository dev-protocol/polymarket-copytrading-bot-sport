# Polymarket Copytrading Bot

Copies trades from one or more leader addresses on Polymarket. Config in `trade.toml`, secrets in `.env`.

# Market Types

- Polymarket includes Politics, Sports, Crypto, Economic, Geopolitical, Entertainment, and Experimental markets.
- Politics & Macro markets are longer-term and news-driven, suitable for medium-term copy strategies.
- Sports & Crypto markets are fast-moving and require quick execution (websocket mode recommended).
- Entertainment markets tend to be slower and lower volatility.
- Experimental / low-liquidity markets carry higher slippage risk and should use size limits.

Adjust filters like entry_trade_sec, trade_sec_from_resolve, take_profit, and buy_amount_limit_in_usd based on the market’s volatility and duration.

NOTE: Based on experience, crypto prediction markets can be highly volatile and risky, especially due to rapid price swings and fast position flipping by large traders.

For this reason, this bot is designed to copy trades across all market categories (Politics, Sports, Macro, Entertainment, etc.), rather than focusing only on crypto markets. Diversifying across different market types helps reduce concentration risk and smooth overall performance.

Consulting With Builder: [xstacks](https://t.me/x_stacks)

## Setup

```bash
cp .env.example .env
# Edit .env: WALLET_PRIVATE_KEY, PROXY_WALLET_ADDRESS (if Magic), SIGNATURE_TYPE
npm install
```

## Config: trade.toml

| Key | Description |
|-----|-------------|
| `clob_host` | CLOB API base URL (default mainnet) |
| `chain_id` | 137 = Polygon mainnet |
| `simulation` | `true` = log only, no orders |
| `[copy]` | |
| `target_address` | One or more leader addresses (single = websocket; multiple = polling) |
| `revert_trade` | `true` = copy BUY and SELL; `false` = BUY only |
| `size_multiplier` | Multiply copied size (1.0 = same) |
| `poll_interval_sec` | Polling interval when using multiple targets |
| `[exit]` | |
| `take_profit` | Sell at this % gain (0 = off) |
| `stop_loss` | Sell at this % loss (0 = off) |
| `trailing_stop` | Sell if price drops this % from high (0 = off) |
| `[filter]` | |
| `buy_amount_limit_in_usd` | Max USD per copied trade (0 = no limit) |
| `entry_trade_sec` | Only copy if leader traded within last N sec (0 = off) |
| `trade_sec_from_resolve` | Skip if market resolves within N sec (0 = off) |

## Run

```bash
npm run dev    # tsx src/index.ts
```

## Project layout

```
src/
  index.ts       # Entry: load config, start copy + optional exit loop
  config/        # Load trade.toml + .env → AppConfig
  client/        # CLOB client (ethers + API key)
  trading/       # copyTrade(): place order from LeaderTrade
  polling/       # Multi-target: poll positions API, diff → trades
  realtime/     # Single target: websocket activity → trades
  filter/       # shouldCopyTrade(): revert_trade, entry_trade_sec, trade_sec_from_resolve
  exit/          # recordEntry(), runExitLoop(): take_profit, stop_loss, trailing_stop
  types/         # AppConfig, LeaderTrade, etc.
```

## Env

- `WALLET_PRIVATE_KEY` – EOA or Magic export
- `PROXY_WALLET_ADDRESS` – Polymarket profile (required for Magic; optional EOA)
- `SIGNATURE_TYPE` – 0 = EOA, 1 = Magic/proxy, 2 = Gnosis Safe
