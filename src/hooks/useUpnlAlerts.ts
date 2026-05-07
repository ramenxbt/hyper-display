import { useEffect, useRef } from "react";
import {
  isPermissionGranted,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { AssetPosition } from "../lib/hl";
import { fmtSignedUsd } from "../lib/format";
import { sendWebhook } from "../lib/webhook";
import type { AlertRule, WebhookFormat } from "../lib/settings";

const THROTTLE_MS = 30 * 60 * 1000;

type Args = {
  rules: AlertRule[];
  positions: AssetPosition[];
  notifyEnabled: boolean;
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookFormat: WebhookFormat;
};

export function useUpnlAlerts({
  rules,
  positions,
  notifyEnabled,
  webhookEnabled,
  webhookUrl,
  webhookFormat,
}: Args): void {
  const lastFiredRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!rules.some((r) => r.enabled)) return;
    if (!notifyEnabled && !(webhookEnabled && webhookUrl)) return;
    let cancelled = false;

    const totalUpnl = positions.reduce(
      (acc, p) => acc + parseFloat(p.position.unrealizedPnl),
      0,
    );

    const run = async () => {
      const granted = notifyEnabled ? await isPermissionGranted() : false;
      if (cancelled) return;

      const now = Date.now();
      for (const rule of rules) {
        if (!rule.enabled) continue;

        let triggered = false;
        let title = "";
        let body = "";

        if (rule.type === "upnl-below" && totalUpnl < rule.threshold) {
          triggered = true;
          title = rule.label || "Total uPnL below threshold";
          body = `uPnL ${fmtSignedUsd(totalUpnl)} dropped below ${fmtSignedUsd(rule.threshold)}.`;
        } else if (rule.type === "upnl-above" && totalUpnl > rule.threshold) {
          triggered = true;
          title = rule.label || "Total uPnL above threshold";
          body = `uPnL ${fmtSignedUsd(totalUpnl)} rose above ${fmtSignedUsd(rule.threshold)}.`;
        }

        if (!triggered) continue;
        const last = lastFiredRef.current.get(rule.id) ?? 0;
        if (now - last < THROTTLE_MS) continue;

        if (granted) sendNotification({ title, body });
        if (webhookEnabled && webhookUrl) {
          sendWebhook(webhookUrl, webhookFormat, {
            title,
            body,
            severity: rule.type === "upnl-below" ? "warning" : "info",
          }).catch((err) => console.warn("webhook failed", err));
        }
        lastFiredRef.current.set(rule.id, now);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    rules,
    positions,
    notifyEnabled,
    webhookEnabled,
    webhookUrl,
    webhookFormat,
  ]);
}
