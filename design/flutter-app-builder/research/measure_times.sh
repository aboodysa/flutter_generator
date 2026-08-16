#!/bin/bash
# Timing harness for repeated generator activities (measure -> optimize -> re-measure)
# Usage: bash measure_times.sh [--quick]
cd /Users/username/Documents/cto/flutter_generator

IR=apps/tasks/input/tasks.ir.json
OUT=/tmp/timing_out
GENDIR=/tmp/timing_app

echo "===== MEASURING REPEATED ACTIVITIES ($(date +%T)) ====="
measure() { # name, cmd...
  local name="$1"; shift
  local start=$(python3 -c "import time;print(time.time())")
  "$@" > /tmp/timing_$$.log 2>&1
  local rc=$?
  local end=$(python3 -c "import time;print(time.time())")
  printf "%-28s %6.1fs  rc=%s\n" "$name" "$(python3 -c "print(f'{$end-$start:.1f}')")" "$rc"
}

measure "typecheck:builder" npm run typecheck:builder
measure "index.ts (generate 1x)" npx ts-node --transpile-only builder/src/index.ts "$IR" "$OUT"
measure "validate.ts (full)" npx ts-node --transpile-only builder/src/validate.ts "$IR" "$OUT"
measure "flutter pub get" bash -c "cd $OUT && flutter pub get"
measure "flutter analyze" bash -c "cd $OUT && flutter analyze"
measure "flutter test (no goldens)" bash -c "cd $OUT && flutter test"
measure "flutter build web" bash -c "cd $OUT && flutter build web --base-href=/tasks/"

echo "===== done ($(date +%T)) ====="
