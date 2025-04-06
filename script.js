// ... existing code ...

// Game mechanics - Piece movement and collision detection
function isValidMove(offsetX, offsetY, piece = gameState.currentPiece) {
  // Check if the proposed move would cause a collision
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      // Skip empty cells in the tetromino
      if (!piece.shape[row][col]) continue;
      
      // Calculate the grid position
      const newX = piece.x + col + offsetX;
      const newY = piece.y + row + offsetY;
      
      // Check if out of bounds
      if (newX < 0 || newX >= COLS || newY >= ROWS) {
        return false;
      }
      
      // Check if trying to move into a filled cell (but ignore if above the grid)
      if (newY >= 0 && gameState.grid[newY][newX]) {
        return false;
      }
    }
  }
  
  return true;
}

function movePiece(direction) {
  let offsetX = 0;
  let offsetY = 0;
  
  switch (direction) {
    case 'left':
      offsetX = -1;
      break;
    case 'right':
      offsetX = 1;
      break;
    case 'down':
      offsetY = 1;
      break;
  }
  
  if (isValidMove(offsetX, offsetY)) {
    gameState.currentPiece.x += offsetX;
    gameState.currentPiece.y += offsetY;
    
    if (direction === 'left' || direction === 'right') {
      playSoundEffect('move');
    }
    
    return true;
  }
  
  return false;
}

function rotatePiece(direction) {
  // Create a copy of the current piece to manipulate
  const piece = { ...gameState.currentPiece };
  const originalShape = piece.shape;
  
  // Create a rotated version of the shape
  let newShape = [];
  
  if (direction === 'clockwise') {
    // Rotate 90 degrees clockwise
    for (let i = 0; i < originalShape[0].length; i++) {
      newShape[i] = [];
      for (let j = 0; j < originalShape.length; j++) {
        newShape[i][j] = originalShape[originalShape.length - 1 - j][i];
      }
    }
  } else {
    // Rotate 90 degrees counter-clockwise
    for (let i = 0; i < originalShape[0].length; i++) {
      newShape[i] = [];
      for (let j = 0; j < originalShape.length; j++) {
        newShape[i][j] = originalShape[j][originalShape[0].length - 1 - i];
      }
    }
  }
  
  piece.shape = newShape;
  
  // Wall kick - Try different positions to make the rotation work
  const kicks = [
    { x: 0, y: 0 },     // Original position
    { x: 1, y: 0 },     // Kick right
    { x: -1, y: 0 },    // Kick left
    { x: 0, y: -1 },    // Kick up
    { x: 1, y: -1 },    // Kick right-up
    { x: -1, y: -1 }    // Kick left-up
  ];
  
  // Special case for I piece (more aggressive kicks)
  if (piece.type === 'I') {
    kicks.push({ x: 2, y: 0 }, { x: -2, y: 0 });
  }
  
  // Try each kick position
  for (const kick of kicks) {
    if (isValidMove(kick.x, kick.y, piece)) {
      // Apply the valid rotation and kick
      gameState.currentPiece.shape = newShape;
      gameState.currentPiece.x += kick.x;
      gameState.currentPiece.y += kick.y;
      
      playSoundEffect('rotate');
      return true;
    }
  }
  
  return false;
}

function hardDrop() {
  let dropDistance = 0;
  
  // Drop the piece as far as it can go
  while (isValidMove(0, dropDistance + 1)) {
    dropDistance++;
  }
  
  gameState.currentPiece.y += dropDistance;
  playSoundEffect('drop');
  
  // Add bonus points for hard drop
  if (dropDistance > 0) {
    gameState.score += dropDistance * 2;
    updateScore();
  }
  
  lockPiece();
}

function lockPiece() {
  // Add the current piece to the grid
  for (let row = 0; row < gameState.currentPiece.shape.length; row++) {
    for (let col = 0; col < gameState.currentPiece.shape[row].length; col++) {
      if (gameState.currentPiece.shape[row][col]) {
        const gridY = gameState.currentPiece.y + row;
        const gridX = gameState.currentPiece.x + col;
        
        // Only place on grid if within bounds
        if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
          gameState.grid[gridY][gridX] = gameState.currentPiece.type;
        }
      }
    }
  }
  
  // Check for cleared lines
  checkLines();
  
  // Get the next piece
  spawnNewPiece();
  
  // Show an AI encouragement message occasionally if enabled
  if (gameState.settings.aiAssistance && Math.random() < 0.2) {
    const message = gameState.aiMessages.encouragement[
      Math.floor(Math.random() * gameState.aiMessages.encouragement.length)
    ];
    showAIMessage(message);
  }
}

