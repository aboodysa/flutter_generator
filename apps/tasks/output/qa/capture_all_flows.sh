#!/bin/bash
# Capture all-flows goldens for a generated app, one screen per invocation (avoids cross-test
# router-state contamination). Usage: bash capture_all_flows.sh <app-dir> <pkg> <screens-file>
set -u
APPDIR="$1"; PKG="$2"; SCREENS="$3"
cd /Users/username/Documents/cto/flutter_generator
python3 apps/tasks/output/qa/gen_all_flows_harness.py "$APPDIR" "$PKG" "$SCREENS"
cd "$APPDIR"
while IFS='|' read -r name kind entity sfile; do
  [ -z "$name" ] && continue
  case "$name" in \#*) continue;; esac
  echo "=== $name ==="
  flutter test test/temp_all_flows_test.dart --plain-name "$name (golden)" --update-goldens 2>&1 | tail -1
done < "$SCREENS"
echo "=== goldens ==="
ls test/goldens/ | grep "_all"
