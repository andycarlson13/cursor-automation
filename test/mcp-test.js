const http = require('http');
const net = require('net');
const { execSync } = require('child_process');

// Simple test to check if MCP servers are running
async function testMCPServers() {
    console.log('Testing MCP servers...\n');
    let allPassed = true;

    // Test Filesystem MCP (stdio-based)
    try {
        execSync('npm run mcp-fs -- --test', { stdio: 'pipe' });
        console.log('✅ Filesystem MCP: OK');
    } catch (error) {
        console.error('❌ Filesystem MCP: Failed');
        allPassed = false;
    }

    // Test Puppeteer MCP
    try {
        const puppeteerResponse = await testTCP(9222);
        console.log('✅ Puppeteer MCP:', puppeteerResponse);
    } catch (error) {
        console.error('❌ Puppeteer MCP:', error.message);
        allPassed = false;
    }

    // Test GitHub MCP
    try {
        if (!process.env.GITHUB_TOKEN && !process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
            console.warn('⚠️ GitHub MCP: Token not found, skipping test');
        } else {
            execSync('npm run mcp-github -- --test', { stdio: 'pipe' });
            console.log('✅ GitHub MCP: OK');
        }
    } catch (error) {
        console.error('❌ GitHub MCP:', error.message);
        allPassed = false;
    }

    // Test WebResearch MCP
    try {
        const webResearchResponse = await testTCP(3000);
        console.log('✅ WebResearch MCP:', webResearchResponse);
    } catch (error) {
        console.error('❌ WebResearch MCP:', error.message);
        allPassed = false;
    }

    // Test Fetch MCP
    try {
        const fetchResponse = await testTCP(3001);
        console.log('✅ Fetch MCP:', fetchResponse);
    } catch (error) {
        console.error('❌ Fetch MCP:', error.message);
        allPassed = false;
    }

    // Test Sequential MCP
    try {
        const sequentialResponse = await testTCP(3002);
        console.log('✅ Sequential MCP:', sequentialResponse);
    } catch (error) {
        console.error('❌ Sequential MCP:', error.message);
        allPassed = false;
    }

    console.log('\nTest Summary:');
    if (allPassed) {
        console.log('✅ All MCP servers are running correctly');
        process.exit(0);
    } else {
        console.error('❌ Some MCP servers failed their tests');
        process.exit(1);
    }
}

// Helper function to test TCP connections
function testTCP(port) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        const timeout = setTimeout(() => {
            client.destroy();
            reject(new Error(`Connection timeout on port ${port}`));
        }, 1000);

        client.connect(port, '127.0.0.1', () => {
            clearTimeout(timeout);
            client.destroy();
            resolve('Connection successful');
        });

        client.on('error', (error) => {
            clearTimeout(timeout);
            reject(new Error(`Connection failed on port ${port}`));
        });
    });
}

// Run tests
testMCPServers().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
}); 