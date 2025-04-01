# Flappy Bird MCP Demo

This example demonstrates a simple Flappy Bird clone that can be analyzed using Model Context Protocol (MCP) agents.

## Game Features

- Simple Flappy Bird gameplay
- Score tracking
- Game over and restart functionality
- Mobile-friendly design

## Files Included

- `index.html` - The game's HTML structure and styling
- `game.js` - Game logic and mechanics
- `mcp-analysis.js` - Demonstration of how MCP can analyze and improve the game
- `mcp-report.json` - Generated analysis report (created when you run the analysis)

## How to Play

1. Open `index.html` in your browser
2. Click the "Start Game" button
3. Click or press spacebar to make the bird fly
4. Avoid hitting the pipes or the ground
5. Try to get the highest score you can!

## MCP Analysis Demo

This example includes a script that simulates how MCP agents can analyze and suggest improvements for the game:

```bash
# First start the MCP servers
npm run start-all-mcp

# Then run the analysis script
node examples/flappy-bird/mcp-analysis.js
```

The analysis demonstrates:

1. **UI Analysis** (Puppeteer MCP) - Evaluates the game's interface and accessibility
2. **Code Analysis** (Filesystem MCP) - Reviews the game code for performance and best practices
3. **Web Research** (WebResearch MCP) - Compares with modern implementations for improvement ideas

## Learning Objectives

This example showcases:

- How MCP agents can analyze frontend applications
- Integration between multiple MCP agents for comprehensive analysis
- How AI can provide actionable insights for code improvement

## Extending the Example

You can use this as a starting point for more complex game development or MCP integrations:

- Add real sprite animations using an image atlas
- Implement the suggested improvements from the MCP analysis
- Create a more sophisticated analysis that uses the actual MCP servers instead of simulations

## Related MCP Documentation

For more information on the MCP tools used in this example, see:

- [Filesystem MCP](https://github.com/andycarlson13/cursor-automation#filesystem-mcp)
- [Puppeteer MCP](https://github.com/andycarlson13/cursor-automation#puppeteer-mcp)
- [WebResearch MCP](https://github.com/andycarlson13/cursor-automation#webresearch-mcp)
