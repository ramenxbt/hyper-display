import { useEffect, useRef, useState } from "react";
import type { SavedWallet } from "../lib/wallets";
import { shortAddress } from "../lib/format";
import { isValidAddress } from "../lib/hl";

type Props = {
  wallets: SavedWallet[];
  active: string;
  onPick: (address: string) => void;
  onSave: (label?: string) => void;
  onRemove: (address: string) => void;
  onRename: (address: string, label: string) => void;
  onPickAll?: () => void;
  aggregateActive?: boolean;
};

export function WalletMenu({
  wallets,
  active,
  onPick,
  onSave,
  onRemove,
  onRename,
  onPickAll,
  aggregateActive,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [labelDraft, setLabelDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const isSaved = wallets.some((w) => w.address.toLowerCase() === active.toLowerCase());
  const canSave = isValidAddress(active) && !isSaved;

  return (
    <div className="wallet-menu" ref={ref} data-tauri-drag-region="false">
      <button
        type="button"
        className="wallet-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>Wallets</span>
        <span className="count">{wallets.length}</span>
      </button>
      {open && (
        <div className="wallet-pop" role="menu">
          {wallets.length === 0 && (
            <div className="wallet-empty">No saved wallets yet.</div>
          )}
          {wallets.length >= 2 && onPickAll && (
            <div className={`wallet-row ${aggregateActive ? "active" : ""}`}>
              <button
                type="button"
                className="wallet-pick"
                onClick={() => {
                  onPickAll();
                  setOpen(false);
                }}
                title="Aggregate every saved wallet"
              >
                <span className="wallet-label">All wallets</span>
                <span className="wallet-addr mono subtle">
                  {wallets.length} accounts
                </span>
                <span className="wallet-key">⌘0</span>
              </button>
            </div>
          )}
          {wallets.map((w, idx) => {
            const isActive = w.address.toLowerCase() === active.toLowerCase();
            return (
              <div
                key={w.address}
                className={`wallet-row ${isActive ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="wallet-pick"
                  onClick={() => {
                    onPick(w.address);
                    setOpen(false);
                  }}
                  title="Switch to this wallet"
                >
                  <span className="wallet-label">
                    {w.label || shortAddress(w.address)}
                  </span>
                  {w.label && (
                    <span className="wallet-addr mono subtle">
                      {shortAddress(w.address)}
                    </span>
                  )}
                  {idx < 9 && <span className="wallet-key">⌘{idx + 1}</span>}
                </button>
                <button
                  type="button"
                  className="wallet-rename"
                  title="Rename"
                  onClick={() => {
                    const next = window.prompt(
                      "Label for this wallet",
                      w.label ?? "",
                    );
                    if (next != null) onRename(w.address, next);
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="wallet-remove"
                  title="Remove"
                  onClick={() => onRemove(w.address)}
                >
                  ✕
                </button>
              </div>
            );
          })}
          {canSave && (
            <div className="wallet-add">
              <input
                placeholder="Label (optional)"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSave(labelDraft);
                    setLabelDraft("");
                  }
                }}
              />
              <button
                type="button"
                className="wallet-save"
                onClick={() => {
                  onSave(labelDraft);
                  setLabelDraft("");
                }}
              >
                Save current
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