function holdPiece() {
  // Can only hold once per piece
  if (gameState.hasHeld) return;
  
  // If no piece is being held, store current piece and get next piece
  if (!gameState.holdPiece) {
    gameState.holdPiece = {
      type: gameState.currentPiece.type,
      shape: SHAPES[gameState.currentPiece.type],
      x: Math.floor(COLS / 2) - Math.ceil(SHAPES[gameState.currentPiece.type][0].length / 2),
      y: 0,
      rotation: 0
    };
    
    spawnNewPiece();
  } else {
    // Swap current piece with hold piece
    const temp = {
      type: gameState.currentPiece.type,
      shape: SHAPES[gameState.currentPiece.type],
      x: Math.floor(COLS / 2) - Math.ceil(SHAPES[gameState.currentPiece.type][0].length / 2),
      y: 0,
      rotation: 0
    };
    
    gameState.currentPiece = {
      type: gameState.holdPiece.type,
      shape: SHAPES[gameState.holdPiece.type],
      x: Math.floor(COLS / 2) - Math.ceil(SHAPES[gameState.holdPiece.type][0].length / 2),
      y: 0,
      rotation: 0
    };
    
    gameState.holdPiece = temp;
  }
  
  // Mark that hold has been used for this piece
  gameState.hasHeld = true;
  
  // Update display
  updateHoldPieceDisplay();
  
  playSoundEffect('hold');
}

function checkLines() {
  let linesCleared = 0;
  let rowsToRemove = [];
  
  // Check each row from bottom to top
  for (let row = ROWS - 1; row >= 0; row--) {
    let isLineFull = true;
    
    // Check if every cell in the row is filled
    for (let col = 0; col < COLS; col++) {
      if (!gameState.grid[row][col]) {
        isLineFull = false;
        break;
      }
    }
    
    if (isLineFull) {
      rowsToRemove.push(row);
      linesCleared++;
    }
  }
  
  // Remove the cleared lines
  if (linesCleared > 0) {
    // Apply screen shake if enabled
    if (gameState.settings.screenShake) {
      applyScreenShake(linesCleared);
    }
    
    // Remove rows and add new empty rows at the top
    rowsToRemove.forEach(row => {
      gameState.grid.splice(row, 1);
      gameState.grid.unshift(Array(COLS).fill(null));
    });
    
    // Play sound effect based on number of lines cleared
    if (linesCleared === 4) {
      playSoundEffect('tetris');
    } else {
      playSoundEffect('clear');
    }
    
    // Update combo
    gameState.combo++;
    
    // Calculate score based on the number of lines cleared
    let scoreIncrease = 0;
    switch (linesCleared) {
      case 1:
        scoreIncrease = 100 * gameState.level;
        break;
      case 2:
        scoreIncrease = 300 * gameState.level;
        break;
      case 3:
        scoreIncrease = 500 * gameState.level;
        break;
      case 4:
        scoreIncrease = 800 * gameState.level;
        break;
    }
    
    // Apply combo multiplier
    if (gameState.combo > 1) {
      scoreIncrease *= 1 + (gameState.combo * 0.1);
    }
    
    // Update score and lines
    gameState.score += Math.floor(scoreIncrease);
    gameState.lines += linesCleared;
    
    // Check if level up
    const newLevel = Math.floor(gameState.lines / 10) + 1;
    if (newLevel > gameState.level) {
      gameState.level = newLevel;
      gameState.dropInterval = calculateDropInterval();
      playSoundEffect('levelup');
      
      // Show level up message if AI assistance is enabled
      if (gameState.settings.aiAssistance) {
        showAIMessage(`Level up! You're now at level ${gameState.level}. Speed increases!`);
      }
    }
    
    // Update UI
    updateScore();
    
    // Challenge mode: if certain level, add random blocks to bottom
    if (gameState.difficulty === 'challenge' && gameState.level > 2 && Math.random() < 0.3) {
      addChallengeRow();
    }
  } else {
    // Reset combo if no lines were cleared
    gameState.combo = 0;
  }
  
  return linesCleared;
}

function addChallengeRow() {
  // Add a row with random blocks at the bottom
  gameState.grid.pop(); // Remove top row
  
  // Create a new row with random blocks (some empty spaces)
  const newRow = [];
  for (let i = 0; i < COLS; i++) {
    // 70% chance of a block, 30% chance of empty
    if (Math.random() < 0.7) {
      const pieces = Object.keys(SHAPES);
      newRow[i] = pieces[Math.floor(Math.random() * pieces.length)];
    } else {
      newRow[i] = null;
    }
  }
  
  gameState.grid.push(newRow);
  
  if (gameState.settings.aiAssistance) {
    showAIMessage("Challenge mode: Random blocks added!");
  }
}

