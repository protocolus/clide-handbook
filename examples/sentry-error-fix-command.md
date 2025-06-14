# Sentry-Powered Error Fix Command

This example shows how to create a command that uses Sentry MCP integration to automatically fix production errors.

## .claude/commands/fix-sentry-error.md

```markdown
Analyze and fix Sentry error $ARGUMENTS with intelligent error pattern recognition.

## Prerequisites Check

### 1. Verify Sentry Integration
```bash
if [ -z "$SENTRY_AUTH_TOKEN" ] || [ -z "$SENTRY_ORG" ] || [ -z "$SENTRY_PROJECT" ]; then
  echo "Sentry environment variables not configured"
  echo "Required: SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT"
  exit 1
fi
```

### 2. Validate Error ID
```bash
ERROR_ID="$ARGUMENTS"
if [ -z "$ERROR_ID" ]; then
  echo "Usage: fix-sentry-error <sentry-error-id>"
  exit 1
fi
```

## Error Analysis Phase

### 1. Fetch Error Details
Use MCP Sentry server to get comprehensive error information:
```bash
# Get error details including stack trace, context, and frequency
ERROR_DATA=$(claude -p "get detailed information for Sentry error ${ERROR_ID} including stack trace, user context, and occurrence patterns")
```

### 2. Analyze Error Pattern
```bash
# Use MCP to analyze error patterns across the codebase
PATTERN_ANALYSIS=$(claude -p "analyze error patterns for ${ERROR_ID} and identify root cause in codebase")
```

### 3. Check Recent Changes
```bash
# Correlate error with recent deployments
DEPLOYMENT_CORRELATION=$(claude -p "check if Sentry error ${ERROR_ID} correlates with recent git commits or deployments")
```

## Error Classification

Based on Sentry data, classify the error:

### JavaScript Runtime Errors
- `TypeError: Cannot read property 'X' of undefined`
- `ReferenceError: X is not defined`
- `TypeError: X is not a function`

### Network/API Errors
- `NetworkError: Failed to fetch`
- `Request failed with status 500`
- `CORS policy error`

### React Component Errors
- `Error: Cannot update component while rendering`
- `Warning: Each child should have unique key prop`
- `Error: Hooks can only be called inside function components`

## Automated Fix Implementation

### 1. Create Feature Branch
```bash
BRANCH_NAME="fix/sentry-${ERROR_ID}-$(date +%Y%m%d)"
git checkout -b "$BRANCH_NAME"
```

### 2. Apply Error-Specific Fixes

#### Null/Undefined Property Access
```typescript
// Before (causing error)
const userName = user.profile.name;

// After (defensive fix)
const userName = user?.profile?.name ?? 'Unknown User';

// Or with validation
const userName = user && user.profile && user.profile.name 
  ? user.profile.name 
  : 'Unknown User';
```

#### Function Existence Checks
```typescript
// Before (causing error)
callback();

// After (safe call)
if (typeof callback === 'function') {
  callback();
} else {
  console.warn('Callback is not a function:', typeof callback);
}
```

#### Network Error Handling
```typescript
// Before (no error handling)
const response = await fetch('/api/data');
const data = await response.json();

// After (comprehensive error handling)
const response = await fetch('/api/data').catch(error => {
  console.error('Network request failed:', error);
  throw new Error('Unable to fetch data. Please try again.');
});

if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}

const data = await response.json().catch(error => {
  console.error('Failed to parse response:', error);
  throw new Error('Invalid response format');
});
```

### 3. Add Comprehensive Error Boundaries

For React component errors, add error boundaries:

```typescript
// ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Sentry with additional context
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 4. Add Monitoring and Alerting

```typescript
// Add custom Sentry context for better error tracking
Sentry.configureScope((scope) => {
  scope.setTag('errorFix.automated', true);
  scope.setTag('errorFix.originalIssue', ERROR_ID);
  scope.setContext('fix_metadata', {
    fixedAt: new Date().toISOString(),
    fixMethod: 'automated',
    confidence: 'high'
  });
});
```

## Testing Strategy

### 1. Reproduce Error Locally
```bash
# Create test that reproduces the original error
npm run test -- --testNamePattern="sentry-error-${ERROR_ID}"
```

