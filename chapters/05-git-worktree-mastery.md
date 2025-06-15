# Chapter 5: Git Worktree Mastery

Git worktrees are one of the most powerful yet underutilized features for autonomous development. They allow you to have multiple working directories for a single repository, enabling parallel development streams that would otherwise require complex branching strategies or multiple repository clones.

## Understanding Git Worktrees

A git worktree creates a new working directory linked to your existing repository. Each worktree can be on a different branch, allowing you to:

- Work on multiple features simultaneously
- Quickly switch between bug fixes and feature development
- Run CI/CD processes in parallel
- Compare implementations side-by-side

```bash
# Create a new worktree for feature development
git worktree add ../feature-branch feature/new-api

# Create worktree from a new branch
git worktree add ../hotfix -b hotfix/critical-bug

# List all worktrees
git worktree list
```

## MCP Integration for Worktrees

Our MCP server includes intelligent worktree management tools. Add these to your `.mcp.json` configuration:

```json
{
  "mcpServers": {
    "project-tools": {
      "command": "node",
      "args": ["tools/project-tools.js"],
      "env": {
        "ENABLE_WORKTREE_TOOLS": "true"
      }
    }
  }
}
```

The worktree tools in your MCP server provide:

```javascript
// Add to your ProjectToolsServer class
async createWorktree(name, branch = null, baseBranch = 'main') {
  const worktreePath = path.join('..', name);
  
  try {
    // Create new branch if specified
    if (branch && !await this.branchExists(branch)) {
      await this.execCommand(`git checkout -b ${branch} ${baseBranch}`);
      await this.execCommand(`git push -u origin ${branch}`);
      await this.execCommand(`git checkout ${baseBranch}`);
    }
    
    // Create worktree
    const targetBranch = branch || name;
    await this.execCommand(`git worktree add ${worktreePath} ${targetBranch}`);
    
    return {
      success: true,
      path: worktreePath,
      branch: targetBranch,
      message: `Worktree created at ${worktreePath} on branch ${targetBranch}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async listWorktrees() {
  try {
    const result = await this.execCommand('git worktree list --porcelain');
    const worktrees = [];
    const lines = result.split('\n');
    
    let current = {};
    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        if (Object.keys(current).length > 0) {
          worktrees.push(current);
        }
        current = { path: line.substring(9) };
      } else if (line.startsWith('HEAD ')) {
        current.commit = line.substring(5);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7);
      }
    }
    
    if (Object.keys(current).length > 0) {
      worktrees.push(current);
    }
    
    return worktrees;
  } catch (error) {
    return [];
  }
}

async syncWorktree(worktreePath) {
  const originalDir = process.cwd();
  
  try {
    process.chdir(worktreePath);
    
    // Fetch latest changes
    await this.execCommand('git fetch origin');
    
    // Get current branch
    const branch = await this.execCommand('git branch --show-current');
    
    // Pull latest changes if on a tracking branch
    try {
      await this.execCommand(`git pull origin ${branch.trim()}`);
    } catch (error) {
      // Branch might not have upstream
      console.log(`No upstream for ${branch.trim()}`);
    }
    
    return {
      success: true,
      message: `Worktree ${worktreePath} synced successfully`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  } finally {
    process.chdir(originalDir);
  }
}

async removeWorktree(worktreePath) {
  try {
    await this.execCommand(`git worktree remove ${worktreePath}`);
    return {
      success: true,
      message: `Worktree ${worktreePath} removed successfully`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

## Autonomous Workflow Patterns

### Parallel Feature Development

Create dedicated worktrees for different development streams:

```bash
# Main development
claude-code "Create worktree for user authentication feature"

# In parallel - different terminal/Claude session
claude-code "Create worktree for API optimization work"
```

Claude Code can work on both simultaneously, with each worktree maintaining its own:
- Dependencies (`node_modules`)
- Build artifacts
- Development server
- Test environment

### CI/CD Integration

Use worktrees for zero-downtime deployment testing:

```javascript
// Add to MCP server
async createDeploymentWorktree() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const worktreeName = `deployment-${timestamp}`;
  
  const result = await this.createWorktree(worktreeName, null, 'main');
  
  if (result.success) {
    // Run full build and test suite
    const originalDir = process.cwd();
    process.chdir(result.path);
    
    try {
      await this.execCommand('npm ci');
      await this.execCommand('npm run build');
      await this.execCommand('npm test');
      
      return {
        success: true,
        worktree: worktreeName,
        path: result.path,
        ready: true
      };
    } catch (error) {
      // Clean up failed deployment worktree
      process.chdir(originalDir);
      await this.removeWorktree(result.path);
      throw error;
    } finally {
      process.chdir(originalDir);
    }
  }
  
  return result;
}
```

### Hotfix Workflow

Implement rapid hotfix deployment:

```javascript
async createHotfixWorktree(issueDescription) {
  const branchName = `hotfix/${issueDescription.toLowerCase().replace(/\s+/g, '-')}`;
  const worktreeName = `hotfix-${Date.now()}`;
  
  // Create from production branch
  const result = await this.createWorktree(worktreeName, branchName, 'production');
  
  if (result.success) {
    return {
      ...result,
      instructions: [
        `cd ${result.path}`,
        'npm ci',
        `# Fix: ${issueDescription}`,
        'npm test',
        'git add -A',
        `git commit -m "hotfix: ${issueDescription}"`,
        'git push origin ' + branchName
      ]
    };
  }
  
  return result;
}
```

## Advanced Worktree Strategies

### Resource Optimization

Share common dependencies across worktrees:

```bash
# Create shared node_modules
mkdir -p shared/node_modules