function applyScreenShake(intensity) {
  const container = document.getElementById('tetris-container');
  
  // Skip if reduced motion is enabled
  if (gameState.settings.reducedMotion) return;
  
  container.style.transform = `translate(${Math.random() * intensity * 3 - intensity * 1.5}px, ${Math.random() * intensity * 3 - intensity * 1.5}px)`;
  
  setTimeout(() => {
    container.style.transform = 'translate(0, 0)';
  }, 200);
}

// Drawing functions
function draw() {
  const ctx = gameState.ctx;
  
  // Clear the canvas
  ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
  
  // Draw the grid (filled blocks)
  drawGrid();
  
  // Draw the current falling piece
  drawPiece(gameState.currentPiece);
  
  // Draw ghost piece (preview of where the piece will land)
  drawGhostPiece();
}

function drawGrid() {
  const ctx = gameState.ctx;
  const colorMode = gameState.settings.colorBlindnessMode === 'none' ? 'regular' : 'colorblind';
  
  // Draw filled blocks
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (gameState.grid[row][col]) {
        const blockType = gameState.grid[row][col];
        
        // Draw block with appropriate color
        drawBlock(ctx, col, row, COLORS[blockType][colorMode]);
      }
    }
  }
  
  // Draw grid lines if high contrast mode is enabled
  if (gameState.settings.highContrast) {
    ctx.strokeStyle = 'var(--grid-border)';
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let col = 0; col <= COLS; col++) {
      ctx.beginPath();
      ctx.moveTo(col * BLOCK_SIZE, 0);
      ctx.lineTo(col * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let row = 0; row <= ROWS; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * BLOCK_SIZE);
      ctx.lineTo(COLS * BLOCK_SIZE, row * BLOCK_SIZE);
      ctx.stroke();
    }
  }
}

function drawPiece(piece) {
  if (!piece) return;
  
  const ctx = gameState.ctx;
  const colorMode = gameState.settings.colorBlindnessMode === 'none' ? 'regular' : 'colorblind';
  
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        // Only draw visible blocks (those on the grid)
        if (piece.y + row >= 0) {
          drawBlock(ctx, piece.x + col, piece.y + row, COLORS[piece.type][colorMode]);
        }
      }
    }
  }
}

function drawGhostPiece() {
  if (!gameState.currentPiece) return;
  
  // Create a copy of the current piece
  const ghostPiece = { ...gameState.currentPiece };
  
  // Find the drop position
  let dropDistance = 0;
  while (isValidMove(0, dropDistance + 1, ghostPiece)) {
    dropDistance++;
  }
  
  ghostPiece.y += dropDistance;
  
  // Draw the ghost piece semi-transparently
  const ctx = gameState.ctx;
  const colorMode = gameState.settings.colorBlindnessMode === 'none' ? 'regular' : 'colorblind';
  
  ctx.globalAlpha = 0.3;
  for (let row = 0; row < ghostPiece.shape.length; row++) {
    for (let col = 0; col < ghostPiece.shape[row].length; col++) {
      if (ghostPiece.shape[row][col]) {
        // Only draw visible blocks (those on the grid)
        if (ghostPiece.y + row >= 0) {
          drawBlock(ctx, ghostPiece.x + col, ghostPiece.y + row, COLORS[ghostPiece.type][colorMode]);
        }
      }
    }
  }
  ctx.globalAlpha = 1.0;
}

