# The Clide Handbook

**Orchestrating Autonomous Development Workflows**

> Build Self-Healing Software with AI-Driven Git Worktrees, Automated Testing, and Intelligent Code Review

## What is Clide?

**Clide** (CLI + IDE) is a comprehensive methodology and toolkit for autonomous development with Claude Code. It transforms Claude Code from a simple AI coding assistant into a powerful development environment that can handle complex, multi-step workflows through Model Context Protocol (MCP) and intelligent command orchestration.

## About This Book

This repository contains both the complete handbook for autonomous development with Claude Code and all the working code examples, configurations, and templates referenced throughout the book.

**Jump to:** [Table of Contents](#table-of-contents) | [Quick Start](#quick-start) | [Key Features](#key-features) | [Basic Setup](#basic-setup) | [Custom Commands](#custom-commands) | [Examples](#example-workflows)

## Table of Contents

### Part I: Foundations
- **[Introduction](chapters/00-introduction.md)** - Welcome to the future of development
- **[Chapter 1: The Age of Autonomous Development](chapters/01-the-age-of-autonomous-development.md)** - The evolution of coding assistance
- **[Chapter 2: Understanding Claude Code](chapters/02-understanding-claude-code.md)** - Your new development partner
- **[Chapter 3: Setting Up Your Environment](chapters/03-setting-up-your-environment.md)** - Installation and configuration

### Part II: Core Workflows
- **[Chapter 5: Git Worktree Mastery](chapters/05-git-worktree-mastery.md)** - Parallel development streams
- **[Chapter 6: The Testing-First Philosophy](chapters/06-the-testing-first-philosophy.md)** - AI-powered test generation
- **[Chapter 7: The Issue-to-PR Pipeline](chapters/07-the-issue-to-pr-pipeline.md)** - Automated bug fixing workflow

### Part III: Advanced Patterns
- **[Chapter 8: Advanced Command Patterns](chapters/08-advanced-command-patterns.md)** - Self-healing code systems
- **[Chapter 9: Tool Permissions and Security](chapters/09-tool-permissions-and-security.md)** - Implementing security layers
- **[Chapter 10: Advanced Automation and Future Patterns](chapters/10-advanced-automation-and-future-patterns.md)** - Emerging patterns
- **[Chapter 11: Automated Issue Detection and Dispatch](chapters/11-automated-issue-detection-and-dispatch.md)** - Autonomous issue handling

### Part IV: Conclusion
- **[Chapter 12: Conclusion](chapters/12-conclusion.md)** - The future of autonomous development

## Quick Start

Clone this repository to get everything you need:

```bash
git clone https://github.com/protocolus/clide-handbook
cd clide-handbook

# The book chapters are in chapters/
# Working code examples are in examples/
# Ready-to-use templates are in templates/
```

## Repository Structure

```
clide-handbook/
├── chapters/                    # Complete handbook chapters
│   ├── 00-introduction.md
│   ├── 01-the-age-of-autonomous-development.md
│   ├── 02-understanding-claude-code.md
│   ├── 03-setting-up-your-environment.md
│   ├── 04-custom-commands-architecture.md
│   ├── 06-the-testing-first-philosophy.md
│   └── 07-the-issue-to-pr-pipeline.md
├── examples/                    # Working code examples
│   ├── react-app/              # Complete React/TypeScript setup
│   │   ├── .claude/             # Claude Code configuration
│   │   ├── .mcp.json           # Model Context Protocol config
│   │   ├── tsconfig.json       # TypeScript configuration
│   │   ├── jest.config.js      # Testing setup
│   │   └── package.json        # Dependencies and scripts
│   ├── commands/               # Custom command examples
│   ├── workflows/              # Git worktree workflows
│   └── pipelines/              # CI/CD configurations
├── templates/                  # Ready-to-use templates
│   ├── mcp/                    # MCP server templates
│   ├── tsconfig/               # TypeScript configurations
│   ├── eslint/                 # ESLint rule sets
│   └── jest/                   # Testing setups
└── tools/                      # Helper scripts and utilities
```

## Key Features

### Model Context Protocol (MCP) Integration
- **Deep Contextual Understanding**: Claude Code understands your entire project structure, not just individual files
- **Secure Tool Integration**: Connect to databases, APIs, development tools, and monitoring services with fine-grained permissions
- **Production Monitoring**: Integrated Sentry error tracking, analysis, and automated fix generation
- **Custom MCP Servers**: Build project-specific tools that integrate seamlessly with Claude Code
- **Rich Context Awareness**: Leverage relationships, dependencies, patterns, and production data across your codebase

### Autonomous Development Workflows
- **Issue-to-PR Pipeline**: Automated bug fixing from GitHub issues to merged pull requests
- **Intelligent Testing**: AI-powered test generation, execution, and maintenance
- **Type-Safe Automation**: TypeScript-first approach ensuring reliable autonomous operations
- **Git Worktree Integration**: Parallel development streams with isolated environments

### Advanced Command Architecture
- **Custom Commands**: Build domain-specific automation tailored to your workflow
- **Command Composition**: Chain simple commands into complex workflows
- **Context-Aware Execution**: Commands that understand project state and history
- **Team Knowledge Sharing**: Capture and distribute tribal knowledge through automation

## Basic Setup

### Prerequisites
- Claude Code CLI installed
- GitHub CLI (`gh`) installed  
- Git with worktree support
- Node.js 18+ for MCP server functionality

### Directory Structure
```
.claude/
├── commands/
│   ├── fix-github-issue.md
│   └── review-pr.md
└── workflows/
    └── issue-to-pr.md
```

## Custom Commands

### Creating Custom Commands

Commands are created by placing markdown files in `.claude/commands/`. The command name is derived from the filename.

**Example: `.claude/commands/fix-github-issue.md`**
```markdown
Please analyze and fix the GitHub issue: $ARGUMENTS.

Follow these steps:
1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes to fix the issue
5. Write and run tests to verify the fix
6. Ensure code passes linting and type checking
7. Create a descriptive commit message
8. Push and create a PR

Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.
```

**Usage:**
```bash
claude -p "/project:fix-github-issue 1234"
```

## Git Worktree Integration

### Basic Worktree Workflow

```bash
# Create a worktree for a feature
git worktree add ../project-feature-a feature-a

# Navigate to worktree and run Claude Code
cd ../project-feature-a && claude -p "migrate foo.py from React to Vue. When you are done, you MUST return the string OK if you succeeded, or FAIL if the task failed." --allowedTools Edit Bash(git commit:*)

# Clean up when finished
git worktree remove ../project-feature-a
```

## Advanced Workflow: Issue to PR Pipeline

### Workflow Components

#### 1. Plan Creation Command
**`.claude/commands/create-fix-plan.md`**
```markdown
Analyze GitHub issue $ARGUMENTS and create a detailed fix plan.

Steps:
1. Use `gh issue view $ARGUMENTS` to get issue details
2. Analyze the codebase to understand the problem
3. Create a detailed plan with:
   - Problem analysis
   - Affected files
   - Implementation steps
   - Test requirements
4. Create a new issue with the plan using `gh issue create`
5. Link it to the original issue
6. Return the new issue number

Output format: "PLAN_ISSUE: [number]"
```

#### 2. Test Creation Command
**`.claude/commands/write-failing-test.md`**
```markdown
Based on issue $ARGUMENTS, write a test that demonstrates the bug.

Steps:
1. Read the issue details and fix plan
2. Identify the appropriate test file
3. Write a test that currently fails
4. Run the test to confirm it fails
5. Commit the test with message "test: failing test for issue #$ARGUMENTS"
6. Return "TEST_CREATED" if successful
```

#### 3. Implementation Command
**`.claude/commands/implement-fix.md`**
```markdown
Implement the fix for issue $ARGUMENTS following the plan.

Steps:
1. Read the issue and plan details
2. Implement the necessary changes
3. Run the failing test until it passes
4. Run all tests to ensure no regressions
5. Once tests pass, return "FIX_COMPLETE"
```

#### 4. PR Review Command
**`.claude/commands/review-pr.md`**
```markdown
Review the pull request $ARGUMENTS.

Analyze:
1. Code quality and style
2. Test coverage
3. Potential bugs or edge cases
4. Performance implications
5. Security considerations

Provide feedback and return either:
- "APPROVED" if the PR is ready to merge
- "CHANGES_REQUESTED: [summary of required changes]"
```

### Complete Automated Workflow Script

**`scripts/auto-fix-issue.sh`**
```bash
#!/bin/bash

ISSUE_NUMBER=$1
BRANCH_NAME="fix-issue-$ISSUE_NUMBER"
WORKTREE_PATH="../worktree-$BRANCH_NAME"

# Step 1: Create fix plan
echo "Creating fix plan for issue #$ISSUE_NUMBER..."
PLAN_RESULT=$(claude -p "/project:create-fix-plan $ISSUE_NUMBER")
PLAN_ISSUE=$(echo "$PLAN_RESULT" | grep -oP 'PLAN_ISSUE: \K\d+')

if [ -z "$PLAN_ISSUE" ]; then
    echo "Failed to create plan"
    exit 1
fi

# Step 2: Create worktree and branch
echo "Creating worktree at $WORKTREE_PATH..."
git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
cd "$WORKTREE_PATH"

# Step 3: Write failing test
echo "Writing failing test..."
TEST_RESULT=$(claude -p "/project:write-failing-test $ISSUE_NUMBER" --allowedTools Edit Bash)

if [[ "$TEST_RESULT" != *"TEST_CREATED"* ]]; then
    echo "Failed to create test"
    git worktree remove "$WORKTREE_PATH"
    exit 1
fi

# Step 4: Implement fix
echo "Implementing fix..."
FIX_RESULT=$(claude -p "/project:implement-fix $ISSUE_NUMBER" --allowedTools Edit Bash)

if [[ "$FIX_RESULT" != *"FIX_COMPLETE"* ]]; then
    echo "Failed to implement fix"
    git worktree remove "$WORKTREE_PATH"
    exit 1
fi

# Step 5: Commit and push
git add -A
git commit -m "fix: resolve issue #$ISSUE_NUMBER

Implements fix as per plan in issue #$PLAN_ISSUE"
git push origin "$BRANCH_NAME"

# Step 6: Create PR
PR_URL=$(gh pr create \
    --title "Fix: Issue #$ISSUE_NUMBER" \
    --body "Fixes #$ISSUE_NUMBER\nImplementation plan: #$PLAN_ISSUE" \
    --base main)

PR_NUMBER=$(echo "$PR_URL" | grep -oP '/pull/\K\d+')

# Step 7: Review PR
echo "Reviewing PR #$PR_NUMBER..."
REVIEW_RESULT=$(claude -p "/project:review-pr $PR_NUMBER")

if [[ "$REVIEW_RESULT" == *"APPROVED"* ]]; then
    echo "PR approved! Merging..."
    gh pr merge "$PR_NUMBER" --auto --squash
    gh issue close "$ISSUE_NUMBER" --comment "Fixed in PR #$PR_NUMBER"
else
    echo "Changes requested: $REVIEW_RESULT"
    echo "Manual intervention required"
fi

# Cleanup
cd ..
git worktree remove "$WORKTREE_PATH"
```

## Configuration Files

### `.mcp.json` Configuration

Example configuration for Claude Code:
```json
{
  "tools": {
    "edit": {
      "enabled": true
    },
    "bash": {
      "enabled": true,
      "allowed_commands": [
        "git",
        "gh",
        "npm",
        "pytest",
        "make"
      ]
    }
  },
  "context": {
    "max_files": 20,
    "include_patterns": [
      "**/*.py",
      "**/*.js",
      "**/*.md"
    ],
    "exclude_patterns": [
      "**/node_modules/**",
      "**/.git/**"
    ]
  }
}
```

## Best Practices

### 1. Command Design
- Make commands atomic and focused
- Always include error handling
- Use clear return values for automation
- Include progress indicators

### 2. Worktree Management
- Use descriptive worktree names
- Always clean up worktrees after use
- Consider using a cleanup script for orphaned worktrees

### 3. Automation Safety
- Include dry-run options
- Log all automated actions
- Set up notifications for failures
- Use `--allowedTools` to limit permissions

### 4. Testing Integration
- Always create tests before fixes
- Use test-driven development approach
- Run full test suite before PR creation
- Include integration tests for complex fixes

## Advanced Patterns

### Parallel Worktree Processing
```bash
# Process multiple issues in parallel
for issue in "$@"; do
    ./scripts/auto-fix-issue.sh "$issue" &
done
wait
```

### Conditional Workflows
```bash
# Different workflows based on issue labels
LABELS=$(gh issue view "$ISSUE" --json labels -q '.labels[].name')
if [[ "$LABELS" == *"bug"* ]]; then
    claude -p "/project:fix-bug $ISSUE"
elif [[ "$LABELS" == *"feature"* ]]; then
    claude -p "/project:implement-feature $ISSUE"
fi
```

### Progress Monitoring
```bash
# Monitor Claude Code execution with timeouts
timeout 30m claude -p "/project:complex-task" || {
    echo "Task timed out"
    # Cleanup and notify
}
```

## Troubleshooting

### Common Issues

1. **Worktree conflicts**
   ```bash
   # List all worktrees
   git worktree list
   # Remove problematic worktree
   git worktree remove --force path/to/worktree
   ```

2. **Claude Code hanging**
   - Check `.mcp.json` configuration
   - Verify tool permissions
   - Use `--verbose` flag for debugging

3. **Git permissions**
   - Ensure SSH keys are configured
   - Check GitHub CLI authentication: `gh auth status`

## Security Considerations

1. **Limited Tool Access**
   - Use `--allowedTools` to restrict commands
   - Avoid giving access to sensitive operations

2. **Code Review**
   - Always review generated code before merging
   - Set up required PR reviews in GitHub

3. **API Keys**
   - Store credentials in environment variables
   - Never commit sensitive data

## Example Workflows

### Bug Fix Workflow
```bash
# 1. Developer reports bug
gh issue create --title "Bug: ..." --label bug

# 2. Automated fix attempt
./scripts/auto-fix-issue.sh $ISSUE_NUMBER

# 3. Manual review if needed
git worktree add ../manual-review fix-issue-$ISSUE_NUMBER
cd ../manual-review
# Make manual adjustments
```

### Feature Development Workflow
```bash
# 1. Create feature spec
claude -p "Create a detailed spec for: $FEATURE_DESCRIPTION" > spec.md

# 2. Create implementation plan
gh issue create --title "Feature: $FEATURE" --body-file spec.md

# 3. Implement in worktree
git worktree add ../feature-$FEATURE
cd ../feature-$FEATURE
claude -p "/project:implement-feature --spec ../spec.md"
```

## Conclusion

Claude Code with git worktree provides powerful automation for development workflows. By combining custom commands, automated testing, and PR management, teams can significantly accelerate their development process while maintaining code quality.
