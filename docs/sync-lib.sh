#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
rm -rf docs/lib
mkdir -p docs/lib
cp -R src/janus docs/lib/janus