function drawBlock(ctx, x, y, color) {
  const blockStyle = gameState.settings.blockStyle;
  
  ctx.fillStyle = color;
  
  switch (blockStyle) {
    case 'standard':
      // Filled block with border
      ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      
      // Light edge (top, left)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(x * BLOCK_SIZE, y * BLOCK_SIZE);
      ctx.lineTo((x + 1) * BLOCK_SIZE, y * BLOCK_SIZE);
      ctx.lineTo(x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
      ctx.closePath();
      ctx.fill();
      
      // Dark edge (bottom, right)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.moveTo(x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
      ctx.lineTo((x + 1) * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
      ctx.lineTo((x + 1) * BLOCK_SIZE, y * BLOCK_SIZE);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'custom':
      // Rounded corners
      ctx.beginPath();
      ctx.roundRect(
        x * BLOCK_SIZE + 1, 
        y * BLOCK_SIZE + 1, 
        BLOCK_SIZE - 2, 
        BLOCK_SIZE - 2,
        4
      );
      ctx.fill();
      
      // Inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(
        x * BLOCK_SIZE + 4, 
        y * BLOCK_SIZE + 4, 
        BLOCK_SIZE - 8, 
        BLOCK_SIZE - 8,
        2
      );
      ctx.fill();
      break;
      
    case 'random':
      // Textured blocks
      ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      
      // Random pattern
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let i = 0; i < 3; i++) {
        const patternX = x * BLOCK_SIZE + Math.random() * BLOCK_SIZE;
        const patternY = y * BLOCK_SIZE + Math.random() * BLOCK_SIZE;
        const size = 2 + Math.random() * 6;
        
        ctx.beginPath();
        ctx.arc(patternX, patternY, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
  }
}

// Update UI displays
function updateScore() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('lines').textContent = gameState.lines;
  document.getElementById('level').textContent = gameState.level;
}

function updateNextPiecesDisplay() {
  const nextPiecesContainer = document.getElementById('next-pieces');
  const nextPieceDisplays = nextPiecesContainer.querySelectorAll('.next-piece-display');
  
  nextPieceDisplays.forEach((display, index) => {
    // Clear the display
    display.innerHTML = '';
    
    if (index < gameState.nextPieces.length) {
      // Create a mini canvas for each next piece
      const canvas = document.createElement('canvas');
      canvas.width = 4 * 15;  // Smaller block size for preview
      canvas.height = 4 * 15;
      display.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      const piece = gameState.nextPieces[index];
      const colorMode = gameState.settings.colorBlindnessMode === 'none' ? 'regular' : 'colorblind';
      
      // Center the piece in the preview
      const offsetX = (4 - piece.shape[0].length) / 2;
      const offsetY = (4 - piece.shape.length) / 2;
      
      // Draw the piece
      for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
          if (piece.shape[row][col]) {
            ctx.fillStyle = COLORS[piece.type][colorMode];
            ctx.fillRect((offsetX + col) * 15, (offsetY + row) * 15, 15, 15);
            
            // Add simple shading
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect((offsetX + col) * 15, (offsetY + row) * 15, 15, 2);
            ctx.fillRect((offsetX + col) * 15, (offsetY + row) * 15, 2, 15);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect((offsetX + col) * 15 + 13, (offsetY + row) * 15, 2, 15);
            ctx.fillRect((offsetX + col) * 15, (offsetY + row) * 15 + 13, 15, 2);
          }
        }
      }
    }
  });
}

function updateHoldPieceDisplay() {
  const holdPieceContainer = document.getElementById('hold-piece');
  
  // Clear the display
  holdPieceContainer.innerHTML = '';
  
  if (gameState.holdPiece) {
    // Create a mini canvas for the hold piece
    const canvas = document.createElement('canvas');
    canvas.width = 4 * 15;  // Smaller block size for preview
    canvas.height = 4 * 15;
    holdPieceContainer.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const piece = gameState.holdPiece;
    const colorMode = gameState.settings.colorBlindnessMode === 'none' ? 'regular' : 'colorblind';
    
    // Center the piece in the preview
    const offsetX = (4 - piece.shape[0].length) / 2;
    const offsetY = (4 - piece.shape.length) / 2;
    
    // Draw the piece
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          ctx.fillStyle = COLORS[piece.type][colorMode];
          ctx.fillRect((offsetX + col) * 15, (offsetY + row) * 15, 15, 15);
          
          // Add simple shading
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect((offsetX + col) * 15, (offsetY + row) * 15, 15, 2);
          ctx.fillRect((offsetX + col) * 15, (offsetY + row) * 15, 2, 15);
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect((offsetX + col) * 15 + 13, (offsetY + row) * 15, 2, 15);
          ctx.fillRect((offsetX + col) * 15, (offsetY + row) * 15 + 13, 15, 2);
        }
      }
    }
  }
}

// AI assistant functionality
function showAIMessage(message) {
  if (!gameState.settings.aiAssistance) return;
  
  const aiAssistant = document.getElementById('ai-assistant');
  const aiMessage = document.getElementById('ai-message');
  
  aiMessage.textContent = message;
  aiAssistant.classList.remove('hidden');
  
  // Hide message after a short delay
  setTimeout(() => {
    aiAssistant.classList.add('hidden');
  }, 5000);
}

function getAIFeedback() {
  let feedbackType = 'beginner';
  
  // Determine feedback type based on score and level
  if (gameState.score > 10000 && gameState.level >= 10) {
    feedbackType = 'expert';
  } else if (gameState.score > 5000 && gameState.level >= 5) {
    feedbackType = 'advanced';
  } else if (gameState.score > 2000 && gameState.level >= 3) {
    feedbackType = 'intermediate';
  }
  
  return gameState.aiMessages.feedback[feedbackType];
}

