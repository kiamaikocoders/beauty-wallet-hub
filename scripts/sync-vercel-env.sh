#!/usr/bin/env bash
set -euo pipefail
# Requires: vercel CLI logged into team beautywalletke-5992
SCOPE="${VERCEL_SCOPE:-beautywalletke-5992}"
PROJECT="beauty-wallet-hub"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a; source "$ROOT/.env"; set +a

add() {
  local key="$1" val="$2"
  printf '%s' "$val" | vercel --scope "$SCOPE" env add "$key" production --project "$PROJECT" --force 2>/dev/null || true
  printf '%s' "$val" | vercel --scope "$SCOPE" env add "$key" preview --project "$PROJECT" --force 2>/dev/null || true
  printf '%s' "$val" | vercel --scope "$SCOPE" env add "$key" development --project "$PROJECT" --force 2>/dev/null || true
  echo "set $key"
}

add VITE_SUPABASE_URL "$VITE_SUPABASE_URL"
add VITE_SUPABASE_PUBLISHABLE_KEY "$VITE_SUPABASE_PUBLISHABLE_KEY"
add VITE_MAPBOX_ACCESS_TOKEN "$VITE_MAPBOX_ACCESS_TOKEN"
add RESEND_API_KEY "$RESEND_API_KEY"
echo "Done. Redeploy production for VITE_* to take effect."
