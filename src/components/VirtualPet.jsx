import { useState, useEffect } from 'react';

const VirtualPet = ({ notes = [] }) => {
  const [position, setPosition] = useState(10);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [activity, setActivity] = useState('idle'); // idle, walking
  
  // Determine overall mood from notes
  const baseMood = (() => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const recentNotes = notes.filter(n => new Date(n.created_at) >= threeDaysAgo);
    
    if (recentNotes.length === 0) {
      return 'sad';
    }
    const recentAppreciation = recentNotes.filter(n => n.type === 'appreciation').length;
    if (recentAppreciation > 2) {
      return 'happy';
    }
    return 'idle'; // normal behavior
  })();

  // Adjust activity during render if pet becomes sad
  const [prevBaseMood, setPrevBaseMood] = useState(baseMood);
  if (baseMood !== prevBaseMood) {
    setPrevBaseMood(baseMood);
    if (baseMood === 'sad') {
      setActivity('idle');
    }
  }

  const currentState = baseMood === 'sad' ? 'sad' : (activity === 'walking' ? 'walking' : baseMood);

  useEffect(() => {
    if (baseMood === 'sad') return;

    const interval = setInterval(() => {
      // Randomly decide to walk or idle
      if (Math.random() > 0.7) {
        setActivity('walking');
        setDirection(Math.random() > 0.5 ? 1 : -1);
      } else {
        setActivity('idle');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [baseMood]);

  useEffect(() => {
    if (currentState === 'walking') {
      const move = setInterval(() => {
        setPosition(prev => {
          let next = prev + (direction * 1);
          if (next > 90) {
            setDirection(-1);
            return 90;
          }
          if (next < 5) {
            setDirection(1);
            return 5;
          }
          return next;
        });
      }, 50);
      return () => clearInterval(move);
    }
  }, [currentState, direction]);

  const getPetEmoji = () => {
    if (currentState === 'sad') return '😿';
    if (currentState === 'happy') return '😻';
    if (currentState === 'walking') return '🐈';
    return '😺';
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: `${position}%`,
      transform: `scaleX(${direction})`,
      transition: currentState === 'walking' ? 'none' : 'all 0.5s ease',
      fontSize: '2rem',
      zIndex: 50,
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
      pointerEvents: 'none'
    }}>
      {getPetEmoji()}
      {currentState === 'happy' && (
        <span style={{ position: 'absolute', top: '-20px', right: 0, fontSize: '1rem', animation: 'float-up 1s infinite' }}>
          ❤️
        </span>
      )}
      {currentState === 'sad' && (
        <span style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '1rem', opacity: 0.7 }}>
          💧
        </span>
      )}
    </div>
  );
};

export default VirtualPet;