// Update game loop
function update(time = 0) {
  if (gameState.gameOver || gameState.isPaused) return;
  
  // Calculate time delta
  const deltaTime = time - gameState.lastTime;
  gameState.lastTime = time;
  
  // Update drop counter
  gameState.dropCounter += deltaTime;
  
  // Drop piece if interval reached
  if (gameState.dropCounter > gameState.dropInterval) {
    softDrop();
    gameState.dropCounter = 0;
  }
  
  // Render the game
  draw();
  
  // Continuing the game loop
  requestAnimationFrame(update);
}

function softDrop() {
  // Move the piece down if possible
  if (movePiece('down')) {
    // Add small score for soft drop
    gameState.score += 1;
    updateScore();
    return true;
  }
  
  // If the piece can't move down, lock it in place
  lockPiece();
  return false;
}

// Game over function
function gameOver() {
  gameState.gameOver = true;
  
  // Stop background music
  if (gameState.audio.bgm.current) {
    gameState.audio.bgm.current.pause();
  }
  
  // Play game over sound
  playSoundEffect('gameover');
  
  // Update final score on game over screen
  document.getElementById('final-score').textContent = gameState.score;
  document.getElementById('final-lines').textContent = gameState.lines;
  document.getElementById('final-level').textContent = gameState.level;
  
  // Show AI feedback if enabled
  if (gameState.settings.aiAssistance) {
    document.getElementById('ai-feedback').textContent = getAIFeedback();
  }
  
  // Check if score is a high score
  const highScores = gameState.highScores[gameState.difficulty] || [];
  const isHighScore = highScores.length < 10 || gameState.score > highScores[highScores.length - 1].score;
  
  if (isHighScore) {
    document.getElementById('high-score-input').classList.remove('hidden');
  } else {
    document.getElementById('high-score-input').classList.add('hidden');
  }
  
  // Show game over screen
  showScreen('game-over-screen');
}

