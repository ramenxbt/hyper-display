# Security

Hyper-Display is a read-only desktop app. This page tells you exactly what it does and does not do, and how to report a vulnerability if you find one.

## What it does

- Sends `POST` requests to `https://api.hyperliquid.xyz/info` with the wallet address you paste, asking "what positions does this wallet have?".
- Loads two web fonts (Inter, JetBrains Mono) from `fonts.googleapis.com` at startup.
- Sends native OS notifications (macOS, Windows, Linux) only if you turn on alerts in settings.
- Sends one `POST` request to a webhook URL you configure, only if you turn on the webhook mirror.

## What it does NOT do

- **Never asks for keys.** No private key, no seed phrase, no signing prompt anywhere. The app's source has zero EIP-712 / signing code paths. Search the repo for `signTypedData` or `personal_sign`: there are no matches.
- **Never holds funds.** No wallet integration, no contract calls, no withdrawals, no transfers. Hyperliquid's trade endpoints are intentionally unused.
- **No telemetry.** No analytics, no crash reporting, no "phone home" of any kind.
- **No auto-update channel** in v0.x. New versions are released manually on GitHub. Nothing is fetched and executed in the background.
- **No backend.** There is no Hyper-Display server. Every request is from your machine to either Hyperliquid's public API, the Google Fonts CDN, or the webhook URL you configure.

## How to verify it yourself

Every outbound network call lives in [`src/lib/hl.ts`](src/lib/hl.ts) and [`src/lib/webhook.ts`](src/lib/webhook.ts). They are short and readable. Anyone with a few minutes can confirm there is nothing else.

You can also build the app yourself from source ([Build from source](README.md#build-from-source)) and run the dev tools network tab to watch live: you will only see hits to `api.hyperliquid.xyz`, `fonts.googleapis.com` / `fonts.gstatic.com`, and your webhook URL if configured.

## Verify a downloaded binary

Releases tagged `v0.9.2` and later carry a [GitHub artifact attestation](https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds): a cryptographic stamp proving the binary was produced by this repository's CI on a specific commit.

To verify a download:

```bash
gh attestation verify Hyper-Display_<version>_aarch64.dmg --owner ramenxbt
```

A green checkmark means the file you downloaded was built by GitHub Actions from `ramenxbt/hyper-display` and has not been modified since. Any tampering breaks the signature.

## Reporting a vulnerability

If you find a security issue, please **do not** open a public GitHub issue. Instead:

- Email **ramenxbt@proton.me** with `[hyper-display security]` in the subject.
- Or use [GitHub's private vulnerability reporting](https://github.com/ramenxbt/hyper-display/security/advisories/new) for this repo.

You can expect:

- An acknowledgement within 72 hours.
- A patch and a CVE if the issue is real, before any public disclosure.
- Credit in the changelog if you would like it.

## Scope

In scope:

- Code execution, key exfiltration, unintended outbound traffic, supply-chain compromise of the build pipeline, malicious update vectors.

Out of scope:

- Issues that require physical access to a user's unlocked machine (which already breaks the trust model of any local app).
- Bugs in Hyperliquid's API itself (report those to [Hyperliquid](https://hyperliquid.xyz)).
- Bugs in third-party services you choose to wire up (Discord, Slack, your own webhook server).

## Code-signing roadmap

Pre-v1.0 binaries are not signed by Apple or Microsoft, so macOS Gatekeeper and Windows SmartScreen will warn on first launch. Signed builds are part of the v1.0 release pass:

- macOS: Apple Developer Program enrollment, Developer ID Application + Installer signing, notarization.
- Windows: EV Code Signing certificate.
- Linux: AppImages and `.deb` / `.rpm` will continue to be unsigned (standard for the platform); release artifacts will publish SHA256 checksums.

Until then: build from source if you want zero warnings, or use the documented one-line `xattr` / "Run anyway" steps in the [README](README.md#install).
