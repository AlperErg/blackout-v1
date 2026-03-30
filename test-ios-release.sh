#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/blackout"

USE_CLEAN_PREBUILD=false

while getopts ":c" opt; do
	case "$opt" in
		c)
			USE_CLEAN_PREBUILD=true
			;;
		\?)
			echo "Usage: $0 [-c]"
			echo "  -c    Run 'npx expo prebuild --clean'"
			exit 1
			;;
	esac
done

echo "[1/5] git pull"
cd "$ROOT_DIR"
git pull

if [ "$USE_CLEAN_PREBUILD" = true ]; then
	echo "[2/5] npx expo prebuild --clean"
else
	echo "[2/5] npx expo prebuild"
fi
cd "$APP_DIR"
if [ "$USE_CLEAN_PREBUILD" = true ]; then
	npx expo prebuild --clean
else
	npx expo prebuild
fi

echo "[3/5] npm install"
npm install

echo "[4/5] cd ios && pod install && npm install"
cd "$APP_DIR/ios"
pod install
cd "$APP_DIR"
npm install

echo "[5/5] npx expo run:ios --configuration Release"
npx expo run:ios --configuration Release

echo "Done."