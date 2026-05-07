import { useEffect, useRef } from "react";
import {
  isPermissionGranted,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { FundingRow } from "./useFundingRates";
import { sendWebhook } from "../lib/webhook";
import type { AlertRule, WebhookFormat } from "../lib/settings";

const THROTTLE_MS = 30 * 60 * 1000;

type Args = {
  rules: AlertRule[];
  rows: FundingRow[];
  watchlist: Set<string>;
  notifyEnabled: boolean;
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookFormat: WebhookFormat;
};

export function useFundingAlerts({
  rules,
  rows,
  watchlist,
  notifyEnabled,
  webhookEnabled,
  webhookUrl,
  webhookFormat,
}: Args): void {
  const lastFiredRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const fundingRules = rules.filter(
      (r) => r.enabled && r.type === "funding-abs-above",
    );
    if (fundingRules.length === 0) return;
    if (rows.length === 0) return;
    if (watchlist.size === 0) return;
    if (!notifyEnabled && !(webhookEnabled && webhookUrl)) return;

    let cancelled = false;
    const watched = rows.filter((r) =>
      watchlist.has(r.coin.toUpperCase()),
    );

    const run = async () => {
      const granted = notifyEnabled ? await isPermissionGranted() : false;
      if (cancelled) return;
      const now = Date.now();
      for (const rule of fundingRules) {
        const thresholdPct = Math.abs(rule.threshold);
        for (const r of watched) {
          const ratePct = r.funding * 100;
          if (Math.abs(ratePct) < thresholdPct) continue;

          const key = `${rule.id}:${r.coin}`;
          const last = lastFiredRef.current.get(key) ?? 0;
          if (now - last < THROTTLE_MS) continue;

          const direction = ratePct > 0 ? "longs paying" : "shorts paying";
          const title = rule.label || `${r.coin} funding rate above ${thresholdPct}%`;
          const body = `${r.coin} 1H funding ${ratePct.toFixed(4)}% (${direction}); threshold ${thresholdPct}%.`;

          if (granted) sendNotification({ title, body });
          if (webhookEnabled && webhookUrl) {
            sendWebhook(webhookUrl, webhookFormat, {
              title,
              body,
              coin: r.coin,
              severity: "info",
            }).catch((err) => console.warn("webhook failed", err));
          }
          lastFiredRef.current.set(key, now);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    rules,
    rows,
    watchlist,
    notifyEnabled,
    webhookEnabled,
    webhookUrl,
    webhookFormat,
  ]);
}
