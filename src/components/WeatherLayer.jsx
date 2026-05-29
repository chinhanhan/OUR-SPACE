import { useEffect, useRef } from 'react';

const WeatherLayer = ({ notes = [] }) => {
  const canvasRef = useRef(null);

  // Derive weather type from notes
  const weatherType = (() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentNotes = notes.filter(n => new Date(n.created_at) >= sevenDaysAgo);
    
    const appreciation = recentNotes.filter(n => n.type === 'appreciation').length;
    const concern = recentNotes.filter(n => n.type === 'concern').length;

    if (concern > appreciation && concern > 0) {
      return 'rain';
    } else if (appreciation > concern && appreciation > 2) {
      return 'sunshine';
    }
    return 'clear';
  })();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || weatherType === 'clear') return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const particles = [];

    if (weatherType === 'rain') {
      for (let i = 0; i < 100; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          l: Math.random() * 20 + 10,
          xs: -4 + Math.random() * 4 + 2,
          ys: Math.random() * 10 + 10
        });
      }
    } else if (weatherType === 'sunshine') {
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 3 + 1,
          xs: (Math.random() - 0.5) * 1,
          ys: (Math.random() - 0.5) * 1,
          opacity: Math.random()
        });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (weatherType === 'rain') {
        ctx.strokeStyle = 'rgba(174,194,224,0.5)';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.l * p.xs / p.ys, p.y + p.l);
          ctx.stroke();
          
          p.x += p.xs;
          p.y += p.ys;
          if (p.x > canvas.width || p.y > canvas.height) {
            p.x = Math.random() * canvas.width;
            p.y = -20;
          }
        }
      } else if (weatherType === 'sunshine') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 223, 137, ${p.opacity})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          
          p.x += p.xs;
          p.y -= Math.abs(p.ys); // Float up
          p.opacity += (Math.random() - 0.5) * 0.05;
          if (p.opacity < 0) p.opacity = 0;
          if (p.opacity > 1) p.opacity = 1;
          
          if (p.y < -10) {
            p.y = canvas.height + 10;
            p.x = Math.random() * canvas.width;
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weatherType]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1, // Behind the content, but in front of background
        transition: 'opacity 2s',
        opacity: weatherType === 'clear' ? 0 : 1
      }}
    />
  );
};

export default WeatherLayer;
