# Comprehensive Package Management with MCP

This example demonstrates advanced package management capabilities using the enhanced MCP tools for dependency checking, security auditing, and intelligent package updates.

## Package Health Check Command

### .claude/commands/package-health-check.md

```markdown
Perform comprehensive package health analysis and recommendations.

## Health Check Process

### 1. Dependency Analysis
```bash
# Check for outdated packages with severity filtering
OUTDATED_RESULT=$(claude -p "check dependencies with moderate severity filter and npm package manager")

# Parse results
OUTDATED_COUNT=$(echo "$OUTDATED_RESULT" | jq '.outdated.count')
CRITICAL_UPDATES=$(echo "$OUTDATED_RESULT" | jq '.outdated.critical | length')
```

### 2. Security Audit
```bash
# Comprehensive security audit
AUDIT_RESULT=$(claude -p "audit packages with summary format including production dependencies")

# Risk assessment
RISK_LEVEL=$(echo "$AUDIT_RESULT" | jq -r '.riskAssessment.level')
VULN_COUNT=$(echo "$AUDIT_RESULT" | jq '.securityAudit.totalVulnerabilities')
```

### 3. Package Ecosystem Health
```bash
# Analyze overall package health
HEALTH_RESULT=$(claude -p "analyze package health including metrics and bundle impact")

# Extract health score
HEALTH_SCORE=$(echo "$HEALTH_RESULT" | jq '.healthScore')
BUNDLE_SIZE=$(echo "$HEALTH_RESULT" | jq -r '.bundleImpact.estimatedSize')
```

## Health Report Generation

### Summary Dashboard
```bash
echo "📦 Package Health Report"
echo "========================"
echo ""
echo "🏥 Overall Health Score: $HEALTH_SCORE/100"
echo "📊 Total Packages: $(echo "$HEALTH_RESULT" | jq '.overview.totalPackages')"
echo "⚡ Bundle Size: $BUNDLE_SIZE"
echo ""
echo "🔄 Updates Available:"
echo "  - Total Outdated: $OUTDATED_COUNT"
echo "  - Critical Updates: $CRITICAL_UPDATES"
echo ""
echo "🔒 Security Status:"
echo "  - Risk Level: $RISK_LEVEL"
echo "  - Vulnerabilities: $VULN_COUNT"
```

### Detailed Analysis
```typescript
interface PackageHealthReport {
  timestamp: string;
  overallScore: number;
  status: 'healthy' | 'warning' | 'critical';
  
  dependencies: {
    total: number;
    production: number;
    development: number;
    outdated: {
      count: number;
      byType: {
        major: number;
        minor: number;
        patch: number;
      };
    };
  };
  
  security: {
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    vulnerabilities: {
      total: number;
      critical: number;
      high: number;
      moderate: number;
      low: number;
    };
  };
  
  recommendations: string[];
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    packages?: string[];
  }>;
}
```

## Automated Package Update Workflow

### .claude/commands/smart-package-update.md

```markdown
Intelligently update packages based on risk assessment and testing.

## Update Strategy Selection

### 1. Analyze Current State
```bash
# Get comprehensive dependency status
DEPS_STATUS=$(claude -p "check dependencies with auto-fix disabled")

# Determine update strategy based on project phase
if [ "$CI" = "true" ]; then
  STRATEGY="patch"  # Conservative in CI
elif [ -f ".release-candidate" ]; then
  STRATEGY="minor"  # Moderate during RC
else
  STRATEGY="minor"  # Normal development
fi
```

### 2. Risk Assessment
```typescript
const assessUpdateRisk = (packageInfo: any) => {
  const risks = {
    high: ['react', 'next', 'webpack', 'babel'],
    medium: ['lodash', 'axios', 'express'],
    low: ['@types/*', 'eslint-*', 'prettier']
  };
  
  if (risks.high.some(pkg => packageInfo.name.includes(pkg))) {
    return 'high';
  } else if (risks.medium.some(pkg => packageInfo.name.includes(pkg))) {
    return 'medium';
  }
  return 'low';
};
```

### 3. Staged Update Process
```bash
# Phase 1: Low-risk patch updates
claude -p "update packages using patch strategy with dry-run false and test verification"

if [ $? -eq 0 ]; then
  echo "✅ Patch updates completed successfully"
else
  echo "❌ Patch updates failed, aborting"
  exit 1
fi

# Phase 2: Medium-risk minor updates (if tests pass)
if [ "$STRATEGY" = "minor" ]; then
  claude -p "update packages using minor strategy with dry-run false and test verification"
fi
```

