#!/bin/bash
# Puts Rook-like in /Applications: a native app (main.swift, a window with a WebKit view) showing index.html.
# The game folder path is baked into Info.plist: re-run this script if the folder moves.
# An app/saves.json (gitignored) is copied in too; the app fills those localStorage keys once if they are empty.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="${1:-/Applications}/Rook-like.app"
rm -rf "$APP"; mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -O "$ROOT/app/main.swift" -o "$APP/Contents/MacOS/Rook-like"
cp "$ROOT/app/icon.icns" "$APP/Contents/Resources/icon.icns"
[ -f "$ROOT/app/saves.json" ] && cp "$ROOT/app/saves.json" "$APP/Contents/Resources/saves.json"
cat > "$APP/Contents/Info.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Rook-like</string>
  <key>CFBundleDisplayName</key><string>Rook-like</string>
  <key>CFBundleIdentifier</key><string>eu.vandenbruwaene.rook-like</string>
  <key>CFBundleExecutable</key><string>Rook-like</string>
  <key>CFBundleIconFile</key><string>icon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>GameFolder</key><string>$ROOT</string>
</dict></plist>
PL
codesign --force --sign - "$APP" >/dev/null 2>&1 || true
touch "$APP"
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP" >/dev/null 2>&1 || true
echo "installed: $APP"
