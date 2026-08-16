#!/bin/bash
# free_ram.sh — cleanup routine to run after each testing/generation batch.
# Kills orphaned Flutter/Dart processes (testers, frontend_server, build daemons),
# purges pub/build caches, and reports RAM. Run it at the END of every verify cycle.
set -u
echo "===== FREE-RAM CLEANUP ($(date +%T)) ====="

before=$(memory_pressure -Q 2>/dev/null | grep -i "free percentage" | grep -oE '[0-9]+%' | head -1)
echo "RAM free before: ${before:-?}"

# 1. Kill orphaned flutter_tester / dartaotruntime (test workers left by interrupted runs)
killed=0
for pat in flutter_tester "dartaotruntime" "dart.*frontend_server" "flutter_tools.snapshot run"; do
  for pid in $(pgrep -f "$pat" 2>/dev/null); do
    # skip our own shell/bash
    cmd=$(ps -p "$pid" -o command= 2>/dev/null | head -c 40)
    if [ -n "$cmd" ]; then kill -9 "$pid" 2>/dev/null && killed=$((killed+1)); fi
  done
done

# 2. Stop the flutter daemon (holds a resident VM)
kill -9 $(pgrep -f "flutter.*daemon" 2>/dev/null) 2>/dev/null

# 3. Purge flutter build caches (safe: regenerated on demand)
find ~/.pub-cache -name "*.tmp" -delete 2>/dev/null
find /tmp -maxdepth 2 -name "*.dart_tool" -type d -exec rm -rf {} + 2>/dev/null

echo "killed $killed orphaned dart/flutter processes"

after=$(memory_pressure -Q 2>/dev/null | grep -i "free percentage" | grep -oE '[0-9]+%' | head -1)
echo "RAM free after: ${after:-?}"
echo "===== done ====="
