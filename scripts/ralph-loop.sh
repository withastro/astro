#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

DEFAULT_PROMPT_FILE="${SCRIPT_DIR}/ralph-loop.prompt.md"
PROMPT_FILE=""
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -* )
      EXTRA_ARGS+=("$1")
      if [[ $# -gt 1 && "$2" != -* ]]; then
        EXTRA_ARGS+=("$2")
        shift
      fi
      ;;
    * )
      if [[ -z "${PROMPT_FILE}" && -f "$1" ]]; then
        PROMPT_FILE="$1"
      else
        EXTRA_ARGS+=("$1")
      fi
      ;;
  esac
  shift
done

if [[ -z "${PROMPT_FILE}" ]]; then
  PROMPT_FILE="${DEFAULT_PROMPT_FILE}"
fi

if [[ ! -f "${PROMPT_FILE}" ]]; then
  echo "Missing prompt file: ${PROMPT_FILE}" >&2
  exit 1
fi

if ! command -v ralph >/dev/null 2>&1; then
  echo "ralph CLI not found. Install: npm install -g @th0rgal/ralph-wiggum" >&2
  exit 1
fi

AGENT="${RALPH_AGENT:-opencode}"
MAX_ITERATIONS="${RALPH_MAX_ITERATIONS:-300}"
COMPLETION_PROMISE="${RALPH_COMPLETION_PROMISE:-RALPH_DONE}"

cd "${ROOT_DIR}"

ralph "Use prompt file." \
  --agent "${AGENT}" \
  --max-iterations "${MAX_ITERATIONS}" \
  --completion-promise "${COMPLETION_PROMISE}" \
  --prompt-file "${PROMPT_FILE}" \
  "${EXTRA_ARGS[@]}"
