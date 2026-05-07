export type WebhookFormat = "discord" | "slack" | "generic";
export type Theme = "dark" | "light" | "auto";

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
  theme: Theme;
  positionColumns: PositionColumnVisibility;
};

export type PositionColumnVisibility = {
  entry: boolean;
  mark: boolean;
  spark24h: boolean;
  liq: boolean;
  margin: boolean;
  roe: boolean;
  lev: boolean;
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
  theme: "dark",
  positionColumns: {
    entry: true,
    mark: true,
    spark24h: true,
    liq: true,
    margin: true,
    roe: true,
    lev: true,
  },
};

const KEY = "hyper-display.settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      positionColumns: {
        ...DEFAULT_SETTINGS.positionColumns,
        ...(parsed.positionColumns ?? {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
