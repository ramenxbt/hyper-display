export type WebhookFormat = "discord" | "slack" | "generic";

export type Settings = {
  notifyLiqEnabled: boolean;
  liqThresholdPct: number; // distance from mark to liq, as percent
  refreshSeconds: number; // 2..30
  showSecondarySeries: boolean;
  compactMode: boolean;
  menuBarMode: boolean;
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookFormat: WebhookFormat;
  autoLaunch: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  notifyLiqEnabled: false,
  liqThresholdPct: 5,
  refreshSeconds: 5,
  showSecondarySeries: true,
  compactMode: false,
  menuBarMode: false,
  webhookEnabled: false,
  webhookUrl: "",
  webhookFormat: "discord",
  autoLaunch: false,
};

const KEY = "hyper-display.settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
