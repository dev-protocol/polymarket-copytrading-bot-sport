# Polymarket Copytrading Bot

Copies trades from one or more leader addresses on Polymarket. Config in `trade.toml`, secrets in `.env`.

## Journey of Builder - [xstacks](https://t.me/x_stacks)

While many traders focus heavily on crypto prediction markets, I noticed that they can be extremely volatile and unpredictable in short timeframes. Rapid price swings, aggressive position flipping, and sudden liquidity shifts make consistent automation difficult.
When I started looking at Polymarket, I noticed one thing right away: markets can be unpredictable. Crypto markets, in particular, move fast—prices swing, positions flip, and liquidity can change in an instant, making consistent automation really tricky.

Instead of limiting the bot to one type of market, I decided to build a system that could copy trades across all kinds of markets—Politics, Sports, Crypto, Economic events, and more. The idea was simple: follow experienced traders, act quickly, and stay flexible, no matter what market they’re in.

I started development in early February 2026, spending a couple of weeks testing, refining filters, timing logic, and position sizes. Running simulations on historical data and testing with a small live balance showed promising results: steady, consistent gains without chasing extreme volatility.

The strategy isn’t about explosive wins. It’s about disciplined copy trading, spreading risk across multiple markets, and aiming for smooth, reliable performance. By following multiple leaders and diversifying trades, the bot can handle fast-moving markets like sports and crypto while still keeping long-term events, like politics and macroeconomics, in play.

In short, it’s a long-term, flexible system built for steady growth, smart risk control, and automated trading across the full spectrum of Polymarket.
This is a long-term strategy — built around discipline, diversification, and steady growth rather than hype.

# Market Types

- Polymarket includes Politics, Sports, Crypto, Economic, Geopolitical, Entertainment, and Experimental markets.
- Politics & Macro markets are longer-term and news-driven, suitable for medium-term copy strategies.
- Sports & Crypto markets are fast-moving and require quick execution (websocket mode recommended).
- Entertainment markets tend to be slower and lower volatility.
- Experimental / low-liquidity markets carry higher slippage risk and should use size limits.

Adjust filters like entry_trade_sec, trade_sec_from_resolve, take_profit, and buy_amount_limit_in_usd based on the market’s volatility and duration.

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

## Env

- `WALLET_PRIVATE_KEY` – EOA or Magic export
- `PROXY_WALLET_ADDRESS` – Polymarket profile (required for Magic; optional EOA)
- `SIGNATURE_TYPE` – 0 = EOA, 1 = Magic/proxy, 2 = Gnosis Safe

### Target Wallets

|Address|Profile|Pnl|
|-|-|-|
|0x6031b6eed1c97e853c6e0f03ad3ce3529351f96d|@gabagool22|<img width="413" height="170" alt="image" src="https://github.com/user-attachments/assets/ef04d657-da3f-4b5a-aeed-b99f2c264df8" />|
|0x63ce342161250d705dc0b16df89036c8e5f9ba9a|@0x8dxd|<img width="409" height="169" alt="image" src="https://github.com/user-attachments/assets/e032f4e9-001a-4dd6-b3b5-6d983167f92d" />|
|0xa61ef8773ec2e821962306ca87d4b57e39ff0abd|@risk-manager|<img width="416" height="162" alt="image" src="https://github.com/user-attachments/assets/6ca49607-7615-4a0c-9786-54400971ee27" />|
|0x781a48229e2c08e20d1eaad90ef73710988c96e6|@100USDollars|<img width="416" height="166" alt="image" src="https://github.com/user-attachments/assets/380debcb-dc09-466f-b7cd-ca2552605eb7" />|
|0x0ac97e4f5c542cd98c226ae8e1736ae78b489641|@7thStaircase|<img width="411" height="162" alt="image" src="https://github.com/user-attachments/assets/c638d830-a472-4035-99ca-c33c72c3aa23" />|
|0x1d0034134e339a309700ff2d34e99fa2d48b0313|@0x1d0034134e|<img width="412" height="174" alt="image" src="https://github.com/user-attachments/assets/2e07c2bf-2ac6-42d2-b319-356bfc0def91" />|
|0xa9878e59934ab507f9039bcb917c1bae0451141d|@ilovecircle|<img width="414" height="164" alt="image" src="https://github.com/user-attachments/assets/b8342802-62d3-461d-8593-8f980178bdfe" />|
|0xd0d6053c3c37e727402d84c14069780d360993aa|@k9Q2mX4L8A7ZP3R|<img width="411" height="173" alt="image" src="https://github.com/user-attachments/assets/e3eaf5bb-b6d3-47fd-bf96-93d13bcd4442" />|
|0x594edB9112f526Fa6A80b8F858A6379C8A2c1C11|@0x594edB9112f526Fa6A80b8F858A6379C8A2c1C11|<img width="414" height="164" alt="image" src="https://github.com/user-attachments/assets/d868f76d-74d9-405d-b168-7e8d5b27c083" />|