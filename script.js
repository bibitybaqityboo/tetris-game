// Game Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = {
  'I': '#00f0f0',
  'O': '#f0f000',
  'T': '#a000f0',
  'S': '#00f000',
  'Z': '#f00000',
  'J': '#0000f0',
  'L': '#f0a000'
};

const SHAPES = {
  'I': [[1, 1, 1, 1]],
  'O': [[1, 1], [1, 1]],
  'T': [[0, 1, 0], [1, 1, 1]],
  'S': [[0, 1, 1], [1, 1, 0]],
  'Z': [[1, 1, 0], [0, 1, 1]],
  'J': [[1, 0, 0], [1, 1, 1]],
  'L': [[0, 0, 1], [1, 1, 1]]
};

// Game State
const gameState = {
  grid: Array(ROWS).fill().map(() => Array(COLS).fill(null)),
  currentPiece: null,
  nextPieces: [],
  holdPiece: null,
  hasHeld: false,
  score: 0,
  level: 1,
  lines: 0,
  isGameOver: false,
  isPaused: false,
  settings: {
    musicVolume: 70,
    sfxVolume: 80,
    screenShake: true,
    reducedMotion: false,
    aiAssistance: true,
    theme: 'retro',
    difficulty: 'classic',
    blockStyle: 'standard',
    colorBlindness: 'none',
    highContrast: false
  }
};

// Initialize canvas and context
const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// Initialize audio context and sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {};

// Sound management
function loadSounds() {
  const soundFiles = {
    move: 'assets/audio/move.mp3',
    rotate: 'assets/audio/rotate.mp3',
    drop: 'assets/audio/drop.mp3',
    clear: 'assets/audio/clear.mp3',
    tetris: 'assets/audio/tetris.mp3',
    levelup: 'assets/audio/levelup.mp3',
    gameover: 'assets/audio/gameover.mp3',
    hold: 'assets/audio/hold.mp3',
    powerup: 'assets/audio/powerup.mp3'
  };
  
  for (const [name, path] of Object.entries(soundFiles)) {
    const audio = new Audio(path);
    audio.preload = 'auto';
    sounds[name] = audio;
  }
  
  // Load background music
  sounds.bgm = {
    retro: new Audio('assets/audio/tetris-theme.mp3'),
    lofi: new Audio('assets/audio/tetris-lofi.mp3'),
    orchestral: new Audio('assets/audio/tetris-orchestral.mp3')
  };
  
  // Set up background music looping
  Object.values(sounds.bgm).forEach(track => {
    track.loop = true;
  });
}

function playSoundEffect(name) {
  if (!sounds[name]) return;
  
  const sound = sounds[name];
  sound.currentTime = 0;
  sound.volume = gameState.settings.sfxVolume / 100;
  sound.play().catch(e => console.error('Error playing sound:', e));
}

function playBackgroundMusic() {
  // Stop any currently playing BGM
  Object.values(sounds.bgm).forEach(track => {
    track.pause();
    track.currentTime = 0;
  });
  
  const selectedTrack = sounds.bgm[gameState.settings.musicSelection || 'retro'];
  if (selectedTrack) {
    selectedTrack.volume = gameState.settings.musicVolume / 100;
    selectedTrack.play().catch(e => console.error('Error playing BGM:', e));
  }
}

function toggleMute() {
  gameState.settings.isMuted = !gameState.settings.isMuted;
  
  if (gameState.settings.isMuted) {
    Object.values(sounds.bgm).forEach(track => track.pause());
  } else {
    playBackgroundMusic();
  }
  
  const muteButton = document.getElementById('mute-button');
  muteButton.textContent = gameState.settings.isMuted ? '🔇' : '🔊';
}

// Game initialization
function init() {
  // Load sounds
  loadSounds();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize the game
  resetGame();
  
  // Start the game loop
  requestAnimationFrame(gameLoop);
}

// Game loop and core mechanics
function gameLoop(timestamp) {
  if (!gameState.lastTime) gameState.lastTime = timestamp;
  const deltaTime = timestamp - gameState.lastTime;
  
  if (!gameState.isPaused && !gameState.isGameOver) {
    update(deltaTime);
    draw();
  }
  
  gameState.lastTime = timestamp;
  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  if (gameState.dropCounter > gameState.dropInterval) {
    softDrop();
    gameState.dropCounter = 0;
  } else {
    gameState.dropCounter += deltaTime;
  }
}

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  drawGrid();
  
  // Draw current piece
  if (gameState.currentPiece) {
    drawPiece(gameState.currentPiece);
  }
  
  // Draw ghost piece
  drawGhostPiece();
}

function drawGrid() {
  // Draw filled blocks
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (gameState.grid[row][col]) {
        const color = COLORS[gameState.grid[row][col]];
        drawBlock(col, row, color);
      }
    }
  }
}

function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  
  // Add shading
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, 1);
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, 1, BLOCK_SIZE);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(x * BLOCK_SIZE + BLOCK_SIZE - 1, y * BLOCK_SIZE, 1, BLOCK_SIZE);
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE - 1, BLOCK_SIZE, 1);
}

