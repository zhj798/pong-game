// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const paddleWidth = 10;
const paddleHeight = 80;
const ballSize = 8;
const paddleSpeed = 6;
const computerSpeed = 5;

let gameRunning = false;
let playerScore = 0;
let computerScore = 0;

// Paddle objects
const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    draw: function() {
        ctx.fillStyle = '#667eea';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    },
    update: function() {
        this.y += this.dy;
        
        // Wall collision
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
        }
    }
};

const computer = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    draw: function() {
        ctx.fillStyle = '#764ba2';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    },
    update: function() {
        this.y += this.dy;
        
        // Wall collision
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
        }
    }
};

// Ball object
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 5,
    vy: 5,
    radius: ballSize,
    draw: function() {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    },
    update: function() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Top and bottom wall collision
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy = -this.vy;
            this.y = this.y - this.radius < 0 ? this.radius : canvas.height - this.radius;
        }
        
        // Paddle collision with player
        if (this.x - this.radius < player.x + player.width &&
            this.y > player.y &&
            this.y < player.y + player.height) {
            this.vx = -this.vx;
            this.x = player.x + player.width + this.radius;
            
            // Add spin based on paddle position
            let collidePoint = this.y - (player.y + player.height / 2);
            collidePoint = collidePoint / (player.height / 2);
            this.vy = collidePoint * 5;
        }
        
        // Paddle collision with computer
        if (this.x + this.radius > computer.x &&
            this.y > computer.y &&
            this.y < computer.y + computer.height) {
            this.vx = -this.vx;
            this.x = computer.x - this.radius;
            
            // Add spin based on paddle position
            let collidePoint = this.y - (computer.y + computer.height / 2);
            collidePoint = collidePoint / (computer.height / 2);
            this.vy = collidePoint * 5;
        }
        
        // Score points
        if (this.x - this.radius < 0) {
            computerScore++;
            updateScore();
            resetBall();
        }
        if (this.x + this.radius > canvas.width) {
            playerScore++;
            updateScore();
            resetBall();
        }
    }
};

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        keys[e.key] = false;
    }
});

// Mouse movement for player control
document.addEventListener('mousemove', (e) => {
    if (!gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    // Move paddle towards mouse
    const paddleCenter = player.y + player.height / 2;
    const diff = mouseY - paddleCenter;
    
    if (Math.abs(diff) > 5) {
        player.dy = diff > 0 ? paddleSpeed : -paddleSpeed;
    } else {
        player.dy = 0;
    }
});

// Update player paddle from keyboard
function updatePlayerInput() {
    if (keys['ArrowUp']) {
        player.dy = -paddleSpeed;
    } else if (keys['ArrowDown']) {
        player.dy = paddleSpeed;
    } else {
        player.dy = 0;
    }
}

// Computer AI
function updateComputerAI() {
    const computerCenter = computer.y + computer.height / 2;
    const diff = ball.y - computerCenter;
    
    if (Math.abs(diff) > 35) {
        computer.dy = diff > 0 ? computerSpeed : -computerSpeed;
    } else {
        computer.dy = 0;
    }
}

// Reset ball
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.vy = (Math.random() - 0.5) * 5;
}

// Update score display
function updateScore() {
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
}

// Draw center line
function drawCenterLine() {
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    drawCenterLine();
    
    if (gameRunning) {
        // Update game objects
        updatePlayerInput();
        player.update();
        
        updateComputerAI();
        computer.update();
        
        ball.update();
    }
    
    // Draw game objects
    player.draw();
    computer.draw();
    ball.draw();
    
    requestAnimationFrame(gameLoop);
}

// Button handlers
document.getElementById('startBtn').addEventListener('click', () => {
    gameRunning = !gameRunning;
    document.getElementById('startBtn').textContent = gameRunning ? 'Pause Game' : 'Start Game';
});

document.getElementById('resetBtn').addEventListener('click', () => {
    playerScore = 0;
    computerScore = 0;
    updateScore();
    resetBall();
    gameRunning = false;
    document.getElementById('startBtn').textContent = 'Start Game';
});

// Start the game loop
gameLoop();

// Initial setup
updateScore();