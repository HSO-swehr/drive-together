#!/bin/bash

set -euo pipefail

npm run typecheck
npm run lint
npm run format:check
npm test
npm run build

echo -e "\n✅ Alle Checks bestanden!\n"
