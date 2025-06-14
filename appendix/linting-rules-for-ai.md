# Appendix: Linting Rules for AI Development

This appendix provides a comprehensive collection of ESLint and TypeScript rules specifically optimized for autonomous development with Claude Code. These rules enhance code readability for AI analysis while maintaining best practices.

## Core Philosophy

AI-optimized linting rules prioritize:
1. **Explicit Code Structure**: Clear, unambiguous code patterns
2. **Type Safety**: Strong typing for better AI understanding
3. **Consistent Patterns**: Predictable code organization
4. **Self-Documenting Code**: Reduced need for external documentation
5. **Error Prevention**: Catching issues before they reach production

## ESLint Configuration

### Base Configuration

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/typescript",
    "plugin:jsx-a11y/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json",
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": [
    "@typescript-eslint",
    "react",
    "react-hooks",
    "import",
    "jsx-a11y",
    "prefer-const",
    "no-console",
    "ai-readable"
  ],
  "rules": {
    // AI-Optimized Rules
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/prefer-readonly-parameter-types": "warn",
    
    // Naming Conventions for AI Clarity
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"],
        "leadingUnderscore": "forbid",
        "trailingUnderscore": "forbid"
      },
      {
        "selector": "function",
        "format": ["camelCase"],
        "leadingUnderscore": "forbid"
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      },
      {
        "selector": "interface",
        "format": ["PascalCase"],
        "prefix": ["I"]
      },
      {
        "selector": "typeAlias",
        "format": ["PascalCase"],
        "suffix": ["Type"]
      }
    ],
    
    // Import Organization for AI Navigation
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ],
    
    // Code Structure Rules
    "max-len": ["error", { "code": 100, "ignoreUrls": true }],
    "max-lines": ["error", { "max": 300 }],
    "max-lines-per-function": ["error", { "max": 50 }],
    "complexity": ["error", 10],
    "max-depth": ["error", 4],
    "max-params": ["error", 5],
    
    // React-Specific AI Rules
    "react/prop-types": "off", // Use TypeScript instead
    "react/jsx-props-no-spreading": "error",
    "react/function-component-definition": [
      "error",
      {
        "namedComponents": "function-declaration",
        "unnamedComponents": "arrow-function"
      }
    ],
    "react/jsx-sort-props": [
      "error",
      {
        "callbacksLast": true,
        "shorthandFirst": true,
        "multiline": "last"
      }
    ],
    
    // Error Prevention
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-misused-promises": "error",
    
    // Code Quality for AI Analysis
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "warn",
    "no-debugger": "error",
    "no-alert": "error",
    "no-eval": "error",
    "no-implied-eval": "error"
  }
}
```

### Custom AI-Readable Rules Plugin

```javascript
// eslint-plugin-ai-readable.js
module.exports = {
  rules: {
    'explicit-return-types': {
      meta: {
        docs: {
          description: 'Require explicit return types for AI clarity'
        },
        type: 'problem'
      },
      create(context) {
        return {
          FunctionDeclaration(node) {
            if (!node.returnType) {
              context.report({
                node,
                message: 'Function must have explicit return type for AI analysis'
              });
            }
          },
          ArrowFunctionExpression(node) {
            if (!node.returnType && node.parent.type !== 'VariableDeclarator') {
              context.report({
                node,
                message: 'Arrow function must have explicit return type'
              });
            }
          }
        };
      }
    },
    
    'descriptive-variable-names': {
      meta: {
        docs: {
          description: 'Enforce descriptive variable names for AI understanding'
        },
        type: 'suggestion'
      },
      create(context) {
        const minimumLength = 3;
        const meaningfulPrefixes = ['is', 'has', 'can', 'should', 'will'];
        
        return {
          VariableDeclarator(node) {
            if (node.id.type === 'Identifier') {
              const name = node.id.name;
              
              // Allow short names for common patterns
              if (['i', 'j', 'k', 'x', 'y', 'z'].includes(name)) {
                return;
              }
              
              if (name.length < minimumLength) {
                context.report({
                  node,
                  message: `Variable name '${name}' is too short. Use descriptive names for AI clarity.`
                });
              }
              
              // Encourage boolean naming conventions
              if (node.init && node.init.type === 'Literal' && typeof node.init.value === 'boolean') {
                const hasGoodPrefix = meaningfulPrefixes.some(prefix => name.startsWith(prefix));
                if (!hasGoodPrefix) {
                  context.report({
                    node,
                    message: `Boolean variable '${name}' should start with is, has, can, should, or will`
                  });
                }
              }
            }
          }
        };
      }
    },
    
    'comment-before-complex-logic': {
      meta: {
        docs: {
          description: 'Require comments before complex logic blocks'
        },
        type: 'suggestion'
      },
      create(context) {
        return {
          IfStatement(node) {
            if (this.isComplexCondition(node.test) && !this.hasCommentBefore(node)) {
              context.report({
                node,
                message: 'Complex conditional logic should have explanatory comment'
              });
            }
          },
          
          ForStatement(node) {
            if (!this.hasCommentBefore(node)) {
              context.report({
                node,
                message: 'For loops should have explanatory comment'
              });
            }
          }
        };
      }
    },
    
    'no-magic-numbers': {
      meta: {
        docs: {
          description: 'Disallow magic numbers for AI understanding'
        },
        type: 'suggestion'
      },
      create(context) {
        const allowedNumbers = [0, 1, -1, 2];
        
        return {
          Literal(node) {
            if (typeof node.value === 'number' && !allowedNumbers.includes(node.value)) {
              context.report({
                node,
                message: `Magic number ${node.value} should be defined as a named constant`
              });
            }
          }
        };
      }
    }
  }
};
```

## TypeScript Configuration for AI

### Strict tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    // AI-Optimized Strict Options
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    
    // Enhanced Type Checking
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    
    // Path Mapping for AI Navigation
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"]
    }
  },
  "include": [
    "src",
    "tests",
    "types"
  ],
  "exclude": [
    "node_modules",
    "build",
    "dist"
  ]
}
```

