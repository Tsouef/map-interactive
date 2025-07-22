# Issue #13: Configure Vite for Library Building with Leaflet

**Labels**: build, high-priority, infrastructure

## Description

Configure Vite to build the library in both ESM and UMD formats for maximum compatibility. The build system should support Leaflet and OpenStreetMap instead of Mapbox.

## Acceptance Criteria

- [ ] Vite config properly set up for library mode
- [ ] Builds both ESM and UMD outputs
- [ ] TypeScript declarations generated correctly
- [ ] External dependencies properly configured
- [ ] Build size optimized (< 100KB gzipped)
- [ ] Source maps generated for debugging
- [ ] Leaflet properly configured as external dependency
- [ ] React marked as peer dependency

## Technical Requirements

### Dependencies to Use (Open Source)
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "leaflet-draw": "^1.0.4",
    "@turf/turf": "^6.5.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Vite Configuration
```js
export default {
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'LeafletZoneSelector',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'leaflet'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          leaflet: 'L'
        }
      }
    }
  }
}
```

## Integration Tests Required

**IMPORTANT: No commits should be made before all tests pass and are validated.**

- [ ] Test that build outputs are created correctly
- [ ] Test that TypeScript types are generated
- [ ] Test that the library can be imported in both ESM and CommonJS environments
- [ ] Test that Leaflet is properly externalized
- [ ] Test that the bundle size meets requirements

## Testing Commands
```bash
# Run build
pnpm build

# Check bundle size
pnpm size

# Test in example project
cd examples/basic && pnpm test:integration
```

## Notes

- Remove all Mapbox-related configurations
- Ensure Leaflet CSS is properly handled
- Consider using rollup-plugin-visualizer to analyze bundle
- No proprietary dependencies allowed - only open source

## Related Issues

- #11: Testing Infrastructure (integration tests)
- #10: Geographic Utilities (ensure proper tree-shaking)