// Event listeners
function setupEventListeners() {
  // Game menu buttons
  document.getElementById('start-button').addEventListener('click', () => {
    startGame();
  });
  
  // Difficulty selector
  document.querySelectorAll('.difficulty-button').forEach(button => {
    button.addEventListener('click', (e) => {
      document.querySelectorAll('.difficulty-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      e.target.classList.add('selected');
      gameState.difficulty = e.target.dataset.difficulty;
    });
  });
  
  // Theme selector
  document.querySelectorAll('.theme-button').forEach(button => {
    button.addEventListener('click', (e) => {
      document.querySelectorAll('.theme-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      e.target.classList.add('selected');
      setTheme(e.target.dataset.theme);
    });
  });
  
  // In-game controls
  document.getElementById('pause-button').addEventListener('click', togglePause);
  document.getElementById('restart-button').addEventListener('click', restartGame);
  document.getElementById('settings-button').addEventListener('click', () => {
    gameState.isPaused = true;
    showScreen('settings-screen');
  });
  
  // Pause screen
  document.getElementById('resume-button').addEventListener('click', resumeGame);
  document.getElementById('restart-paused-button').addEventListener('click', restartGame);
  document.getElementById('settings-paused-button').addEventListener('click', () => {
    showScreen('settings-screen');
  });
  document.getElementById('exit-button').addEventListener('click', exitToMenu);
  
  // Settings screen
  document.getElementById('music-volume').addEventListener('input', (e) => {
    gameState.settings.musicVolume = parseInt(e.target.value);
    updateVolume();
  });
  document.getElementById('sfx-volume').addEventListener('input', (e) => {
    gameState.settings.sfxVolume = parseInt(e.target.value);
    updateVolume();
  });
  document.getElementById('music-selection').addEventListener('change', (e) => {
    gameState.settings.musicSelection = e.target.value;
    if (!gameState.gameOver && !gameState.isPaused) {
      playBackgroundMusic();
    }
  });
  document.getElementById('block-style').addEventListener('change', (e) => {
    gameState.settings.blockStyle = e.target.value;
  });
  document.getElementById('color-blindness').addEventListener('change', (e) => {
    // Remove all color blindness classes first
    document.body.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    
    gameState.settings.colorBlindnessMode = e.target.value;
    
    if (e.target.value !== 'none') {
      document.body.classList.add(`colorblind-${e.target.value}`);
    }
  });
  document.getElementById('high-contrast').addEventListener('change', (e) => {
    gameState.settings.highContrast = e.target.checked;
    if (e.target.checked) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  });
  document.getElementById('screen-shake').addEventListener('change', (e) => {
    gameState.settings.screenShake = e.target.checked;
  });
  document.getElementById('reduced-motion').addEventListener('change', (e) => {
    gameState.settings.reducedMotion = e.target.checked;
    if (e.target.checked) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  });
  document.getElementById('ai-assistance').addEventListener('change', (e) => {
    gameState.settings.aiAssistance = e.target.checked;
    
    if (e.target.checked && !gameState.gameOver && !gameState.isPaused) {
      // Display a welcome back message
      showAIMessage("AI assistant activated! I'll provide tips as you play.");
    }
  });
  document.getElementById('controls-help-button').addEventListener('click', () => {
    showScreen('controls-help-screen');
  });
  document.getElementById('save-settings-button').addEventListener('click', () => {
    saveSettings();
    if (gameState.isPaused) {
      showScreen('pause-screen');
    } else {
      exitToMenu();
    }
  });
  document.getElementById('cancel-settings-button').addEventListener('click', () => {
    // Revert to saved settings
    loadSettings();
    if (gameState.isPaused) {
      showScreen('pause-screen');
    } else {
      exitToMenu();
    }
  });
  
  // Controls help screen
  document.getElementById('controls-back-button').addEventListener('click', () => {
    showScreen('settings-screen');
  });
  
  // Game over screen
  document.getElementById('play-again-button').addEventListener('click', restartGame);
  document.getElementById('view-leaderboard-button').addEventListener('click', () => {
    showLeaderboard();
    showScreen('leaderboard-screen');
  });
  document.getElementById('game-over-menu-button').addEventListener('click', exitToMenu);
  document.getElementById('save-score-button').addEventListener('click', () => {
    const playerName = document.getElementById('player-name').value.trim() || 'Player';
    saveHighScore(playerName, gameState.score, gameState.lines, gameState.level);
    
    // Hide the input after saving
    document.getElementById('high-score-input').classList.add('hidden');
    document.getElementById('player-name').value = '';
    
    // Show success message
    const feedbackEl = document.getElementById('ai-feedback');
    feedbackEl.textContent = "Score saved successfully!";
    
    // Update the leaderboard tabs
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
      if (tab.dataset.difficulty === gameState.difficulty) {
        tab.classList.add('selected');
      } else {
        tab.classList.remove('selected');
      }
    });
    
    // Show the updated leaderboard
    showLeaderboard();
    setTimeout(() => {
      showScreen('leaderboard-screen');
    }, 1500);
  });
  
  // Leaderboard screen
  document.getElementById('leaderboard-back-button').addEventListener('click', () => {
    if (gameState.gameOver) {
      showScreen('game-over-screen');
    } else {
      exitToMenu();
    }
  });
  document.querySelectorAll('.leaderboard-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.leaderboard-tab').forEach(t => {
        t.classList.remove('selected');
      });
      e.target.classList.add('selected');
      showLeaderboard(e.target.dataset.difficulty);
    });
  });
  
  // Power-ups
  document.querySelectorAll('.power-up').forEach(powerUp => {
    powerUp.addEventListener('click', (e) => {
      const type = e.currentTarget.dataset.type;
      activatePowerUp(type);
    });
  });
  
  // Mobile touch controls
  if (gameState.isMobile) {
    document.getElementById('left-button').addEventListener('click', () => {
      movePiece('left');
    });
    document.getElementById('right-button').addEventListener('click', () => {
      movePiece('right');
    });
    document.getElementById('down-button').addEventListener('click', () => {
      softDrop();
    });
    document.getElementById('rotate-button').addEventListener('click', () => {
      rotatePiece('clockwise');
    });
    document.getElementById('drop-button').addEventListener('click', () => {
      hardDrop();
    });
    document.getElementById('hold-button').addEventListener('click', () => {
      holdPiece();
    });
  }
  
  // Keyboard controls
  document.addEventListener('keydown', handleKeyDown);
}

function setupTouchControls() {
  // For mobile swipe controls
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  
  gameState.canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, {passive: true});
  
  gameState.canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = touchEndTime - touchStartTime;
    
    // Detect swipes that are short in duration and significant in distance
    if (deltaTime < 250) {
      if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          movePiece('right');
        } else {
          movePiece('left');
        }
      } else if (Math.abs(deltaY) > 30 && Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        if (deltaY > 0) {
          softDrop();
        } else {
          rotatePiece('clockwise');
        }
      }
    } else if (deltaTime < 100) {
      // Very quick tap - hard drop
      hardDrop();
    } else if (deltaTime < 500) {
      // Longer tap - rotation
      rotatePiece('clockwise');
    }
  }, {passive: true});
  
  // Prevent default touch behavior to avoid browser scrolling
  gameState.canvas.addEventListener('touchmove', (e) => {
    if (!gameState.gameOver && !gameState.isPaused) {
      e.preventDefault();
    }
  }, {passive: false});
}

