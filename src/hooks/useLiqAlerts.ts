import { useEffect, useRef } from "react";
import {
  isPermissionGranted,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { AssetPosition, AllMids } from "../lib/hl";
import { fmtUsd } from "../lib/format";
import { sendWebhook } from "../lib/webhook";
import type { WebhookFormat } from "../lib/settings";

const THROTTLE_MS = 30 * 60 * 1000;

type Args = {
  notifyEnabled: boolean;
  thresholdPct: number;
  positions: AssetPosition[];
  mids: AllMids;
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookFormat: WebhookFormat;
};

export function useLiqAlerts({
  notifyEnabled,
  thresholdPct,
  positions,
  mids,
  webhookEnabled,
  webhookUrl,
  webhookFormat,
}: Args): void {
  const lastFiredRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const anyChannelEnabled = notifyEnabled || (webhookEnabled && !!webhookUrl);
    if (!anyChannelEnabled) return;
    let cancelled = false;

    const run = async () => {
      const granted = notifyEnabled ? await isPermissionGranted() : false;
      if (cancelled) return;

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
        const title = `${p.coin} approaching liquidation`;
        const body = `Mark ${fmtUsd(mark)} vs liq ${fmtUsd(liq)} — ${distancePct.toFixed(2)}% away (${isLong ? "long" : "short"}, ${fmtUsd(p.positionValue)} notional).`;

        if (granted) {
          sendNotification({ title, body });
        }

        if (webhookEnabled && webhookUrl) {
          sendWebhook(webhookUrl, webhookFormat, {
            title,
            body,
            coin: p.coin,
            severity: "warning",
          }).catch((err) => {
            console.warn("webhook failed", err);
          });
        }

        lastFiredRef.current.set(p.coin, now);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    notifyEnabled,
    thresholdPct,
    positions,
    mids,
    webhookEnabled,
    webhookUrl,
    webhookFormat,
  ]);
}
