import { useEffect, useRef } from "react";
import type { Settings } from "../lib/settings";

type Props = {
  open: boolean;
  settings: Settings;
  onChange: (next: Settings) => void;
  onClose: () => void;
  onTestNotification: () => void;
  notifPermission: "granted" | "denied" | "unknown";
  onRequestPermission: () => void;
};

export function SettingsPanel({
  open,
  settings,
  onChange,
  onClose,
  onTestNotification,
  notifPermission,
  onRequestPermission,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    onChange({ ...settings, [k]: v });

  return (
    <div className="settings-overlay" onMouseDown={onClose}>
      <div
        className="settings-panel"
        role="dialog"
        aria-label="Settings"
        ref={ref}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="settings-head">
          <span>Settings</span>
          <button className="settings-close" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <Section title="Refresh">
          <Field label="Polling interval">
            <div className="settings-row">
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={settings.refreshSeconds}
                onChange={(e) =>
                  set("refreshSeconds", parseInt(e.target.value, 10))
                }
              />
              <span className="mono">{settings.refreshSeconds}s</span>
            </div>
          </Field>
        </Section>

        <Section title="Equity chart">
          <Toggle
            label="Show alternate series"
            description="Dim dashed line for the other of equity / PnL."
            checked={settings.showSecondarySeries}
            onChange={(v) => set("showSecondarySeries", v)}
          />
        </Section>

        <Section title="Liquidation alerts">
          <Toggle
            label="Notify when mark approaches liquidation"
            description="Sends a native desktop notification, throttled to one per coin every 30 minutes."
            checked={settings.notifyLiqEnabled}
            onChange={(v) => set("notifyLiqEnabled", v)}
          />
          <Field label="Trigger distance">
            <div className="settings-row">
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={settings.liqThresholdPct}
                onChange={(e) =>
                  set("liqThresholdPct", parseInt(e.target.value, 10))
                }
                disabled={!settings.notifyLiqEnabled}
              />
              <span className="mono">{settings.liqThresholdPct}%</span>
            </div>
            <p className="settings-hint">
              Triggers when |mark − liq| / mark falls below this percent.
            </p>
          </Field>
          <div className="settings-row settings-perm">
            <span className={`perm-dot perm-${notifPermission}`} />
            <span className="muted">
              Permission:{" "}
              {notifPermission === "granted"
                ? "granted"
                : notifPermission === "denied"
                  ? "denied"
                  : "not requested"}
            </span>
            {notifPermission !== "granted" && (
              <button
                type="button"
                className="settings-btn"
                onClick={onRequestPermission}
              >
                Request
              </button>
            )}
            <button
              type="button"
              className="settings-btn"
              onClick={onTestNotification}
              disabled={notifPermission !== "granted"}
            >
              Send test
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-section">
      <div className="settings-section-title">{title}</div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-field">
      <div className="settings-field-label">{label}</div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="settings-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="settings-toggle-track" aria-hidden />
      <div className="settings-toggle-text">
        <span className="settings-toggle-label">{label}</span>
        {description && (
          <span className="settings-toggle-desc">{description}</span>
        )}
      </div>
    </label>
  );
}
