import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const PresenceLayer = ({ author }) => {
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (!author) return;

    const room = supabase.channel('room_presence', {
      config: {
        presence: {
          key: author,
        },
      },
    });

    room
      .on('presence', { event: 'sync' }, () => {
        const state = room.presenceState();
        const users = {};
        for (const [key, value] of Object.entries(state)) {
          if (key !== author && value.length > 0) {
            // value is an array of connections for this user. We take the first one.
            users[key] = value[0];
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({
            author,
            x: -100,
            y: -100,
            timestamp: Date.now()
          });
        }
      });

    // Track mouse movement
    const handleMouseMove = (e) => {
      // Throttle broadcast to avoid spamming
      if (Math.random() > 0.5) {
        // Calculate relative position based on viewport
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        room.track({
          author,
          x,
          y,
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      room.unsubscribe();
    };
  }, [author]);

  return (
    <>
      {/* Online indicator at the top right */}
      {Object.keys(onlineUsers).length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(10px)',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }} className="animate-fade-in">
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4CAF50', animation: 'pulse-glow 2s infinite' }}></div>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>对方在线中</span>
        </div>
      )}

      {/* Render cursors */}
      {Object.entries(onlineUsers).map(([key, data]) => {
        if (!data.x || data.x < 0) return null;
        
        const cursorX = data.x * window.innerWidth;
        const cursorY = data.y * window.innerHeight;
        
        // Random color based on name length or something stable
        const color = key === '男方' ? '#4dabf7' : '#ff8787';

        return (
          <div key={key} className="live-cursor" style={{ transform: `translate(${cursorX}px, ${cursorY}px)` }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="cursor-svg">
              <path d="M5.65376 21.2674C5.04505 21.6056 4.30514 21.0506 4.45396 20.3703L7.30064 7.35165C7.45892 6.62804 8.28399 6.25701 8.92723 6.62125L20.8931 13.3957C21.4939 13.7359 21.4429 14.618 20.8037 14.8967L14.7733 17.5259C14.5422 17.6267 14.3541 17.8016 14.2388 18.0264L11.3931 23.5786C11.0872 24.1755 10.1873 24.135 9.9406 23.5126L5.65376 21.2674Z" fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <div className="cursor-label" style={{ backgroundColor: color }}>{key}</div>
          </div>
        );
      })}
    </>
  );
};

export default PresenceLayer;
