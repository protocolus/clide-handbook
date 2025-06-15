# Chapter 8: Advanced Command Patterns

> "I don't have trust issues, I just prefer my commands with built-in therapy sessions."
> 
> — Clide, on self-healing code patterns

As your autonomous development workflows mature, you'll discover that simple commands evolve into sophisticated patterns that handle complex scenarios. This chapter explores advanced command patterns that unlock Claude Code's full potential for intelligent, context-aware development.

## Conditional Command Flows

### Smart Decision Trees

Create commands that adapt based on project state:

```javascript
// Add to your MCP server
async analyzeAndAct(action, context = {}) {
  const projectState = await this.getProjectState();
  const decision = await this.makeIntelligentDecision(action, projectState, context);
  
  switch (decision.strategy) {
    case 'test_first':
      return await this.executeTestFirstFlow(decision.params);
    case 'hotfix':
      return await this.executeHotfixFlow(decision.params);
    case 'feature_branch':
      return await this.executeFeatureBranchFlow(decision.params);
    case 'refactor':
      return await this.executeRefactorFlow(decision.params);
    default:
      return await this.executeDefaultFlow(decision.params);
  }
}

async getProjectState() {
  const [
    gitStatus,
    testResults,
    buildStatus,
    dependencies,
    coverage
  ] = await Promise.all([
    this.execCommand('git status --porcelain'),
    this.runTests({ silent: true }),
    this.checkBuildStatus(),
    this.analyzeDependencies(),
    this.getCoverageReport()
  ]);
  
  return {
    hasUncommittedChanges: gitStatus.trim() !== '',
    testsPass: testResults.success,
    buildPasses: buildStatus.success,
    hasVulnerabilities: dependencies.vulnerabilities > 0,
    coveragePercent: coverage.total,
    timestamp: new Date().toISOString()
  };
}

async makeIntelligentDecision(action, state, context) {
  // Complex decision logic based on project state
  if (context.urgency === 'critical' && state.testsPass) {
    return { strategy: 'hotfix', params: { fast: true } };
  }
  
  if (action.includes('test') || !state.testsPass) {
    return { strategy: 'test_first', params: { focus: action } };
  }
  
  if (state.hasUncommittedChanges && action.includes('feature')) {
    return { 
      strategy: 'feature_branch', 
      params: { stash: true, newBranch: true } 
    };
  }
  
  return { strategy: 'default', params: {} };
}
```

### Context-Aware Commands

Build commands that understand your development context:

```javascript
async smartDeploy(environment = 'staging') {
  const context = await this.buildDeploymentContext(environment);
  
  if (!context.canDeploy) {
    return {
      success: false,
      reason: context.blockingReason,
      suggestedAction: context.suggestion
    };
  }
  
  // Execute deployment with appropriate strategy
  switch (context.strategy) {
    case 'blue_green':
      return await this.blueGreenDeploy(environment, context);
    case 'rolling':
      return await this.rollingDeploy(environment, context);
    case 'canary':
      return await this.canaryDeploy(environment, context);
    default:
      return await this.standardDeploy(environment, context);
  }
}

async buildDeploymentContext(environment) {
  const [branch, tests, builds, monitoring] = await Promise.all([
    this.getCurrentBranch(),
    this.getTestResults(),
    this.getBuildStatus(),
    this.getMonitoringHealth(environment)
  ]);
  
  const rules = {
    production: {
      requiresBranch: 'main',
      requiresTests: true,
      requiresBuild: true,
      requiresHealthy: true,
      strategy: 'blue_green'
    },
    staging: {
      requiresBranch: ['main', 'develop'],
      requiresTests: true,
      requiresBuild: true,
      requiresHealthy: false,
      strategy: 'rolling'
    },
    development: {
      requiresBranch: null,
      requiresTests: false,
      requiresBuild: false,
      requiresHealthy: false,
      strategy: 'standard'
    }
  };
  
  const rule = rules[environment];
  const context = {
    environment,
    branch: branch.trim(),
    strategy: rule.strategy,
    canDeploy: true,
    blockingReason: null,
    suggestion: null
  };
  
  // Validate deployment conditions
  if (rule.requiresBranch && !rule.requiresBranch.includes(context.branch)) {
    context.canDeploy = false;
    context.blockingReason = `Wrong branch: ${context.branch}`;
    context.suggestion = `Switch to ${rule.requiresBranch} branch`;
  }
  
  if (rule.requiresTests && !tests.pass) {
    context.canDeploy = false;
    context.blockingReason = 'Tests failing';
    context.suggestion = 'Fix failing tests before deployment';
  }
  
  if (rule.requiresBuild && !builds.success) {
    context.canDeploy = false;
    context.blockingReason = 'Build failing';
    context.suggestion = 'Fix build errors before deployment';
  }
  
  return context;
}
```

