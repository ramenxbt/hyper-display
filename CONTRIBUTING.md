# Contributing to Hyper-Display

Thanks for stopping by. Hyper-Display is a small, focused app: a read-only desktop dashboard for Hyperliquid. The bar for new features is "would I want this on my own monitor every day?" If yes, open an issue and let's talk.

## Quick links

- [Open issues](https://github.com/ramenxbt/hyper-display/issues)
- [Roadmap (in the README)](README.md#roadmap)
- [Hyperliquid info API reference](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)

## Development setup

Same prerequisites as **Build from source** in the [README](README.md#build-from-source) (Xcode CLT / VS Build Tools / Linux dev libs, plus Rust and Node 20+).

```bash
git clone https://github.com/ramenxbt/hyper-display.git
cd hyper-display
npm install
npm run tauri:dev
```

The frontend is React + TypeScript + Vite; HMR picks up edits live. The Rust shell rebuilds automatically when you save a file under `src-tauri/`.

### Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run tauri:dev` | Run the desktop app with hot reload |
| `npm run tauri:build` | Produce a distributable bundle (see README for output paths) |
| `npm run build` | Type-check and produce the Vite production bundle |
| `npm run lint` | ESLint over the frontend |
| `cd src-tauri && cargo check` | Type-check the Rust shell |

## Project layout

The README has a tree under [Architecture](README.md#architecture). Two rules of thumb:

- **Frontend-only feature?** Add a hook in `src/hooks/`, a component in `src/components/`, wire it into `src/App.tsx`. Keep state in `src/lib/settings.ts` if it should persist.
- **Needs OS access (window, tray, file picker, native notification)?** Add a Tauri command in `src-tauri/src/lib.rs` and call it via `invoke` from the frontend. Update the capability file in `src-tauri/capabilities/default.json` if a new permission is required.

## Style

- TypeScript strict mode is on, prefer explicit types on exported APIs.
- Defaults over knobs: don't add a setting if a sane default works.
- Single em dashes are fine, but no paired em-dash bracketing (`X — aside — Y`).
- No comments that just narrate code. Only comment when the *why* is non-obvious.
- Avoid AI-generated images / logos. Real screenshots or nothing.

## Commits

This project uses many small focused commits, not one mega-commit per session. A typical sequence for a new feature:

1. `feat(api): add foo endpoint`
2. `feat(ui): foo component`
3. `feat(app): wire foo into the dashboard`
4. `chore: bump version + update README`

Conventional-ish prefixes (`feat`, `fix`, `chore`, `docs`, `refactor`) are used loosely. Keep subject lines under ~72 chars.

## Pull requests

1. Fork, create a feature branch off `main`.
2. Run `npm run build` and `cd src-tauri && cargo check` before pushing.
3. Open the PR with a short description: what changed, why, what you tested.
4. Screenshots for visible UI changes are appreciated.

## Reporting bugs

Use the **Bug report** issue template. Include:

- OS and version (e.g. macOS 15.4, Windows 11, Ubuntu 24.04).
- Hyper-Display version (visible in `package.json`, or `git describe --tags`).
- Steps to reproduce.
- Expected vs actual.
- Any console output (open dev tools with `Cmd+Opt+I` / `F12`).

## Feature requests

Use the **Feature request** issue template. Tell us the use case before the implementation.

## Code of conduct

Be respectful, be patient, no harassment. Take disagreements to private DMs first if they get heated.
