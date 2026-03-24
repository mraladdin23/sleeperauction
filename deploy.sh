#!/bin/bash
# SleeperBid deploy script
# Usage: bash deploy.sh
# Stamps a fresh timestamp into sw.js so the PWA cache busts on every deploy.

set -e

TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
echo "→ Stamping cache version: sleeperbid-$TIMESTAMP"

# Replace the placeholder in sw.js with the current timestamp
sed -i.bak "s/__TIMESTAMP__/$TIMESTAMP/g" sw.js
rm -f sw.js.bak

echo "→ Staging all changes..."
git add -A

echo "→ Committing..."
git commit -m "deploy: cache-bust $TIMESTAMP" || echo "  (nothing new to commit)"

echo "→ Pushing to GitHub..."
git push

# Restore the placeholder in sw.js for next time
sed -i.bak "s/sleeperbid-$TIMESTAMP/__TIMESTAMP__/g" sw.js
rm -f sw.js.bak

echo "✅ Deployed! PWA will pick up changes on next open."
