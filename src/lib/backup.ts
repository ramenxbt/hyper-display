import { DEFAULT_SETTINGS, type Settings } from "./settings";
import type { SavedWallet } from "./wallets";
import { isValidAddress } from "./hl";

export type BackupFile = {
  app: "hyper-display";
  version: 1;
  exportedAt: number;
  wallets: SavedWallet[];
  settings: Settings;
};

export function buildBackup(
  wallets: SavedWallet[],
  settings: Settings,
): BackupFile {
  return {
    app: "hyper-display",
    version: 1,
    exportedAt: Date.now(),
    wallets,
    settings,
  };
}

export function downloadBackup(data: BackupFile): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date(data.exportedAt)
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  a.download = `hyper-display_backup_${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export type ParsedBackup = {
  ok: true;
  data: BackupFile;
} | {
  ok: false;
  error: string;
};

export function parseBackup(raw: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: `Invalid JSON: ${(err as Error).message}` };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Backup file is empty or malformed." };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.app !== "hyper-display") {
    return { ok: false, error: "Not a Hyper-Display backup file." };
  }
  if (obj.version !== 1) {
    return { ok: false, error: `Unsupported backup version: ${obj.version}.` };
  }
  const wallets = Array.isArray(obj.wallets)
    ? (obj.wallets.filter(
        (w): w is SavedWallet =>
          !!w &&
          typeof w === "object" &&
          typeof (w as SavedWallet).address === "string" &&
          isValidAddress((w as SavedWallet).address),
      ) as SavedWallet[])
    : [];
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...((obj.settings as Partial<Settings>) ?? {}),
  };
  return {
    ok: true,
    data: {
      app: "hyper-display",
      version: 1,
      exportedAt: typeof obj.exportedAt === "number" ? obj.exportedAt : Date.now(),
      wallets,
      settings,
    },
  };
}

export function pickBackupFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result?.toString() ?? null);
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