### 2. Verify Fix
```bash
# Ensure fix resolves the issue
npm test
npm run build
npm run type-check
```

### 3. Integration Testing
```bash
# Test in staging environment
npm run test:e2e
```

## Deployment and Monitoring

### 1. Create Sentry Release
```bash
# Use MCP Sentry integration to create release
claude -p "create Sentry release for fix of error ${ERROR_ID} with current git SHA"
```

### 2. Deploy with Monitoring
```bash
# Deploy and monitor error rates
claude -p "deploy fix for Sentry error ${ERROR_ID} and monitor error budget for next 2 hours"
```

### 3. Verify Error Resolution
```bash
# Check if error recurrence decreases
claude -p "monitor Sentry error ${ERROR_ID} for 24 hours and report if issue is resolved"
```

## Quality Assurance

### Pre-Deployment Checklist
- [ ] Error reproduced in test environment
- [ ] Fix applied and tested
- [ ] No new errors introduced
- [ ] Error boundary added if applicable
- [ ] Monitoring and alerting configured
- [ ] Sentry release created
- [ ] Rollback plan prepared

### Post-Deployment Monitoring
- [ ] Error occurrence rate decreased
- [ ] No new related errors
- [ ] Performance impact acceptable
- [ ] User experience preserved

## Advanced Error Patterns

### Memory Leaks
```typescript
// Add cleanup to prevent memory leaks
useEffect(() => {
  const subscription = observable.subscribe(handler);
  return () => subscription.unsubscribe(); // Cleanup
}, []);
```

### Race Conditions
```typescript
// Use AbortController for fetch requests
useEffect(() => {
  const controller = new AbortController();
  
  fetch('/api/data', { signal: controller.signal })
    .then(response => response.json())
    .then(data => setData(data))
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Fetch failed:', error);
      }
    });
    
  return () => controller.abort();
}, []);
```

### State Management Issues
```typescript
// Use useCallback to prevent unnecessary re-renders
const handleClick = useCallback((id: string) => {
  setSelectedId(id);
}, []);

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);
```

## Success Metrics

Track the effectiveness of automated fixes:

1. **Error Resolution Rate**: Percentage of errors successfully fixed
2. **Fix Accuracy**: Fixes that don't introduce new errors
3. **Time to Resolution**: From error detection to fix deployment
4. **Regression Rate**: Fixed errors that reoccur
5. **Error Budget Impact**: Improvement in overall error budget

## Learning and Improvement

### Pattern Recognition
```bash
# Analyze successful fixes to improve future automation
claude -p "analyze patterns from successful Sentry error fixes to improve automation accuracy"
```

### Fix Template Generation
```bash
# Generate reusable fix templates
claude -p "create fix templates based on most common Sentry error patterns"
```

## Output Format

Return: "SENTRY_FIX_COMPLETE: Error ${ERROR_ID}
- Classification: ${ERROR_TYPE}
- Fix applied: ${FIX_DESCRIPTION}
- Tests passing: ${TEST_STATUS}
- Sentry release: ${RELEASE_VERSION}
- Monitoring active: ${MONITORING_STATUS}"

## Error Handling

If fix cannot be automated:
- Document the error analysis
- Create detailed issue for manual review
- Assign to appropriate team member
- Set up monitoring for similar errors

Return: "MANUAL_INTERVENTION_REQUIRED: Error ${ERROR_ID}
- Reason: ${COMPLEXITY_REASON}
- Analysis: ${ANALYSIS_SUMMARY}
- Assigned to: ${ASSIGNEE}
- Issue created: ${ISSUE_URL}"
```

## Usage Examples

### Basic Error Fix
```bash
claude -p "/project:fix-sentry-error 1234567890"
```

### High-Priority Error
```bash
claude -p "/project:fix-sentry-error 1234567890 --priority=critical --notify-team"
```

### Batch Error Processing
```bash
# Fix multiple related errors
claude -p "/project:fix-sentry-errors --batch --filter=TypeError --limit=10"
```

This command demonstrates how Sentry MCP integration enables intelligent, automated error resolution that combines production monitoring with code analysis and automated fixing.