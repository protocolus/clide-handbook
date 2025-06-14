# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a documentation repository for Claude Code CLI workflows, focusing on git worktree integration, GitHub issue management, and development automation patterns. The repository contains comprehensive documentation in README.md titled "The Clide Handbook: Orchestrating Autonomous Development Workflows".

## Key Documentation Areas

### 1. Claude Code Custom Commands
Custom commands are stored in `.claude/commands/` as markdown files. Common commands include:
- `fix-github-issue.md` - Analyze and fix GitHub issues
- `review-pr.md` - Review pull requests
- `create-fix-plan.md` - Create detailed fix plans for issues
- `write-failing-test.md` - Write tests that demonstrate bugs
- `implement-fix.md` - Implement fixes following plans

### 2. Git Worktree Integration
The documentation emphasizes using git worktrees for isolated development:
```bash
git worktree add ../project-feature-a feature-a
cd ../project-feature-a && claude -p "task description"
git worktree remove ../project-feature-a
```

### 3. GitHub CLI Integration
All GitHub operations should use the `gh` command:
- `gh issue view` - Get issue details
- `gh pr create` - Create pull requests
- `gh pr merge` - Merge pull requests
- `gh issue close` - Close issues

## Important Patterns

### Issue-to-PR Workflow
The documentation describes an automated workflow:
1. Analyze issue and create fix plan
2. Create worktree and branch
3. Write failing test
4. Implement fix
5. Create and review PR
6. Merge if approved

### Command Return Values
Commands should return clear status indicators:
- `"OK"` or `"FAIL"` for simple tasks
- `"PLAN_ISSUE: [number]"` for plan creation
- `"TEST_CREATED"` for test creation
- `"FIX_COMPLETE"` for implementation
- `"APPROVED"` or `"CHANGES_REQUESTED"` for reviews

## Configuration

### `.mcp.json` Structure
```json
{
  "tools": {
    "edit": { "enabled": true },
    "bash": { 
      "enabled": true,
      "allowed_commands": ["git", "gh", "npm", "pytest", "make"]
    }
  }
}
```

## Best Practices from Documentation

1. **Always use `--allowedTools` to limit permissions** when running automated workflows
2. **Create tests before fixes** following TDD approach
3. **Use descriptive worktree names** like `fix-issue-1234`
4. **Clean up worktrees** after use with `git worktree remove`
5. **Return clear status values** for automation scripts to parse

## Common Tasks

Since this is a documentation repository, common tasks involve:
- Updating workflow documentation
- Adding new custom command examples
- Improving automation scripts
- Documenting best practices and patterns

Note: This repository does not contain executable code, build systems, or tests - it's purely documentation for Claude Code workflows.