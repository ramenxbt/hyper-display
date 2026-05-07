# Hyper-Display

[![License: MIT](https://img.shields.io/badge/license-MIT-97FCE4.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/built_with-Tauri_2-24C8DB.svg)](https://tauri.app)
[![Hyperliquid](https://img.shields.io/badge/data-Hyperliquid_Info_API-97FCE4.svg)](https://hyperliquid.gitbook.io/hyperliquid-docs)

A small, always-on desktop dashboard for any Hyperliquid wallet. Paste a 0x address, pin the window on a second monitor, and watch positions, open orders, and recent fills update in real time.

Read-only by design. No keys, no signatures, no servers. Just the public Hyperliquid info API and your own machine.

## Why

Hyperliquid's web UI is great when you are actively trading, but it is heavy to keep open all day, and it only shows the wallet you are connected with. Hyper-Display is the opposite: a lightweight native window that watches any address you paste, refreshes every five seconds, and stays out of the way.

Use it for:

- Watching your own positions while you work in another window.
- Tracking a friend, a fund, or a vault that publishes its address.
- Studying a wallet's live behavior without giving any platform your own keys.

## Features

- **Account summary** — account value, unrealized PnL, notional, margin used, withdrawable, open position count.
- **Positions table** — coin, side, size, entry, mark, liquidation price, margin, unrealized PnL, ROE, leverage.
- **Open orders** — type, side, size/filled, limit price, notional, reduce-only flag, time placed.
- **Recent fills** — last 100 trades with direction, size, price, fee, and closed PnL.
- **5-second refresh** with a live-status dot in the title bar.
- **Address persistence** — your last-used wallet is remembered locally.
- **HL-faithful styling** — dark navy surface, mint accent, tabular numerics, long/short coloring.

## Screenshots

_Coming with v0.1.1._ For now, run it locally (see Development) and you will see the same layout as the screenshots will eventually show.

## Install

> v0.1 builds will be published to the [Releases](https://github.com/ramenxbt/hyper-display/releases) page once the icon set is finalized. Until then, build from source — it takes about three minutes on a recent Mac.

## Development

Prerequisites: Node 20+, Rust stable, and the Tauri prerequisites for your platform ([macOS](https://tauri.app/start/prerequisites/#macos), [Windows](https://tauri.app/start/prerequisites/#windows), [Linux](https://tauri.app/start/prerequisites/#linux)).

```bash
git clone https://github.com/ramenxbt/hyper-display.git
cd hyper-display
npm install
npm run tauri:dev    # launches the desktop app with HMR
```

To build a distributable bundle:

```bash
npm run tauri:build  # outputs to src-tauri/target/release/bundle/
```

## Architecture

```
src/
  lib/
    hl.ts            Hyperliquid info-API client (fetch + types)
    format.ts        currency, percent, size, time formatters
  hooks/
    useSnapshot.ts   5s polling hook returning a unified snapshot
  components/
    AddressBar.tsx
    AccountSummary.tsx
    PositionsTable.tsx
    OrdersTable.tsx
    FillsTable.tsx
  App.tsx            top bar + summary + tabs

src-tauri/           Rust shell, window config, bundling
```

The frontend talks to `https://api.hyperliquid.xyz/info` directly via `fetch`. There is no Rust-side API code; the Tauri shell only owns the window. This keeps the project portable — you can run the same UI as a regular web app by deleting `src-tauri/` and pointing Vite at a static host.

## Data sources

All data comes from a single public endpoint:

| Request type           | Returns                                     |
| ---------------------- | ------------------------------------------- |
| `clearinghouseState`   | margin summary + asset positions            |
| `frontendOpenOrders`   | resting limit orders and triggers           |
| `userFills`            | recent fills, including closed PnL          |
| `allMids`              | live mid prices for every traded asset      |

See the [Hyperliquid Info API docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint).

## Roadmap

Planned for v0.2:

- 24h PnL / equity sparkline in the summary strip.
- Per-asset funding payment history tab.
- Multi-wallet support (saved presets, hotkey-switch).
- Native menu-bar mode on macOS.

## Privacy

Hyper-Display never sees your keys. It only ever issues `POST` requests to the public Hyperliquid info endpoint with the address you paste in. Your last address is stored in `localStorage` on your own machine.

## License

MIT. See [LICENSE](LICENSE).

Built by [@ramenxbt](https://github.com/ramenxbt).