# In each worktree
ln -sf ../../shared/node_modules node_modules
```

> **⚠️ Warning**: Symlinking `node_modules` across worktrees can cause issues with:
> - Native modules compiled for different Node.js versions
> - Platform-specific binaries 
> - Development vs production dependencies
> - Tools that don't follow symlinks properly
> 
> Consider using `pnpm` with workspace support instead for safer dependency sharing.

### Database Isolation

For applications with databases, isolate each worktree:

```javascript
// Environment-specific configuration
async setupWorktreeEnvironment(worktreePath, envType = 'development') {
  const envFile = path.join(worktreePath, '.env.local');
  const dbName = `myapp_${path.basename(worktreePath)}_${envType}`;
  
  const envContent = `
DATABASE_URL="postgresql://localhost:5432/${dbName}"
REDIS_URL="redis://localhost:6379/1"
NODE_ENV="${envType}"
PORT="${3000 + Math.floor(Math.random() * 1000)}"
`;
  
  await fs.writeFile(envFile, envContent);
  
  // Create isolated database
  await this.execCommand(`createdb ${dbName}`, { cwd: worktreePath });
  await this.execCommand(`npm run db:migrate`, { cwd: worktreePath });
  
  return {
    database: dbName,
    envFile: envFile,
    ready: true
  };
}
```

### Automated Cleanup

Implement smart worktree lifecycle management:

```javascript
async cleanupStaleWorktrees(maxAge = 7) {
  const worktrees = await this.listWorktrees();
  const cutoff = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
  
  for (const worktree of worktrees) {
    if (worktree.path === process.cwd()) continue; // Skip main worktree
    
    try {
      const stats = await fs.stat(worktree.path);
      if (stats.mtime < cutoff) {
        // Check if branch has unmerged changes
        const status = await this.execCommand('git status --porcelain', {
          cwd: worktree.path
        });
        
        if (status.trim() === '') {
          await this.removeWorktree(worktree.path);
          console.log(`Cleaned up stale worktree: ${worktree.path}`);
        }
      }
    } catch (error) {
      // Worktree might already be removed
      console.log(`Skipping cleanup for ${worktree.path}: ${error.message}`);
    }
  }
}
```

## Claude Code Integration

### Worktree-Aware Commands

Train Claude Code to understand your worktree setup:

```markdown
# Add to CLAUDE.md

## Worktree Guidelines

- Use `create-worktree` MCP tool for new feature branches
- Each worktree should have isolated environment variables
- Run tests in the target worktree before creating PRs
- Use `sync-worktree` before starting work in existing worktrees
- Clean up worktrees after merging branches

## Current Worktrees

Run `list-worktrees` MCP tool to see active worktrees.
Always verify which worktree you're working in before making changes.
```

### Intelligent Branch Management

```javascript
async suggestWorktreeStrategy(taskDescription) {
  const worktrees = await this.listWorktrees();
  const branches = await this.listBranches();
  
  const analysis = {
    taskType: this.classifyTask(taskDescription),
    existingWorktrees: worktrees.length,
    availableBranches: branches.filter(b => !b.startsWith('origin/')),
    recommendation: null
  };
  
  if (analysis.taskType === 'hotfix') {
    analysis.recommendation = {
      action: 'create_hotfix_worktree',
      reason: 'Hotfixes require isolated environment from production',
      baseBranch: 'production'
    };
  } else if (analysis.taskType === 'feature' && analysis.existingWorktrees < 3) {
    analysis.recommendation = {
      action: 'create_feature_worktree',
      reason: 'Feature development benefits from parallel workspace',
      baseBranch: 'main'
    };
  } else {
    analysis.recommendation = {
      action: 'use_existing_worktree',
      reason: 'Too many active worktrees, consider cleanup first',
      suggestion: 'Run cleanup-stale-worktrees first'
    };
  }
  
  return analysis;
}
```

## Best Practices

### 1. Naming Conventions

Use consistent worktree naming:
- `feature-{ticket-id}`: Feature development
- `hotfix-{timestamp}`: Emergency fixes
- `experiment-{description}`: Proof of concepts
- `review-{pr-number}`: Code review environments

### 2. Resource Management

- Limit concurrent worktrees (recommended: 3-5)
- Share large dependencies when possible
- Use cleanup automation for stale worktrees
- Monitor disk space usage

### 3. Integration Testing

Create integration test worktrees:

```javascript
async createIntegrationEnvironment() {
  const worktree = await this.createWorktree('integration-test', 'integration');
  
  if (worktree.success) {
    const originalDir = process.cwd();
    process.chdir(worktree.path);
    
    try {
      // Setup full integration environment
      await this.execCommand('docker-compose -f docker-compose.integration.yml up -d');
      await this.execCommand('npm run test:integration');
      
      return {
        ...worktree,
        environment: 'integration',
        services: ['database', 'redis', 'api'],
        ready: true
      };
    } finally {
      process.chdir(originalDir);
    }
  }
  
  return worktree;
}
```

### 4. Security Considerations

- Keep sensitive environment variables isolated per worktree
- Use different database instances for each worktree
- Implement proper cleanup to avoid leaving credentials in abandoned worktrees

Git worktrees transform how Claude Code can approach complex development tasks, enabling true parallel development and sophisticated CI/CD workflows that would be impossible with traditional single-worktree approaches.