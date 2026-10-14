#!/bin/sh
# Cache-busting for GitHub Pages (browsers may cache files ~10 min). Run after changing any css/js/data file:  sh tools/bump-version.sh
# Rewrites the ?v= tag on every asset link in index.html and on the menu catalog request in js/app.js.
cd "$(dirname "$0")/.." || exit 1
V=${1:-$(date +%Y%m%d%H%M)}
sed -i -E "s#(css/styles\.css|js/data\.js|js/art\.js|js/app\.js)(\?v=[0-9A-Za-z]+)?\"#\1?v=$V\"#" index.html
sed -i -E "s#var ASSET_V = '[0-9A-Za-z]*';#var ASSET_V = '$V';#" js/app.js
echo "asset version: $V"