function drawPiece(piece) {
  const shape = piece.shape;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        drawBlock(piece.x + col, piece.y + row, COLORS[piece.type]);
      }
    }
  }
}

function drawGhostPiece() {
  if (!gameState.currentPiece) return;
  
  const ghost = {
    ...gameState.currentPiece,
    y: gameState.currentPiece.y
  };
  
  while (isValidMove(0, 1, ghost)) {
    ghost.y++;
  }
  
  ctx.globalAlpha = 0.3;
  drawPiece(ghost);
  ctx.globalAlpha = 1;
}

// Game mechanics
function isValidMove(offsetX, offsetY, piece = gameState.currentPiece) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const newX = piece.x + col + offsetX;
        const newY = piece.y + row + offsetY;
        
        if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
        if (newY >= 0 && gameState.grid[newY][newX]) return false;
      }
    }
  }
  return true;
}

function movePiece(direction) {
  if (gameState.isGameOver || gameState.isPaused) return;
  
  let offsetX = 0;
  let offsetY = 0;
  
  switch (direction) {
    case 'left': offsetX = -1; break;
    case 'right': offsetX = 1; break;
    case 'down': offsetY = 1; break;
  }
  
  if (isValidMove(offsetX, offsetY)) {
    gameState.currentPiece.x += offsetX;
    gameState.currentPiece.y += offsetY;
    return true;
  }
  return false;
}

function rotatePiece() {
  if (gameState.isGameOver || gameState.isPaused) return;
  
  const piece = gameState.currentPiece;
  const newShape = [];
  
  for (let i = 0; i < piece.shape[0].length; i++) {
    newShape[i] = [];
    for (let j = 0; j < piece.shape.length; j++) {
      newShape[i][j] = piece.shape[piece.shape.length - 1 - j][i];
    }
  }
  
  const oldShape = piece.shape;
  piece.shape = newShape;
  
  if (!isValidMove(0, 0)) {
    piece.shape = oldShape;
  }
}

function hardDrop() {
  if (gameState.isGameOver || gameState.isPaused) return;
  
  while (movePiece('down')) {
    gameState.score += 2;
  }
  lockPiece();
}

function lockPiece() {
  const piece = gameState.currentPiece;
  
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const gridY = piece.y + row;
        const gridX = piece.x + col;
        
        if (gridY < 0) {
          gameOver();
          return;
        }
        
        gameState.grid[gridY][gridX] = piece.type;
      }
    }
  }
  
  clearLines();
  spawnPiece();
}

function clearLines() {
  let linesCleared = 0;
  
  for (let row = ROWS - 1; row >= 0; row--) {
    if (gameState.grid[row].every(cell => cell !== null)) {
      gameState.grid.splice(row, 1);
      gameState.grid.unshift(Array(COLS).fill(null));
      linesCleared++;
      row++;
    }
  }
  
  if (linesCleared > 0) {
    gameState.lines += linesCleared;
    gameState.score += calculateScore(linesCleared);
    updateScore();
    
    const newLevel = Math.floor(gameState.lines / 10) + 1;
    if (newLevel > gameState.level) {
      gameState.level = newLevel;
      gameState.dropInterval = Math.max(100, 1000 - (gameState.level - 1) * 100);
    }
  }
}

function calculateScore(lines) {
  const basePoints = [0, 100, 300, 500, 800];
  return basePoints[lines] * gameState.level;
}

function spawnPiece() {
  const pieces = 'IJLOSTZ';
  const type = pieces[Math.floor(Math.random() * pieces.length)];
  
  gameState.currentPiece = {
    type,
    shape: SHAPES[type],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
    y: 0
  };
  
  if (!isValidMove(0, 0)) {
    gameOver();
  }
}

function gameOver() {
  gameState.isGameOver = true;
  showGameOver();
}

function showGameOver() {
  const gameOverScreen = document.createElement('div');
  gameOverScreen.className = 'game-over';
  gameOverScreen.innerHTML = `
    <h2>Game Over</h2>
    <p>Score: ${gameState.score}</p>
    <p>Lines: ${gameState.lines}</p>
    <p>Level: ${gameState.level}</p>
    <button onclick="resetGame()">Play Again</button>
  `;
  document.body.appendChild(gameOverScreen);
}

function resetGame() {
  gameState.grid = Array(ROWS).fill().map(() => Array(COLS).fill(null));
  gameState.score = 0;
  gameState.lines = 0;
  gameState.level = 1;
  gameState.dropInterval = 1000;
  gameState.dropCounter = 0;
  gameState.isGameOver = false;
  gameState.isPaused = false;
  
  const gameOverScreen = document.querySelector('.game-over');
  if (gameOverScreen) {
    gameOverScreen.remove();
  }
  
  updateScore();
  spawnPiece();
}

function updateScore() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('lines').textContent = gameState.lines;
  document.getElementById('level').textContent = gameState.level;
}

function softDrop() {
  if (gameState.isGameOver || gameState.isPaused) return;
  
  if (!movePiece('down')) {
    lockPiece();
  }
  return true;
}

