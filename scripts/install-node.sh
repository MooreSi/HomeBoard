#!/usr/bin/env bash
set -euo pipefail
# Called inside a Debian/Ubuntu LXC. Uses Node's official binaries and checksums.
if command -v node >/dev/null && [ "$(node -p 'Number(process.versions.node.split(".")[0])')" -ge 22 ]; then exit 0; fi
case "$(uname -m)" in x86_64) arch=x64 ;; aarch64) arch=arm64 ;; *) echo 'Unsupported Node architecture' >&2; exit 1 ;; esac
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
base=https://nodejs.org/dist/latest-v24.x
curl --fail --silent --show-error "$base/SHASUMS256.txt" -o "$work/SHASUMS256.txt"
archive=$(awk -v arch="$arch" '$2 ~ "^node-v24[.][0-9]+[.][0-9]+-linux-" arch "[.]tar[.]xz$" {print $2}' "$work/SHASUMS256.txt")
[ -n "$archive" ] && [ "$(printf '%s\n' "$archive" | wc -l)" -eq 1 ] || { echo 'Node archive lookup failed' >&2; exit 1; }
curl --fail --silent --show-error "$base/$archive" -o "$work/$archive"
(cd "$work"; awk -v archive="$archive" '$2 == archive' SHASUMS256.txt | sha256sum -c -)
tar -xJf "$work/$archive" -C /usr/local --strip-components=1
node --version
