import React, { useState, useEffect } from 'react';

const VirtualPet = ({ notes = [] }) => {
  const [position, setPosition] = useState(10);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [state, setState] = useState('idle'); // idle, walking, sad, happy
  
  useEffect(() => {
    // Determine overall mood
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const recentNotes = notes.filter(n => new Date(n.created_at) >= threeDaysAgo);
    
    if (recentNotes.length === 0) {
      setState('sad');
    } else {
      const recentAppreciation = recentNotes.filter(n => n.type === 'appreciation').length;
      if (recentAppreciation > 2) {
        setState('happy');
      } else {
        setState('idle'); // normal behavior
      }
    }
  }, [notes]);

  useEffect(() => {
    if (state === 'sad') return; // Sad pet just sits there

    const interval = setInterval(() => {
      // Randomly decide to walk or idle
      if (Math.random() > 0.7) {
        setState('walking');
        setDirection(Math.random() > 0.5 ? 1 : -1);
      } else {
        if (state !== 'happy') setState('idle');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === 'walking') {
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
  }, [state, direction]);

  const getPetEmoji = () => {
    if (state === 'sad') return '😿';
    if (state === 'happy') return '😻';
    if (state === 'walking') return direction === 1 ? '🐈' : '🐈';
    return '😺';
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: `${position}%`,
      transform: `scaleX(${direction})`,
      transition: state === 'walking' ? 'none' : 'all 0.5s ease',
      fontSize: '2rem',
      zIndex: 50,
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
      pointerEvents: 'none'
    }}>
      {getPetEmoji()}
      {state === 'happy' && (
        <span style={{ position: 'absolute', top: '-20px', right: 0, fontSize: '1rem', animation: 'float-up 1s infinite' }}>
          ❤️
        </span>
      )}
      {state === 'sad' && (
        <span style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '1rem', opacity: 0.7 }}>
          💧
        </span>
      )}
    </div>
  );
};

export default VirtualPet;
