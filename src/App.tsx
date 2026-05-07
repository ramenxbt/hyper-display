import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { sendWebhook } from "./lib/webhook";
import { AddressBar } from "./components/AddressBar";
import { AccountSummary } from "./components/AccountSummary";
import { EquityStrip } from "./components/EquityStrip";
import { PositionsTable } from "./components/PositionsTable";
import { OrdersTable } from "./components/OrdersTable";
import { FillsTable } from "./components/FillsTable";
import { FundingTable } from "./components/FundingTable";
import { WalletMenu } from "./components/WalletMenu";
import { SettingsPanel } from "./components/SettingsPanel";
import { useSnapshot } from "./hooks/useSnapshot";
import { useLiqAlerts } from "./hooks/useLiqAlerts";
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

export default function App() {
  const [address, setAddress] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  });
  const [wallets, setWallets] = useState<SavedWallet[]>(() => loadWallets());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifPermission, setNotifPermission] =
    useState<"granted" | "denied" | "unknown">("unknown");
  const [tab, setTab] = useState<Tab>("positions");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (isValidAddress(address)) localStorage.setItem(STORAGE_KEY, address);
  }, [address]);

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

  // cmd+1..9 / ctrl+1..9 to switch wallets
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const num = parseInt(e.key, 10);
      if (Number.isFinite(num) && num >= 1 && num <= 9) {
        const target = wallets[num - 1];
        if (target) {
          e.preventDefault();
          setAddress(target.address);
        }
      }
      if (meta && (e.key === "," || e.key === ".")) {
        e.preventDefault();
        setSettingsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wallets]);

  const { data, error, loading, lastUpdated } = useSnapshot(
    address,
    settings.refreshSeconds * 1000,
  );

  const positions = data?.state.assetPositions ?? [];
  const orders = data?.orders ?? [];
  const fills = data?.fills ?? [];
  const funding = data?.funding ?? [];
  const portfolio = data?.portfolio;

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

  const status = !isValidAddress(address)
    ? "idle"
    : error
      ? "err"
      : data
        ? "live"
        : "idle";

  const statusLabel = !isValidAddress(address)
    ? "Awaiting wallet"
    : error
      ? "Connection issue"
      : lastUpdated
        ? `Updated ${timeAgo(lastUpdated)}`
        : "Loading…";

  void now;

  const compact = settings.compactMode || settings.menuBarMode;

  return (
    <div className={`app ${compact ? "compact" : ""}`}>
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">Hyper-Display</span>
        </div>
        <AddressBar value={address} onChange={setAddress} />
        <WalletMenu
          wallets={wallets}
          active={address}
          onPick={setAddress}
          onSave={onSaveCurrent}
          onRemove={onRemoveWallet}
          onRename={onRenameWallet}
        />
        <div className="topbar-status">
          {isValidAddress(address) && (
            <span className="mono subtle">{shortAddress(address)}</span>
          )}
          <span className={`dot ${status}`} aria-hidden />
          <span>{statusLabel}</span>
        </div>
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

      {loading && !data && <div className="loading-line" />}

      <AccountSummary state={data?.state ?? null} />

      {!isValidAddress(address) ? (
        <NoAddress />
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
                <PositionsTable positions={positions} mids={data?.mids ?? {}} />
              )}
              {tab === "orders" && <OrdersTable orders={orders} />}
              {tab === "fills" && <FillsTable fills={fills} />}
              {tab === "funding" && <FundingTable entries={funding} />}
            </div>
          </div>
        </>
      )}

      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
        onTestNotification={onTestNotification}
        onTestWebhook={onTestWebhook}
        notifPermission={notifPermission}
        onRequestPermission={onRequestPermission}
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

function NoAddress() {
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

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