## Security-First Update Command

### .claude/commands/security-update.md

```markdown
Prioritize security updates with comprehensive testing and rollback capability.

## Security Update Process

### 1. Identify Security Issues
```bash
# Get detailed security audit
SECURITY_AUDIT=$(claude -p "audit packages with json format for production dependencies")

# Extract critical and high severity issues
CRITICAL_VULNS=$(echo "$SECURITY_AUDIT" | jq '.securityAudit.severity.critical')
HIGH_VULNS=$(echo "$SECURITY_AUDIT" | jq '.securityAudit.severity.high')

if [ "$CRITICAL_VULNS" -gt 0 ] || [ "$HIGH_VULNS" -gt 0 ]; then
  echo "🚨 Security vulnerabilities found: $CRITICAL_VULNS critical, $HIGH_VULNS high"
else
  echo "✅ No critical security issues found"
  exit 0
fi
```

### 2. Backup Current State
```bash
# Create comprehensive backup
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup
git stash push -m "Pre-security-update backup"
```

### 3. Apply Security Fixes
```bash
# Try automated security fixes first
npm audit fix --only=prod

# Verify fixes
AUDIT_AFTER=$(npm audit --json)
REMAINING_CRITICAL=$(echo "$AUDIT_AFTER" | jq '.metadata.vulnerabilities.critical // 0')

if [ "$REMAINING_CRITICAL" -gt 0 ]; then
  echo "⚠️ $REMAINING_CRITICAL critical vulnerabilities remain"
  echo "Manual intervention required"
fi
```

### 4. Comprehensive Testing
```bash
# Run full test suite
npm run test:all
TEST_RESULT=$?

# Run security tests if available
if [ -f "scripts/security-tests.sh" ]; then
  ./scripts/security-tests.sh
  SECURITY_TEST_RESULT=$?
else
  SECURITY_TEST_RESULT=0
fi

# Performance regression test
npm run build
npm run test:performance || echo "⚠️ Performance tests not available"
```

### 5. Rollback Strategy
```bash
if [ "$TEST_RESULT" -ne 0 ] || [ "$SECURITY_TEST_RESULT" -ne 0 ]; then
  echo "❌ Tests failed, rolling back"
  
  # Restore backup
  cp package.json.backup package.json
  cp package-lock.json.backup package-lock.json
  npm ci
  
  # Report failure
  echo "Security update failed:"
  echo "- Test result: $TEST_RESULT"
  echo "- Security test result: $SECURITY_TEST_RESULT"
  
  exit 1
else
  echo "✅ Security updates applied successfully"
  rm package.json.backup package-lock.json.backup
fi
```

## Package Audit Dashboard

### .claude/commands/package-dashboard.md

```markdown
Generate comprehensive package management dashboard with visual indicators.

## Dashboard Components

### 1. Health Overview
```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get all package data
HEALTH_DATA=$(claude -p "analyze package health including metrics")
DEPS_DATA=$(claude -p "check dependencies with npm package manager")
AUDIT_DATA=$(claude -p "audit packages with summary format")

# Extract key metrics
HEALTH_SCORE=$(echo "$HEALTH_DATA" | jq '.healthScore')
TOTAL_PACKAGES=$(echo "$HEALTH_DATA" | jq '.overview.totalPackages')
OUTDATED_COUNT=$(echo "$DEPS_DATA" | jq '.outdated.count')
VULN_COUNT=$(echo "$AUDIT_DATA" | jq '.securityAudit.totalVulnerabilities')

# Determine status colors
if [ "$HEALTH_SCORE" -ge 80 ]; then
  HEALTH_COLOR=$GREEN
  HEALTH_STATUS="Healthy"
elif [ "$HEALTH_SCORE" -ge 60 ]; then
  HEALTH_COLOR=$YELLOW
  HEALTH_STATUS="Warning"
else
  HEALTH_COLOR=$RED
  HEALTH_STATUS="Critical"
fi

# Generate dashboard
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    📦 Package Dashboard                      ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Overall Health: ${HEALTH_COLOR}${HEALTH_STATUS} (${HEALTH_SCORE}/100)${NC}"
echo -e "${BLUE}║${NC} Total Packages: ${TOTAL_PACKAGES}"
echo -e "${BLUE}║${NC} Outdated: ${OUTDATED_COUNT} packages"
echo -e "${BLUE}║${NC} Vulnerabilities: ${VULN_COUNT} issues"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════════╣${NC}"
```