## Multi-Stage Command Pipelines

### Progressive Enhancement Pattern

Build commands that enhance themselves based on success:

```javascript
async progressiveFeatureDevelopment(featureSpec) {
  const pipeline = new CommandPipeline('feature-development');
  
  // Stage 1: Foundation
  pipeline.addStage('foundation', async () => {
    const branch = await this.createFeatureBranch(featureSpec.name);
    const tests = await this.generateFailingTests(featureSpec);
    return { branch, tests, success: true };
  });
  
  // Stage 2: Implementation (conditional on foundation)
  pipeline.addStage('implementation', async (context) => {
    if (!context.foundation.success) {
      return { skipped: true, reason: 'Foundation failed' };
    }
    
    const implementation = await this.implementFeature(featureSpec, context.foundation.tests);
    const testResults = await this.runTests();
    
    return { 
      implementation, 
      testResults,
      success: testResults.success 
    };
  });
  
  // Stage 3: Integration (conditional on implementation)
  pipeline.addStage('integration', async (context) => {
    if (!context.implementation.success) {
      return { skipped: true, reason: 'Implementation incomplete' };
    }
    
    const integration = await this.integrateFeature(featureSpec);
    const e2eTests = await this.runE2ETests();
    
    return { 
      integration, 
      e2eTests,
      success: e2eTests.success 
    };
  });
  
  // Stage 4: Documentation (always runs if reached)
  pipeline.addStage('documentation', async (context) => {
    const docs = await this.generateDocumentation(featureSpec, context);
    const examples = await this.generateUsageExamples(featureSpec);
    
    return { docs, examples, success: true };
  });
  
  return await pipeline.execute();
}

class CommandPipeline {
  constructor(name) {
    this.name = name;
    this.stages = [];
    this.context = {};
  }
  
  addStage(name, executor, condition = null) {
    this.stages.push({ name, executor, condition });
  }
  
  async execute() {
    const results = {
      pipeline: this.name,
      stages: {},
      success: true,
      completedStages: 0,
      totalStages: this.stages.length
    };
    
    for (const stage of this.stages) {
      if (stage.condition && !stage.condition(this.context)) {
        results.stages[stage.name] = { skipped: true, reason: 'Condition not met' };
        continue;
      }
      
      try {
        const stageResult = await stage.executor(this.context);
        results.stages[stage.name] = stageResult;
        this.context[stage.name] = stageResult;
        
        if (stageResult.success === false) {
          results.success = false;
          break;
        }
        
        results.completedStages++;
      } catch (error) {
        results.stages[stage.name] = { 
          success: false, 
          error: error.message 
        };
        results.success = false;
        break;
      }
    }
    
    return results;
  }
}
```

### Parallel Execution Patterns

Execute independent tasks simultaneously:

```javascript
async parallelOptimization() {
  const optimizationTasks = [
    this.optimizeImages(),
    this.optimizeCSS(),
    this.optimizeJavaScript(),
    this.optimizeDatabase(),
    this.optimizeAPI()
  ];
  
  // Execute all optimizations in parallel
  const results = await Promise.allSettled(optimizationTasks);
  
  // Process results and provide detailed feedback
  const report = {
    totalTasks: optimizationTasks.length,
    successful: 0,
    failed: 0,
    improvements: [],
    errors: []
  };
  
  results.forEach((result, index) => {
    const taskName = ['images', 'css', 'javascript', 'database', 'api'][index];
    
    if (result.status === 'fulfilled') {
      report.successful++;
      report.improvements.push({
        task: taskName,
        ...result.value
      });
    } else {
      report.failed++;
      report.errors.push({
        task: taskName,
        error: result.reason.message
      });
    }
  });
  
  return report;
}

async optimizeImages() {
  const images = await this.findLargeImages();
  const optimized = [];
  
  for (const image of images) {
    const result = await this.compressImage(image);
    optimized.push(result);
  }
  
  return {
    task: 'image-optimization',
    processed: optimized.length,
    sizeSaved: optimized.reduce((sum, img) => sum + img.sizeSaved, 0),
    files: optimized
  };
}
```

## Adaptive Error Recovery

### Self-Healing Commands

Build commands that can recover from common failures:

