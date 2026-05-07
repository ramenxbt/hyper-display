<div align="center">

# Hyper-Display

**Always-on Hyperliquid positions dashboard.**

A read-only desktop app that watches any Hyperliquid wallet you paste. Pin it on a second monitor, drop it into your menu bar, and let it update live in the background.

[![License: MIT](https://img.shields.io/badge/license-MIT-97FCE4.svg)](LICENSE)
[![Built with Tauri 2](https://img.shields.io/badge/built_with-Tauri_2-24C8DB.svg)](https://tauri.app)
[![Hyperliquid Info API](https://img.shields.io/badge/data-Hyperliquid_Info_API-97FCE4.svg)](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)
[![Latest tag](https://img.shields.io/github/v/tag/ramenxbt/hyper-display?label=latest&color=97FCE4)](https://github.com/ramenxbt/hyper-display/releases)

[**Download for your OS →**](https://github.com/ramenxbt/hyper-display/releases/latest)

<br />

<img src="docs/screenshots/dashboard.png" alt="Hyper-Display dashboard" width="900" />

</div>

---

#### Quick links

[Install](#install) · [First-run walkthrough](#first-run-walkthrough) · [Features](#features) · [Keyboard shortcuts](#keyboard-shortcuts) · [Screenshots](#more-screenshots) · [FAQ](#faq) · [Settings](#settings) · [Build from source](#build-from-source) · [Privacy](#privacy-and-data) · [Contributing](CONTRIBUTING.md)

---

## Install

> **Just want to download it?** Click the [latest release](https://github.com/ramenxbt/hyper-display/releases/latest), pick the file for your OS, open it. Three clicks total. Step-by-step below if you have not done this before.

The pre-1.0 binaries are not signed yet. macOS Gatekeeper and Windows SmartScreen will warn you on the very first launch, but each section below has a one-step bypass.

<details open>
<summary><b>macOS (Apple Silicon and Intel) — about 30 seconds</b></summary>

1. Go to the [latest release page](https://github.com/ramenxbt/hyper-display/releases/latest).
2. Under **Assets**, download the `.dmg` for your Mac:
   - **Apple Silicon** (any M-series MacBook / iMac / Mac mini, 2020 or newer): file ending in `aarch64.dmg`.
   - **Intel** Mac: file ending in `x64.dmg`.
3. Double-click the downloaded `.dmg`. A window pops up with the app icon and an **Applications** shortcut. **Drag the icon onto Applications.**
4. Open your Applications folder, **right-click Hyper-Display, choose Open**, and click **Open** in the dialog. You only do this once. After that, double-click as normal.

> **"Hyper-Display.app is damaged and can't be opened"?** That's macOS quarantining unsigned downloads. Run this once in Terminal:
> ```bash
> xattr -dr com.apple.quarantine /Applications/Hyper-Display.app
> ```

**Prefer one line in Terminal?**

```bash
curl -fsSL https://raw.githubusercontent.com/ramenxbt/hyper-display/main/install.sh | bash
```

</details>

<details>
<summary><b>Windows 10 / 11 — about 30 seconds</b></summary>

1. Go to the [latest release page](https://github.com/ramenxbt/hyper-display/releases/latest).
2. Under **Assets**, download the file ending in `x64-setup.exe` (recommended) or `x64_en-US.msi`.
3. Double-click the downloaded file.
4. Windows Defender SmartScreen will warn you because the binary is unsigned. Click **More info → Run anyway**.
5. Step through the installer (Next → Install → Finish).

After install, search for **Hyper-Display** in the Start menu.

</details>

<details>
<summary><b>Linux (Debian / Ubuntu / Fedora / others)</b></summary>

Three artifacts ship for Linux on every release:

| Format | Best for | Install |
| --- | --- | --- |
| `.AppImage` | Any modern distro | `chmod +x hyper-display_*.AppImage && ./hyper-display_*.AppImage` |
| `.deb` | Debian, Ubuntu, Pop!\_OS, Mint | `sudo apt install ./hyper-display_*.deb` |
| `.rpm` | Fedora, RHEL, openSUSE | `sudo rpm -i hyper-display-*.rpm` |

**Prefer one line:**

```bash
curl -fsSL https://raw.githubusercontent.com/ramenxbt/hyper-display/main/install.sh | bash
```

The script drops the AppImage into `~/.local/bin` and makes it executable.

</details>

> Need a platform that isn't in the latest release yet? See [**Build from source**](#build-from-source). It is a `git clone` + `npm install` + `npm run tauri:build` and takes about three minutes.

## First-run walkthrough

1. **Launch the app.** You'll see an empty dashboard and a **Wallet** field at the top.
2. **Paste any Hyperliquid address** into that field. To grab yours: open [app.hyperliquid.xyz](https://app.hyperliquid.xyz), connect your wallet, click the address shown in the top-right of the page, copy. Paste into Hyper-Display.
3. **Hit Enter.** Numbers start streaming. The dashboard refreshes every 5 seconds by default.
4. **Save the wallet.** Click **Wallets** in the top bar, name it (optional), click **Save current**. Now it sticks across launches and gets a `⌘1` shortcut.
5. **Optional but nice:** open settings (`⌘,` or the gear icon, top-right) and switch on **Launch on login** so the app comes back when you boot your machine.

That's the whole onboarding. Everything else is opt-in.

## Features

| | |
| --- | --- |
| **Live trading data** | Account summary, positions table with sparkline + uPnL bar, open orders, recent fills, 30-day funding payments. Sortable columns and per-coin filters everywhere. |
| **PnL breakdown** | Realized + unrealized PnL donuts sliced by coin. Equity sparkline strip with 24H / 7D / 30D / All toggle and Equity vs PnL series switch. |
| **Funding rates** | Heatmap of every Hyperliquid coin colour-coded by 1H rate, with annualised APR. Star coins to a watchlist and trigger alerts when rates cross a threshold. |
| **Order book** | Bid / ask depth ladders with cumulative bars and spread shown in price + bps. |
| **Spot balances** | Read-only Hyperliquid spot positions per token. |
| **Multi-wallet** | Save unlimited wallets with labels and notes. `⌘1..9` to switch. `⌘0` for an aggregate "All wallets" view that sums every saved account. |
| **Menu-bar mode** | Collapses to a small always-on-top window with the dock icon hidden, anchored under the tray icon. |
| **Pinned positions** | Click ⤴ on any Positions row to spawn a tiny floating window of just that coin. Layout is persisted across launches. |
| **Alerts** | Liquidation-proximity, total uPnL thresholds, funding-rate thresholds. Native desktop notifications and / or webhook mirror to Discord, Slack, or generic JSON. |
| **Backup** | One-click JSON export / import of saved wallets and settings. Drop in iCloud / Drive / Dropbox. |
| **Themes** | Dark, Light, or Auto (follows your OS). |
| **Command palette** | `⌘K` to fuzzy-search wallets, tabs, coins, theme, and quick actions. |
| **CSV export** | Fills and Funding tables export to CSV with one click. |

## Keyboard shortcuts

| Shortcut | What it does |
| --- | --- |
| `⌘K` / `Ctrl+K` | Open the command palette |
| `⌘,` / `Ctrl+,` | Toggle the settings panel |
| `⌘1` to `⌘9` | Switch to saved wallet 1 through 9 |
| `⌘0` | Switch to the aggregate "All wallets" view |
| `Esc` | Close any open modal |

## More screenshots

<p align="center">
  <img src="docs/screenshots/menu-bar.png" alt="Menu-bar mode" width="380" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/settings.png" alt="Settings panel" width="380" />
</p>

Left: menu-bar mode (small, always-on-top, dock icon hidden). Right: settings panel.

## FAQ

**Where do I find my Hyperliquid address?**
Open [app.hyperliquid.xyz](https://app.hyperliquid.xyz), connect your wallet, click the address shown in the top-right corner. Copy and paste into Hyper-Display.

**Is this safe? Can it move my funds?**
No. Hyper-Display never asks for keys, never asks you to sign anything, and only ever reads from Hyperliquid's public info endpoint. The only thing it sends out is the address you paste, to ask "what positions does this wallet have?". You can verify that yourself in the source: every network call is in `src/lib/hl.ts`.

**Where are my settings and saved wallets stored?**
In `localStorage` on your own machine. Nothing is sent to any server (other than Hyperliquid for read-only data, and your webhook URL if you configure one).

**Why does it ask for notification permission?**
Only if you turn on liquidation alerts or custom alert rules. Notifications are local OS notifications, never pushed from a server.

**The macOS app says "damaged and can't be opened" — is something wrong?**
No. macOS quarantines downloads that aren't signed by an Apple Developer cert. Run the one-liner in the macOS install section to remove the quarantine flag. Signed builds are coming with v1.0.

**Does it support trading?**
No, by design. Hyper-Display is a viewer. Closing positions, placing orders, and changing leverage all require signed requests, which means holding a key. We chose to stay key-less to keep the blast radius zero.

**Can I track multiple wallets at once?**
Yes. Save 2+ wallets in the **Wallets** menu, then pick **All wallets** (or hit `⌘0`) for an aggregate view that sums account value, PnL, positions, orders, fills, and funding across every wallet.

**Why no mobile?**
Tauri can ship Android and iOS, but the UX of this dashboard is desktop-first. A mobile companion is on the long-term roadmap.

## Settings

Open the panel with `⌘,` or the gear icon. Highlights:

- **Appearance**: Dark / Light / Auto theme.
- **Window**: Menu-bar mode, compact density, launch on login.
- **Refresh**: Polling interval slider, 2 to 30 seconds.
- **Equity chart**: Dim dashed alternate series toggle.
- **Positions columns**: Hide entry / mark / 24H sparkline / liq / margin / ROE / leverage individually.
- **Custom alert rules**: Total uPnL above or below thresholds, funding-rate thresholds for watchlisted coins.
- **Webhook mirror**: Discord, Slack, or generic JSON URL with a "Send test" button.
- **Backup**: One-click JSON export / import.

## Build from source

Three minutes on a recent machine. Use this if you want the latest unreleased changes, or are on a platform we haven't published an installer for.

### 1. Install prerequisites

You need a C/C++ toolchain, the Rust toolchain, and Node.js 20 or newer.

<details>
<summary><b>macOS</b></summary>

```bash
xcode-select --install                                      # C/C++ toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh   # Rust
brew install node                                            # Node 20+ (or use nvm / asdf)
```

After installing Rust, restart your shell or run `source "$HOME/.cargo/env"`.

</details>

<details>
<summary><b>Windows 10 / 11</b></summary>

1. **Microsoft C++ Build Tools** with the *Desktop development with C++* workload: <https://visualstudio.microsoft.com/visual-cpp-build-tools/>
2. **WebView2 Runtime** (already on Windows 11; on 10 grab the bootstrapper from <https://developer.microsoft.com/microsoft-edge/webview2/>).
3. **Rust**: <https://www.rust-lang.org/tools/install>
4. **Node.js 20+**: <https://nodejs.org/> or `winget install OpenJS.NodeJS.LTS`

</details>

<details>
<summary><b>Linux (Debian / Ubuntu)</b></summary>

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev build-essential \
  curl wget file libxdo-dev libssl-dev \
  libayatana-appindicator3-dev librsvg2-dev

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20
```

For Fedora, Arch, and other distros see the [Tauri prerequisites doc](https://tauri.app/start/prerequisites/#linux).

</details>

### 2. Clone, install, run

```bash
git clone https://github.com/ramenxbt/hyper-display.git
cd hyper-display
npm install
npm run tauri:dev          # development with hot reload
# or
npm run tauri:build        # release bundle (output paths below)
```

Output of `tauri:build`:

| Platform | Output |
| --- | --- |
| macOS | `src-tauri/target/release/bundle/dmg/Hyper-Display_<ver>_<arch>.dmg` |
| Windows | `src-tauri/target/release/bundle/nsis/Hyper-Display_<ver>_x64-setup.exe` |
| Linux | `src-tauri/target/release/bundle/{deb,appimage,rpm}/...` |

## Architecture

```
src/
  components/   UI: tables, donuts, sparkline, palette, settings, pin view
  hooks/        polling: useAggregateSnapshot, useMarkCandles, useFundingRates,
                useL2Book, useLiqAlerts, useUpnlAlerts, useFundingAlerts, useSort
  lib/          Hyperliquid client, formatters, settings, wallets, aggregate,
                csv, webhook, watchlist, pinLayout, backup
  App.tsx       top bar, summary, equity strip, tabs
  main.tsx      renders App, or PinView when launched with ?pin=COIN

src-tauri/      Rust shell: window config, tray icon, set_menubar_mode +
                open_pin_window commands, autostart + notification plugins
```

The frontend talks to the public Hyperliquid info endpoint (`https://api.hyperliquid.xyz/info`) directly via `fetch`. There is no Rust-side API code; the Tauri shell only owns the window and a few OS integrations. You can run the same UI as a regular web app by deleting `src-tauri/` and pointing Vite at any static host.

### Hyperliquid endpoints used

| Request type | Returns |
| --- | --- |
| `clearinghouseState` | margin summary + asset positions |
| `frontendOpenOrders` | resting limit orders and triggers |
| `userFills` | recent fills, including closed PnL |
| `allMids` | live mid prices for every traded asset |
| `portfolio` | account-value and PnL history per timeframe |
| `userFunding` | hourly funding payments over the lookback |
| `candleSnapshot` | OHLCV candles for inline sparklines |
| `metaAndAssetCtxs` | universe-wide funding rates and mark prices |
| `l2Book` | bid / ask ladder for the order-book panel |
| `spotClearinghouseState` | spot balances per token |

## Privacy and data

Hyper-Display never sees your keys. It only ever issues `POST` requests to the public Hyperliquid info endpoint with the address you paste. Your last address, saved wallets, settings, watchlist, and pin layout live in `localStorage` on your machine. Nothing is sent anywhere else.

The only outbound network calls beyond Hyperliquid are:

- Fonts: Inter and JetBrains Mono load from Google Fonts at app start.
- Notifications: native OS only.
- Webhook mirror: only fires if you configure it, only to the URL you provide.

## Roadmap

Planned for v1.0:

- App icon set and signed macOS DMG / Windows MSI artifacts (no more SmartScreen / Gatekeeper warnings).
- Onboarding overlay for the first launch.
- Diagnostics screen (data-source latencies, last-error log).
- Polished landing page with screenshots and a download CTA.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) if you would like to help ship any of those.

## Contributing

PRs are welcome. The setup is the same as **Build from source** above. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the dev workflow, style guide, and what kinds of changes land easiest.

## License

MIT. See [LICENSE](LICENSE).

Built by [@ramenxbt](https://github.com/ramenxbt). Not affiliated with Hyperliquid.
