import type {
  AssetPosition,
  ClearinghouseState,
  FundingEntry,
  MarginSummary,
  OpenOrder,
  PortfolioFrame,
  PortfolioFrameKey,
  PortfolioHistory,
  Snapshot,
  UserFill,
  AllMids,
} from "./hl";

export type WalletTag = { address: string; label?: string };

export type TaggedAssetPosition = AssetPosition & { wallet?: WalletTag };
export type TaggedOpenOrder = OpenOrder & { wallet?: WalletTag };
export type TaggedUserFill = UserFill & { wallet?: WalletTag };
export type TaggedFundingEntry = FundingEntry & { wallet?: WalletTag };

export type AggregatedState = {
  marginSummary: MarginSummary;
  crossMarginSummary: MarginSummary;
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  assetPositions: TaggedAssetPosition[];
  time: number;
};

export type AggregateSnapshot = {
  state: AggregatedState;
  orders: TaggedOpenOrder[];
  fills: TaggedUserFill[];
  mids: AllMids;
  portfolio: PortfolioHistory;
  funding: TaggedFundingEntry[];
  fetchedAt: number;
  walletCount: number;
};

const ZERO_MARGIN: MarginSummary = {
  accountValue: "0",
  totalNtlPos: "0",
  totalRawUsd: "0",
  totalMarginUsed: "0",
};

function addStrFloat(a: string, b: string): string {
  return (parseFloat(a) + parseFloat(b)).toString();
}

function sumMargin(a: MarginSummary, b: MarginSummary): MarginSummary {
  return {
    accountValue: addStrFloat(a.accountValue, b.accountValue),
    totalNtlPos: addStrFloat(a.totalNtlPos, b.totalNtlPos),
    totalRawUsd: addStrFloat(a.totalRawUsd, b.totalRawUsd),
    totalMarginUsed: addStrFloat(a.totalMarginUsed, b.totalMarginUsed),
  };
}

function mergeFrames(frames: PortfolioFrame[]): PortfolioFrame {
  const byTs = new Map<number, { acct: number; pnl: number }>();
  for (const f of frames) {
    for (const [ts, v] of f.accountValueHistory) {
      const slot = byTs.get(ts) ?? { acct: 0, pnl: 0 };
      slot.acct += parseFloat(v);
      byTs.set(ts, slot);
    }
    for (const [ts, v] of f.pnlHistory) {
      const slot = byTs.get(ts) ?? { acct: 0, pnl: 0 };
      slot.pnl += parseFloat(v);
      byTs.set(ts, slot);
    }
  }
  const sorted = [...byTs.entries()].sort((a, b) => a[0] - b[0]);
  const acct: [number, string][] = sorted.map(([t, v]) => [t, v.acct.toString()]);
  const pnl: [number, string][] = sorted.map(([t, v]) => [t, v.pnl.toString()]);
  const vlmTotal = frames.reduce((acc, f) => acc + parseFloat(f.vlm || "0"), 0);
  return {
    accountValueHistory: acct,
    pnlHistory: pnl,
    vlm: vlmTotal.toString(),
  };
}

function mergePortfolios(portfolios: PortfolioHistory[]): PortfolioHistory {
  const byKey = new Map<PortfolioFrameKey, PortfolioFrame[]>();
  for (const p of portfolios) {
    for (const [k, frame] of p) {
      const arr = byKey.get(k) ?? [];
      arr.push(frame);
      byKey.set(k, arr);
    }
  }
  const out: PortfolioHistory = [];
  for (const [k, frames] of byKey) {
    out.push([k, mergeFrames(frames)]);
  }
  return out;
}

export function aggregateSnapshots(
  snapshots: { snapshot: Snapshot; wallet: WalletTag }[],
): AggregateSnapshot {
  if (snapshots.length === 1) {
    const { snapshot } = snapshots[0];
    return {
      state: snapshot.state as AggregatedState,
      orders: snapshot.orders,
      fills: snapshot.fills,
      mids: snapshot.mids,
      portfolio: snapshot.portfolio,
      funding: snapshot.funding,
      fetchedAt: snapshot.fetchedAt,
      walletCount: 1,
    };
  }

  let margin = ZERO_MARGIN;
  let crossMargin = ZERO_MARGIN;
  let withdrawable = 0;
  let crossMaint = 0;
  const positions: TaggedAssetPosition[] = [];
  const orders: TaggedOpenOrder[] = [];
  const fills: TaggedUserFill[] = [];
  const funding: TaggedFundingEntry[] = [];
  const mids: AllMids = {};

  for (const { snapshot, wallet } of snapshots) {
    margin = sumMargin(margin, snapshot.state.marginSummary);
    crossMargin = sumMargin(crossMargin, snapshot.state.crossMarginSummary);
    withdrawable += parseFloat(snapshot.state.withdrawable || "0");
    crossMaint += parseFloat(snapshot.state.crossMaintenanceMarginUsed || "0");

    for (const p of snapshot.state.assetPositions) {
      positions.push({ ...p, wallet });
    }
    for (const o of snapshot.orders) orders.push({ ...o, wallet });
    for (const f of snapshot.fills) fills.push({ ...f, wallet });
    for (const e of snapshot.funding) funding.push({ ...e, wallet });

    for (const [coin, mid] of Object.entries(snapshot.mids)) {
      if (!(coin in mids)) mids[coin] = mid;
    }
  }

  const portfolios = snapshots.map((s) => s.snapshot.portfolio);
  const mergedPortfolio = mergePortfolios(portfolios);

  const state: AggregatedState = {
    marginSummary: margin,
    crossMarginSummary: crossMargin,
    crossMaintenanceMarginUsed: crossMaint.toString(),
    withdrawable: withdrawable.toString(),
    assetPositions: positions,
    time: Date.now(),
  };

  return {
    state,
    orders,
    fills,
    mids,
    portfolio: mergedPortfolio,
    funding,
    fetchedAt: Date.now(),
    walletCount: snapshots.length,
  };
}

// allow ClearinghouseState aggregation to type-check the AggregatedState alias safely
export function asState(state: AggregatedState): ClearinghouseState {
  return state as unknown as ClearinghouseState;
}
