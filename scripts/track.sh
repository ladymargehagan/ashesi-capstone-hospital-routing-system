#!/usr/bin/env bash
# ============================================================
#  track.sh  —  YOUR script (run this on YOUR machine)
#
#  WHAT IT DOES:
#    1. Detects every file you changed vs the base repo
#       (staged, unstaged, untracked, and committed-ahead).
#    2. Bundles them into a timestamped zip archive that
#       preserves the full directory structure.
#
#  USAGE:
#    ./track.sh
#
#  OUTPUT:
#    changes_YYYY-MM-DD_HH-MM-SS.zip
#
#  THEN send your friend:
#    1. apply.sh
#    2. changes_YYYY-MM-DD_HH-MM-SS.zip  ← generated here
#  And tell them: ./apply.sh changes_YYYY-MM-DD_HH-MM-SS.zip
# ============================================================

set -e

# ── Colours ────────────────────────────────────────────────────
GREEN='\033[0;32m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
RED='\033[0;31m'

# ── Config ─────────────────────────────────────────────────────
BRANCH="${1:-main}"     # optional: pass branch name as arg, default: main

# ── Timestamp & output file ────────────────────────────────────
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
ZIP_FILE="changes_${TIMESTAMP}.zip"

echo ""
echo "${BOLD}${CYAN}Scanning your changes...${NC}"
echo ""

# ── Collect changed files ───────────────────────────────────────
declare -a FILES=()

# Staged, unstaged, untracked — skip deletions (D)
while IFS= read -r line; do
  STATUS="${line:0:2}"
  FILE="${line:3}"
  [[ -z "$FILE" ]] && continue
  # Skip deleted files; they don't exist to zip
  [[ "$STATUS" =~ ^D || "$STATUS" =~ ^.D ]] && continue
  [[ ! -f "$FILE" ]] && continue
  if [[ ! " ${FILES[*]} " =~ " $FILE " ]]; then
    FILES+=("$FILE")
    echo "  ✔  $FILE"
  fi
done < <(git status --porcelain)

# Committed but not yet pushed to upstream
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  [[ ! -f "$file" ]] && continue
  if [[ ! " ${FILES[*]} " =~ " $file " ]]; then
    FILES+=("$file")
    echo "  ✔  $file (committed)"
  fi
done < <(git diff --name-only "origin/$BRANCH..HEAD" 2>/dev/null || true)

TOTAL=${#FILES[@]}

if [[ $TOTAL -eq 0 ]]; then
  echo "${RED}No changed files found. Nothing to zip.${NC}"
  exit 0
fi

# ── Build the zip ───────────────────────────────────────────────
# zip automatically stores the path relative to CWD, so the
# directory structure is fully preserved inside the archive.
echo ""
echo "${BOLD}${CYAN}Creating zip archive...${NC}"
echo ""

# Remove old zip if it somehow exists
rm -f "$ZIP_FILE"

zip -r "$ZIP_FILE" "${FILES[@]}"

echo ""
echo "${GREEN}${BOLD}Done! ✅${NC}"
echo ""
echo "  Files tracked  : $TOTAL"
echo "  Archive created: $ZIP_FILE"
echo ""
echo "${CYAN}Next steps:${NC}"
echo "  1. Send your friend both files:"
echo "       - apply.sh"
echo "       - $ZIP_FILE"
echo "  2. Tell them to place both files in the ROOT of the repo on their machine."
echo "  3. Tell them to run:  bash apply.sh $ZIP_FILE"
echo ""
