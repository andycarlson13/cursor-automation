# Cursor Automation with MCP Agents

This repository provides tools for automating Cursor IDE with Model Context Protocol (MCP) agents, enabling powerful AI-assisted coding workflows.

## 🎮 MCP Agents Showcase

Check out our [MCP Agents Showcase](examples/mcp-showcase/README.md) to see how different MCP agents work together to analyze, improve, and generate code. The showcase uses a Flappy Bird game implementation to demonstrate:

- Code analysis and optimization
- Automated testing and validation
- API integration and testing
- Game logic flow analysis
- Research-driven improvements

Each agent's capabilities and results are documented with real examples from the test runs.

## What This Does

Cursor Automation connects your Cursor AI assistant with your local system and external services through Model Context Protocol (MCP) agents. This enables Claude and other AI models to:

- Access your local files and project code
- Browse the web and search for information
- Interact with GitHub repositories
- Execute complex reasoning tasks
- Make network requests
- Automate browser interactions

Instead of copying and pasting code snippets, this toolset allows AI in Cursor to directly interact with your development environment.

## Prerequisites

Before installing, ensure you have the following:

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/get-npm) (v6 or later)
- [Cursor IDE](https://cursor.sh/)
- [Git](https://git-scm.com/downloads)

For macOS users, the easiest way to install these is via Homebrew:

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and npm
brew install node

# Install Git if not already installed
brew install git
```

## Installation

1. Clone this repository: `git clone https://github.com/yourusername/cursor-automation.git`
2. Navigate to the project directory: `cd cursor-automation`
3. Run the setup script: `npm run setup`

The setup script will:

- Install all dependencies
- Guide you through configuring your workspace directory
- Help you set up a GitHub Personal Access Token
- Initialize the MCP configuration

Alternatively, you can follow these manual steps:

1. Install dependencies: `npm install`
2. Configure your workspace directory: `npm run configure-workspace`
3. Set up GitHub Personal Access Token: `npm run setup-github`
4. Initialize MCP configuration: `npm run mcp-init`

### macOS Case Sensitivity Note

macOS has a case-insensitive but case-preserving filesystem. This means that while `/users/username/desktop/work` and `/Users/username/Desktop/Work` refer to the same directory, the MCP server may have issues if the case doesn't match exactly what's on disk.

For best results, always use the exact case of your directories. Our configuration script attempts to detect both capitalized and lowercase variants of common workspace directories.

## Usage

### Starting MCP Servers

The most reliable way to initialize all MCP servers is:

```bash
npm run mcp-init
# Or with force restart option:
npm run mcp-init-force
```

Alternatively, you can use our custom script to start all servers with detailed logging:

```bash
npm run start-all-mcp
```

### Testing MCP Functionality

After starting the servers, test if all MCP tools are working correctly:

```bash
npm run test-mcp
```

### Stopping MCP Servers

When you're done, stop all running MCP servers:

```bash
npm run stop-all-mcp
```

## Available MCP Servers

| Server              | Description                            | Configuration                         |
| ------------------- | -------------------------------------- | ------------------------------------- |
| Filesystem          | Provides AI access to your local files | Configure workspace directory path    |
| Puppeteer           | Enables browser automation             | Uses headless Chrome                  |
| GitHub              | Integrates with GitHub repositories    | Requires GitHub Personal Access Token |
| WebResearch         | Provides web search capabilities       | No additional configuration needed    |
| Fetch               | Enables making network requests        | No additional configuration needed    |
| Sequential Thinking | Enables complex multi-step reasoning   | No additional configuration needed    |

## MCP Server Details

### Filesystem MCP

The Filesystem MCP provides secure access to your local files and project code. It enables:

- Reading and writing files in allowed directories
- Directory listing and file search
- Code analysis and modification
- Project structure understanding

Configuration:

```bash
npm run mcp-fs
# or
npx -y @modelcontextprotocol/server-filesystem /your/workspace/path
```

### Puppeteer MCP

The Puppeteer MCP enables browser automation and UI analysis. Features include:

- Automated UI testing
- Visual regression testing
- Accessibility analysis
- Performance monitoring
- Screenshot capture

Configuration:

```bash
npm run mcp-puppeteer
# or
npx -y @modelcontextprotocol/server-puppeteer
```

### GitHub MCP

The GitHub MCP provides integration with GitHub repositories. Capabilities include:

- Repository management
- Code review automation
- Branch protection
- Issue and PR management
- Commit analysis

Configuration:

```bash
# First set up your token
npm run setup-github

# Then start the server
npm run mcp-github
# or
npx -y @modelcontextprotocol/server-github
```

### Fetch MCP

The Fetch MCP enables network requests and API interactions. Features include:

- HTTP/HTTPS requests
- API testing
- Response analysis
- Performance monitoring
- Error handling

Configuration:

```bash
npm run mcp-fetch
# or
npx -y mcprouter
```

### Sequential MCP

The Sequential MCP enables complex multi-step reasoning tasks. It provides:

- Task orchestration
- Dependency management
- Step-by-step analysis
- Error recovery
- State management

Configuration:

```bash
npm run mcp-sequential
# or
npx -y mcprouter
```

### WebResearch MCP

The WebResearch MCP provides web search and research capabilities. Features include:

- Web search integration
- Content analysis
- Trend monitoring
- Competitive research
- Documentation search

Configuration:

```bash
npm run mcp-webresearch
# or
npx -y @modelcontextprotocol/server-webresearch
```

## In-Depth Configuration

### Workspace Directory Configuration

The Filesystem MCP server needs to know which directories to access. You can configure this using our interactive script:

```bash
npm run configure-workspace
```

This script will:

1. Look for common workspace directories on your system
2. Let you select from existing directories or specify a custom path
3. Update your shell profile with the CURSOR_WORKSPACE_DIR environment variable
4. Update package.json and other configuration files automatically

You can also manually configure this in several ways:

1. **Environment Variable**:

   ```bash
   export CURSOR_WORKSPACE_DIR="/path/to/your/workspace"
   ```

2. **Update Package.json**:
   Edit the `mcp-fs` script in `package.json`:

   ```json
   "mcp-fs": "npx -y @modelcontextprotocol/server-filesystem /your/custom/path"
   ```

3. **Edit start-all-mcp.js**:
   Modify the `workspaceDir` variable in `scripts/start-all-mcp.js`.

#### macOS Case Sensitivity Note

macOS has a case-insensitive but case-preserving filesystem. This means that while `/users/username/desktop/work` and `/Users/username/Desktop/Work` refer to the same directory, the MCP server may have issues if the case doesn't match exactly what's on disk.

For best results, always use the exact case of your directories. Our configuration script attempts to detect both capitalized and lowercase variants of common workspace directories.

### GitHub Token Configuration

The GitHub token must have appropriate permissions to interact with repositories. When running `npm run setup-github`, the token is:

1. Saved to your shell profile (~/.zshrc, ~/.bashrc, or ~/.profile)
2. Added to the MCP configuration at ~/.cursor/mcp.json
3. Saved to a local .env file for compatibility

If you need to update your token later, simply run:

```bash
npm run setup-github
```

### MCP Configuration File

The MCP configuration is stored in `~/.cursor/mcp.json`. This file is automatically configured by the setup scripts, but you can manually edit it if needed.

## Monitoring and Troubleshooting

### Logs

MCP server logs are stored in the `mcp-logs` directory:

```bash
tail -f mcp-logs/Filesystem-out.log  # Monitor filesystem server output
tail -f mcp-logs/GitHub-err.log      # Check GitHub server errors
```

### Verifying Running Servers

If the test script doesn't detect running servers:

1. Check process status: `ps aux | grep server`
2. Examine log files in `mcp-logs` directory
3. Restart servers with: `npm run mcp-init-force`

### Common Issues

#### GITHUB_PERSONAL_ACCESS_TOKEN Not Found

If you see `GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set`:

1. Run `npm run setup-github` to set up the token
2. Restart your terminal or run `source ~/.zshrc` (or equivalent)

#### Wrong Workspace Path

If AI can't access your files:

1. Run `npm run configure-workspace` to reconfigure your workspace
2. Check that the path exists and is accessible
3. Restart the Filesystem MCP server

#### Directory Capitalization Issues

If you see messages like "Allowed directories: [ '/users/username/desktop/work' ]" but your actual directory is "/Users/username/Desktop/Work":

1. Make sure to use the correct capitalization in all configurations
2. Run `npm run configure-workspace` and select the correctly capitalized directory
3. Verify the capitalization in `~/.cursor/mcp.json`

## Technical Details

### How It Works

This toolset configures and manages Model Context Protocol (MCP) servers, which allow AI models to access various capabilities:

1. **MCP Servers**: Each server provides a specific capability (filesystem, web, GitHub, etc.)
2. **Configuration**: Servers are configured via the ~/.cursor/mcp.json file
3. **Environment**: Servers use environment variables for authentication and settings
4. **Scripts**: Helper scripts manage server lifecycle and configuration

### Security Considerations

- The filesystem server only provides access to the configured workspace directory
- GitHub tokens should be created with the minimum required permissions
- Environment variables are used to avoid storing credentials in the repository
- All network access can be monitored through the logs

## Available Scripts

- `npm run mcp-init` - Initialize MCP configuration
- `npm run mcp-init-force` - Reinitialize MCP configuration (force restart)
- `npm run test-mcp` - Test all MCP tools
- `npm run demo-mcp` - Demonstrate MCP capabilities
- `npm run start-all-mcp` - Start all MCP servers with enhanced logging
- `npm run stop-all-mcp` - Stop all MCP servers and backup logs
- `npm run setup-github` - Configure GitHub token globally
- `npm run configure-workspace` - Interactive workspace directory configuration
- `npm run mcp-fs` - Start just the filesystem server
- `npm run mcp-puppeteer` - Start just the Puppeteer server
- `npm run mcp-github` - Start just the GitHub server
- `npm run mcp-webresearch` - Start just the web research server
- `npm run mcp-fetch` - Start just the fetch server
- `npm run mcp-sequential` - Start just the sequential thinking server

## License

MIT

## Contributing

Contributions are welcome! Please submit issues and pull requests via GitHub.

## Privacy Notice

When using this tool and sharing code or logs:

1. The `.gitignore` file is configured to prevent committing sensitive files like `.env` that may contain tokens
2. All scripts use environment variables rather than hardcoded credentials
3. When reporting issues, please sanitize logs to remove any personal information
4. The setup scripts are designed to use your home directory and not expose absolute paths in committed code

If you fork or clone this repository, it's recommended to run `git clean -fdx` before committing to ensure no personal data is included accidentally.