```javascript
async resilientBuild(maxRetries = 3) {
  let attempt = 0;
  let lastError = null;
  
  while (attempt < maxRetries) {
    try {
      const result = await this.attemptBuild(attempt);
      if (result.success) {
        return {
          success: true,
          attempts: attempt + 1,
          ...result
        };
      }
      
      // Analyze failure and attempt recovery
      const recovery = await this.analyzeAndRecover(result.error, attempt);
      if (!recovery.canRecover) {
        throw new Error(recovery.reason);
      }
      
      await this.executeRecovery(recovery);
      
    } catch (error) {
      lastError = error;
      attempt++;
      
      if (attempt < maxRetries) {
        console.log(`Build attempt ${attempt} failed, retrying...`);
        await this.waitWithBackoff(attempt);
      }
    }
  }
  
  return {
    success: false,
    attempts: maxRetries,
    finalError: lastError.message,
    suggestion: await this.suggestManualFix(lastError)
  };
}

async analyzeAndRecover(error, attempt) {
  const errorPatterns = {
    'ENOENT.*node_modules': {
      recovery: 'reinstall-dependencies',
      canRecover: true,
      confidence: 0.9
    },
    'TypeScript.*type.*error': {
      recovery: 'fix-types',
      canRecover: attempt < 2,
      confidence: 0.7
    },
    'Module not found': {
      recovery: 'install-missing-dependency',
      canRecover: true,
      confidence: 0.8
    },
    'port.*already in use': {
      recovery: 'kill-port-process',
      canRecover: true,
      confidence: 1.0
    }
  };
  
  for (const [pattern, config] of Object.entries(errorPatterns)) {
    if (new RegExp(pattern, 'i').test(error.message)) {
      return {
        ...config,
        pattern,
        originalError: error.message
      };
    }
  }
  
  return {
    canRecover: false,
    reason: 'Unknown error pattern',
    originalError: error.message
  };
}

async executeRecovery(recovery) {
  switch (recovery.recovery) {
    case 'reinstall-dependencies':
      await this.execCommand('rm -rf node_modules package-lock.json');
      await this.execCommand('npm install');
      break;
      
    case 'fix-types':
      await this.autoFixTypeErrors();
      break;
      
    case 'install-missing-dependency':
      const missing = this.extractMissingDependency(recovery.originalError);
      await this.execCommand(`npm install ${missing}`);
      break;
      
    case 'kill-port-process':
      const port = this.extractPort(recovery.originalError);
      await this.execCommand(`lsof -ti:${port} | xargs kill -9`);
      break;
  }
}
```

### Intelligent Rollback

Implement smart rollback mechanisms:

```javascript
async safeDeploymentWithRollback(environment, config) {
  // Create deployment checkpoint
  const checkpoint = await this.createDeploymentCheckpoint();
  
  try {
    // Perform deployment
    const deployment = await this.deploy(environment, config);
    
    // Verify deployment health
    const healthCheck = await this.performHealthCheck(environment, {
      timeout: 300000, // 5 minutes
      checkInterval: 10000 // 10 seconds
    });
    
    if (!healthCheck.healthy) {
      throw new Error(`Health check failed: ${healthCheck.reason}`);
    }
    
    // Cleanup checkpoint if successful
    await this.cleanupCheckpoint(checkpoint);
    
    return {
      success: true,
      deployment,
      healthCheck
    };
    
  } catch (error) {
    console.log('Deployment failed, initiating rollback...');
    
    const rollback = await this.executeRollback(checkpoint, {
      preserveLogs: true,
      notifyTeam: true
    });
    
    return {
      success: false,
      error: error.message,
      rollback,
      checkpoint: checkpoint.id
    };
  }
}

async createDeploymentCheckpoint() {
  const timestamp = new Date().toISOString();
  const commit = await this.getCurrentCommit();
  const envState = await this.captureEnvironmentState();
  
  const checkpoint = {
    id: `checkpoint-${timestamp}`,
    timestamp,
    commit,
    envState,
    database: await this.createDatabaseBackup(),
    files: await this.createFileBackup()
  };
  
  await this.saveCheckpoint(checkpoint);
  return checkpoint;
}

async executeRollback(checkpoint, options = {}) {
  const rollbackSteps = [
    () => this.rollbackCode(checkpoint.commit),
    () => this.rollbackDatabase(checkpoint.database),
    () => this.rollbackFiles(checkpoint.files),
    () => this.restartServices(),
    () => this.verifyRollback()
  ];
  
  const results = [];
  
  for (const step of rollbackSteps) {
    try {
      const result = await step();
      results.push({ success: true, ...result });
    } catch (error) {
      results.push({ success: false, error: error.message });
      // Continue with remaining steps even if one fails
    }
  }
  
  if (options.notifyTeam) {
    await this.notifyRollback(checkpoint, results);
  }
  
  return {
    checkpointId: checkpoint.id,
    steps: results,
    success: results.every(r => r.success)
  };
}
```

