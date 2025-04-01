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
    let gravity = 0.08; // Much slower falling
    let birdY = 300;
    let birdVelocity = 0;
    let birdPosition = 60;
    let pipes = [];
    let gameLoop;
    let pipeGenerationInterval;
    let isFullscreen = true;
    let hasJumped = false; // Track if player has jumped

    // Game constants
    const FLAP_VELOCITY = -3.5; // Gentler upward movement
    const PIPE_SPEED = 1.2; // Even slower pipes
    const PIPE_SPAWN_INTERVAL = 3500; // More time between pipes
    const GAP_SIZE = 250; // Much larger gap
    let CONTAINER_HEIGHT = gameContainer.clientHeight;
    let CONTAINER_WIDTH = gameContainer.clientWidth;
    const BIRD_HEIGHT = 30;
    const BIRD_WIDTH = 40;
    const GROUND_HEIGHT = 20;

    // Initialize the game
    function initGame() {
        // Force fullscreen on start
        if (!document.fullscreenElement) {
            toggleFullscreen();
        }
        
        birdY = CONTAINER_HEIGHT * 0.6; // Start bird lower
        birdVelocity = 0;
        score = 0;
        hasJumped = false;
        scoreDisplay.textContent = score;
        pipes = [];
        gameStarted = false;
        gameOver = false;

        // Update container dimensions
        updateContainerDimensions();

        // Clear existing pipes
        const existingPipes = document.querySelectorAll('.pipe');
        existingPipes.forEach(pipe => pipe.remove());

        // Reset bird position
        updateBirdPosition();

        // Show start screen with instructions
        startScreen.style.display = 'flex';
        gameOverScreen.style.display = 'none';
        
        // Update instructions based on player experience
        const instructionsElement = document.querySelector('#start-screen p');
        if (!hasJumped) {
            instructionsElement.innerHTML = `
                <div class="instructions">
                    <p>🎮 How to Play:</p>
                    <ul>
                        <li>Click or press Space to jump up</li>
                        <li>Avoid hitting the ground</li>
                        <li>Pass through the gaps in the pipes</li>
                        <li>The bird will fall if you don't click</li>
                    </ul>
                    <p class="tip">Tip: Try to keep the bird in the middle of the screen</p>
                </div>
            `;
        } else {
            instructionsElement.textContent = 'Click or press Space to jump up';
        }
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

        // Apply gravity to bird (with terminal velocity)
        birdVelocity = Math.min(birdVelocity + gravity, 4); // Limit falling speed
        birdY += birdVelocity;

        // Check if bird hits the ground or ceiling
        if (birdY < 0) {
            birdY = 0;
            birdVelocity = 0;
        }
        if (birdY > CONTAINER_HEIGHT - BIRD_HEIGHT - GROUND_HEIGHT) {
            birdY = CONTAINER_HEIGHT - BIRD_HEIGHT - GROUND_HEIGHT;
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

        // More forgiving gap position
        const minGapTop = 150; // Higher minimum
        const maxGapTop = CONTAINER_HEIGHT - GAP_SIZE - 150; // Lower maximum
        const gapTop = Math.floor(Math.random() * (maxGapTop - minGapTop)) + minGapTop;
        
        // Create top pipe
        const topPipe = document.createElement('div');
        topPipe.className = 'pipe pipe-top';
        topPipe.style.height = `${gapTop}px`;
        topPipe.style.left = `${CONTAINER_WIDTH}px`;
        topPipe.style.top = '0';
        
        // Create bottom pipe
        const bottomPipe = document.createElement('div');
        bottomPipe.className = 'pipe pipe-bottom';
        bottomPipe.style.height = `${CONTAINER_HEIGHT - gapTop - GAP_SIZE - GROUND_HEIGHT}px`;
        bottomPipe.style.left = `${CONTAINER_WIDTH}px`;
        bottomPipe.style.bottom = `${GROUND_HEIGHT}px`;
        
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
        const bottomPipeTop = CONTAINER_HEIGHT - parseInt(pipe.bottomElement.style.height) - GROUND_HEIGHT;
        
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
        
        hasJumped = true;
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
        
        // Smoother rotation with less extreme angles
        const rotation = Math.max(-20, Math.min(20, birdVelocity * 2));
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
        if (!document.fullscreenElement) {
            if (gameContainer.requestFullscreen) {
                gameContainer.requestFullscreen();
            } else if (gameContainer.mozRequestFullScreen) {
                gameContainer.mozRequestFullScreen();
            } else if (gameContainer.webkitRequestFullscreen) {
                gameContainer.webkitRequestFullscreen();
            } else if (gameContainer.msRequestFullscreen) {
                gameContainer.msRequestFullscreen();
            }
            document.body.classList.add('fullscreen');
            fullscreenBtn.textContent = 'Exit Fullscreen';
            isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            document.body.classList.remove('fullscreen');
            fullscreenBtn.textContent = 'Fullscreen';
            isFullscreen = false;
        }
        
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