function handleKeyDown(e) {
  if (gameState.gameOver) return;
  
  if (!gameState.isPaused) {
    switch (e.key) {
      case 'ArrowLeft':
        movePiece('left');
        break;
      case 'ArrowRight':
        movePiece('right');
        break;
      case 'ArrowDown':
        softDrop();
        break;
      case 'z':
      case 'Z':
        rotatePiece('counterclockwise');
        break;
      case 'x':
      case 'X':
        rotatePiece('clockwise');
        break;
      case ' ':
        hardDrop();
        break;
      case 'c':
      case 'C':
        holdPiece();
        break;
      case '1':
        activatePowerUp('slow-time');
        break;
      case '2':
        activatePowerUp('clear-row');
        break;
      case '3':
        activatePowerUp('swap-piece');
        break;
    }
  }
  
  // Controls that work even when paused
  switch (e.key) {
    case 'p':
    case 'P':
      togglePause();
      break;
    case 'r':
    case 'R':
      restartGame();
      break;
    case 'm':
    case 'M':
      toggleMute();
      break;
    case 'Escape':
      if (gameState.isPaused) {
        resumeGame();
      } else {
        togglePause();
      }
      break;
  }
}

// Game flow control
function togglePause() {
  if (gameState.gameOver) return;
  
  gameState.isPaused = !gameState.isPaused;
  
  if (gameState.isPaused) {
    // Pause background music
    if (gameState.audio.bgm.current) {
      gameState.audio.bgm.current.pause();
    }
    
    showScreen('pause-screen');
  } else {
    // Resume background music if not muted
    if (!gameState.audio.muted && gameState.audio.bgm.current) {
      gameState.audio.bgm.current.play().catch(e => console.error('Error playing audio:', e));
    }
    
    gameState.lastTime = performance.now();
    showScreen('game-screen');
    requestAnimationFrame(update);
  }
}

function resumeGame() {
  if (gameState.isPaused) {
    gameState.isPaused = false;
    
    // Resume background music if not muted
    if (!gameState.audio.muted && gameState.audio.bgm.current) {
      gameState.audio.bgm.current.play().catch(e => console.error('Error playing audio:', e));
    }
    
    gameState.lastTime = performance.now();
    showScreen('game-screen');
    requestAnimationFrame(update);
  }
}

function restartGame() {
  // Reset game state and start again
  gameState.gameOver = true; // Set to true before restarting
  startGame();
}

function exitToMenu() {
  // Stop the game and return to menu
  gameState.gameOver = true;
  gameState.isPaused = false;
  
  // Stop background music
  if (gameState.audio.bgm.current) {
    gameState.audio.bgm.current.pause();
  }
  
  showScreen('start-screen');
}

// Theme management
function setTheme(theme) {
  // Remove existing theme classes
  document.body.classList.remove('theme-retro', 'theme-neon', 'theme-nature', 'theme-sci-fi');
  
  // Add new theme class
  document.body.classList.add(`theme-${theme}`);
  
  // Update game state
  gameState.theme = theme;
}

// Leaderboard
function showLeaderboard(difficulty = gameState.difficulty) {
  const leaderboardList = document.getElementById('leaderboard-list');
  leaderboardList.innerHTML = '';
  
  const scores = gameState.highScores[difficulty] || [];
  
  if (scores.length === 0) {
    leaderboardList.innerHTML = '<p class="no-scores">No high scores yet. Play a game to set a record!</p>';
    return;
  }
  
  const table = document.createElement('table');
  table.className = 'leaderboard-table';
  
  // Create header row
  const header = document.createElement('tr');
  ['Rank', 'Name', 'Score', 'Lines', 'Level', 'Date'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    header.appendChild(th);
  });
  table.appendChild(header);
  
  // Create data rows
  scores.forEach((score, index) => {
    const row = document.createElement('tr');
    
    // Rank cell
    const rankCell = document.createElement('td');
    rankCell.textContent = index + 1;
    row.appendChild(rankCell);
    
    // Name cell
    const nameCell = document.createElement('td');
    nameCell.textContent = score.name;
    row.appendChild(nameCell);
    
    // Score cell
    const scoreCell = document.createElement('td');
    scoreCell.textContent = score.score;
    row.appendChild(scoreCell);
    
    // Lines cell
    const linesCell = document.createElement('td');
    linesCell.textContent = score.lines;
    row.appendChild(linesCell);
    
    // Level cell
    const levelCell = document.createElement('td');
    levelCell.textContent = score.level;
    row.appendChild(levelCell);
    
    // Date cell
    const dateCell = document.createElement('td');
    const date = new Date(score.date);
    dateCell.textContent = date.toLocaleDateString();
    row.appendChild(dateCell);
    
    table.appendChild(row);
  });
  
  leaderboardList.appendChild(table);
}

