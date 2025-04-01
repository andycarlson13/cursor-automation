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

    // Game variables
    let gameStarted = false;
    let gameOver = false;
    let score = 0;
    let gravity = 0.5;
    let birdY = 300;
    let birdVelocity = 0;
    let birdPosition = 60;
    let pipes = [];
    let gameLoop;
    let pipeGenerationInterval;

    // Game constants
    const FLAP_VELOCITY = -8;
    const PIPE_SPEED = 2;
    const PIPE_SPAWN_INTERVAL = 2000; // ms
    const GAP_SIZE = 150;
    const CONTAINER_HEIGHT = gameContainer.clientHeight;
    const CONTAINER_WIDTH = gameContainer.clientWidth;
    const BIRD_HEIGHT = bird.clientHeight;
    const BIRD_WIDTH = bird.clientWidth;

    // Initialize the game
    function initGame() {
        birdY = 300;
        birdVelocity = 0;
        score = 0;
        scoreDisplay.textContent = score;
        pipes = [];
        gameStarted = false;
        gameOver = false;

        // Clear existing pipes
        const existingPipes = document.querySelectorAll('.pipe');
        existingPipes.forEach(pipe => pipe.remove());

        // Reset bird position
        updateBirdPosition();

        // Show start screen
        startScreen.style.display = 'flex';
        gameOverScreen.style.display = 'none';
    }

    // Start the game
    function startGame() {
        gameStarted = true;
        gameOver = false;
        startScreen.style.display = 'none';
        
        // Start the game loop
        gameLoop = setInterval(updateGame, 20);
        
        // Generate pipes at intervals
        pipeGenerationInterval = setInterval(generatePipe, PIPE_SPAWN_INTERVAL);
        
        // Generate first pipe immediately
        generatePipe();
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
        if (birdY > CONTAINER_HEIGHT - BIRD_HEIGHT) {
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
        const gapTop = Math.floor(Math.random() * (CONTAINER_HEIGHT - GAP_SIZE - 100)) + 50;
        
        // Create top pipe
        const topPipe = document.createElement('div');
        topPipe.className = 'pipe pipe-top';
        topPipe.style.height = `${gapTop}px`;
        topPipe.style.left = `${CONTAINER_WIDTH}px`;
        topPipe.style.top = '0';
        
        // Create bottom pipe
        const bottomPipe = document.createElement('div');
        bottomPipe.className = 'pipe pipe-bottom';
        bottomPipe.style.height = `${CONTAINER_HEIGHT - gapTop - GAP_SIZE}px`;
        bottomPipe.style.left = `${CONTAINER_WIDTH}px`;
        bottomPipe.style.bottom = '0';
        
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
        const bottomPipeTop = CONTAINER_HEIGHT - parseInt(pipe.bottomElement.style.height);
        
        // Check horizontal collision
        if (birdRight > pipeLeft && birdPosition < pipeRight) {
            // Check vertical collision
            if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
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
    }

    // Update bird position based on birdY
    function updateBirdPosition() {
        bird.style.top = `${birdY}px`;
        
        // Add rotation based on velocity
        const rotation = birdVelocity * 2;
        bird.style.transform = `rotate(${rotation}deg)`;
    }

    // End the game
    function gameEnd() {
        gameOver = true;
        clearInterval(gameLoop);
        clearInterval(pipeGenerationInterval);
        
        // Show game over screen
        gameOverScreen.style.display = 'flex';
        finalScoreDisplay.textContent = score;
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

    // Initialize the game when loaded
    initGame();
}); 