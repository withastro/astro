#!/usr/bin/env bash
# Prints all headings with depth < 4 (ignoring frontmatter) and exits 1 if any found, 0 otherwise.

set -euo pipefail

# Strip YAML frontmatter (--- ... ---) if present, then parse tokens
matches=$(awk '
  BEGIN { in_frontmatter = 0 }
  /^---$/ {
    if (NR == 1) { in_frontmatter = 1; next }       # start frontmatter
    else if (in_frontmatter) { in_frontmatter = 0; next }  # end frontmatter
  }
  !in_frontmatter { print }
' "$1" |
marked --tokens |
jq -r '[.[] | select(.type=="heading" and .depth < 4)] |
       if length == 0 then empty else .[] | (("#" * .depth) + " " + .text) end')

if [[ -n "$matches" ]]; then
  echo "$matches"
  exit 1
else
  exit 0
fi
