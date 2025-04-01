# Cursor Automation - Full AI Integration Toolkit

A comprehensive toolkit for maximizing AI automation capabilities in Cursor editor using Model Context Protocol (MCP) tools.

## Features

- **Optimized MCP Configuration**: Enhanced settings for maximum automation capability
- **Filesystem MCP**: Access files and directories in your workspace
- **Puppeteer MCP**: Advanced browser automation and UI analysis
- **GitHub MCP**: Seamless GitHub repository integration
- **WebResearch MCP**: Powerful web search and content retrieval
- **Fetch MCP**: Enhanced API request capabilities
- **Sequential Thinking MCP**: Process complex, multi-step tasks

## Quick Start - Automatic Mode

```bash
# Install dependencies
npm install

# Set up the fully automated environment (one command setup)
npm run full-automation

# Install Cursor startup hook (runs automatically when Cursor starts)
npm run install-startup-hook
```

With this setup, the AI automation environment will start automatically whenever you launch Cursor. It will:

1. Detect GitHub repositories and current branches
2. Start all necessary MCP servers
3. Configure GitHub integration with existing tokens
4. Enable full AI automation capabilities

## Using AI Automation

To leverage AI automation for code changes:

1. Make changes using Claude in Cursor
2. Run the AI agent to commit and push changes:

```bash
npm run ai-agent
```

The AI agent will:
- Detect Git repositories and branches
- Take screenshots of UI changes if requested
- Commit changes with AI-generated or custom commit messages
- Push to the current branch

## Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/Blackhawk-Intelligence-LLC/cursor-automation.git
cd cursor-automation
npm install
```

## Optimized MCP Configuration

For maximum AI automation capabilities, use the optimized configuration:

```bash
npm run mcp-optimize
```

This will:
1. Create an optimized MCP configuration in `~/.cursor/mcp.json`
2. Configure all MCP servers with enhanced settings
3. Set up workspace paths automatically

To force restart all servers with the optimized configuration:

```bash
npm run mcp-optimize-force
```

## Usage

### Initialize MCP Servers

To initialize all MCP servers for use with Cursor:

```bash
npm run mcp-init
```

This will:

1. Update the MCP configuration in `~/.cursor/mcp.json`
2. Start all MCP servers in the background
3. Make the servers available to Cursor

If you want to force restart all servers:

```bash
npm run mcp-init-force
```

### Starting Individual MCP Servers

You can start each MCP server individually:

```bash
npm run mcp-fs             # Filesystem operations
npm run mcp-puppeteer      # Browser automation
npm run mcp-github         # GitHub operations
npm run mcp-webresearch    # Web search
npm run mcp-fetch          # API requests
npm run mcp-sequential     # Sequential thinking
```

### Testing MCP Servers

To verify all MCP servers are running correctly:

```bash
npm run test-mcp
```

### Demo Capabilities

To see a demonstration of MCP capabilities:

```bash
npm run demo-mcp
```

## Automatic Startup Integration

With the automatic startup feature, Cursor will initialize the full AI automation environment every time it launches:

1. **MCP Servers Auto-Start**: All MCP servers start automatically
2. **GitHub Token Detection**: Existing tokens are detected and used
3. **Repository Awareness**: Current Git repository and branch are identified
4. **Prompt for Missing Tokens**: If GitHub token is missing, you'll be prompted

This eliminates the need to manually start servers or configure tools before using AI automation.

### Setting Up Automatic Startup

```bash
# Install the Cursor startup hook
npm run install-startup-hook
```

To verify it's working:

```bash
npm run cursor-startup
```

## AI Automation Agent

The AI automation agent handles Git operations for AI-generated changes:

```bash
npm run ai-agent
```

Features:

- **UI Analysis**: Takes screenshots of UI changes for visual review
- **Intelligent Commits**: Suggests meaningful commit messages
- **Branch Awareness**: Always commits to the current branch
- **GitHub Integration**: Pushes changes directly to GitHub

When you make AI-driven changes to your codebase, the agent streamlines the process of committing and pushing those changes.

## Available MCP Tools for Full Automation

### Filesystem MCP

Access files and directories in your workspace. Enhanced for:

- Reading and writing files with high performance
- Recursive directory operations
- Advanced file metadata handling
- Efficient path manipulation

### Puppeteer MCP

Browser automation and UI analysis. Optimized for:

- Headless browsing with maximum performance
- Automated testing and form submission
- High-quality screenshot generation
- JavaScript evaluation in browser context
- Advanced web page interaction

### GitHub MCP

GitHub repository integration. Improved for:

- Repository search and management
- PR and issue workflow automation
- Code search and analysis
- Commit management
- Seamless repository operations

### WebResearch MCP

Web search and content retrieval. Enhanced for:

- Intelligent web searching
- Content extraction and analysis
- Multi-page navigation
- Screenshot capabilities
- Research synthesis

### Fetch MCP

Enhanced API request capabilities. Optimized for:

- RESTful API interaction
- GraphQL query support
- Response processing
- Authentication handling
- Rate-limit management

### Sequential Thinking MCP

Process complex, multi-step tasks. Enhanced for:

- Breaking down complex problems into manageable steps
- Chain-of-thought reasoning with enhanced context
- Multi-stage workflow automation
- Decision tree navigation
- Recursive problem-solving

## Full Automation Configuration

The optimized MCP configuration uses:

- Expanded workspace paths for comprehensive file access
- Enhanced Puppeteer settings with increased timeouts
- GitHub token integration for seamless authentication
- Improved performance settings for all MCP servers

## Troubleshooting

If MCP servers aren't running correctly:

1. Check server status:

   ```bash
   ps aux | grep -E 'server-filesystem|server-puppeteer|server-github|mcp-webresearch|mcprouter'
   ```

2. Force optimize and restart all servers:

   ```bash
   npm run mcp-optimize-force
   npm run mcp-init-force
   ```

3. Start specific servers manually:
   ```bash
   npx -y @modelcontextprotocol/server-filesystem
   ```

4. Check logs for specific errors:
   ```bash
   # For filesystem MCP server
   tail -f ~/.cursor/logs/filesystem-mcp.log
   ```

## License

MIT