// Event listeners
document.addEventListener('keydown', event => {
  if (gameState.isGameOver) return;
  
  switch (event.key) {
    case 'ArrowLeft':
      movePiece('left');
      break;
    case 'ArrowRight':
      movePiece('right');
      break;
    case 'ArrowDown':
      movePiece('down');
      break;
    case 'ArrowUp':
      rotatePiece();
      break;
    case ' ':
      hardDrop();
      break;
  }
});

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
  // Set up initial game state
  gameState.dropInterval = 1000;
  gameState.dropCounter = 0;
  gameState.lastTime = 0;
  gameState.combo = 0;
  gameState.nextPieces = [];
  
  // Generate initial next pieces
  for (let i = 0; i < 3; i++) {
    const pieces = 'IJLOSTZ';
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    gameState.nextPieces.push({
      type,
      shape: SHAPES[type]
    });
  }
  
  // Load sounds
  loadSounds();
  
  // Set up event listeners
  setupEventListeners();
  setupMobileControls();
  
  // Show start screen
  showScreen('start-screen');
  
  // Add start button listener
  document.getElementById('start-button').addEventListener('click', () => {
    resetGame();
    showScreen('game-screen');
    playBackgroundMusic();
    requestAnimationFrame(gameLoop);
  });
  
  // Add settings listeners
  document.getElementById('music-volume').addEventListener('input', (e) => {
    gameState.settings.musicVolume = parseInt(e.target.value);
    if (!gameState.settings.isMuted) {
      Object.values(sounds.bgm).forEach(track => {
        track.volume = gameState.settings.musicVolume / 100;
      });
    }
  });
  
  document.getElementById('sfx-volume').addEventListener('input', (e) => {
    gameState.settings.sfxVolume = parseInt(e.target.value);
  });
  
  // Add theme selection listener
  document.querySelectorAll('.theme-button').forEach(button => {
    button.addEventListener('click', (e) => {
      document.querySelectorAll('.theme-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      e.target.classList.add('selected');
      document.body.className = `theme-${e.target.dataset.theme}`;
    });
  });
  
  // Add difficulty selection listener
  document.querySelectorAll('.difficulty-button').forEach(button => {
    button.addEventListener('click', (e) => {
      document.querySelectorAll('.difficulty-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      e.target.classList.add('selected');
      gameState.settings.difficulty = e.target.dataset.difficulty;
    });
  });
});

// Force update: Sat Apr 6 03:25:00 MST 2024
// Rebuild trigger: Update game mechanics and UI

// UI Management
function showScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.game-screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  
  // Show the requested screen
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove('hidden');
  }
}

function updateNextPiecesDisplay() {
  const nextPiecesContainer = document.getElementById('next-pieces');
  const displays = nextPiecesContainer.querySelectorAll('.next-piece-display');
  
  displays.forEach((display, index) => {
    display.innerHTML = '';
    
    if (index < gameState.nextPieces.length) {
      const piece = gameState.nextPieces[index];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = canvas.height = BLOCK_SIZE * 4;
      
      // Center the piece in the preview
      const offsetX = (4 - piece.shape[0].length) / 2;
      const offsetY = (4 - piece.shape.length) / 2;
      
      piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            ctx.fillStyle = COLORS[piece.type];
            ctx.fillRect(
              (offsetX + x) * BLOCK_SIZE,
              (offsetY + y) * BLOCK_SIZE,
              BLOCK_SIZE,
              BLOCK_SIZE
            );
          }
        });
      });
      
      display.appendChild(canvas);
    }
  });
}

function updateHoldPieceDisplay() {
  const holdPieceContainer = document.getElementById('hold-piece');
  holdPieceContainer.innerHTML = '';
  
  if (gameState.holdPiece) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.height = BLOCK_SIZE * 4;
    
    // Center the piece in the preview
    const offsetX = (4 - gameState.holdPiece.shape[0].length) / 2;
    const offsetY = (4 - gameState.holdPiece.shape.length) / 2;
    
    gameState.holdPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          ctx.fillStyle = COLORS[gameState.holdPiece.type];
          ctx.fillRect(
            (offsetX + x) * BLOCK_SIZE,
            (offsetY + y) * BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
          );
        }
      });
    });
    
    holdPieceContainer.appendChild(canvas);
  }
}

function setupMobileControls() {
  if ('ontouchstart' in window) {
    const mobileControls = document.getElementById('mobile-controls');
    mobileControls.classList.remove('hidden');
    
    // Add touch event listeners
    document.getElementById('left-button').addEventListener('touchstart', () => movePiece('left'));
    document.getElementById('right-button').addEventListener('touchstart', () => movePiece('right'));
    document.getElementById('down-button').addEventListener('touchstart', () => movePiece('down'));
    document.getElementById('rotate-button').addEventListener('touchstart', () => rotatePiece());
    document.getElementById('drop-button').addEventListener('touchstart', () => hardDrop());
    document.getElementById('hold-button').addEventListener('touchstart', () => holdPiece());
  }
}