## Project Structure Rules

### File Naming Conventions

```bash
# Components: PascalCase
UserProfile.tsx
ProfileEditor.tsx
NavigationMenu.tsx

# Hooks: camelCase with 'use' prefix
useUserProfile.ts
useLocalStorage.ts
useAuthState.ts

# Utilities: camelCase
formatDate.ts
validateEmail.ts
apiClient.ts

# Types: PascalCase with descriptive suffix
UserProfileType.ts
ApiResponseType.ts
ValidationErrorType.ts

# Constants: UPPER_SNAKE_CASE
API_ENDPOINTS.ts
ERROR_MESSAGES.ts
DEFAULT_CONFIG.ts

# Tests: match source with .test suffix
UserProfile.test.tsx
useUserProfile.test.ts
formatDate.test.ts
```

### Directory Structure Standards

```
src/
├── components/           # React components
│   ├── common/          # Reusable components
│   ├── forms/           # Form-specific components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
├── services/            # API and external services
├── utils/               # Pure utility functions
├── types/               # TypeScript type definitions
├── constants/           # Application constants
├── styles/              # Global styles and themes
└── __tests__/           # Test utilities and setup

tests/
├── components/          # Component tests
├── hooks/               # Hook tests
├── utils/               # Utility tests
├── integration/         # Integration tests
├── e2e/                # End-to-end tests
└── __fixtures__/        # Test data fixtures
```

## Advanced Type Patterns for AI

### Branded Types for Domain Safety

```typescript
// Brand types for AI to understand domain boundaries
type UserId = string & { readonly brand: unique symbol };
type Email = string & { readonly brand: unique symbol };
type Password = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  // Validation logic
  return id as UserId;
}

function sendEmail(to: Email, subject: string): Promise<void> {
  // AI can understand this only accepts validated emails
  return emailService.send(to, subject);
}
```

### Exhaustive Union Types

```typescript
// Explicit state management for AI understanding
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: UserData }
  | { status: 'error'; error: string };

function handleState(state: LoadingState): ReactNode {
  switch (state.status) {
    case 'idle':
      return <div>Click to load</div>;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <UserProfile data={state.data} />;
    case 'error':
      return <ErrorMessage error={state.error} />;
    default:
      // TypeScript ensures this is never reached
      const _exhaustive: never = state;
      return _exhaustive;
  }
}
```

### API Response Type Patterns

```typescript
// Consistent API response patterns for AI understanding
interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
  readonly metadata?: {
    readonly timestamp: string;
    readonly requestId: string;
  };
}

// Type-safe API client pattern
async function fetchUser(id: UserId): Promise<ApiResponse<UserData>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();
    
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: response.headers.get('x-request-id') || 'unknown'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
```

## React Patterns for AI Clarity

### Component Interface Patterns

```typescript
// Explicit component interfaces for AI understanding
interface BaseComponentProps {
  readonly className?: string;
  readonly testId?: string;
  readonly 'aria-label'?: string;
}

interface UserProfileProps extends BaseComponentProps {
  readonly user: UserData;
  readonly onEdit?: (user: UserData) => void;
  readonly onDelete?: (userId: UserId) => void;
  readonly readonly?: boolean;
}

function UserProfile({
  user,
  onEdit,
  onDelete,
  readonly = false,
  className,
  testId,
  'aria-label': ariaLabel
}: UserProfileProps): JSX.Element {
  // Component implementation
}
```

### Hook Type Patterns

```typescript
// Explicit hook return types for AI analysis
interface UseUserProfileReturn {
  readonly user: UserData | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly updateUser: (updates: Partial<UserData>) => Promise<void>;
  readonly deleteUser: () => Promise<void>;
  readonly refetch: () => Promise<void>;
}

function useUserProfile(userId: UserId): UseUserProfileReturn {
  // Hook implementation
}
```

## Code Quality Automation

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: typescript-check
        name: TypeScript Check
        entry: npx tsc --noEmit
        language: system
        types: [typescript]
        
      - id: eslint-check
        name: ESLint Check
        entry: npx eslint --fix
        language: system
        types: [typescript, javascript]
        
      - id: prettier-format
        name: Prettier Format
        entry: npx prettier --write
        language: system
        types: [typescript, javascript, json, yaml, markdown]
        
      - id: test-check
        name: Test Check
        entry: npm test -- --passWithNoTests
        language: system
        pass_filenames: false
```

### GitHub Actions Workflow

```yaml
name: AI Code Quality Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: TypeScript check
        run: npx tsc --noEmit
        
      - name: ESLint check
        run: npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0
        
      - name: Run tests
        run: npm test -- --coverage --passWithNoTests
        
      - name: Check test coverage
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below minimum 80%"
            exit 1
          fi
```

These linting rules and patterns ensure that your codebase remains AI-readable, maintainable, and follows best practices for autonomous development with Claude Code.