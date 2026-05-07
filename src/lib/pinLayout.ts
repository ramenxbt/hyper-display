export type PinEntry = {
  coin: string;
  wallet: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

const KEY = "hyper-display.pinLayout";

export function loadPinLayout(): PinEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PinEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is PinEntry =>
        !!p && typeof p.coin === "string" && typeof p.wallet === "string",
    );
  } catch {
    return [];
  }
}

export function savePinLayout(entries: PinEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

function sameKey(a: PinEntry, b: PinEntry): boolean {
  return (
    a.coin === b.coin && a.wallet.toLowerCase() === b.wallet.toLowerCase()
  );
}

export function upsertPin(entries: PinEntry[], next: PinEntry): PinEntry[] {
  const filtered = entries.filter((e) => !sameKey(e, next));
  return [...filtered, next];
}

export function removePin(
  entries: PinEntry[],
  coin: string,
  wallet: string,
): PinEntry[] {
  return entries.filter((e) => !sameKey(e, { coin, wallet }));
}
