#!/bin/bash

# Exit on any error or if warnings are found in output
set -e

OUTPUT=$(mktemp)

npm run typecheck 2>&1 | tee -a "$OUTPUT"
npm run lint 2>&1 | tee -a "$OUTPUT"
npm run test:run 2>&1 | tee -a "$OUTPUT"
npm run build -w frontend 2>&1 | tee -a "$OUTPUT"

# Check for warnings in output
if grep -qi "warning\|warn:" "$OUTPUT"; then
  echo -e "\n❌ Warnungen gefunden!\n"
  rm "$OUTPUT"
  exit 1
fi

rm "$OUTPUT"
echo -e "\n✅ Alle Checks bestanden!\n"
