import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  enable as enableAutostart,
  disable as disableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { sendWebhook } from "./lib/webhook";
import {
  buildBackup,
  downloadBackup,
  parseBackup,
  pickBackupFile,
} from "./lib/backup";
import { AddressBar } from "./components/AddressBar";
import { AccountSummary } from "./components/AccountSummary";
import { EquityStrip } from "./components/EquityStrip";
import { PositionsTable } from "./components/PositionsTable";
import { PositionsBreakdown } from "./components/PositionsBreakdown";
import { OrdersTable } from "./components/OrdersTable";
import { FillsTable } from "./components/FillsTable";
import { FundingTable } from "./components/FundingTable";
import { WalletMenu } from "./components/WalletMenu";
import { SettingsPanel } from "./components/SettingsPanel";
import { CommandPalette, type CommandItem } from "./components/CommandPalette";
import { useAggregateSnapshot } from "./hooks/useAggregateSnapshot";
import { useLiqAlerts } from "./hooks/useLiqAlerts";
import { useMarkCandles } from "./hooks/useMarkCandles";
import type { WalletTag } from "./lib/aggregate";
import { isValidAddress } from "./lib/hl";
import { shortAddress, timeAgo } from "./lib/format";
import {
  addWallet,
  loadWallets,
  removeWallet,
  renameWallet,
  saveWallets,
  type SavedWallet,
} from "./lib/wallets";
import {
  loadSettings,
  saveSettings,
  type Settings,
} from "./lib/settings";

type Tab = "positions" | "orders" | "fills" | "funding";

const STORAGE_KEY = "hyper-display.address";
const ALL = "ALL";

