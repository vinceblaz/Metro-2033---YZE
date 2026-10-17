#!/usr/bin/env bash
# Construit l'archive de distribution du système (system.json à la racine du zip).
# Usage : scripts/build-archive.sh [dossier_de_sortie]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-dist}"
mkdir -p "$OUT"
rm -f "$OUT/metro-2033-yze.zip"
zip -rq "$OUT/metro-2033-yze.zip" \
  system.json LICENSE README.md CHANGELOG.md \
  src styles templates lang \
  ui/backgrounds \
  docs/guide-installation-utilisation.md docs/recette-foundry.md
cp system.json "$OUT/system.json"
echo "Archive : $OUT/metro-2033-yze.zip"
