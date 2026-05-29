import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { playPopSound, playChimeSound } from '../utils/audio';

// Helper to play a sizzle/melting sound using Web Audio API
const playMeltSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = ctx.sampleRate * 0.1; // 0.1s noise burst
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
  } catch {
    // Audio Context might be blocked or unsupported by browser autoplays
  }
};

// Canvas Wax Seal Component
const WaxSealCanvas = ({ themeColor, onMelted }) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const scratchPoints = useRef(0);
  const requiredPoints = 40; // amount of scratching needed to melt

  // Draw the initial wax seal
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set size
    canvas.width = 120;
    canvas.height = 120;

    // Draw Wax Base
    const grad = ctx.createRadialGradient(60, 60, 10, 60, 60, 60);
    if (themeColor === 'burgundy') {
      grad.addColorStop(0, '#800f2f');
      grad.addColorStop(0.7, '#5c0f26');
      grad.addColorStop(1, '#3f0c1a');
    } else if (themeColor === 'navy') {
      grad.addColorStop(0, '#1d3557');
      grad.addColorStop(0.7, '#14213d');
      grad.addColorStop(1, '#0b0f19');
    } else { // gold
      grad.addColorStop(0, '#d4af37');
      grad.addColorStop(0.7, '#aa7c11');
      grad.addColorStop(1, '#785006');
    }

    // Outer uneven seal ring
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    // Create organic slightly uneven circle
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const r = 52 + Math.sin(angle * 8) * 2.5; // wavy edge
      const x = 60 + Math.cos(angle) * r;
      const y = 60 + Math.sin(angle) * r;
      if (angle === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Inner seal stamp circle
    ctx.shadowBlur = 0; // reset shadow
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(60, 60, 38, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Heart Icon in the center
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❤', 60, 60);

  }, [themeColor]);

  // Scratch action
  const scratch = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    scratchPoints.current += 1;
    if (scratchPoints.current % 3 === 0) playMeltSound();
    if (scratchPoints.current >= requiredPoints) {
      onMelted();
    }
  };

  const handleMouseDown = () => (isDrawing.current = true);
  const handleMouseUp = () => (isDrawing.current = false);
  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    scratch(e.clientX, e.clientY);
  };

  const handleTouchStart = () => (isDrawing.current = true);
  const handleTouchEnd = () => (isDrawing.current = false);
  const handleTouchMove = (e) => {
    if (!isDrawing.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  return (
    <div style={{ position: 'relative', width: '120px', height: '120px', cursor: 'grab' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}
      />
      {/* Target icon underneath */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          opacity: 0.25,
          zIndex: 1
        }}
      >
        🔓
      </div>
    </div>
  );
};

const LoveLetters = ({ capsules = [], author, onBack }) => {
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent' | 'write'
  const [letterText, setLetterText] = useState('');
  const [sealColor, setSealColor] = useState('burgundy'); // 'burgundy' | 'navy' | 'gold'
  const [unlockDate, setUnlockDate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [readingLetter, setReadingLetter] = useState(null);
  const [meltedStates, setMeltedStates] = useState({});

  // Parse [letter:color] prefix
  const parseLetter = (cap) => {
    const match = cap.text.match(/^\[letter:([a-z]+)\]\s*(.*)$/);
    if (match) {
      return {
        ...cap,
        isLetter: true,
        sealColor: match[1],
        cleanText: match[2]
      };
    }
    return {
      ...cap,
      isLetter: false,
      sealColor: 'burgundy',
      cleanText: cap.text
    };
  };

  // Compile letter capsules
  const parsedCapsules = capsules.map(parseLetter).filter(c => c.isLetter);
  const receivedLetters = parsedCapsules.filter(c => c.author !== author);
  const sentLetters = parsedCapsules.filter(c => c.author === author);

  const handleSendLetter = async (e) => {
    e.preventDefault();
    if (!letterText.trim()) return;
    setIsSending(true);

    const prefix = `[letter:${sealColor}] `;
    const combinedContent = prefix + letterText.trim();
    const finalUnlock = unlockDate || new Date().toISOString().split('T')[0]; // defaults to immediately unlocked

    await supabase.from('time_capsules').insert([
      { text: combinedContent, author, unlock_date: finalUnlock }
    ]);

    setLetterText('');
    setUnlockDate('');
    setSealColor('burgundy');
    setIsSending(false);
    playChimeSound();
    setActiveTab('sent');
  };

  const getSealThemeDetails = (color) => {
    switch (color) {
      case 'navy': return { color: '#1d3557', name: '深海之蓝', shadow: 'rgba(29, 53, 87, 0.4)' };
      case 'gold': return { color: '#d4af37', name: '誓言之金', shadow: 'rgba(212, 175, 55, 0.4)' };
      default: return { color: '#800f2f', name: '烈焰勃艮第', shadow: 'rgba(128, 15, 47, 0.4)' };
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>✉️ 我们的火漆情书信箱</h2>
        <button className="btn btn-outline" onClick={onBack}>返回首页</button>
      </header>

      {/* Tabs */}
      <div 
        style={{ 
          display: 'flex', 
          background: 'var(--glass-bg)', 
          borderRadius: 'var(--radius-md)', 
          padding: '4px', 
          marginBottom: '2rem',
          maxWidth: '450px',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxShadow: 'var(--glass-shadow)',
          border: '1px solid var(--glass-border)'
        }}
      >
        <button 
          onClick={() => { playPopSound(); setActiveTab('received'); }}
          style={{
            flex: 1, padding: '0.6rem', border: 'none', borderRadius: '18px',
            background: activeTab === 'received' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'received' ? '#fff' : 'var(--color-text)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.25s'
          }}
        >
          📥 收到的情书
        </button>
        <button 
          onClick={() => { playPopSound(); setActiveTab('sent'); }}
          style={{
            flex: 1, padding: '0.6rem', border: 'none', borderRadius: '18px',
            background: activeTab === 'sent' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'sent' ? '#fff' : 'var(--color-text)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.25s'
          }}
        >
          📤 寄出的信
        </button>
        <button 
          onClick={() => { playPopSound(); setActiveTab('write'); }}
          style={{
            flex: 1, padding: '0.6rem', border: 'none', borderRadius: '18px',
            background: activeTab === 'write' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'write' ? '#fff' : 'var(--color-text)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.25s'
          }}
        >
          ✏️ 撰写情书
        </button>
      </div>

      {/* Tab 1: Received Letters */}
      {activeTab === 'received' && (
        <div style={{ textAlign: 'left' }}>
          <h3 className="text-light" style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>收到的甜蜜信件 ({receivedLetters.length})</h3>
          {receivedLetters.length === 0 ? (
            <p className="text-light text-center" style={{ padding: '3rem' }}>收件箱空空的，快让对方给你写一封盖有火漆的情书吧 ✉️</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {receivedLetters.map(letData => {
                const isLocked = new Date() < new Date(letData.unlock_date);
                const theme = getSealThemeDetails(letData.sealColor);

                return (
                  <div 
                    key={letData.id} 
                    className="card animate-fade-in"
                    style={{ 
                      padding: '2rem 1.5rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      textAlign: 'center', 
                      background: 'var(--glass-bg)',
                      border: `1px solid ${theme.color}22`,
                      boxShadow: `0 8px 30px ${theme.shadow}15`
                    }}
                  >
                    {/* Retro Envelope Visual */}
                    <div 
                      style={{ 
                        width: '90px', 
                        height: '60px', 
                        border: `2px solid ${theme.color}`, 
                        borderRadius: '4px',
                        background: '#f8edeb',
                        position: 'relative',
                        marginBottom: '1.5rem',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* Envelop folding lines */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderBottom: `1px solid ${theme.color}44`, transform: 'skewY(20deg)', transformOrigin: 'top left' }} />
                      <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', borderBottom: `1px solid ${theme.color}44`, transform: 'skewY(-20deg)', transformOrigin: 'top right' }} />
                      
                      {/* 3D Wax Seal Circle Button */}
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: theme.color,
                          boxShadow: `0 2px 8px ${theme.color}88`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}
                      >
                        ❤
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--color-text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      来自 {letData.author} 的情书
                    </h4>
                    
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '1rem', display: 'block' }}>
                      寄于 {new Date(letData.created_at).toLocaleDateString()}
                    </span>

                    {isLocked ? (
                      <div style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        🔒 锁闭中 (将在 {new Date(letData.unlock_date).toLocaleDateString()} 开启)
                      </div>
                    ) : (
                      <button 
                        className="btn btn-outline" 
                        style={{ borderColor: theme.color, color: theme.color, padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}
                        onClick={() => { playPopSound(); setReadingLetter(letData); }}
                      >
                        📬 擦拭并开启信封
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sent Letters */}
      {activeTab === 'sent' && (
        <div style={{ textAlign: 'left' }}>
          <h3 className="text-light" style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>我寄出的信 ({sentLetters.length})</h3>
          {sentLetters.length === 0 ? (
            <p className="text-light text-center" style={{ padding: '3rem' }}>你还没有寄出过情书哦，快去写一封寄给对方吧 ✍️</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {sentLetters.map(letData => {
                const theme = getSealThemeDetails(letData.sealColor);
                return (
                  <div 
                    key={letData.id} 
                    className="card animate-fade-in"
                    style={{ 
                      padding: '1.5rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-start',
                      background: 'var(--glass-bg)',
                      borderLeft: `4px solid ${theme.color}`
                    }}
                  >
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                      <span>盖有印章：{theme.name}</span>
                      <span>{new Date(letData.created_at).toLocaleDateString()}</span>
                    </div>
                    <p 
                      style={{ 
                        fontSize: '0.95rem', 
                        color: 'var(--color-text)', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        width: '100%', 
                        marginBottom: '1rem',
                        fontStyle: 'italic'
                      }}
                    >
                      {letData.cleanText}
                    </p>
                    <button 
                      className="btn btn-outline" 
                      style={{ alignSelf: 'flex-end', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => { playPopSound(); setReadingLetter({ ...letData, bypassMelt: true }); }}
                    >
                      查看寄件 🔍
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Write Letter */}
      {activeTab === 'write' && (
        <div className="card" style={{ maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1.5rem' }}>写一封手写火漆情书 ✍️</h3>
          <form onSubmit={handleSendLetter} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* Wax Seal Theme selector */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>选择信封盖印火漆：</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['burgundy', 'navy', 'gold'].map(color => {
                  const details = getSealThemeDetails(color);
                  const isSelected = sealColor === color;
                  return (
                    <button
                      type="button"
                      key={color}
                      onClick={() => { playPopSound(); setSealColor(color); }}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: `1px solid ${isSelected ? details.color : 'var(--glass-border)'}`,
                        background: isSelected ? `${details.color}15` : 'rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}
                    >
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: details.color, boxShadow: `0 2px 5px ${details.color}66` }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? details.color : 'var(--color-text)' }}>{details.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unlock Date Config */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>设定收信解锁日期 (可选)：</label>
              <p className="text-light" style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>留空表示对方可以立刻打开；选择日期可作为未来的特别惊喜。</p>
              <input 
                type="date" 
                className="form-control" 
                value={unlockDate} 
                onChange={(e) => setUnlockDate(e.target.value)} 
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Letter Text */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>情书内容：</label>
              <textarea
                className="form-control"
                placeholder="亲爱的，见信好。想和你说..."
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                style={{ minHeight: '200px' }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSending}>
              {isSending ? '正在用热熔胶盖印信封...' : '盖上火漆，投入邮箱 📮'}
            </button>
          </form>
        </div>
      )}

      {/* Reader Dialog Overlay */}
      {readingLetter && (
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(20, 20, 25, 0.85)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '1.5rem'
          }}
        >
          <div 
            style={{
              background: '#fcfbf7', // vintage paper white
              border: '1px solid #dcdad4',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            {/* If bypassMelt (viewing sent letter) or already melted in this session */}
            {readingLetter.bypassMelt || meltedStates[readingLetter.id] ? (
              <div className="animate-fade-in" style={{ width: '100%', textAlign: 'left' }}>
                {/* Envelope Seal Indicator */}
                <div style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>🔓 💌</div>
                
                {/* Letter Header */}
                <div style={{ fontSize: '0.85rem', color: '#9e9c96', borderBottom: '1px solid #e8e6df', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>写信人: <b>{readingLetter.author}</b></span>
                  <span>{new Date(readingLetter.created_at).toLocaleDateString()}</span>
                </div>

                {/* Letter Content with classic Serif font */}
                <p 
                  style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontSize: '1.15rem', 
                    color: '#3d3c3a', 
                    fontFamily: '"STKaiti", "KaiTi", "Georgia", serif',
                    lineHeight: '1.8',
                    minHeight: '150px',
                    maxHeight: '40vh',
                    overflowY: 'auto',
                    padding: '0 0.5rem',
                    animation: 'typewriterReveal 1s ease forwards'
                  }}
                >
                  {readingLetter.cleanText}
                </p>

                {/* Close Button */}
                <button 
                  className="btn btn-outline" 
                  style={{ width: '100%', marginTop: '2rem', border: '1px solid #c8c6bf', color: '#4a4947' }}
                  onClick={() => setReadingLetter(null)}
                >
                  折叠信件并收起
                </button>
              </div>
            ) : (
              // Scratch Wax Seal view
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '1.5rem', 
                  textAlign: 'center' 
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>🕯️</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#4a4947' }}>手指来回摩擦火漆印章以融化封蜡</h3>
                <p style={{ fontSize: '0.85rem', color: '#8e8c87', maxWidth: '300px' }}>
                  这是一封来自 <b>{readingLetter.author}</b> 的私密信件。请用滑动手势融开火漆封印。
                </p>
                
                {/* Interactive Canvas Scratch Seal */}
                <WaxSealCanvas 
                  themeColor={readingLetter.sealColor} 
                  onMelted={() => {
                    playChimeSound();
                    setMeltedStates(prev => ({ ...prev, [readingLetter.id]: true }));
                  }}
                />

                <button 
                  className="btn btn-outline" 
                  style={{ border: '1px solid #c8c6bf', color: '#8e8c87', padding: '0.4rem 1.5rem', fontSize: '0.85rem', marginTop: '1rem' }}
                  onClick={() => setReadingLetter(null)}
                >
                  暂不开封
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Typewriter keyframes style inject */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes typewriterReveal {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default LoveLetters;
