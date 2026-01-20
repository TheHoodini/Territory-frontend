import { useState, useEffect, useRef } from 'react';
import './App.css';
import { isValidMove, checkGameOver } from './gameLogic';

const BOARD_SIZE = 9;

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [board, setBoard] = useState([]);
  const [bluePos, setBluePos] = useState({ row: 0, col: 0 });
  const [blackPos, setBlackPos] = useState({ row: BOARD_SIZE - 1, col: BOARD_SIZE - 1 });
  const [currentPlayer, setCurrentPlayer] = useState('blue');
  const [winner, setWinner] = useState(null);
  const [hoveredPlayer, setHoveredPlayer] = useState(false);

  // Online mode 
  const [menuMode, setMenuMode] = useState('main'); // 'main', 'online'
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [myPlayerColor, setMyPlayerColor] = useState(null);
  const [playerNames, setPlayerNames] = useState({ blue: 'Blue', black: 'Black' });
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [, setConnectionStatus] = useState('disconnected');

  const wsRef = useRef(null);

  // WebSocket 
  useEffect(() => {
    if (isOnlineMode && !wsRef.current) {
      // Railway deployment URL
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to server');
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // eslint-disable-next-line react-hooks/immutability
        handleWebSocketMessage(data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        console.log('Disconnected from server');
        setConnectionStatus('disconnected');
        wsRef.current = null;
      };

      wsRef.current = ws;
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [isOnlineMode]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'room_created':
        setRoomCode(data.roomCode);
        setMyPlayerColor('blue');
        setPlayerNames(prev => ({ ...prev, blue: playerName }));
        setWaitingForPlayer(true);
        break;

      case 'room_joined':
        setRoomCode(data.roomCode);
        setMyPlayerColor('black');
        setPlayerNames({ blue: data.blueName, black: playerName });
        startOnlineGame();
        break;

      case 'player_joined':
        setPlayerNames(prev => ({ ...prev, black: data.playerName }));
        setWaitingForPlayer(false);
        startOnlineGame();
        break;

      case 'game_start':
        break;

      case 'move':
        handleOpponentMove(data.row, data.col, data.player);
        break;

      case 'game_over':
        setWinner(data.winner);
        break;

      case 'error':
        alert(data.message);
        break;

      case 'room_expired':
        alert('Room expired due to inactivity');
        backToMenu();
        break;

      case 'player_disconnected':
        setWinner(null);
        setTimeout(() => {
          alert('Opponent disconnected');
          backToMenu();
        }, 100);
        break;


      default:
        break;
    }
  };

  const startOnlineGame = () => {
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    setBoard(newBoard);
    setBluePos({ row: 0, col: 0 });
    setBlackPos({ row: BOARD_SIZE - 1, col: BOARD_SIZE - 1 });
    setCurrentPlayer('blue');
    setWinner(null);
    setHoveredPlayer(false);
    setGameStarted(true);
    setWaitingForPlayer(false);
  };

  const applyMove = (player, newRow, newCol) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => [...r]);

      const oldPos = player === 'blue' ? bluePos : blackPos;

      newBoard[oldPos.row][oldPos.col] = player;

      if (player === 'blue') {
        setBluePos({ row: newRow, col: newCol });
      } else {
        setBlackPos({ row: newRow, col: newCol });
      }

      return newBoard;
    });

    setCurrentPlayer(prev => (prev === 'blue' ? 'black' : 'blue'));
  };


  const getCurrentPlayerName = () => {
    if (isOnlineMode && currentPlayer === myPlayerColor) {
      return playerName;
    }
    return playerNames[currentPlayer] || currentPlayer;
  };


  const handleOpponentMove = (row, col, player) => {
    applyMove(player, row, col);

    const opponentPos = player === 'blue' ? blackPos : bluePos; 
    const currentPos = player === 'blue' ? { row, col } : { row, col };

    if (checkGameOver(opponentPos, currentPos, board, BOARD_SIZE)) {
      setWinner(player);
    }
  };



  const createRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'create_room',
        playerName: playerName.trim()
      }));
    }
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!joinRoomInput.trim()) {
      alert('Please enter a room code');
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_room',
        roomCode: joinRoomInput.trim().toUpperCase(),
        playerName: playerName.trim()
      }));
    }
  };

  const startGame = () => {
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    setBoard(newBoard);
    setBluePos({ row: 0, col: 0 });
    setBlackPos({ row: BOARD_SIZE - 1, col: BOARD_SIZE - 1 });
    setCurrentPlayer('blue');
    setWinner(null);
    setHoveredPlayer(false);
    setGameStarted(true);
    setIsOnlineMode(false);
    setPlayerNames({ blue: 'Blue', black: 'Black' });
  };

  const backToMenu = () => {
    setGameStarted(false);
    setMenuMode('main');
    setIsOnlineMode(false);
    setWaitingForPlayer(false);
    setRoomCode('');
    setPlayerName('');
    setJoinRoomInput('');
    setMyPlayerColor(null);
    setWinner(null);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };


  const handleSquareClick = (row, col) => {
    if (winner) return;
    if (!isValidMove(row, col, board, currentPlayer, bluePos, blackPos, BOARD_SIZE)) return;
    if (isOnlineMode && currentPlayer !== myPlayerColor) return;
    if (isOnlineMode && !wsRef.current) return;

    applyMove(currentPlayer, row, col);

    if (isOnlineMode && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'move',
        roomCode,
        row,
        col,
        player: currentPlayer
      }));
    }

    const currentPos = currentPlayer === 'blue' ? { row, col } : (currentPlayer === 'black' ? { row, col } : null);
    const opponentPos = currentPlayer === 'blue' ? blackPos : bluePos;

    if (checkGameOver(opponentPos, currentPos, board, BOARD_SIZE)) {
      setWinner(currentPlayer);
      if (isOnlineMode && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'game_over',
          roomCode,
          winner: currentPlayer
        }));
      }
    }
  };


  const renderSquare = (row, col) => {
    const isBlue = bluePos.row === row && bluePos.col === col;
    const isBlack = blackPos.row === row && blackPos.col === col;
    const isValid = !winner && isValidMove(row, col, board, currentPlayer, bluePos, blackPos, BOARD_SIZE);
    const showPath = hoveredPlayer && isValid;

    let className = 'square';
    if (showPath) {
      className += ' valid-move';
    } else if (board[row][col] === 'blue') {
      className += ' blocked-blue';
    } else if (board[row][col] === 'black') {
      className += ' blocked-black';
    } else {
      className += ' empty';
    }
    if (isValid) {
      className += ' valid';
    }

    return (
      <div
        key={`${row}-${col}`}
        className={className}
        onClick={() => handleSquareClick(row, col)}
      >
        {isBlue && (
          <div
            className="player-circle player-blue"
            onMouseEnter={() => !winner && currentPlayer === 'blue' && setHoveredPlayer(true)}
            onMouseLeave={() => setHoveredPlayer(false)}
          />
        )}
        {isBlack && (
          <div
            className="player-circle player-black"
            onMouseEnter={() => !winner && currentPlayer === 'black' && setHoveredPlayer(true)}
            onMouseLeave={() => setHoveredPlayer(false)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="container">
      {!gameStarted && <h1>Territory</h1>}

      {!gameStarted && menuMode === 'main' && (
        <div className="menu">
          <button className="play-local" onClick={startGame}>Play Locally</button>
          <button className="play-online" onClick={() => { setMenuMode('online'); setIsOnlineMode(true); }}>
            Play Online
          </button>
        </div>
      )}

      {!gameStarted && menuMode === 'online' && !waitingForPlayer && (
        <div className="online-menu">
          <div className="online-section">
            <h2>Join a Room</h2>
            <input
              type="text"
              placeholder="Room Code"
              maxLength={5}
              value={joinRoomInput}
              onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
              className="room-input"
            />
            <input
              type="text"
              placeholder="Name"
              maxLength={10}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="name-input"
            />
            <button className="join-button" onClick={joinRoom}>Join</button>
          </div>

          <div className="online-divider">OR</div>

          <div className="online-section">
            <h2>Create a Room</h2>
            <input
              type="text"
              placeholder="Name"
              maxLength={10}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="name-input"
            />
            <button className="create-button" onClick={createRoom}>Create</button>
          </div>

          <button className="back-button" onClick={backToMenu}>Back to Menu</button>
        </div>
      )}

      {!gameStarted && waitingForPlayer && (
        <div className="waiting-room">
          <h2>Waiting for Player...</h2>
          <div className="room-code-display">
            <p>Room Code:</p>
            <div className="code">{roomCode}</div>
          </div>
          <p className="waiting-text">Share this code!</p>
          <button className="back-button" onClick={backToMenu}>Cancel</button>
        </div>
      )}

      {gameStarted && (
        <div>
          <div className="game-info">
            {isOnlineMode && roomCode && (
              <div className="room-code-small">Room: {roomCode}</div>
            )}
            {winner ? (
              <div className="winner-text" style={{ color: winner === 'blue' ? '#316dee' : '#e3e3e6' }}>
                {playerNames[winner]} wins!
              </div>
            ) : (
              <div style={{ color: currentPlayer === 'blue' ? '#316dee' : '#e3e3e6' }}>
                {getCurrentPlayerName()}'s turn
                {isOnlineMode && currentPlayer === myPlayerColor && ' (You)'}
              </div>
            )}
          </div>
          <div className="board" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}>
            {board.map((row, rowIndex) =>
              row.map((_, colIndex) => renderSquare(rowIndex, colIndex))
            )}
          </div>
          <button className="back-button" onClick={backToMenu}>Back to Menu</button>
        </div>
      )}
    </div>
  );
}

export default App;