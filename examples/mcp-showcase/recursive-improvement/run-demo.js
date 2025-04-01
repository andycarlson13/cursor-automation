const AIImprovement = require('./improve-ai');
const mcpIntegration = require('./mcp-integration');

async function runDemo() {
    console.log('Starting MCP Recursive Improvement Demo');
    console.log('======================================');

    try {
        // Initialize the improvement process
        const improver = new AIImprovement();
        
        // Hook up MCP integration
        improver.analyzeCurrentState = async () => {
            console.log('\nPhase 1: Analysis');
            console.log('----------------');
            
            // Use WebResearch MCP to gather improvement strategies
            const research = await mcpIntegration.webResearch(
                'latest game AI optimization techniques neural networks'
            );
            
            // Use Sequential MCP to analyze current performance
            const performance = await mcpIntegration.sequentialAnalysis({
                type: 'performance',
                metrics: ['score', 'survival_time', 'decision_speed']
            });
            
            return mcpIntegration.formatResults({
                type: 'analysis',
                data: {
                    research: research,
                    performance: performance
                }
            });
        };

        improver.createImprovementPlan = async (analysis) => {
            console.log('\nPhase 2: Planning');
            console.log('----------------');
            
            // Use Sequential MCP to create improvement steps
            const plan = await mcpIntegration.sequentialAnalysis({
                type: 'planning',
                analysis: analysis
            });
            
            return mcpIntegration.formatResults({
                type: 'plan',
                data: plan
            });
        };

        improver.implementChanges = async (plan) => {
            console.log('\nPhase 3: Implementation');
            console.log('----------------------');
            
            // Use Filesystem MCP to make code changes
            const codeChanges = await mcpIntegration.filesystemOperation(
                'update',
                'src/ai/brain.js',
                plan.improvements
            );
            
            // Use GitHub MCP to commit changes
            const commit = await mcpIntegration.githubOperation(
                'commit',
                {
                    message: `AI Improvement Iteration ${improver.iterationCount + 1}`,
                    files: ['src/ai/brain.js']
                }
            );
            
            return mcpIntegration.formatResults({
                type: 'implementation',
                data: {
                    codeChanges: codeChanges,
                    commit: commit
                }
            });
        };

        improver.validateChanges = async (implementation) => {
            console.log('\nPhase 4: Validation');
            console.log('------------------');
            
            // Use Puppeteer MCP to run game tests
            const gameTests = await mcpIntegration.puppeteerTest(
                'http://localhost:3000/game'
            );
            
            // Use Fetch MCP to collect metrics
            const metrics = await mcpIntegration.fetchOperation(
                '/api/metrics',
                'GET'
            );
            
            return mcpIntegration.formatResults({
                type: 'validation',
                data: {
                    tests: gameTests,
                    metrics: metrics
                }
            });
        };

        // Run the improvement process
        const results = await improver.runImprovement();
        
        console.log('\nDemo Results');
        console.log('============');
        console.log('Total Iterations:', results.totalIterations);
        console.log('Final Version:', results.finalVersion);
        console.log('\nDetailed results have been saved to the results directory.');
        
    } catch (error) {
        console.error('Error during demo:', error);
        process.exit(1);
    }
}

// Run the demo
runDemo().catch(console.error); 