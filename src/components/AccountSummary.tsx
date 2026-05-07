import type { ClearinghouseState } from "../lib/hl";
import { fmtSignedUsd, fmtUsd } from "../lib/format";

type Props = {
  state: ClearinghouseState | null;
};

function totalUnrealized(state: ClearinghouseState): number {
  return state.assetPositions.reduce(
    (acc, p) => acc + parseFloat(p.position.unrealizedPnl || "0"),
    0,
  );
}

export function AccountSummary({ state }: Props) {
  const account = state?.marginSummary.accountValue ?? null;
  const ntl = state?.marginSummary.totalNtlPos ?? null;
  const margin = state?.marginSummary.totalMarginUsed ?? null;
  const withdrawable = state?.withdrawable ?? null;
  const upnl = state ? totalUnrealized(state) : null;
  const positions = state?.assetPositions.length ?? null;

  const upnlClass =
    upnl == null ? "" : upnl > 0 ? "long" : upnl < 0 ? "short" : "";

  return (
    <div className="summary">
      <Cell k="Account Value" v={account == null ? "—" : fmtUsd(account)} accent />
      <Cell
        k="Unrealized PnL"
        v={upnl == null ? "—" : fmtSignedUsd(upnl)}
        valueClass={upnlClass}
      />
      <Cell k="Notional" v={ntl == null ? "—" : fmtUsd(ntl)} />
      <Cell k="Margin Used" v={margin == null ? "—" : fmtUsd(margin)} />
      <Cell k="Withdrawable" v={withdrawable == null ? "—" : fmtUsd(withdrawable)} />
      <Cell k="Open Positions" v={positions == null ? "—" : String(positions)} />
    </div>
  );
}

function Cell({
  k,
  v,
  accent,
  valueClass,
}: {
  k: string;
  v: string;
  accent?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="summary-cell">
      <div className="k">{k}</div>
      <div className={`v ${accent ? "accent" : ""} ${valueClass ?? ""}`}>{v}</div>
    </div>
  );
}