### 2. Trend Analysis
```typescript
interface TrendData {
  date: string;
  healthScore: number;
  outdatedCount: number;
  vulnerabilityCount: number;
  bundleSize: string;
}

const trackTrends = async () => {
  const today = new Date().toISOString().split('T')[0];
  const trendFile = '.claude/package-trends.json';
  
  // Load existing trends
  const trends: TrendData[] = await loadTrends(trendFile);
  
  // Add today's data
  const todayData: TrendData = {
    date: today,
    healthScore: await getHealthScore(),
    outdatedCount: await getOutdatedCount(),
    vulnerabilityCount: await getVulnerabilityCount(),
    bundleSize: await getBundleSize()
  };
  
  trends.push(todayData);
  
  // Keep last 30 days
  const recentTrends = trends.slice(-30);
  
  // Save trends
  await saveTrends(trendFile, recentTrends);
  
  // Generate trend report
  generateTrendReport(recentTrends);
};
```

### 3. Action Recommendations
```bash
# Generate actionable recommendations
RECOMMENDATIONS=$(cat << 'EOF'
📋 Recommended Actions:

🔴 Critical (Do Now):
EOF
)

# Check for critical vulnerabilities
CRITICAL_VULNS=$(echo "$AUDIT_DATA" | jq '.securityAudit.severity.critical')
if [ "$CRITICAL_VULNS" -gt 0 ]; then
  echo "   • Fix $CRITICAL_VULNS critical security vulnerabilities"
fi

# Check for major updates to critical packages
CRITICAL_OUTDATED=$(echo "$DEPS_DATA" | jq '.outdated.critical | length')
if [ "$CRITICAL_OUTDATED" -gt 0 ]; then
  echo "   • Review $CRITICAL_OUTDATED critical package updates"
fi

echo ""
echo "🟡 Medium Priority (This Week):"

# Check for high severity vulnerabilities
HIGH_VULNS=$(echo "$AUDIT_DATA" | jq '.securityAudit.severity.high')
if [ "$HIGH_VULNS" -gt 0 ]; then
  echo "   • Address $HIGH_VULNS high-severity vulnerabilities"
fi

# Check for minor updates
MINOR_UPDATES=$(echo "$DEPS_DATA" | jq '.outdated.packages.minor | length')
if [ "$MINOR_UPDATES" -gt 0 ]; then
  echo "   • Apply $MINOR_UPDATES minor package updates"
fi

echo ""
echo "🟢 Low Priority (When Convenient):"
echo "   • Update development dependencies"
echo "   • Review and clean unused dependencies"
echo "   • Consider bundle size optimizations"
```

## Continuous Package Monitoring

### GitHub Actions Integration

```yaml
# .github/workflows/package-monitoring.yml
name: Package Health Monitoring

on:
  schedule:
    - cron: '0 8 * * MON'  # Monday 8 AM
  workflow_dispatch:

jobs:
  package-health:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run package health check
        run: |
          claude -p "/project:package-health-check" > package-health-report.txt
          
      - name: Create issue if critical problems found
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('package-health-report.txt', 'utf8');
            
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🚨 Critical Package Health Issues Detected',
              body: `## Package Health Report\n\n\`\`\`\n${report}\n\`\`\`\n\nPlease review and address the critical issues identified.`,
              labels: ['security', 'dependencies', 'critical']
            });
```

## Usage Examples

### Daily Health Check
```bash
# Quick health check
claude -p "/project:package-health-check"

# Generate dashboard
claude -p "/project:package-dashboard"
```

### Security-Focused Updates
```bash
# Emergency security update
claude -p "/project:security-update"

# Comprehensive audit
claude -p "audit packages with table format including production dependencies"
```

### Planned Maintenance
```bash
# Smart update with testing
claude -p "/project:smart-package-update"

# Check update impact
claude -p "update packages using minor strategy with dry-run true"
```

### CI/CD Integration
```bash
# Pre-deployment check
claude -p "check dependencies with critical severity filter and auto-fix enabled"

# Post-deployment verification
claude -p "analyze package health and check for any regressions"
```

This comprehensive package management system provides intelligent, automated dependency management that balances security, stability, and keeping packages up-to-date.