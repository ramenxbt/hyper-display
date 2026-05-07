const HL_INFO_URL = "https://api.hyperliquid.xyz/info";

export type Leverage = {
  type: "cross" | "isolated";
  value: number;
  rawUsd?: string;
};

export type AssetPosition = {
  type: "oneWay";
  position: {
    coin: string;
    szi: string;
    entryPx: string | null;
    leverage: Leverage;
    liquidationPx: string | null;
    marginUsed: string;
    maxLeverage: number;
    positionValue: string;
    returnOnEquity: string;
    unrealizedPnl: string;
    cumFunding?: { allTime: string; sinceOpen: string; sinceChange: string };
  };
};

export type MarginSummary = {
  accountValue: string;
  totalNtlPos: string;
  totalRawUsd: string;
  totalMarginUsed: string;
};

export type ClearinghouseState = {
  marginSummary: MarginSummary;
  crossMarginSummary: MarginSummary;
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  assetPositions: AssetPosition[];
  time: number;
};

export type OpenOrder = {
  coin: string;
  side: "B" | "A";
  limitPx: string;
  sz: string;
  oid: number;
  timestamp: number;
  origSz: string;
  reduceOnly?: boolean;
  orderType?: string;
  triggerPx?: string;
  triggerCondition?: string;
  isTrigger?: boolean;
  tif?: string;
};

export type UserFill = {
  coin: string;
  px: string;
  sz: string;
  side: "B" | "A";
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken: string;
};

export type AllMids = Record<string, string>;

export type PortfolioFrameKey =
  | "day"
  | "week"
  | "month"
  | "allTime"
  | "perpDay"
  | "perpWeek"
  | "perpMonth"
  | "perpAllTime";

export type PortfolioFrame = {
  accountValueHistory: [number, string][];
  pnlHistory: [number, string][];
  vlm: string;
};

export type PortfolioHistory = [PortfolioFrameKey, PortfolioFrame][];

export type FundingDelta = {
  type: "funding";
  coin: string;
  usdc: string;
  szi: string;
  fundingRate: string;
  nSamples?: number;
};

export type FundingEntry = {
  time: number;
  hash: string;
  delta: FundingDelta;
};

async function post<T>(body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(HL_INFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`HL info ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export const fetchClearinghouseState = (user: string, signal?: AbortSignal) =>
  post<ClearinghouseState>({ type: "clearinghouseState", user }, signal);

export const fetchOpenOrders = (user: string, signal?: AbortSignal) =>
  post<OpenOrder[]>({ type: "frontendOpenOrders", user }, signal);

export const fetchUserFills = (user: string, signal?: AbortSignal) =>
  post<UserFill[]>({ type: "userFills", user }, signal);

export const fetchAllMids = (signal?: AbortSignal) =>
  post<AllMids>({ type: "allMids" }, signal);

export const fetchPortfolio = (user: string, signal?: AbortSignal) =>
  post<PortfolioHistory>({ type: "portfolio", user }, signal);

export const fetchUserFunding = (
  user: string,
  startTime: number,
  signal?: AbortSignal,
) => post<FundingEntry[]>({ type: "userFunding", user, startTime }, signal);

export type Candle = {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
};

export const fetchCandleSnapshot = (
  coin: string,
  interval: string,
  startTime: number,
  endTime: number,
  signal?: AbortSignal,
) =>
  post<Candle[]>(
    {
      type: "candleSnapshot",
      req: { coin, interval, startTime, endTime },
    },
    signal,
  );

export function frameByKey(
  history: PortfolioHistory | undefined,
  key: PortfolioFrameKey,
): PortfolioFrame | undefined {
  return history?.find(([k]) => k === key)?.[1];
}

export type Snapshot = {
  state: ClearinghouseState;
  orders: OpenOrder[];
  fills: UserFill[];
  mids: AllMids;
  portfolio: PortfolioHistory;
  funding: FundingEntry[];
  fetchedAt: number;
};

const FUNDING_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

export async function fetchSnapshot(
  user: string,
  signal?: AbortSignal,
): Promise<Snapshot> {
  const fundingStart = Date.now() - FUNDING_LOOKBACK_MS;
  const [state, orders, fills, mids, portfolio, funding] = await Promise.all([
    fetchClearinghouseState(user, signal),
    fetchOpenOrders(user, signal),
    fetchUserFills(user, signal),
    fetchAllMids(signal),
    fetchPortfolio(user, signal),
    fetchUserFunding(user, fundingStart, signal),
  ]);
  return {
    state,
    orders,
    fills,
    mids,
    portfolio,
    funding,
    fetchedAt: Date.now(),
  };
}

export function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}
