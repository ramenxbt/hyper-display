import type { WebhookFormat } from "./settings";

export type WebhookPayload = {
  title: string;
  body: string;
  coin?: string;
  severity?: "info" | "warning";
};

const COLORS = {
  warning: 0xed7088,
  info: 0x97fce4,
};

function buildBody(payload: WebhookPayload, format: WebhookFormat): unknown {
  const color = COLORS[payload.severity ?? "warning"];
  switch (format) {
    case "discord":
      return {
        username: "Hyper-Display",
        embeds: [
          {
            title: payload.title,
            description: payload.body,
            color,
            footer: { text: payload.coin ? `coin: ${payload.coin}` : "Hyper-Display" },
            timestamp: new Date().toISOString(),
          },
        ],
      };
    case "slack":
      return {
        text: `*${payload.title}*\n${payload.body}`,
      };
    case "generic":
    default:
      return {
        title: payload.title,
        body: payload.body,
        coin: payload.coin ?? null,
        severity: payload.severity ?? "warning",
        timestamp: Date.now(),
        source: "hyper-display",
      };
  }
}

export async function sendWebhook(
  url: string,
  format: WebhookFormat,
  payload: WebhookPayload,
): Promise<void> {
  if (!url) return;
  const body = buildBody(payload, format);
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function isLikelyValidWebhookUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
