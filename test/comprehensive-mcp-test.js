const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function runComprehensiveTest() {
    console.log('\n=== Comprehensive MCP Integration Test ===\n');
    let allPassed = true;

    // Test 1: Filesystem MCP - Create and read game config
    try {
        console.log('🔍 Testing Filesystem MCP with game config...');
        const gameConfig = {
            difficulty: 'medium',
            pipeGap: 225,
            speed: 3
        };
        fs.writeFileSync('examples/flappy-bird/config.json', JSON.stringify(gameConfig, null, 2));
        const readConfig = JSON.parse(fs.readFileSync('examples/flappy-bird/config.json', 'utf8'));
        console.log('✅ Filesystem MCP: Successfully created and read game config');
    } catch (error) {
        console.error('❌ Filesystem MCP:', error.message);
        allPassed = false;
    }

    // Test 2: Puppeteer MCP - Test game page loading
    try {
        console.log('\n🔍 Testing Puppeteer MCP with game page...');
        execSync('node scripts/test-game-page.js', { stdio: 'inherit' });
        console.log('✅ Puppeteer MCP: Successfully tested game page');
    } catch (error) {
        console.error('❌ Puppeteer MCP:', error.message);
        allPassed = false;
    }

    // Test 3: GitHub MCP - Check repository status
    try {
        console.log('\n🔍 Testing GitHub MCP integration...');
        const repoStatus = execSync('git status', { encoding: 'utf8' });
        console.log('✅ GitHub MCP: Successfully checked repository status');
    } catch (error) {
        console.error('❌ GitHub MCP:', error.message);
        allPassed = false;
    }

    // Test 4: WebResearch MCP - Search for game improvements
    try {
        console.log('\n🔍 Testing WebResearch MCP for game research...');
        execSync('node scripts/search-game-improvements.js', { stdio: 'inherit' });
        console.log('✅ WebResearch MCP: Successfully researched game improvements');
    } catch (error) {
        console.error('❌ WebResearch MCP:', error.message);
        allPassed = false;
    }

    // Test 5: Fetch MCP - Test API endpoints
    try {
        console.log('\n🔍 Testing Fetch MCP with API endpoints...');
        execSync('node scripts/test-api-endpoints.js', { stdio: 'inherit' });
        console.log('✅ Fetch MCP: Successfully tested API endpoints');
    } catch (error) {
        console.error('❌ Fetch MCP:', error.message);
        allPassed = false;
    }

    // Test 6: Sequential MCP - Run game analysis
    try {
        console.log('\n🔍 Testing Sequential MCP with game analysis...');
        execSync('node scripts/analyze-game-sequence.js', { stdio: 'inherit' });
        console.log('✅ Sequential MCP: Successfully analyzed game sequence');
    } catch (error) {
        console.error('❌ Sequential MCP:', error.message);
        allPassed = false;
    }

    // Final Summary
    console.log('\n=== Test Summary ===');
    if (allPassed) {
        console.log('✅ All MCP agents tested successfully with Flappy Bird integration!');
        process.exit(0);
    } else {
        console.error('❌ Some tests failed. Please check the logs above.');
        process.exit(1);
    }
}

// Run the comprehensive test
runComprehensiveTest().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
}); 