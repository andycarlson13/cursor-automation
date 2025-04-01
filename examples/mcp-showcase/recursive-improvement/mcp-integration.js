const { spawn } = require('child_process');
const path = require('path');

class MCPIntegration {
    constructor() {
        this.baseDir = path.join(__dirname, '..', '..', '..');
    }

    async webResearch(query) {
        return this.runMCP('webresearch', {
            search_term: query,
            explanation: 'Researching AI improvements'
        });
    }

    async puppeteerTest(url) {
        return this.runMCP('puppeteer', {
            url: url,
            takeScreenshot: true
        });
    }

    async githubOperation(operation, data) {
        return this.runMCP('github', {
            operation: operation,
            data: data
        });
    }

    async filesystemOperation(operation, path, content) {
        return this.runMCP('filesystem', {
            operation: operation,
            path: path,
            content: content
        });
    }

    async sequentialAnalysis(data) {
        return this.runMCP('sequential', {
            data: data,
            type: 'analysis'
        });
    }

    async fetchOperation(endpoint, method, data) {
        return this.runMCP('fetch', {
            endpoint: endpoint,
            method: method,
            data: data
        });
    }

    async runMCP(type, params) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(this.baseDir, 'mcp', type, 'index.js');
            const process = spawn('node', [scriptPath], {
                cwd: this.baseDir,
                env: { ...process.env, MCP_PARAMS: JSON.stringify(params) }
            });

            let output = '';
            let error = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                error += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        resolve(JSON.parse(output));
                    } catch (e) {
                        resolve(output);
                    }
                } else {
                    reject(new Error(`MCP ${type} failed: ${error}`));
                }
            });
        });
    }

    // Helper method to format results for the improvement process
    formatResults(mcpResults) {
        return {
            timestamp: new Date().toISOString(),
            mcpType: mcpResults.type,
            data: mcpResults.data,
            metrics: mcpResults.metrics || {}
        };
    }
}

module.exports = new MCPIntegration(); 