## Performance Optimization Patterns

### Lazy Execution

Defer expensive operations until needed:

```javascript
class LazyCommandExecutor {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
  }
  
  async executeWhenNeeded(command, dependencies = []) {
    const cacheKey = this.getCacheKey(command, dependencies);
    
    // Return cached result if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Return pending promise if already executing
    if (this.pending.has(cacheKey)) {
      return this.pending.get(cacheKey);
    }
    
    // Execute and cache the promise
    const promise = this.executeCommand(command, dependencies);
    this.pending.set(cacheKey, promise);
    
    try {
      const result = await promise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.pending.delete(cacheKey);
    }
  }
  
  async executeCommand(command, dependencies) {
    // Wait for dependencies first
    await Promise.all(dependencies.map(dep => this.executeWhenNeeded(dep)));
    
    // Execute the actual command
    return await command();
  }
  
  getCacheKey(command, dependencies) {
    return `${command.toString()}-${JSON.stringify(dependencies)}`;
  }
}

// Usage example
const executor = new LazyCommandExecutor();

await executor.executeWhenNeeded(
  () => this.runExpensiveTypeCheck(),
  ['install-dependencies', 'generate-types']
);
```

### Incremental Processing

Process large datasets in chunks:

```javascript
async processLargeCodebase(action, options = {}) {
  const { 
    chunkSize = 50, 
    parallel = 4,
    progressCallback = null 
  } = options;
  
  const files = await this.getAllSourceFiles();
  const chunks = this.chunkArray(files, chunkSize);
  
  const results = [];
  let processed = 0;
  
  // Process chunks in parallel batches
  for (let i = 0; i < chunks.length; i += parallel) {
    const batch = chunks.slice(i, i + parallel);
    
    const batchPromises = batch.map(async (chunk) => {
      const chunkResults = [];
      
      for (const file of chunk) {
        const result = await this.processFile(file, action);
        chunkResults.push(result);
        processed++;
        
        if (progressCallback) {
          progressCallback({
            processed,
            total: files.length,
            percent: (processed / files.length) * 100,
            currentFile: file
          });
        }
      }
      
      return chunkResults;
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
  }
  
  return {
    totalFiles: files.length,
    processed: results.length,
    results: results
  };
}

chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

## Command Composition Patterns

### Higher-Order Commands

Create commands that transform other commands:

```javascript
function withRetry(maxRetries = 3) {
  return function(command) {
    return async function(...args) {
      let lastError;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await command.apply(this, args);
        } catch (error) {
          lastError = error;
          if (attempt < maxRetries - 1) {
            await this.waitWithBackoff(attempt);
          }
        }
      }
      
      throw lastError;
    };
  };
}

function withTiming(command) {
  return async function(...args) {
    const start = Date.now();
    try {
      const result = await command.apply(this, args);
      const duration = Date.now() - start;
      
      return {
        ...result,
        timing: { duration, start, end: Date.now() }
      };
    } catch (error) {
      const duration = Date.now() - start;
      error.timing = { duration, start, end: Date.now() };
      throw error;
    }
  };
}

function withCaching(ttl = 300000) { // 5 minutes default
  const cache = new Map();
  
  return function(command) {
    return async function(...args) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
      
      const result = await command.apply(this, args);
      cache.set(key, { result, timestamp: Date.now() });
      
      return result;
    };
  };
}

// Compose enhanced commands
const enhancedBuild = withRetry(3)(
  withTiming(
    withCaching(600000)( // 10 minute cache
      this.build.bind(this)
    )
  )
);
```

### Command Pipelines

Chain commands with data transformation:

```javascript
class CommandPipe {
  constructor(initialValue) {
    this.value = initialValue;
    this.commands = [];
  }
  
  pipe(command, ...args) {
    this.commands.push({ command, args });
    return this;
  }
  
  async execute() {
    let result = this.value;
    
    for (const { command, args } of this.commands) {
      result = await command(result, ...args);
    }
    
    return result;
  }
}

// Usage example
const result = await new CommandPipe('./src')
  .pipe(this.findSourceFiles.bind(this))
  .pipe(this.filterByExtension.bind(this), '.ts', '.tsx')
  .pipe(this.analyzeComplexity.bind(this))
  .pipe(this.generateReport.bind(this))
  .execute();
```

These advanced patterns enable Claude Code to handle complex scenarios with intelligence, resilience, and efficiency. They form the foundation for truly autonomous development workflows that can adapt to changing conditions and recover from failures gracefully.