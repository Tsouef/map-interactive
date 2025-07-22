# Issue #1: Configure TypeScript for Library Development

**Labels**: setup, configuration, typescript, high-priority

## Description

Configure TypeScript for optimal library development, ensuring proper type generation, strict type checking, and compatibility with both ESM and UMD module formats.

## Acceptance Criteria

- [ ] TypeScript configured for strict type checking
- [ ] Automatic type declaration generation enabled
- [ ] Path aliases configured for clean imports
- [ ] Separate configs for library and test code
- [ ] Support for React JSX with proper types
- [ ] Compatible with Vite build process
- [ ] No TypeScript errors in empty project

## Technical Implementation

### Base TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": false,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests", "examples"]
}
```

### Path Aliases
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@data/*": ["src/data/*"]
    }
  }
}
```

### Library-Specific Settings
```json
// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "emitDeclarationOnly": true,
    "declarationDir": "./dist/types"
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.test.tsx", "**/*.stories.tsx"]
}
```

### Test Configuration
```json
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"],
    "noEmit": true
  },
  "include": ["src", "tests", "jest.setup.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Testing Requirements

- [ ] TypeScript compiles without errors
- [ ] Type declarations generated correctly
- [ ] Path aliases resolve properly
- [ ] React components type-check correctly
- [ ] Leaflet types integrate properly
- [ ] Build process includes type generation

### Verification Commands
```bash
# Type check only
pnpm type-check

# Build types
pnpm tsc --emitDeclarationOnly

# Verify imports work
echo "import { LeafletZoneSelector } from './dist'" | pnpm tsx
```

## Integration with Build Tools

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['**/*.test.ts', '**/*.test.tsx']
    })
  ]
});
```

### Package.json Scripts
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "build:types": "tsc --emitDeclarationOnly --p tsconfig.build.json",
    "prebuild": "pnpm type-check"
  }
}
```

## Common Issues to Avoid

- Don't use `any` type - enforce with ESLint
- Ensure Leaflet types don't conflict with DOM types
- Proper configuration for JSX in .tsx files
- Module resolution must work with both Node and bundlers
- Type exports must be properly configured in package.json

## Success Metrics

- Zero TypeScript errors in CI/CD
- IntelliSense works perfectly in VS Code
- Types automatically published with NPM package
- Consumer projects get full type safety
- No need for @types/leaflet-zone-selector

## Related Issues

- #2: Vite build configuration
- #3: ESLint configuration for TypeScript
- #5: Create main LeafletZoneSelector component