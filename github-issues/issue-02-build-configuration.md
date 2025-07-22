# Issue #2: Set Up Build Configuration for ESM/UMD Output

**Labels**: build, configuration, vite, high-priority

## Description

Configure Vite to build the library in both ESM and UMD formats, with proper externalization of peer dependencies, CSS extraction, and optimized bundle sizes.

## Acceptance Criteria

- [ ] Build outputs both ESM and UMD formats
- [ ] React and React-DOM properly externalized
- [ ] CSS extracted to separate file
- [ ] Source maps generated for debugging
- [ ] Type declarations included in build
- [ ] Bundle size optimized (< 100KB gzipped)
- [ ] Build works with pnpm build command

## Technical Implementation

### Vite Library Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { peerDependencies } from './package.json';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx'],
      outDir: 'dist',
      rollupTypes: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LeafletZoneSelector',
      fileName: (format) => `leaflet-zone-selector.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: [
        ...Object.keys(peerDependencies),
        'react/jsx-runtime'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'leaflet-zone-selector.css';
          }
          return assetInfo.name;
        }
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@data': resolve(__dirname, './src/data')
    }
  }
});
```

### CSS Handling
```typescript
// Additional CSS configuration
export default defineConfig({
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
});
```

### Entry Point Setup
```typescript
// src/index.ts
// Main exports
export { LeafletZoneSelector } from './components/LeafletZoneSelector';
export type { LeafletZoneSelectorProps, LeafletZoneSelectorRef } from './components/LeafletZoneSelector';

// Hook exports
export { useZoneSelection } from './hooks/useZoneSelection';
export { useZoneMetrics } from './hooks/useZoneMetrics';

// Utility exports
export { mergeAdjacentZones } from './utils/mergeAdjacentZones';
export { exportToGeoJSON, exportToKML, exportToCSV } from './utils/exportFormats';

// Type exports
export type { Zone, Coordinates, SelectionState, ExportFormat } from './types';

// Import CSS
import './styles/leaflet-zone-selector.css';
```

### Build Optimization
```typescript
// vite.config.ts - optimization section
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'leaflet-core': ['leaflet', 'react-leaflet', '@react-leaflet/core'],
          'geo-utils': ['@turf/turf'],
          'drawing': ['leaflet-draw']
        }
      },
      plugins: [
        // Bundle size analysis
        visualizer({
          filename: 'dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true
        })
      ]
    },
    chunkSizeWarningLimit: 50 // KB
  }
});
```

## Testing Requirements

- [ ] Build completes without errors
- [ ] Both ESM and UMD files generated
- [ ] Types directory contains all declarations
- [ ] CSS file extracted separately
- [ ] Source maps valid and working
- [ ] Bundle size meets requirements

### Build Verification Script
```bash
#!/bin/bash
# verify-build.sh

# Clean and build
rm -rf dist
pnpm build

# Check file existence
files=(
  "dist/leaflet-zone-selector.es.js"
  "dist/leaflet-zone-selector.umd.js"
  "dist/leaflet-zone-selector.css"
  "dist/index.d.ts"
)

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Missing: $file"
    exit 1
  fi
done

# Check bundle size
size=$(gzip -c dist/leaflet-zone-selector.es.js | wc -c)
if [ $size -gt 102400 ]; then # 100KB
  echo "Bundle too large: $size bytes"
  exit 1
fi

echo "Build verification passed!"
```

## Package.json Configuration
```json
{
  "main": "./dist/leaflet-zone-selector.umd.js",
  "module": "./dist/leaflet-zone-selector.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/leaflet-zone-selector.es.js",
      "require": "./dist/leaflet-zone-selector.umd.js",
      "types": "./dist/index.d.ts"
    },
    "./dist/leaflet-zone-selector.css": {
      "import": "./dist/leaflet-zone-selector.css",
      "require": "./dist/leaflet-zone-selector.css"
    }
  },
  "files": [
    "dist"
  ],
  "sideEffects": [
    "*.css"
  ]
}
```

## Common Build Issues

- Circular dependencies breaking tree-shaking
- CSS imports not working in consuming apps
- Peer dependency version conflicts
- Missing type exports
- Large bundle sizes from unoptimized imports

## Performance Targets

- ESM bundle: < 80KB gzipped
- UMD bundle: < 100KB gzipped
- CSS file: < 20KB gzipped
- Build time: < 30 seconds
- Type generation: < 10 seconds

## Related Issues

- #1: TypeScript configuration
- #3: Configure test environment
- #37: NPM publishing workflow