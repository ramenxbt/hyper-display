import { useEffect, useRef } from "react";
import {
  isPermissionGranted,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { AssetPosition, AllMids } from "../lib/hl";
import { fmtUsd } from "../lib/format";

const THROTTLE_MS = 30 * 60 * 1000;

type Args = {
  enabled: boolean;
  thresholdPct: number;
  positions: AssetPosition[];
  mids: AllMids;
};

export function useLiqAlerts({ enabled, thresholdPct, positions, mids }: Args): void {
  const lastFiredRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = async () => {
      const granted = await isPermissionGranted();
      if (!granted || cancelled) return;

      const now = Date.now();
      for (const { position: p } of positions) {
        if (!p.liquidationPx) continue;
        const liq = parseFloat(p.liquidationPx);
        const markStr = mids[p.coin];
        if (!markStr) continue;
        const mark = parseFloat(markStr);
        if (!Number.isFinite(mark) || mark === 0 || !Number.isFinite(liq)) continue;

        const distancePct = (Math.abs(mark - liq) / mark) * 100;
        if (distancePct >= thresholdPct) continue;

        const last = lastFiredRef.current.get(p.coin) ?? 0;
        if (now - last < THROTTLE_MS) continue;

        const isLong = parseFloat(p.szi) > 0;
        sendNotification({
          title: `${p.coin} approaching liquidation`,
          body: `Mark ${fmtUsd(mark)} vs liq ${fmtUsd(liq)} — ${distancePct.toFixed(2)}% away (${isLong ? "long" : "short"}, ${fmtUsd(p.positionValue)} notional).`,
        });
        lastFiredRef.current.set(p.coin, now);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [enabled, thresholdPct, positions, mids]);
}