// Power-ups
function activatePowerUp(type) {
  if (gameState.gameOver || gameState.isPaused) return;
  
  switch (type) {
    case 'slow-time':
      if (!gameState.activePowerUps.slowTime) {
        gameState.activePowerUps.slowTime = true;
        
        // Apply slow time effect
        gameState.dropInterval = calculateDropInterval();
        
        // Show visual feedback
        document.getElementById('power-slow-time').classList.add('active');
        
        // Show AI message if enabled
        if (gameState.settings.aiAssistance) {
          showAIMessage("Slow Time activated! You have 15 seconds of reduced speed.");
        }
        
        // Play power-up sound
        playSoundEffect('powerup');
        
        // Set timer to deactivate
        if (gameState.powerUpTimers.slowTime) {
          clearTimeout(gameState.powerUpTimers.slowTime);
        }
        
        gameState.powerUpTimers.slowTime = setTimeout(() => {
          gameState.activePowerUps.slowTime = false;
          gameState.dropInterval = calculateDropInterval();
          document.getElementById('power-slow-time').classList.remove('active');
          
          if (gameState.settings.aiAssistance) {
            showAIMessage("Slow Time effect has ended.");
          }
        }, 15000); // 15 seconds duration
      }
      break;
      
    case 'clear-row':
      // Clear the bottom-most row with blocks
      let rowCleared = false;
      
      for (let row = ROWS - 1; row >= 0; row--) {
        if (gameState.grid[row].some(cell => cell !== null)) {
          // Found a row with at least one block
          gameState.grid.splice(row, 1);
          gameState.grid.unshift(Array(COLS).fill(null));
          rowCleared = true;
          
          // Update score
          gameState.score += 100 * gameState.level;
          gameState.lines += 1;
          
          // Check if level up
          const newLevel = Math.floor(gameState.lines / 10) + 1;
          if (newLevel > gameState.level) {
            gameState.level = newLevel;
            gameState.dropInterval = calculateDropInterval();
            playSoundEffect('levelup');
          }
          
          updateScore();
          break;
        }
      }
      
      if (rowCleared) {
        // Apply screen shake if enabled
        if (gameState.settings.screenShake) {
          applyScreenShake(1);
        }
        
        // Play effect
        playSoundEffect('clear');
        
        // Show visual feedback
        document.getElementById('power-clear-row').classList.add('active');
        setTimeout(() => {
          document.getElementById('power-clear-row').classList.remove('active');
        }, 500);
        
        // Show AI message if enabled
        if (gameState.settings.aiAssistance) {
          showAIMessage("Power-up used! A row has been cleared.");
        }
      }
      break;
      
    case 'swap-piece':
      // Swap current piece for a random new one
      const currentPiece = gameState.currentPiece;
      
      // Generate a new random piece
      const newPiece = generateRandomPiece();
      newPiece.x = currentPiece.x;
      newPiece.y = currentPiece.y;
      
      // Try to place the new piece - only swap if valid
      if (isValidMove(0, 0, newPiece)) {
        gameState.currentPiece = newPiece;
        
        // Play power-up sound
        playSoundEffect('powerup');
        
        // Show visual feedback
        document.getElementById('power-swap-piece').classList.add('active');
        setTimeout(() => {
          document.getElementById('power-swap-piece').classList.remove('active');
        }, 500);
        
        // Show AI message if enabled
        if (gameState.settings.aiAssistance) {
          showAIMessage("Piece swapped! Hope the new one helps.");
        }
      }
      break;
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add roundRect polyfill for browsers that don't support it
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
      if (width < 2 * radius) radius = width / 2;
      if (height < 2 * radius) radius = height / 2;
      this.beginPath();
      this.moveTo(x + radius, y);
      this.arcTo(x + width, y, x + width, y + height, radius);
      this.arcTo(x + width, y + height, x, y + height, radius);
      this.arcTo(x, y + height, x, y, radius);
      this.arcTo(x, y, x + width, y, radius);
      this.closePath();
      return this;
    };
  }
  
  // Initialize the game
  init();
});