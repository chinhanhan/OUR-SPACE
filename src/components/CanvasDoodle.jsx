import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

const CanvasDoodle = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#E07A5F'); // Default love color
  
  const colors = ['#E07A5F', '#3D405B', '#81B29A', '#F2CC8F', '#E0A96D'];

  useImperativeHandle(ref, () => ({
    getBlob: async () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      // Check if canvas is empty (we don't want to upload blank doodles)
      const ctx = canvas.getContext('2d');
      const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
      const isBlank = !pixelBuffer.some(color => color !== 0);
      if (isBlank) return null;

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      });
    },
    clear: () => {
      clearCanvas();
    }
  }));

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set display size
    canvas.style.width = '100%';
    canvas.style.height = '200px';
    canvas.style.touchAction = 'none'; // Prevent scrolling while drawing
    
    // Set actual size in memory (scaled for retina displays)
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
  };

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, []);

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (event.touches && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    }
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // Clear keeping the dpr scale in mind
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {colors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: c,
                border: color === c ? '3px solid var(--color-primary)' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0
              }}
            />
          ))}
        </div>
        <button 
          type="button" 
          onClick={clearCanvas} 
          className="btn btn-outline" 
          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
        >
          清空画板
        </button>
      </div>
      <div style={{ border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.5)' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
});

export default CanvasDoodle;
