import React, { useState, useEffect, useRef } from "react";
import "./PianoTileGame.css"; // Using your existing CSS file

const PianoTileGame = () => {
  const [tiles, setTiles] = useState([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const gameAreaRef = useRef(null);
  const audioRef = useRef(null);

  // Define the columns for the tiles
  const columns = [0, 1, 2, 3];
  
  // Colors for the tiles (matching the Piano Fire app)
  const tileColors = {
    0: "#00BFFF", // Bright blue
    1: "#191970", // Dark blue
    2: "#FF69B4", // Pink
    3: "#9400D3"  // Purple
  };
  
  // Initialize audio when component mounts
  useEffect(() => {
    // Create audio element with the correct path
    audioRef.current = new Audio("/audio/Jingle Bells 3.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.loop = true;
    
    // Add event listeners
    audioRef.current.addEventListener('canplaythrough', () => {
      console.log("Audio loaded successfully");
      setAudioLoaded(true);
    });
    
    audioRef.current.addEventListener('error', (e) => {
      console.error("Failed to load audio:", e);
    });
    
    // Clean up audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);
  
  // Start the game
  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setTiles([]);
    addTile(); // Add initial tile
    
    // Start playing background music
    playAudio();
  };

  // Play audio with error handling
  const playAudio = () => {
    if (audioRef.current && !isMuted) {
      // Reset the audio position
      audioRef.current.currentTime = 0;
      
      // Play with error handling
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio playing successfully");
          })
          .catch(error => {
            console.error("Audio playback failed:", error);
          });
      }
    }
  };

  // Stop the game and music
  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    
    // Stop music when game ends
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Toggle mute/unmute background music
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    if (audioRef.current) {
      if (newMuteState) {
        audioRef.current.pause();
      } else if (isPlaying) {
        playAudio();
      }
    }
  };

  // Add a new tile in a random column
  const addTile = () => {
    if (!isPlaying) return;
    
    const randomColumn = columns[Math.floor(Math.random() * columns.length)];
    
    setTiles(prevTiles => [
      ...prevTiles,
      {
        id: Date.now(),
        column: randomColumn,
        position: -25, // Start above the screen
        hit: false,
        missed: false
      }
    ]);
  };

  // Handle tile touch/click
  const handleTileClick = (tileId) => {
    if (!isPlaying || gameOver) return;
    
    // If first click, try to play audio (browser autoplay policy workaround)
    if (audioRef.current && !audioRef.current.paused === false && !isMuted) {
      playAudio();
    }
    
    setTiles(prevTiles => 
      prevTiles.map(tile => 
        tile.id === tileId && !tile.hit && !tile.missed
          ? { ...tile, hit: true }
          : tile
      )
    );
    
    setScore(prevScore => prevScore + 1);
    
    // Add new tile when one is hit
    setTimeout(() => {
      if (isPlaying && !gameOver) {
        addTile();
      }
    }, 100);
  };

  // Update tile positions and check for missed tiles
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    
    const interval = setInterval(() => {
      setTiles(prevTiles => {
        const updatedTiles = prevTiles.map(tile => ({
          ...tile,
          position: tile.position + 1,
          // Mark as missed if it goes off screen without being hit
          missed: tile.position > 100 && !tile.hit ? true : tile.missed
        }));
        
        // Check for missed tiles to end game
        const missedTile = updatedTiles.find(tile => tile.missed);
        if (missedTile) {
          endGame();
        }
        
        // Remove tiles that are hit or off screen
        return updatedTiles.filter(tile => 
          (tile.hit && tile.position <= 110) || 
          (!tile.hit && tile.position <= 105)
        );
      });
    }, 16); // ~60fps for smooth animation
    
    return () => clearInterval(interval);
  }, [isPlaying, gameOver]);

  // Add new tiles on a timer
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    
    const newTileInterval = setInterval(() => {
      addTile();
    }, 2000); // Add a new tile every 2 seconds
    
    return () => clearInterval(newTileInterval);
  }, [isPlaying, gameOver]);

  return (
    <div className="game-container">
      {/* Game header */}
      <div className="game-header">
        <h1>Piano Fire</h1>
        <div className="score">Score: {score}</div>
        <button 
          className="mute-button" 
          onClick={toggleMute}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
            position: "absolute",
            top: "15px",
            right: "15px"
          }}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>
      
      {/* Game area */}
      <div 
        ref={gameAreaRef}
        className="game-area"
        onClick={() => {
          if (!isPlaying && audioRef.current && !isMuted) {
            // Try to play audio on any click to solve autoplay restrictions
            playAudio();
          }
        }}
      >
        {/* Grid columns */}
        <div className="columns">
          {columns.map(column => (
            <div 
              key={column}
              className="column"
            ></div>
          ))}
        </div>
        
        {/* Tiles */}
        {tiles.map(tile => (
          <div
            key={tile.id}
            className={`tile ${tile.hit ? 'hit' : ''}`}
            style={{
              top: `${tile.position}%`,
              left: `${tile.column * 25}%`,
              backgroundColor: tileColors[tile.column],
            }}
            onClick={() => handleTileClick(tile.id)}
          >
            {tile.hit && <div className="hit-circle"></div>}
          </div>
        ))}
        
        {/* Game over overlay */}
        {gameOver && (
          <div className="overlay">
            <div className="game-over">Game Over</div>
            <div className="final-score">Score: {score}</div>
            <button
              className="play-button"
              onClick={startGame}
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Start game overlay */}
        {!isPlaying && !gameOver && (
          <div className="overlay">
            <div className="title">Piano Fire</div>
            <button
              className="play-button"
              onClick={() => {
                startGame();
                // Try to play audio directly on button click (user interaction)
                playAudio();
              }}
            >
              Play Now
            </button>
            <div className="instructions">Tap the tiles as they fall down</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PianoTileGame;