import type { WalletTag } from "../lib/aggregate";
import { shortAddress } from "../lib/format";

export function WalletChip({ wallet }: { wallet?: WalletTag }) {
  if (!wallet) return null;
  return (
    <span className="wallet-chip" title={wallet.address}>
      {wallet.label || shortAddress(wallet.address)}
    </span>
  );
}
