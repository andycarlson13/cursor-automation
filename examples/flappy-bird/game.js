// Flappy Bird Game Logic
document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const bird = document.getElementById('bird');
    const gameContainer = document.getElementById('game-container');
    const scoreDisplay = document.getElementById('score');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    // Game variables
    let gameStarted = false;
    let gameOver = false;
    let score = 0;
    let gravity = 0.25; // Reduced gravity for smoother falling
    let birdY = 300;
    let birdVelocity = 0;
    let birdPosition = 60;
    let pipes = [];
    let gameLoop;
    let pipeGenerationInterval;
    let isFullscreen = true; // Default to fullscreen

    // Game constants
    const FLAP_VELOCITY = -6; // Reduced flap velocity for smoother movement
    const PIPE_SPEED = 2;
    const PIPE_SPAWN_INTERVAL = 2500; // Increased spawn interval for better gameplay
    const GAP_SIZE = 170; // Increased gap size
    let CONTAINER_HEIGHT = gameContainer.clientHeight;
    let CONTAINER_WIDTH = gameContainer.clientWidth;
    const BIRD_HEIGHT = 30;
    const BIRD_WIDTH = 40;

    // Initialize the game
    function initGame() {
        birdY = 300;
        birdVelocity = 0;
        score = 0;
        scoreDisplay.textContent = score;
        pipes = [];
        gameStarted = false;
        gameOver = false;

        // Update container dimensions (in case of fullscreen change)
        updateContainerDimensions();

        // Clear existing pipes
        const existingPipes = document.querySelectorAll('.pipe');
        existingPipes.forEach(pipe => pipe.remove());

        // Reset bird position
        updateBirdPosition();

        // Show start screen
        startScreen.style.display = 'flex';
        gameOverScreen.style.display = 'none';

        // Start in fullscreen by default
        if (!isFullscreen) {
            toggleFullscreen();
        }
        
        // Create bird SVG
        const birdSVG = `
            <svg width="40" height="30" viewBox="0 0 40 30">
                <g transform="translate(0 -5)">
                    <path d="M35,20c0,8.284-6.716,15-15,15S5,28.284,5,20S11.716,5,20,5S35,11.716,35,20" fill="#FFD700"/>
                    <circle cx="25" cy="15" r="2" fill="#000"/>
                    <path d="M30,18c-2,2-4,2-6,1" stroke="#000" stroke-width="1" fill="none"/>
                    <path d="M38,20l-8-3" fill="#FF6B6B"/>
                    <path d="M10,15c0,0,4-8,10-8" stroke="#FFA500" stroke-width="2" fill="none"/>
                </g>
            </svg>`;
        bird.innerHTML = birdSVG;
        
        // Add wing animation
        const wingAnimation = document.createElement('style');
        wingAnimation.textContent = `
            @keyframes flapWings {
                0% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
                100% { transform: translateY(0); }
            }
            #bird path:last-child {
                animation: flapWings 0.3s infinite;
            }
        `;
        document.head.appendChild(wingAnimation);
    }

    // Update container dimensions
    function updateContainerDimensions() {
        CONTAINER_HEIGHT = gameContainer.clientHeight;
        CONTAINER_WIDTH = gameContainer.clientWidth;
    }

    // Start the game
    function startGame() {
        gameStarted = true;
        gameOver = false;
        startScreen.style.display = 'none';
        
        // Start the game loop
        gameLoop = requestAnimationFrame(updateGameLoop);
        
        // Generate pipes at intervals
        pipeGenerationInterval = setInterval(generatePipe, PIPE_SPAWN_INTERVAL);
        
        // Generate first pipe immediately
        generatePipe();
    }

    // Game loop using requestAnimationFrame
    function updateGameLoop(timestamp) {
        if (!gameOver) {
            updateGame();
            gameLoop = requestAnimationFrame(updateGameLoop);
        }
    }

    // Update game state
    function updateGame() {
        if (gameOver) return;

        // Apply gravity to bird
        birdVelocity += gravity;
        birdY += birdVelocity;

        // Check if bird hits the ground or ceiling
        if (birdY < 0) {
            birdY = 0;
            birdVelocity = 0;
        }
        if (birdY > CONTAINER_HEIGHT - BIRD_HEIGHT - 20) { // 20px for ground
            gameEnd();
            return;
        }

        // Update bird position
        updateBirdPosition();

        // Move pipes and check for collisions
        movePipes();
    }

    // Move pipes and check for collisions
    function movePipes() {
        pipes.forEach((pipe, index) => {
            // Move pipe to the left
            pipe.x -= PIPE_SPEED;
            pipe.topElement.style.left = `${pipe.x}px`;
            pipe.bottomElement.style.left = `${pipe.x}px`;

            // Check for collision
            if (checkCollision(pipe)) {
                gameEnd();
                return;
            }

            // Check if pipe passed the bird
            if (!pipe.passed && pipe.x < birdPosition - 30) {
                pipe.passed = true;
                score++;
                scoreDisplay.textContent = score;
            }

            // Remove pipe if it's off-screen
            if (pipe.x < -60) {
                pipe.topElement.remove();
                pipe.bottomElement.remove();
                pipes.splice(index, 1);
            }
        });
    }

    // Generate a new pipe
    function generatePipe() {
        if (gameOver) return;

        // Random gap position
        const gapTop = Math.floor(Math.random() * (CONTAINER_HEIGHT - GAP_SIZE - 140)) + 50;
        
        // Create top pipe
        const topPipe = document.createElement('div');
        topPipe.className = 'pipe pipe-top';
        topPipe.style.height = `${gapTop}px`;
        topPipe.style.left = `${CONTAINER_WIDTH}px`;
        topPipe.style.top = '0';
        
        // Create bottom pipe
        const bottomPipe = document.createElement('div');
        bottomPipe.className = 'pipe pipe-bottom';
        bottomPipe.style.height = `${CONTAINER_HEIGHT - gapTop - GAP_SIZE - 20}px`; // 20px for ground
        bottomPipe.style.left = `${CONTAINER_WIDTH}px`;
        bottomPipe.style.bottom = '20px'; // Account for ground
        
        // Add pipes to the container
        gameContainer.appendChild(topPipe);
        gameContainer.appendChild(bottomPipe);
        
        // Add pipe to array for tracking
        pipes.push({
            x: CONTAINER_WIDTH,
            topElement: topPipe,
            bottomElement: bottomPipe,
            passed: false
        });
    }

    // Check for collision with pipes
    function checkCollision(pipe) {
        const birdRight = birdPosition + BIRD_WIDTH;
        const birdTop = birdY;
        const birdBottom = birdY + BIRD_HEIGHT;
        
        // Pipe position
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + 60;
        const topPipeBottom = parseInt(pipe.topElement.style.height);
        const bottomPipeTop = CONTAINER_HEIGHT - parseInt(pipe.bottomElement.style.height) - 20; // 20px for ground
        
        // Check horizontal collision
        if (birdRight > pipeLeft && birdPosition < pipeRight) {
            // Check vertical collision (with smaller hitbox for better gameplay)
            if (birdTop + 5 < topPipeBottom || birdBottom - 5 > bottomPipeTop) {
                return true;
            }
        }
        
        return false;
    }

    // Make the bird flap
    function flap() {
        if (gameOver) return;
        
        if (!gameStarted) {
            startGame();
        }
        
        birdVelocity = FLAP_VELOCITY;
        
        // Add flap effect
        bird.classList.add('flap');
        setTimeout(() => bird.classList.remove('flap'), 100);
        
        // Play flap sound
        const flapSound = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==');
        flapSound.volume = 0.2;
        flapSound.play().catch(() => {}); // Ignore autoplay restrictions
    }

    // Update bird position based on birdY
    function updateBirdPosition() {
        bird.style.top = `${birdY}px`;
        
        // Smoother rotation based on velocity
        const rotation = Math.max(-30, Math.min(30, birdVelocity * 3));
        bird.style.transform = `rotate(${rotation}deg)`;
        
        // Add trail effect
        if (gameStarted && !gameOver) {
            const trail = document.createElement('div');
            trail.className = 'bird-trail';
            trail.style.left = `${birdPosition}px`;
            trail.style.top = `${birdY + 15}px`;
            gameContainer.appendChild(trail);
            
            // Remove trail after animation
            setTimeout(() => trail.remove(), 500);
        }
    }

    // End the game
    function gameEnd() {
        gameOver = true;
        cancelAnimationFrame(gameLoop);
        clearInterval(pipeGenerationInterval);
        
        // Show game over screen
        gameOverScreen.style.display = 'flex';
        finalScoreDisplay.textContent = score;
    }

    // Toggle fullscreen
    function toggleFullscreen() {
        if (!isFullscreen) {
            // Go fullscreen
            if (gameContainer.requestFullscreen) {
                gameContainer.requestFullscreen();
            } else if (gameContainer.mozRequestFullScreen) { // Firefox
                gameContainer.mozRequestFullScreen();
            } else if (gameContainer.webkitRequestFullscreen) { // Chrome, Safari and Opera
                gameContainer.webkitRequestFullscreen();
            } else if (gameContainer.msRequestFullscreen) { // IE/Edge
                gameContainer.msRequestFullscreen();
            }
            document.body.classList.add('fullscreen');
            fullscreenBtn.textContent = 'Exit Fullscreen';
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
            }
            document.body.classList.remove('fullscreen');
            fullscreenBtn.textContent = 'Fullscreen';
        }
        
        isFullscreen = !isFullscreen;
        
        // Update container dimensions after fullscreen toggle
        setTimeout(updateContainerDimensions, 100);
    }

    // Handle fullscreen change
    function handleFullscreenChange() {
        if (!document.fullscreenElement && 
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement && 
            !document.msFullscreenElement) {
            
            isFullscreen = false;
            document.body.classList.remove('fullscreen');
            fullscreenBtn.textContent = 'Fullscreen';
        } else {
            isFullscreen = true;
            document.body.classList.add('fullscreen');
            fullscreenBtn.textContent = 'Exit Fullscreen';
        }
        
        // Update container dimensions after fullscreen change
        setTimeout(updateContainerDimensions, 100);
    }

    // Event listeners
    document.addEventListener('click', flap);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            flap();
        }
    });
    
    startButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering flap
        startGame();
    });
    
    restartButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering flap
        initGame();
    });
    
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering flap
        toggleFullscreen();
    });
    
    // Listen for fullscreen change events
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Listen for window resize to update dimensions
    window.addEventListener('resize', updateContainerDimensions);

    // Initialize the game when loaded
    initGame();
}); 