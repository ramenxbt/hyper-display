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
- **Equity sparkline** — 24H / 7D / 30D / All-time account-value chart with PnL pill in USD and percent.
- **Positions table** — coin, side, size, entry, mark, liquidation price, margin, unrealized PnL, ROE, leverage.
- **Open orders** — type, side, size/filled, limit price, notional, reduce-only flag, time placed.
- **Recent fills** — last 100 trades with direction, size, price, fee, and closed PnL.
- **Funding payments** — 30-day net funding plus a per-payment ledger (coin, side, size, hourly rate, USDC).
- **Multi-wallet presets** — save unlimited wallets with custom labels, switch with `⌘1..9` / `Ctrl+1..9`.
- **Multi-account aggregate view** — one virtual "All wallets" entry sums account value, positions, orders, fills, and funding across every saved wallet (`⌘0` shortcut). Tables tag each row with the originating wallet.
- **Light / Dark / Auto theme** — Auto follows your system colour scheme.
- **Backup** — one-click JSON export and import of saved wallets and settings; drop it in iCloud, Drive, or Dropbox.
- **Realized + Unrealized PnL donuts** above the Positions table, with per-coin slices, legend, and net total.
- **Sortable headers** on Positions, Open Orders, Recent Fills, and Funding tables (tri-state click cycle).
- **Configurable Positions columns** in Settings → "Positions columns".
- **Command palette** (`⌘K`) — fuzzy search over wallets, tabs, coins, theme, and quick actions.
- **Notes per saved wallet** — free-text annotations rendered under each label in the Wallets menu.
- **Funding-rate heatmap** — fifth tab listing every Hyperliquid coin's current 1H funding rate as a colour-coded grid (green = shorts pay, red = longs pay), with annualised APR in each tile.
- **Custom alert rules** — fire native + webhook alerts when total uPnL crosses any threshold you pin.
- **Pin a position** — click the ⤴ on any Positions row to spawn a small always-on-top floating window of just that coin (size, mark, liq, ROE, 24H sparkline).
- **Pinned-window layout persistence** — pin positions, drag windows where you want them, quit the app; on next launch the same set re-opens at the same place.
- **Funding-rate watchlist** — star coins on the Rates tab and add a `funding |rate| above %` alert rule that fires only on watchlisted coins.
- **Order-book panel** — new "Book" tab with a coin picker, side-by-side bid/ask ladders, cumulative depth bars, best-bid/ask + spread (in price and bps).
- **Spot balances tab** — read-only Hyperliquid spot balances (available / on-hold / entry notional), aggregated when the All-wallets view is active.
- **Per-coin filter** on Fills and Funding tabs.
- **Liquidation alerts** — opt-in native desktop notifications when mark price approaches your liquidation price (configurable threshold, throttled per coin).
- **Menu-bar tray icon** — click to show or hide the main window; right-click for the show / hide / quit menu.
- **Menu-bar mode** — collapses to a 380×540 always-on-top window, removes decorations, and hides the macOS dock icon for a true tray-only experience.
- **Compact density** — tighter rows and smaller fonts, optional in full-window mode and automatic in menu-bar mode.
- **Per-coin uPnL contribution bar** on the Positions tab so the dominant winners and losers stand out at a glance.
- **Webhook mirror** for liquidation alerts (Discord, Slack, or generic JSON) with a built-in test button.
- **Per-coin 24H sparkline** inline on each Positions row (1H mark-price candles, refreshed every minute).
- **CSV export** for Fills and Funding tabs, named with the wallet short-id and timestamp.
- **Tray-anchored window** in menu-bar mode — clicking the tray icon pops the window directly under it, clamped to the screen.
- **Auto-launch on login** (macOS / Windows / Linux) via `tauri-plugin-autostart`.
- **Settings panel** (`⌘,` or click the gear) — window mode, auto-launch, refresh interval, equity-overlay toggle, alert thresholds, notification permission, webhook config.
- **5-second default refresh** (configurable 2 to 30 seconds) with a live-status dot in the title bar.
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
| `portfolio`            | account-value and PnL history per timeframe |
| `userFunding`          | hourly funding payments over the lookback   |
| `candleSnapshot`       | OHLCV candles per coin for inline sparklines |
| `metaAndAssetCtxs`     | universe-wide funding rates and mark prices  |
| `l2Book`               | bid/ask ladder for the order-book panel      |
| `spotClearinghouseState` | spot balances per token                    |

See the [Hyperliquid Info API docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint).

## Roadmap

Planned for v1.0:

- First public release pass: app icon set, signed macOS DMG / Windows MSI artifacts.
- Onboarding overlay for first-time launch.
- Diagnostics screen (data-source latencies, last-error log).
- Polished website with screenshots and a download CTA.

## Privacy

Hyper-Display never sees your keys. It only ever issues `POST` requests to the public Hyperliquid info endpoint with the address you paste in. Your last address is stored in `localStorage` on your own machine.

## License

MIT. See [LICENSE](LICENSE).

Built by [@ramenxbt](https://github.com/ramenxbt).