export default function App() {
  const [selection, setSelection] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  });
  const aggregate = selection === ALL;
  const address = aggregate ? "" : selection;
  const [wallets, setWallets] = useState<SavedWallet[]>(() => loadWallets());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifPermission, setNotifPermission] =
    useState<"granted" | "denied" | "unknown">("unknown");
  const [tab, setTab] = useState<Tab>("positions");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (selection === ALL || isValidAddress(selection)) {
      localStorage.setItem(STORAGE_KEY, selection);
    }
  }, [selection]);

  const setAddress = useCallback((next: string) => setSelection(next), []);

  useEffect(() => {
    saveWallets(wallets);
  }, [wallets]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // probe notification permission once
  useEffect(() => {
    let cancelled = false;
    isPermissionGranted()
      .then((g) => {
        if (cancelled) return;
        setNotifPermission(g ? "granted" : "unknown");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // cmd+0 → aggregate, cmd+1..9 → wallet, cmd+, → settings
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "0" && wallets.length >= 2) {
        e.preventDefault();
        setSelection(ALL);
        return;
      }
      const num = parseInt(e.key, 10);
      if (Number.isFinite(num) && num >= 1 && num <= 9) {
        const target = wallets[num - 1];
        if (target) {
          e.preventDefault();
          setSelection(target.address);
        }
      }
      if (meta && (e.key === "," || e.key === ".")) {
        e.preventDefault();
        setSettingsOpen((v) => !v);
      }
      if (meta && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wallets]);

  const targetWallets = useMemo<WalletTag[]>(() => {
    if (aggregate) {
      return wallets.map((w) => ({ address: w.address, label: w.label }));
    }
    if (isValidAddress(selection)) {
      const known = wallets.find(
        (w) => w.address.toLowerCase() === selection.toLowerCase(),
      );
      return [{ address: selection, label: known?.label }];
    }
    return [];
  }, [aggregate, wallets, selection]);

  const { data, error, loading, lastUpdated } = useAggregateSnapshot(
    targetWallets,
    settings.refreshSeconds * 1000,
  );

  const positions = data?.state.assetPositions ?? [];
  const orders = data?.orders ?? [];
  const fills = data?.fills ?? [];
  const funding = data?.funding ?? [];
  const portfolio = data?.portfolio;
  const positionCoins = useMemo(
    () => Array.from(new Set(positions.map((p) => p.position.coin))),
    [positions],
  );
  const candles = useMarkCandles(positionCoins);

  useLiqAlerts({
    notifyEnabled: settings.notifyLiqEnabled && notifPermission === "granted",
    thresholdPct: settings.liqThresholdPct,
    positions,
    mids: data?.mids ?? {},
    webhookEnabled: settings.webhookEnabled,
    webhookUrl: settings.webhookUrl,
    webhookFormat: settings.webhookFormat,
  });

  // sync menu-bar mode to the Rust window whenever it toggles
  useEffect(() => {
    invoke("set_menubar_mode", { enabled: settings.menuBarMode }).catch(
      (err) => {
        console.warn("set_menubar_mode failed", err);
      },
    );
  }, [settings.menuBarMode]);

  // sync theme onto <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light", "theme-auto");
    root.classList.add(`theme-${settings.theme}`);
  }, [settings.theme]);

  // sync auto-launch with the OS
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await isAutostartEnabled();
        if (cancelled) return;
        if (settings.autoLaunch && !current) await enableAutostart();
        else if (!settings.autoLaunch && current) await disableAutostart();
      } catch (err) {
        console.warn("autostart sync failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [settings.autoLaunch]);

  const onSaveCurrent = useCallback(
    (label?: string) => {
      if (!isValidAddress(address)) return;
      setWallets((prev) => addWallet(prev, { address, label }));
    },
    [address],
  );

  const onRemoveWallet = useCallback((addr: string) => {
    setWallets((prev) => removeWallet(prev, addr));
  }, []);

  const onRenameWallet = useCallback((addr: string, label: string) => {
    setWallets((prev) => renameWallet(prev, addr, label));
  }, []);

  const onRequestPermission = useCallback(async () => {
    try {
      const result = await requestPermission();
      setNotifPermission(result === "granted" ? "granted" : "denied");
    } catch {
      setNotifPermission("denied");
    }
  }, []);

  const onTestNotification = useCallback(() => {
    sendNotification({
      title: "Hyper-Display test",
      body: "Notifications are working. Liquidation alerts will fire automatically when a position gets close.",
    });
  }, []);

  const onExportBackup = useCallback(() => {
    downloadBackup(buildBackup(wallets, settings));
  }, [wallets, settings]);

  const onImportBackup = useCallback(async () => {
    const raw = await pickBackupFile();
    if (!raw) return;
    const result = parseBackup(raw);
    if (!result.ok) {
      window.alert(`Import failed: ${result.error}`);
      return;
    }
    const incomingCount = result.data.wallets.length;
    const ok = window.confirm(
      `Replace local settings and merge ${incomingCount} wallet${incomingCount === 1 ? "" : "s"}?`,
    );
    if (!ok) return;
    setSettings(result.data.settings);
    setWallets((prev) => {
      const known = new Set(prev.map((w) => w.address.toLowerCase()));
      const merged = [...prev];
      for (const w of result.data.wallets) {
        if (!known.has(w.address.toLowerCase())) merged.push(w);
      }
      return merged;
    });
  }, []);

  const commandItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];
    if (wallets.length >= 2) {
      items.push({
        id: "wallet-all",
        group: "Wallets",
        label: "All wallets (aggregate)",
        hint: `${wallets.length} accounts`,
        shortcut: "⌘0",
        perform: () => setSelection(ALL),
      });
    }
    wallets.forEach((w, i) => {
      items.push({
        id: `wallet-${w.address}`,
        group: "Wallets",
        label: w.label || shortAddress(w.address),
        hint: w.label ? shortAddress(w.address) : undefined,
        shortcut: i < 9 ? `⌘${i + 1}` : undefined,
        perform: () => setSelection(w.address),
      });
    });
    const tabs: { id: Tab; label: string }[] = [
      { id: "positions", label: "Positions" },
      { id: "orders", label: "Open Orders" },
      { id: "fills", label: "Recent Fills" },
      { id: "funding", label: "Funding" },
    ];
    for (const t of tabs) {
      items.push({
        id: `tab-${t.id}`,
        group: "Tabs",
        label: t.label,
        perform: () => setTab(t.id),
      });
    }
    const coinSet = new Set<string>();
    for (const p of positions) coinSet.add(p.position.coin);
    for (const c of coinSet) {
      items.push({
        id: `coin-${c}`,
        group: "Coins",
        label: c,
        hint: "View details",
        perform: () => {
          setTab("positions");
        },
      });
    }
    items.push(
      {
        id: "settings",
        group: "Actions",
        label: "Open settings",
        shortcut: "⌘,",
        perform: () => setSettingsOpen(true),
      },
      {
        id: "menubar-toggle",
        group: "Actions",
        label: settings.menuBarMode ? "Exit menu-bar mode" : "Enter menu-bar mode",
        perform: () =>
          setSettings((s) => ({ ...s, menuBarMode: !s.menuBarMode })),
      },
      {
        id: "compact-toggle",
        group: "Actions",
        label: settings.compactMode ? "Disable compact density" : "Enable compact density",
        perform: () =>
          setSettings((s) => ({ ...s, compactMode: !s.compactMode })),
      },
      {
        id: "theme-dark",
        group: "Theme",
        label: "Dark",
        perform: () => setSettings((s) => ({ ...s, theme: "dark" })),
      },
      {
        id: "theme-light",
        group: "Theme",
        label: "Light",
        perform: () => setSettings((s) => ({ ...s, theme: "light" })),
      },
      {
        id: "theme-auto",
        group: "Theme",
        label: "Auto (system)",
        perform: () => setSettings((s) => ({ ...s, theme: "auto" })),
      },
    );
    return items;
  }, [wallets, positions, settings.menuBarMode, settings.compactMode]);

  const onTestWebhook = useCallback(async () => {
    try {
      await sendWebhook(settings.webhookUrl, settings.webhookFormat, {
        title: "Hyper-Display test",
        body: "Webhook mirror is wired up. Real liquidation alerts will land here whenever a position gets close.",
        severity: "info",
      });
    } catch (err) {
      console.warn("test webhook failed", err);
    }
  }, [settings.webhookUrl, settings.webhookFormat]);

  const validSelection = aggregate
    ? wallets.length > 0
    : isValidAddress(selection);

  const status = !validSelection
    ? "idle"
    : error
      ? "err"
      : data
        ? "live"
        : "idle";

  const statusLabel = !validSelection
    ? aggregate
      ? "Add wallets to aggregate"
      : "Awaiting wallet"
    : error
      ? "Connection issue"
      : lastUpdated
        ? `Updated ${timeAgo(lastUpdated)}`
        : "Loading…";

  void now;

  const compact = settings.compactMode || settings.menuBarMode;

  const startWindowDrag = useCallback((e: ReactMouseEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, input, a, [data-no-drag]")) return;
    getCurrentWindow()
      .startDragging()
      .catch(() => {});
  }, []);

  return (
    <div className={`app ${compact ? "compact" : ""} ${settings.menuBarMode ? "menubar" : ""}`}>
      <div
        className="topbar"
        data-tauri-drag-region
        onMouseDown={startWindowDrag}
      >
        <div className="brand" data-tauri-drag-region>
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">Hyper-Display</span>
        </div>
        <AddressBar value={address} onChange={setAddress} compact={compact} />
        <WalletMenu
          wallets={wallets}
          active={address}
          onPick={setSelection}
          onSave={onSaveCurrent}
          onRemove={onRemoveWallet}
          onRename={onRenameWallet}
          onPickAll={() => setSelection(ALL)}
          aggregateActive={aggregate}
        />
        <div className="topbar-status" data-tauri-drag-region>
          {aggregate ? (
            <span className="mono subtle">{wallets.length} wallets</span>
          ) : (
            isValidAddress(address) && (
              <span className="mono subtle">{shortAddress(address)}</span>
            )
          )}
          <span className={`dot ${status}`} aria-hidden />
          <span>{statusLabel}</span>
        </div>
        <div className="topbar-actions" data-tauri-drag-region="false">
          {settings.menuBarMode && (
            <button
              type="button"
              className="settings-trigger"
              onClick={() =>
                setSettings((s) => ({ ...s, menuBarMode: false }))
              }
              title="Exit menu-bar mode"
              aria-label="Exit menu-bar mode"
            >
              <ExpandIcon />
            </button>
          )}
          <button
            type="button"
            className="settings-trigger"
            onClick={() => setSettingsOpen(true)}
            title="Settings (⌘,)"
            aria-label="Settings"
          >
            <GearIcon />
          </button>
        </div>
      </div>

      {loading && !data && <div className="loading-line" />}

      <AccountSummary state={data?.state ?? null} />

      {!validSelection ? (
        <NoAddress aggregate={aggregate} />
      ) : error && !data ? (
        <ErrorState message={error} />
      ) : (
        <>
          <EquityStrip
            portfolio={portfolio}
            showSecondary={settings.showSecondarySeries}
          />
          <div className="panels">
            <div className="tabs" role="tablist">
              <Tab
                id="positions"
                label="Positions"
                count={positions.length}
                active={tab === "positions"}
                onClick={() => setTab("positions")}
              />
              <Tab
                id="orders"
                label="Open Orders"
                count={orders.length}
                active={tab === "orders"}
                onClick={() => setTab("orders")}
              />
              <Tab
                id="fills"
                label="Recent Fills"
                count={fills.length}
                active={tab === "fills"}
                onClick={() => setTab("fills")}
              />
              <Tab
                id="funding"
                label="Funding"
                count={funding.length}
                active={tab === "funding"}
                onClick={() => setTab("funding")}
              />
            </div>
            <div className="panel-body">
              {tab === "positions" && (
                <>
                  {positions.length > 0 && (
                    <PositionsBreakdown positions={positions} fills={fills} />
                  )}
                  <PositionsTable
                    positions={positions}
                    mids={data?.mids ?? {}}
                    candles={candles}
                    aggregate={aggregate}
                    columns={settings.positionColumns}
                  />
                </>
              )}
              {tab === "orders" && (
                <OrdersTable orders={orders} aggregate={aggregate} />
              )}
              {tab === "fills" && (
                <FillsTable
                  fills={fills}
                  address={aggregate ? "all-wallets" : address}
                  aggregate={aggregate}
                />
              )}
              {tab === "funding" && (
                <FundingTable
                  entries={funding}
                  address={aggregate ? "all-wallets" : address}
                  aggregate={aggregate}
                />
              )}
            </div>
          </div>
        </>
      )}

      <CommandPalette
        open={paletteOpen}
        items={commandItems}
        onClose={() => setPaletteOpen(false)}
      />

      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
        onTestNotification={onTestNotification}
        onTestWebhook={onTestWebhook}
        notifPermission={notifPermission}
        onRequestPermission={onRequestPermission}
        onExportBackup={onExportBackup}
        onImportBackup={onImportBackup}
      />
    </div>
  );
}

function Tab({
  id,
  label,
  count,
  active,
  onClick,
}: {
  id: string;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      id={`tab-${id}`}
      className={`tab ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="count">{count}</span>
    </button>
  );
}

function NoAddress({ aggregate }: { aggregate: boolean }) {
  if (aggregate) {
    return (
      <div className="empty" style={{ flex: 1 }}>
        <div>No wallets saved yet.</div>
        <div className="hint">
          Save at least two wallets in the Wallets menu to use the aggregate view.
        </div>
      </div>
    );
  }
  return (
    <div className="empty" style={{ flex: 1 }}>
      <div>Paste a Hyperliquid wallet address to begin.</div>
      <div className="hint">
        Hyper-Display reads from the public Hyperliquid info API. It is read-only,
        runs on your machine, and never asks for keys or signatures.
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="empty" style={{ flex: 1 }}>
      <div className="error">Could not reach the Hyperliquid API.</div>
      <div className="hint mono">{message}</div>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
