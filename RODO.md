# RODO (Repository Operations & Development Outline)

## Overview
This document serves as a comprehensive guide for autonomous development workflows using Claude Code, with specific focus on TypeScript/React projects, testing strategies, and code quality enforcement.

## Common Development Commands

### Build & Development
```bash
# Start development server
npm run dev
# or
yarn dev

# Build for production
npm run build
# or
yarn build

# Preview production build
npm run preview
```

### Code Quality Enforcement

#### TypeScript Checking
```bash
# Run TypeScript compiler checks
npm run typecheck
# or
npx tsc --noEmit

# Watch mode for continuous type checking
npx tsc --noEmit --watch

# Check specific files
npx tsc --noEmit src/components/*.tsx
```

#### Linting
```bash
# Run ESLint
npm run lint
# or
npx eslint . --ext .js,.jsx,.ts,.tsx

# Auto-fix linting issues
npm run lint:fix
# or
npx eslint . --ext .js,.jsx,.ts,.tsx --fix

# Lint staged files only (if using lint-staged)
npx lint-staged
```

#### Formatting
```bash
# Check formatting with Prettier
npm run format:check
# or
npx prettier --check .

# Apply formatting
npm run format
# or
npx prettier --write .
```

### Testing React Applications

#### Test Execution
```bash
# Run all tests
npm test
# or
yarn test

# Run tests in watch mode
npm test -- --watch
# or
jest --watch

# Run tests with coverage
npm test -- --coverage
# or
jest --coverage

# Run specific test file
npm test -- Button.test.tsx
# or
jest src/components/Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

#### React Testing Patterns

##### Component Testing
```bash
# Test a specific component
jest src/components/Header/Header.test.tsx

# Test all components
jest src/components

# Update snapshots
jest -u
```

##### Integration Testing
```bash
# Run integration tests
npm run test:integration
# or
jest --testMatch="**/*.integration.test.{ts,tsx}"

# Run E2E tests
npm run test:e2e
# or
npx playwright test
# or
npx cypress run
```

### Pre-commit Validation
```bash
# Run all pre-commit checks
npm run validate
# Typically includes:
# - TypeScript: tsc --noEmit
# - Linting: eslint . --ext .js,.jsx,.ts,.tsx
# - Tests: jest
# - Formatting: prettier --check .
```

## React-Specific Testing Guidelines

### Testing Library Commands
```bash
# Debug why tests are failing
npm test -- --verbose

# Run tests in specific environment
npm test -- --env=jsdom

# Run only unit tests
npm test -- --testPathPattern=unit

# Run only integration tests  
npm test -- --testPathPattern=integration
```

### Component Testing Best Practices
When testing React components, use these commands to verify:

1. **Rendering Tests**
   ```bash
   # Ensure component renders without crashing
   jest ComponentName.test.tsx --testNamePattern="renders"
   ```

2. **User Interaction Tests**
   ```bash
   # Test user events
   jest ComponentName.test.tsx --testNamePattern="click|change|submit"
   ```

3. **Props and State Tests**
   ```bash
   # Test component with different props
   jest ComponentName.test.tsx --testNamePattern="props"
   ```

4. **Accessibility Tests**
   ```bash
   # Run a11y tests
   jest --testMatch="**/*.a11y.test.{ts,tsx}"
   ```

### Testing Hooks
```bash
# Test custom hooks
jest src/hooks --testNamePattern="hook"

# Test specific hook
jest src/hooks/useAuth.test.ts
```

## TypeScript Configuration Checks

### Validate tsconfig.json
```bash
# Check if tsconfig is valid
npx tsc --showConfig

# Check which files are included
npx tsc --listFiles

# Trace type resolution issues
npx tsc --traceResolution
```

### Strict Mode Validation
```bash
# Ensure strict mode compliance
npx tsc --strict --noEmit

# Check for any type issues
npx tsc --noEmit --skipLibCheck false
```

## Automated Workflow Commands

### Fix All Issues Workflow
```bash
# 1. Fix formatting
npm run format

# 2. Fix linting issues
npm run lint:fix

# 3. Check types
npm run typecheck

# 4. Run tests
npm test

# 5. Build to verify
npm run build
```

### Pre-PR Checklist
```bash
# Run this before creating a PR
npm run validate && npm run build && npm test -- --coverage
```

## Debug Commands

### React DevTools
```bash
# Install React DevTools globally
npm install -g react-devtools

# Run standalone DevTools
react-devtools
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json

# For Create React App
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

## CI/CD Integration Commands

### GitHub Actions
```bash
# Commands typically run in CI
npm ci
npm run typecheck
npm run lint
npm test -- --ci --coverage
npm run build
```

### Pre-deployment Checks
```bash
# Verify production build
npm run build
npx serve -s build
# Test the production build locally
```

## Performance Testing

### React Performance
```bash
# Profile React components
npm test -- --env=jsdom --runInBand --detectOpenHandles

# Measure performance
npm run build
npm run analyze
```

## Common Issues and Solutions

### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache/typescript

# Rebuild project
npm run clean && npm install && npm run build
```

### Test Failures
```bash
# Clear Jest cache
npx jest --clearCache

# Run with no cache
npm test -- --no-cache

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Linting Issues
```bash
# Show ESLint config
npx eslint --print-config src/index.tsx

# Debug ESLint rules
npx eslint src/components/Button.tsx --debug
```

## Project-Specific Scripts

Always check `package.json` for project-specific scripts:
```bash
# List all available scripts
npm run

# Check package.json scripts section
cat package.json | jq '.scripts'
```

## IMPORTANT: Always Run Before Committing

```bash
# The holy trinity of code quality
npm run typecheck && npm run lint && npm test
```

If any of these fail, fix the issues before proceeding with commits or PRs.