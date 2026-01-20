const MAX_MOVE_DISTANCE = 2;

export const isValidMove = (row, col, board, currentPlayer, bluePos, blackPos) => {
  if (board[row][col] !== null) return false;
  
  const pos = currentPlayer === 'blue' ? bluePos : blackPos;
  const opponentPos = currentPlayer === 'blue' ? blackPos : bluePos;
  
  // make player block opponent
  if (row === opponentPos.row && col === opponentPos.col) return false;
  
  // block same position
  if (row === pos.row && col === pos.col) return false;
  
  const rowDiff = row - pos.row;
  const colDiff = col - pos.col;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);
  
  // move in a straight line (horizontal, vertical, or diagonal)
  // Horizontal: rowDiff = 0
  // Vertical: colDiff = 0
  // Diagonal: absRowDiff = absColDiff
  if (rowDiff !== 0 && colDiff !== 0 && absRowDiff !== absColDiff) {
    return false; // Not a valid queen-like move
  }
  
  // Check if within max distance (2 squares)
  const distance = Math.max(absRowDiff, absColDiff);
  if (distance > MAX_MOVE_DISTANCE) return false;
  
  // check available path
  const rowStep = rowDiff === 0 ? 0 : rowDiff / absRowDiff;
  const colStep = colDiff === 0 ? 0 : colDiff / absColDiff;
  
  let currentRow = pos.row + rowStep;
  let currentCol = pos.col + colStep;
  
  // Check each square along the path
  while (currentRow !== row || currentCol !== col) {
    if (board[currentRow][currentCol] !== null || 
        (currentRow === opponentPos.row && currentCol === opponentPos.col)) {
      return false;
    }
    
    currentRow += rowStep;
    currentCol += colStep;
  }
  
  return true;
};

export const getValidMoves = (pos, opponentPos, board, boardSize) => {
  const moves = [];
  
  const directions = [
    { dr: -1, dc: 0 },   // up
    { dr: 1, dc: 0 },    // down
    { dr: 0, dc: -1 },   // left
    { dr: 0, dc: 1 },    // right
    { dr: -1, dc: -1 },  // up-left
    { dr: -1, dc: 1 },   // up-right
    { dr: 1, dc: -1 },   // down-left
    { dr: 1, dc: 1 }     // down-right
  ];
  
  for (const dir of directions) {
    
    for (let distance = 1; distance <= MAX_MOVE_DISTANCE; distance++) {
      const r = pos.row + (dir.dr * distance);
      const c = pos.col + (dir.dc * distance);
      
      if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) {
        break;
      }
      
      // check square is blocked or has opponent
      if (board[r][c] !== null || (r === opponentPos.row && c === opponentPos.col)) {
        break;
      }
      
      moves.push({ row: r, col: c });
    }
  }
  
  return moves;
};

export const checkGameOver = (playerPos, opponentPos, board, boardSize) => {
  return getValidMoves(playerPos, opponentPos, board, boardSize).length === 0;
};