# Chapter 4: MCP Servers on WSL - The Modern Development Stack

> "The future of development is not choosing between Linux and Windows—it's having both, seamlessly."
>
> — Clide

## Why WSL + Docker for MCP Servers?

The Windows Subsystem for Linux (WSL) combined with Docker Desktop represents the most powerful development environment for MCP (Model Context Protocol) servers on Windows machines. This architecture provides the Linux-native toolchain that MCP servers expect while maintaining full integration with your Windows workflow.

This chapter will guide you through setting up a production-grade MCP development environment that delivers:

- **Near-native Linux performance** for MCP server operations
- **Seamless connectivity** between Windows applications and containerized services
- **Production parity** with your deployment environment
- **Enhanced security** through containerization and firewall integration

## The Architecture: Understanding the Stack

## Prerequisites and System Requirements

### Minimum System Requirements

- **OS**: Windows 11 (Build 22H2 or newer)
- **Memory**: 16GB RAM (32GB recommended for heavy workloads)
- **Storage**: 20GB free space for WSL2 and containers
- **CPU**: 4+ cores recommended for container workloads

### Required Software Stack

**1. WSL2 (Version 2.0.9 or newer)**
```bash
# Check your WSL version
wsl --version

# Update WSL to latest version
wsl --update
```

**2. Docker Desktop (Version 4.26 or newer)**
- Download from [docker.com](https://www.docker.com/products/docker-desktop)
- Enable WSL2 backend during installation
- Required for mirrored networking mode support

**3. Ubuntu WSL Distribution**
```bash
# Install Ubuntu (if not already installed)
wsl --install Ubuntu

# Set Ubuntu as default distribution
wsl --set-default Ubuntu
```

## The Golden Path Setup

### Step 1: Enable Mirrored Networking

Mirrored networking eliminates the traditional localhost connectivity issues between Windows and WSL2.

**Create or edit the WSL configuration file:**

```bash
# On Windows, create/edit: %USERPROFILE%\.wslconfig
notepad %USERPROFILE%\.wslconfig
```

**Add the following configuration:**

```ini
[wsl2]
networkingMode=mirrored
memory=8GB
processors=4
```

**Restart WSL to apply changes:**

```bash
# In PowerShell/Command Prompt
wsl --shutdown
# Then start your WSL distribution normally
```

### Step 2: File System Organization

**Critical Performance Rule**: All project code MUST reside in the WSL2 native filesystem for optimal performance.

```bash
# Inside WSL2 Ubuntu
mkdir -p ~/projects/mcp-servers
cd ~/projects/mcp-servers

# Clone your MCP server repository here
git clone https://github.com/your-org/your-mcp-server.git
cd your-mcp-server
```

**Access from Windows**: Use `\\wsl.localhost\Ubuntu\home\yourusername\projects` to access these files from Windows Explorer or other Windows applications.

### Step 3: Understanding MCP Communication Modes

MCP servers operate in two distinct modes, which determines their configuration:

#### Mode 1: Stdio Communication (Most Common)
These servers communicate via stdin/stdout - **no network ports required**:

```bash
# These use stdio communication - no port mapping needed
claude mcp add memory -s user -- docker run -i --rm mcp/memory
claude mcp add sequential-thinking -s user -- docker run -i --rm mcp/sequentialthinking  
claude mcp add puppeteer -s user -- docker run -i --rm mcp/puppeteer
```

**How it works:**
- Claude CLI spawns the container as a child process
- Communication happens via stdin/stdout pipes
- Container is ephemeral (--rm flag) - created per request
- **No network configuration needed**

#### Mode 2: Network Service Mode (Advanced)
Some MCP servers run as persistent network services requiring port mapping:

```yaml
# docker-compose.yml (only for service-mode MCP servers)
version: '3.8'

services:
  # Example: A hypothetical persistent MCP service
  mcp-database:
    image: your-org/mcp-database-server
    container_name: mcp-database
    ports:
      - "127.0.0.1:8001:8001"  # Bind to localhost only
    volumes:
      - mcp-data:/app/data
    restart: unless-stopped
    environment:
      - MCP_SERVER_PORT=8001
    
volumes:
  mcp-data:
    driver: local
```

**When to use service mode:**
- Persistent state management
- Web-based UIs for MCP tools
- High-performance scenarios requiring persistent connections

### Step 4: Dev Container Configuration

Create a `devcontainer.json` to standardize the development environment:

```json
{
  "name": "MCP Server Development",
  "dockerComposeFile": "docker-compose.yml",
  "service": "memory-server",
  "workspaceFolder": "/workspace",
  
  "forwardPorts": [8001, 8002, 8003],
  "portsAttributes": {
    "8001": {
      "label": "Memory Server",
      "onAutoForward": "notify"
    },
    "8002": {
      "label": "Sequential Thinking",
      "onAutoForward": "notify"
    },
    "8003": {
      "label": "Puppeteer",
      "onAutoForward": "notify"
    }
  },
  
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-vscode-remote.remote-containers",
        "ms-vscode-remote.remote-wsl",
        "ms-python.python",
        "ms-toolsai.jupyter",
        "ms-vscode.docker"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "terminal.integrated.defaultProfile.linux": "bash"
      }
    }
  },
  
  "postCreateCommand": "pip install -r requirements.txt && echo 'MCP Development Environment Ready!'",
  
  "mounts": [
    "source=/var/run/docker.sock,target=/var/run/docker.sock,type=bind"
  ]
}
```

## MCP Server Integration Patterns

### Memory Server Configuration

The memory server provides persistent storage across Claude Code sessions using **stdio communication**:

```bash
# Install and configure memory server (stdio mode)
claude mcp add memory -s user -- docker run -i --rm mcp/memory

# Test the configuration
claude --mcp-debug
# In Claude session: "Remember that I prefer TypeScript for new projects"
```

**Resulting Configuration in `.claude.json`:**

```json
{
  "mcpServers": {
    "memory": {
      "type": "stdio",
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/memory"]
    }
  }
}
```

**Key Points:**
- **No port mapping** - communication via stdin/stdout
- **Ephemeral containers** - created per request, destroyed after use
- **No network configuration** needed

### Sequential Thinking Server

Enables step-by-step problem-solving capabilities via stdio:

```bash
# Install sequential thinking server (stdio mode)
claude mcp add sequential-thinking -s user -- docker run -i --rm mcp/sequentialthinking
```

**Usage Examples:**
```
"Help me think through this complex database migration step by step"
"Let's work through this authentication flow with branching logic"
"Walk me through the pros and cons of different caching strategies"
```

### Puppeteer Web Automation

Provides browser automation capabilities using stdio communication:

```bash
# Install Puppeteer server (stdio mode)
claude mcp add puppeteer -s user -- docker run -i --rm mcp/puppeteer
```

**Important Networking Note for Puppeteer:**
When Puppeteer needs to access local development servers, use `host.docker.internal`:

```bash
# If you have a dev server at localhost:3000, Puppeteer should navigate to:
# http://host.docker.internal:3000
```

**Configuration in `.claude.json`:**

```json
{
  "mcpServers": {
    "puppeteer": {
      "type": "stdio", 
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/puppeteer"]
    }
  }
}
```

## Security Best Practices

### Stdio vs Network Mode Security

**Stdio Mode Security (Default - Most Secure)**
The standard MCP servers (memory, sequential-thinking, puppeteer) use stdio communication, which provides excellent security:

- **No network exposure** - containers have no listening ports
- **Process isolation** - each request spawns a fresh container
- **Ephemeral execution** - containers are destroyed after each use
- **No attack surface** - no persistent network services

**Network Service Mode Security (When Required)**
For the rare cases where MCP servers run as network services:

```yaml
# Security-hardened network service configuration
services:
  mcp-network-service:
    ports:
      - "127.0.0.1:8001:8001"  # ✅ Localhost only
      # - "8001:8001"          # ❌ Network exposed
    security_opt:
      - no-new-privileges:true
      - apparmor:docker-default
    cap_drop:
      - ALL
    cap_add:
      - CHOWN  # Only if needed
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
```

### Container-to-Host Communication Security

When MCP servers need to access services on your WSL host.

**Secure Pattern:**
```bash
# MCP server accessing local dev server
# Inside container: connect to host.docker.internal:3000
# Host service should bind to 127.0.0.1:3000 (not 0.0.0.0)
```

**WSL2 Firewall Integration:**
- Windows 11 22H2+ automatically applies firewall rules to WSL traffic
- Enterprise policies (Intune/Defender) are enforced
- Mirrored networking maintains security consistency

### Secret Management

**Environment Variables:**
```bash
# Create .env file (add to .gitignore!)
echo "OPENAI_API_KEY=your_key_here" > .env
echo "DATABASE_URL=your_db_url" >> .env

# Reference in docker-compose.yml
env_file:
  - .env
```

**Docker Secrets (Production-ready):**
```yaml
# docker-compose.yml
services:
  mcp-server:
    secrets:
      - openai_key
      - db_password

secrets:
  openai_key:
    file: ./secrets/openai_key.txt
  db_password:
    file: ./secrets/db_password.txt
```

### Volume Mount Security

**Minimal, Specific Mounts:**
```yaml
volumes:
  # ✅ Secure - specific directories only
  - ./src:/app/src:ro
  - ./config:/app/config:ro
  - mcp-data:/app/data
  
  # ❌ Insecure - overly broad access
  # - .:/app
  # - /home/user:/root
```

## Performance Optimization

### WSL2 Resource Tuning

**Optimal `.wslconfig` for MCP Development:**

```ini
[wsl2]
# Networking
networkingMode=mirrored
dnsTunneling=true
firewall=true

# Performance
memory=12GB
processors=6
swap=4GB

# I/O Optimization
pageReporting=true
kernelCommandLine=cgroup_no_v1=all systemd.unified_cgroup_hierarchy=1
```

### Docker Performance Tuning

**BuildKit Optimization:**
```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

**Container Resource Limits:**
```yaml
services:
  mcp-server:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```


## Troubleshooting Common Issues

### Connectivity Problems

**Issue**: Cannot connect to MCP server from Windows applications

**Solutions**:
1. **Check Mirrored Networking**:
   ```bash
   # Verify mirrored mode is active
   wsl --status
   # Should show: "Default Version: 2" and networking mode
   ```

2. **Fallback to NAT Mode**:
   ```bash
   # If mirrored networking fails, use host.docker.internal
   # Connect to: host.docker.internal:8001 instead of localhost:8001
   ```

3. **Firewall Configuration**:
   ```bash
   # Check Windows Firewall rules
   netsh advfirewall firewall show rule name="Docker Desktop Backend"
   ```

### Performance Issues

**Issue**: Slow file operations or container startup

**Solutions**:
1. **Verify File Location**:
   ```bash
   # Ensure code is in WSL2 filesystem
   pwd  # Should show /home/username/... not /mnt/c/...
   ```

2. **Check Resource Allocation**:
   ```bash
   # Monitor WSL2 resource usage
   wsl --list --verbose
   cat /proc/meminfo | grep MemAvailable
   ```

3. **Docker Disk Usage**:
   ```bash
   # Clean up Docker resources
   docker system prune -a
   docker volume prune
   ```

### Container Health Issues

**Issue**: MCP servers fail to start or respond

**Solutions**:
1. **Check Container Logs**:
   ```bash
   docker logs mcp-memory
   docker logs mcp-sequential
   docker logs mcp-puppeteer
   ```

2. **Verify Port Conflicts**:
   ```bash
   # Check if ports are already in use
   netstat -an | grep :8001
   ss -tulpn | grep :8001
   ```

3. **Test Container Health**:
   ```bash
   # Test individual containers
   docker exec -it mcp-memory /bin/bash
   curl http://localhost:8001/health
   ```


## Integration with Claude Code Workflows

### Custom Commands for MCP Management

Create `.claude/commands/start-mcp-stack.md`:

```markdown
Start the complete MCP server development stack.

Steps:
1. Navigate to the MCP project directory
2. Start all services with docker-compose up -d
3. Wait for health checks to pass
4. Verify connectivity to all three servers:
   - Memory server on port 8001
   - Sequential thinking on port 8002  
   - Puppeteer on port 8003
5. Display service status and connection URLs
6. Return "MCP_STACK_READY" when all services are healthy

Use docker-compose for service management and include health check validation.
```

### Monitoring and Maintenance Commands

Create `.claude/commands/mcp-health-check.md`:

```markdown
Perform comprehensive health check of MCP server stack.

Check:
1. Docker containers are running (docker ps)
2. Port connectivity for each service
3. Service health endpoints respond correctly
4. Resource usage (memory, CPU, disk)
5. Recent error logs from containers
6. Network connectivity between services

Report status and any issues found. Return "HEALTHY" or "ISSUES_FOUND: [details]"
```

## Advanced Patterns

### Multi-Environment Configuration

**Development vs Production Parity:**

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  memory-server:
    image: mcp/memory
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    volumes:
      - ./dev-data:/app/data
    ports:
      - "127.0.0.1:8001:8001"

# docker-compose.prod.yml  
version: '3.8'
services:
  memory-server:
    image: mcp/memory:v1.2.0
    environment:
      - LOG_LEVEL=info
    volumes:
      - memory-prod-data:/app/data
    # No exposed ports - internal network only
```

**Usage**:
```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### Next Steps

1. **Set up your environment** using the Golden Path configuration
2. **Create your first MCP server** following the container patterns
3. **Integrate with Claude Code** using custom commands
4. **Scale to production** using the multi-environment patterns

With this foundation in place, you're ready to build sophisticated MCP-enabled applications that leverage the full power of autonomous development workflows.