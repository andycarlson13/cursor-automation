const puppeteer = require('puppeteer');
const path = require('path');

async function testGamePage() {
    console.log('Testing Flappy Bird game page with Puppeteer...');
    
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        const gamePath = path.join(__dirname, '..', 'examples', 'flappy-bird', 'index.html');
        await page.goto(`file://${gamePath}`);
        
        // Wait for game canvas to be ready
        await page.waitForSelector('canvas');
        
        // Test game initialization
        const isCanvasVisible = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            return canvas && canvas.width > 0 && canvas.height > 0;
        });
        
        if (!isCanvasVisible) {
            throw new Error('Game canvas not properly initialized');
        }
        
        // Take a screenshot for verification
        await page.screenshot({
            path: path.join(__dirname, '..', 'test-results', 'game-screenshot.png')
        });
        
        console.log('Game page loaded successfully');
    } finally {
        await browser.close();
    }
}

testGamePage().catch(console.error); 