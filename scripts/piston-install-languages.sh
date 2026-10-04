#!/usr/bin/env bash
# Installs the languages InnerView's code runner uses into the Piston container.
# Safe to re-run: packages that are already installed are skipped.
#
#   ./scripts/piston-install-languages.sh              # Piston on http://localhost:2000
#   PISTON_URL=http://host:2000 ./scripts/piston-install-languages.sh
#
# Packages persist in the `piston-packages` Docker volume, so this is only needed once per machine
# (or after `docker compose down -v`).
set -euo pipefail

PISTON_URL="${PISTON_URL:-http://localhost:${PISTON_PORT:-2000}}"

# language=version — must match what the editor's language menu expects.
#   gcc → C, C++    node → JavaScript    mono → C#
PACKAGES=(
  python=3.12.0
  node=20.11.1
  typescript=5.0.3
  gcc=10.2.0
  java=15.0.2
  go=1.16.2
  rust=1.68.2
  mono=6.12.0
)

echo "Waiting for Piston at $PISTON_URL ..."
for _ in $(seq 1 60); do
  curl -fs "$PISTON_URL/api/v2/runtimes" >/dev/null 2>&1 && break
  sleep 2
done
curl -fs "$PISTON_URL/api/v2/runtimes" >/dev/null || {
  echo "Piston isn't reachable. Start it with: docker compose up -d piston" >&2
  exit 1
}

failed=0
for pkg in "${PACKAGES[@]}"; do
  lang="${pkg%=*}" version="${pkg#*=}"
  if curl -fs "$PISTON_URL/api/v2/packages" | grep -q "\"language\":\"$lang\",\"language_version\":\"$version\",\"installed\":true"; then
    echo "✓ $lang $version (already installed)"
    continue
  fi
  echo "… installing $lang $version (can take a few minutes)"
  response=$(curl -s -X POST "$PISTON_URL/api/v2/packages" -H 'Content-Type: application/json' \
    -d "{\"language\":\"$lang\",\"version\":\"$version\"}")
  if grep -q '"language"' <<<"$response"; then
    echo "✓ $lang $version"
  else
    echo "✗ $lang $version: $response" >&2
    failed=1
  fi
done

echo
echo "Installed runtimes:"
curl -fs "$PISTON_URL/api/v2/runtimes" | grep -o '"language":"[^"]*","version":"[^"]*"' | sed 's/"language":"\([^"]*\)","version":"\([^"]*\)"/  \1 \2/'
exit $failed
