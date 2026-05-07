import { useState, type FormEvent } from "react";
import { isValidAddress } from "../lib/hl";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function AddressBar({ value, onChange }: Props) {
  const [draft, setDraft] = useState(value);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (isValidAddress(trimmed)) onChange(trimmed);
  };

  return (
    <form className="address-bar" onSubmit={submit}>
      <span className="label">Wallet</span>
      <input
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        placeholder="0x… paste any Hyperliquid address"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
    </form>
  );
}
