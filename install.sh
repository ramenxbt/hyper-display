#!/usr/bin/env bash
# Hyper-Display one-line installer.
#
#   curl -fsSL https://raw.githubusercontent.com/ramenxbt/hyper-display/main/install.sh | bash
#
# Detects OS + architecture, downloads the matching asset from the latest
# GitHub release, and walks you through opening it. macOS = .dmg into
# /Applications. Linux = AppImage into ~/.local/bin. Windows: prints the
# .msi URL (run install scripts manually on Windows).

set -euo pipefail

REPO="ramenxbt/hyper-display"
NAME="hyper-display"

mint() { printf '\033[0;32m%s\033[0m\n' "$1"; }
red()  { printf '\033[0;31m%s\033[0m\n' "$1"; }
note() { printf '\033[0;90m%s\033[0m\n' "$1"; }

uname_s="$(uname -s)"
uname_m="$(uname -m)"

case "$uname_s" in
  Darwin)
    case "$uname_m" in
      arm64) arch="aarch64" ;;
      x86_64) arch="x64" ;;
      *) red "Unsupported architecture: $uname_m"; exit 1 ;;
    esac
    asset_pattern="(${arch}|${uname_m}|universal)\\.dmg$"
    target="macos"
    ;;
  Linux)
    case "$uname_m" in
      x86_64) arch="amd64" ;;
      aarch64) arch="arm64" ;;
      *) red "Unsupported architecture: $uname_m"; exit 1 ;;
    esac
    asset_pattern="${arch}.AppImage$"
    target="linux"
    ;;
  *)
    red "Unsupported OS: $uname_s. On Windows download the .msi from the Releases page manually."
    open "https://github.com/${REPO}/releases/latest" 2>/dev/null || true
    exit 1
    ;;
esac

mint "Hyper-Display installer"
note "OS: $uname_s   Arch: $uname_m   Target: $target"

api="https://api.github.com/repos/${REPO}/releases/latest"
note "Fetching latest release..."

if command -v curl >/dev/null 2>&1; then
  release_json="$(curl -fsSL "$api")"
elif command -v wget >/dev/null 2>&1; then
  release_json="$(wget -qO- "$api")"
else
  red "Need curl or wget."; exit 1
fi

asset_url="$(printf '%s' "$release_json" | grep -Eo '"browser_download_url": *"[^"]+"' | sed 's/.*"browser_download_url": *"\([^"]*\)".*/\1/' | grep -E "$asset_pattern" | head -n 1 || true)"

if [ -z "${asset_url:-}" ]; then
  red "No matching asset found for ${target}/${arch} in the latest release."
  note "Visit https://github.com/${REPO}/releases/latest and download manually."
  exit 1
fi

filename="$(basename "$asset_url")"
tmp="$(mktemp -d)/${filename}"

mint "Downloading ${filename}..."
if command -v curl >/dev/null 2>&1; then
  curl -fL --progress-bar "$asset_url" -o "$tmp"
else
  wget -O "$tmp" "$asset_url"
fi

if [ "$target" = "macos" ]; then
  mint "Opening installer (drag Hyper-Display to /Applications)..."
  hdiutil attach -quiet "$tmp" || true
  open "$tmp"
  cat <<'EOF'

Next steps:
  1. Drag Hyper-Display.app into Applications.
  2. Launch it: macOS will block the first run because the app is unsigned.
     Right-click Hyper-Display in /Applications, choose Open, then click Open.
  3. After that, double-click as normal.

EOF
elif [ "$target" = "linux" ]; then
  install_dir="${HOME}/.local/bin"
  mkdir -p "$install_dir"
  dest="${install_dir}/${NAME}.AppImage"
  mv "$tmp" "$dest"
  chmod +x "$dest"
  mint "Installed to ${dest}"
  cat <<EOF

Run it with:
  ${NAME}.AppImage

If \$HOME/.local/bin is not on your PATH, add it to your shell profile:
  echo 'export PATH="\$HOME/.local/bin:\$PATH"' >> ~/.bashrc
EOF
fi

mint "Done."
