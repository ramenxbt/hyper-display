import { isValidAddress } from "./hl";

export type SavedWallet = {
  address: string;
  label?: string;
  notes?: string;
};

const KEY = "hyper-display.wallets";

export function loadWallets(): SavedWallet[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedWallet[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w): w is SavedWallet => !!w && typeof w.address === "string" && isValidAddress(w.address),
    );
  } catch {
    return [];
  }
}

export function saveWallets(wallets: SavedWallet[]): void {
  localStorage.setItem(KEY, JSON.stringify(wallets));
}

export function addWallet(
  wallets: SavedWallet[],
  next: SavedWallet,
): SavedWallet[] {
  const addr = next.address.trim().toLowerCase();
  if (wallets.some((w) => w.address.toLowerCase() === addr)) return wallets;
  return [...wallets, { address: next.address.trim(), label: next.label?.trim() || undefined }];
}

export function removeWallet(
  wallets: SavedWallet[],
  address: string,
): SavedWallet[] {
  const target = address.toLowerCase();
  return wallets.filter((w) => w.address.toLowerCase() !== target);
}

export function renameWallet(
  wallets: SavedWallet[],
  address: string,
  label: string,
): SavedWallet[] {
  const target = address.toLowerCase();
  return wallets.map((w) =>
    w.address.toLowerCase() === target ? { ...w, label: label.trim() || undefined } : w,
  );
}

export function setWalletNotes(
  wallets: SavedWallet[],
  address: string,
  notes: string,
): SavedWallet[] {
  const target = address.toLowerCase();
  return wallets.map((w) =>
    w.address.toLowerCase() === target
      ? { ...w, notes: notes.trim() || undefined }
      : w,
  );
}
