#!/usr/bin/env bash
# init.sh — shared bootstrap for orchestrator-kit scripts (core/ and adapters/). Source it first.
#
#   - sets ORCH_KIT_DIR to the kit root (the directory that holds core/, adapters/ and config.env)
#   - sources <kit>/config.env if it exists, so every ORCH_* setting is shared across all scripts
#     without being duplicated in each one (copy config.example.env -> config.env to customise)
#
# Usage (from a core/ script):
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/init.sh"
# Usage (from an adapters/ script):
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/core/init.sh"

ORCH_KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$ORCH_KIT_DIR/config.env" ]]; then
  # shellcheck disable=SC1090
  source "$ORCH_KIT_DIR/config.env"
fi
