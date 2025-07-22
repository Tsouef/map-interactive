#!/bin/bash

# Build verification script for Leaflet Zone Selector

echo "🔍 Starting build verification..."

# Clean and build
echo "📦 Cleaning dist directory..."
rm -rf dist

echo "🔨 Building library..."
pnpm build

# Check file existence
echo "✓ Checking required files..."
files=(
  "dist/leaflet-zone-selector.es.js"
  "dist/leaflet-zone-selector.umd.js"
  "dist/leaflet-zone-selector.css"
  "dist/index.d.ts"
)

all_files_exist=true
for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
    all_files_exist=false
  else
    echo "✅ Found: $file"
  fi
done

if [ "$all_files_exist" = false ]; then
  echo "❌ Build verification failed: missing files"
  exit 1
fi

# Check bundle size
echo "📊 Checking bundle sizes..."
if command -v gzip &> /dev/null; then
  es_size=$(gzip -c dist/leaflet-zone-selector.es.js | wc -c)
  umd_size=$(gzip -c dist/leaflet-zone-selector.umd.js | wc -c)
  css_size=$(gzip -c dist/leaflet-zone-selector.css | wc -c)
  
  echo "  ESM bundle: $(($es_size / 1024))KB gzipped"
  echo "  UMD bundle: $(($umd_size / 1024))KB gzipped"
  echo "  CSS file: $(($css_size / 1024))KB gzipped"
  
  # Check if UMD bundle exceeds 100KB
  if [ $umd_size -gt 102400 ]; then
    echo "⚠️  Warning: UMD bundle exceeds 100KB gzipped ($(($umd_size / 1024))KB)"
  fi
  
  # Check if ESM bundle exceeds 80KB
  if [ $es_size -gt 81920 ]; then
    echo "⚠️  Warning: ESM bundle exceeds 80KB gzipped ($(($es_size / 1024))KB)"
  fi
else
  echo "⚠️  gzip not available, skipping size checks"
fi

# Check source maps
echo "🗺️  Checking source maps..."
source_maps=(
  "dist/leaflet-zone-selector.es.js.map"
  "dist/leaflet-zone-selector.umd.js.map"
)

for map in "${source_maps[@]}"; do
  if [ -f "$map" ]; then
    echo "✅ Found source map: $map"
  else
    echo "⚠️  Missing source map: $map"
  fi
done

# Check TypeScript declarations
echo "📝 Checking TypeScript declarations..."
if [ -d "dist" ]; then
  type_files=$(find dist -name "*.d.ts" | wc -l)
  echo "  Found $type_files TypeScript declaration files"
else
  echo "❌ No dist directory found"
  exit 1
fi

echo "✨ Build verification completed successfully!"