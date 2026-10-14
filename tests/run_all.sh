#!/bin/sh
# Runs every check. Needs: node, python3, `pip install playwright` + `playwright install chromium`.
cd "$(dirname "$0")/.." || exit 1
node tools/check-menu.js || exit 1
for f in js/*.js data/menu.js tools/check-menu.js; do node --check "$f" || exit 1; done
export PORT=${PORT:-8766}
python3 tests/serve.py & SRV=$!; sleep 1
rc=0
for t in tests/test_*.py; do
  echo "== $t"
  out=$(python3 "$t"); echo "$out" | tail -4
  # A failed check prints "FAIL <name>"; the summary line "FAILED: []" is not a failure.
  echo "$out" | grep -q '^FAIL ' && rc=1
done
kill $SRV 2>/dev/null; exit $rc
