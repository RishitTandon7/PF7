// --- CALCULATOR APP LOGIC ---
let calcDisplay = '0';
let calcOp = null;
let calcPrev = null;
let calcResetOnNext = false;

window.calcInput = function(val) {
    const displayEl = document.getElementById('calc-display');
    if (!displayEl) return;

    if (val === 'C') {
        calcDisplay = '0';
        calcOp = null;
        calcPrev = null;
    } else if (val === '±') {
        calcDisplay = (parseFloat(calcDisplay) * -1).toString();
    } else if (val === '%') {
        calcDisplay = (parseFloat(calcDisplay) / 100).toString();
    } else if (['+', '-', '*', '/'].includes(val)) {
        calcPrev = calcDisplay;
        calcOp = val;
        calcResetOnNext = true;
    } else if (val === '=') {
        if (calcOp && calcPrev !== null) {
            let res = 0;
            const a = parseFloat(calcPrev);
            const b = parseFloat(calcDisplay);
            if (calcOp === '+') res = a + b;
            if (calcOp === '-') res = a - b;
            if (calcOp === '*') res = a * b;
            if (calcOp === '/') res = b !== 0 ? a / b : 'Error';
            calcDisplay = res.toString();
            calcOp = null;
            calcPrev = null;
            calcResetOnNext = true;
        }
    } else {
        // Numbers or decimal
        if (calcResetOnNext) {
            calcDisplay = val === '.' ? '0.' : val;
            calcResetOnNext = false;
        } else {
            if (val === '.' && calcDisplay.includes('.')) return;
            calcDisplay = calcDisplay === '0' && val !== '.' ? val : calcDisplay + val;
        }
    }
    
    // Limit length to fit display
    if (calcDisplay.length > 12 && calcDisplay !== 'Error') {
        calcDisplay = parseFloat(calcDisplay).toPrecision(10).toString();
    }
    displayEl.innerText = calcDisplay;
};

// --- SNAKE GAME LOGIC ---
let snakeCanvas, snakeCtx;
let snake = [];
let snakeFood = {};
let snakeDx = 20, snakeDy = 0;
let snakeScore = 0;
let snakeHighScore = 0;
let snakeInterval = null;
let gameRunning = false;
const GRID_SIZE = 20;

function initSnakeGame() {
    snakeCanvas = document.getElementById('snake-canvas');
    if(!snakeCanvas) return;
    snakeCtx = snakeCanvas.getContext('2d');
    
    // Reset snake
    snake = [
        {x: 200, y: 200},
        {x: 180, y: 200},
        {x: 160, y: 200}
    ];
    snakeDx = 20;
    snakeDy = 0;
    snakeScore = 0;
    document.getElementById('snake-score').innerText = snakeScore;
    spawnFood();
    drawSnakeFrame();
}

function spawnFood() {
    snakeFood.x = Math.floor(Math.random() * (snakeCanvas.width / GRID_SIZE)) * GRID_SIZE;
    snakeFood.y = Math.floor(Math.random() * (snakeCanvas.height / GRID_SIZE)) * GRID_SIZE;
    // Ensure food doesn't spawn on snake
    snake.forEach(part => {
        if(part.x === snakeFood.x && part.y === snakeFood.y) spawnFood();
    });
}

function drawSnakeFrame() {
    // Clear
    snakeCtx.fillStyle = '#18181b';
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    
    // Draw grid lines
    snakeCtx.strokeStyle = 'rgba(57, 255, 20, 0.05)';
    for(let i = 0; i < snakeCanvas.width; i += GRID_SIZE) {
        snakeCtx.beginPath();
        snakeCtx.moveTo(i, 0);
        snakeCtx.lineTo(i, snakeCanvas.height);
        snakeCtx.stroke();
        snakeCtx.beginPath();
        snakeCtx.moveTo(0, i);
        snakeCtx.lineTo(snakeCanvas.width, i);
        snakeCtx.stroke();
    }
    
    // Draw food
    snakeCtx.fillStyle = '#ff0055';
    snakeCtx.fillRect(snakeFood.x, snakeFood.y, GRID_SIZE - 2, GRID_SIZE - 2);
    
    // Draw snake
    snake.forEach((part, i) => {
        snakeCtx.fillStyle = i === 0 ? '#ffffff' : '#39ff14';
        snakeCtx.fillRect(part.x, part.y, GRID_SIZE - 2, GRID_SIZE - 2);
    });
}

function updateSnake() {
    const head = { x: snake[0].x + snakeDx, y: snake[0].y + snakeDy };
    
    // Wall collision
    if(head.x < 0 || head.x >= snakeCanvas.width || head.y < 0 || head.y >= snakeCanvas.height) {
        gameOver();
        return;
    }
    // Self collision
    for(let i = 0; i < snake.length; i++) {
        if(head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    snake.unshift(head);
    
    // Check food
    if(head.x === snakeFood.x && head.y === snakeFood.y) {
        snakeScore += 10;
        document.getElementById('snake-score').innerText = snakeScore;
        spawnFood();
    } else {
        snake.pop();
    }
    
    drawSnakeFrame();
}

function gameOver() {
    gameRunning = false;
    clearInterval(snakeInterval);
    if(snakeScore > snakeHighScore) {
        snakeHighScore = snakeScore;
        document.getElementById('snake-hiscore').innerText = snakeHighScore;
    }
    document.getElementById('snake-overlay').style.display = 'flex';
    document.getElementById('snake-msg').innerText = 'GAME OVER';
}

window.startSnakeGame = function() {
    initSnakeGame();
    document.getElementById('snake-overlay').style.display = 'none';
    gameRunning = true;
    if(snakeInterval) clearInterval(snakeInterval);
    snakeInterval = setInterval(updateSnake, 120);
};

window.snakeDir = function(x, y) {
    if(!gameRunning) return;
    if(snakeDx !== 0 && x !== 0) return; // Prevent reversing X
    if(snakeDy !== 0 && y !== 0) return; // Prevent reversing Y
    snakeDx = x * GRID_SIZE;
    snakeDy = y * GRID_SIZE;
};

// Listen for keys on the document
document.addEventListener('keydown', (e) => {
    // Only capture if snake window is active and booted
    const osWindow = document.getElementById('snake-win');
    if(!osWindow || osWindow.style.display === 'none') return;
    // Check if snake window has highest z-index
    
    if(['ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); window.snakeDir(0, -1); }
    if(['ArrowDown', 's', 'S'].includes(e.key)) { e.preventDefault(); window.snakeDir(0, 1); }
    if(['ArrowLeft', 'a', 'A'].includes(e.key)) { e.preventDefault(); window.snakeDir(-1, 0); }
    if(['ArrowRight', 'd', 'D'].includes(e.key)) { e.preventDefault(); window.snakeDir(1, 0); }
});

// Setup initial state
document.addEventListener('DOMContentLoaded', () => {
    initSnakeGame();
});
