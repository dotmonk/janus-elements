#!/bin/sh
set -eu

cd "$(dirname "$0")"

attempts=0
until docker build --quiet --tag janus-check . >/dev/null; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 3 ]; then
    echo "docker build failed after ${attempts} attempts" >&2
    exit 1
  fi
  echo "docker build failed (attempt ${attempts}); retrying..." >&2
  sleep 2
done

docker run --rm --init --ipc=host janus-check
