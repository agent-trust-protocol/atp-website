#!/usr/bin/env bash
# Run `next lint` and report ONLY the lines CI treats as failures.
# next lint emits hundreds of warnings; CI only fails on lines containing "Error:".
# Exits 0 if no errors, 1 otherwise.
set -uo pipefail

output=$(npx next lint --max-warnings 99999 2>&1)
errors=$(echo "$output" | grep -E 'Error:' || true)

if [ -n "$errors" ]; then
  # Print each error with the preceding file path line for context.
  echo "$output" | grep -B1 -E 'Error:'
  echo
  echo "lint: errors found (CI will fail)"
  exit 1
fi

echo "lint: no errors"
