#!/usr/bin/env bash
# ============================================================
#  apply.sh  —  YOUR FRIEND'S script
#
#  WHAT IT DOES:
#    Unpacks the zip archive produced by track.sh and places
#    every file exactly where it belongs — creating any
#    missing folders automatically.
#
#  USAGE:
#    bash apply.sh changes_YYYY-MM-DD_HH-MM-SS.zip
#
#  PRE-REQUISITES:
#    • unzip  (installed by default on macOS and most Linux distros)
#    • Both this script AND the zip must be in the ROOT of the repo.
# ============================================================

set -e

# ── Colours ────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Validate argument ──────────────────────────────────────────
ZIP_FILE="${1:-}"

if [[ -z "$ZIP_FILE" ]]; then
  echo ""
  echo "${RED}${BOLD}ERROR:${NC} No zip file specified."
  echo ""
  echo "  Usage: bash apply.sh changes_YYYY-MM-DD_HH-MM-SS.zip"
  echo ""
  exit 1
fi

if [[ ! -f "$ZIP_FILE" ]]; then
  echo ""
  echo "${RED}${BOLD}ERROR:${NC} File not found: $ZIP_FILE"
  echo ""
  echo "  Make sure the zip file is in the same folder as this script."
  exit 1
fi

# ── Check unzip is available ───────────────────────────────────
if ! command -v unzip &>/dev/null; then
  echo "${RED}ERROR: 'unzip' is required but not installed.${NC}"
  echo "  macOS:  brew install unzip   (or: xcode-select --install)"
  echo "  Ubuntu: sudo apt install unzip"
  exit 1
fi

# ── Header ─────────────────────────────────────────────────────
echo ""
echo "${BOLD}${CYAN}╔══════════════════════════════════════════╗${NC}"
echo "${BOLD}${CYAN}║        Applying Changes 🚀               ║${NC}"
echo "${BOLD}${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "  Archive : $ZIP_FILE"
echo ""

# ── List files inside the zip ──────────────────────────────────
echo "${CYAN}Files to be applied:${NC}"
unzip -l "$ZIP_FILE" | awk 'NR>3 && NF>=4 {
  # Print just the filename column (last field)
  $1=$2=$3=""; sub(/^ +/,""); print "  •  " $0
}' | head -n -2   # trim the trailing summary line
echo ""

# ── Confirm ────────────────────────────────────────────────────
read -r -p "${YELLOW}Apply all files above to this directory? [y/N]: ${NC}" confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo ""
  echo "Aborted. No files were changed."
  exit 0
fi

echo ""

# ── Extract ───────────────────────────────────────────────────
# -o  = overwrite without prompting
# Extracts into CWD, preserving the full relative path from the zip.
# Any directories that don't exist yet are created automatically.
unzip -o "$ZIP_FILE"

echo ""
echo "${BOLD}${GREEN}╔══════════════════════════════════════════╗${NC}"
echo "${BOLD}${GREEN}║              Done! ✅                    ║${NC}"
echo "${BOLD}${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "${GREEN}All changes are now in place.${NC}"
echo "${CYAN}Folders that didn't exist were created automatically.${NC}"
echo ""
