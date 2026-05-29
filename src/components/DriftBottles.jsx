import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { playPopSound, playChimeSound } from '../utils/audio';

// Web Audio API Cork popping sound
const playCorkPopSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio Context might be blocked or unsupported by browser autoplays
  }
};

const getRandomIndex = (length) => {
  return Math.floor(Math.random() * length);
};

const DriftBottles = ({ notes = [], author, onBack, isBackgroundOnly = false }) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [openedBottle, setOpenedBottle] = useState(null);
  
  // Track read bottle IDs in localStorage
  const [readBottleIds, setReadBottleIds] = useState(() => {
    const saved = localStorage.getItem('our-space-read-bottles');
    return saved ? JSON.parse(saved) : [];
  });

  // Filter bottles from notes
  const parseBottle = (n) => {
    const match = n.text.match(/^\[bottle\]\s*(.*)$/);
    if (match) {
      return {
        ...n,
        isBottle: true,
        cleanText: match[1]
      };
    }
    return {
      ...n,
      isBottle: false,
      cleanText: n.text
    };
  };

  const parsedBottles = notes.map(parseBottle).filter(b => b.isBottle);
  
  // Floating bottles: Partner's bottles that have NOT been read yet
  const unreadPartnerBottles = parsedBottles.filter(
    b => b.author !== author && !readBottleIds.includes(b.id)
  );

  // Collected bottles: Partner's bottles that HAVE been read
  const collectedBottles = parsedBottles.filter(
    b => b.author !== author && readBottleIds.includes(b.id)
  );

  const handleThrowBottle = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setIsSending(true);

    const combinedText = `[bottle] ${inputText.trim()}`;
    await supabase.from('notes').insert([
      { type: 'appreciation', text: combinedText, author, emotion: 'happy' }
    ]);

    setInputText('');
    setIsSending(false);
    setShowWriteModal(false);
    playChimeSound();
  };

  const handleOpenBottle = (bottle) => {
    playCorkPopSound();
    setOpenedBottle(bottle);
    
    // Add to read list if not already there
    if (!readBottleIds.includes(bottle.id)) {
      const nextRead = [...readBottleIds, bottle.id];
      setReadBottleIds(nextRead);
      localStorage.setItem('our-space-read-bottles', JSON.stringify(nextRead));
    }
  };

  const handleFishBottle = () => {
    playPopSound();
    if (unreadPartnerBottles.length > 0) {
      // Fish the first unread partner bottle
      const fished = unreadPartnerBottles[0];
      handleOpenBottle(fished);
    } else if (collectedBottles.length > 0) {
      // If no unread, randomly retrieve a past partner bottle to reread
      const randomIdx = getRandomIndex(collectedBottles.length);
      const fished = collectedBottles[randomIdx];
      handleOpenBottle(fished);
    } else {
      // If no partner bottles exist at all, alert
      alert("海面上风平浪静，今天暂时没有打捞到对方写的思念瓶哦。先去写一个扔给对方吧！🌊");
    }
  };

  const renderOpenBottleModal = () => (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, padding: '1.5rem'
      }}
    >
      <div 
        style={{
          background: '#f4faff', // ocean paper blue tint
          border: '1px solid #d0e4f5',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'wobbleBob 2s infinite' }}>🍾</div>
        <h3 style={{ fontSize: '1.2rem', color: '#1d3557', fontWeight: 600, marginBottom: '0.5rem' }}>
          🎉 打捞起一个漂流瓶！
        </h3>
        <span style={{ fontSize: '0.75rem', color: '#8fa8c2', marginBottom: '1.5rem', display: 'block' }}>
          写于 {new Date(openedBottle.created_at).toLocaleDateString()} —— 来自 {openedBottle.author}
        </span>

        <p 
          style={{
            fontFamily: '"STKaiti", "KaiTi", serif',
            fontSize: '1.15rem',
            color: '#2b2d42',
            lineHeight: '1.7',
            background: 'rgba(255,255,255,0.5)',
            padding: '1.5rem 1rem',
            borderRadius: '8px',
            border: '1px dashed #c0d8ed',
            whiteSpace: 'pre-wrap',
            textAlign: 'left'
          }}
        >
          {openedBottle.cleanText}
        </p>

        <button 
          className="btn btn-primary" 
          onClick={() => setOpenedBottle(null)}
          style={{ marginTop: '2rem', padding: '0.5rem 2.5rem', background: '#1d3557' }}
        >
          塞回并存入收藏罐
        </button>
      </div>
    </div>
  );

  // Mode 1: Background drifting bottles overlay only
  if (isBackgroundOnly) {
    return (
      <>
        <div 
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: '80px',
            height: '120px',
            pointerEvents: 'none', // click passes through unless clicking bottle
            zIndex: 8,
            overflow: 'hidden'
          }}
        >
          {unreadPartnerBottles.map((bottle, idx) => {
            const delay = idx * 6;
            const duration = 18 + idx * 4;
            return (
              <button
                key={bottle.id}
                onClick={() => handleOpenBottle(bottle)}
                style={{
                  position: 'absolute',
                  bottom: `${20 + (idx * 25) % 60}px`,
                  left: '-100px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '2.5rem',
                  zIndex: 9,
                  pointerEvents: 'auto',
                  animation: `driftFlow ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                  filter: 'drop-shadow(0 6px 12px rgba(162,210,255,0.4))',
                  outline: 'none'
                }}
                title="发现一个漂流瓶！"
              >
                🍾
              </button>
            );
          })}
        </div>

        {openedBottle && renderOpenBottleModal()}

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes driftFlow {
            0% { transform: translate(-100px, 0) rotate(0deg); }
            50% { transform: translate(50vw, -12px) rotate(8deg); }
            100% { transform: translate(calc(100vw + 100px), 0) rotate(-6deg); }
          }
          @keyframes wobbleBob {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
          }
        `}} />
      </>
    );
  }

  // Mode 2: Dedicated Drift Bottles Interactive Page
  return (
    <div className="container animate-fade-in" style={{ padding: '0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>🌊 我们的海面漂流瓶</h2>
        <button className="btn btn-outline" onClick={onBack}>返回首页</button>
      </header>

      {/* Main Sea Panel */}
      <div 
        style={{
          background: 'linear-gradient(180deg, rgba(224, 242, 254, 0.4) 0%, rgba(240, 253, 250, 0.4) 100%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--glass-shadow)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        <div 
          style={{
            fontSize: '5rem',
            animation: 'wobbleBob 3s ease-in-out infinite',
            filter: 'drop-shadow(0 15px 25px rgba(162, 210, 255, 0.45))',
            userSelect: 'none',
            display: 'inline-block',
            marginBottom: '1rem'
          }}
        >
          🍾
        </div>
        <p className="text-light" style={{ fontSize: '1rem', maxWidth: '420px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
          写下你羞于当面表达的绵绵思念扔向大海，或者静下心来，点击打捞看看今天有没有对方留给你的惊喜 🌊
        </p>

        <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => { playPopSound(); setShowWriteModal(true); }}
            style={{ flex: 1, padding: '0.8rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
          >
            ✍️ 扔一个思念瓶
          </button>
          <button 
            className="btn btn-outline" 
            onClick={handleFishBottle}
            style={{ flex: 1, padding: '0.8rem 1.2rem', borderColor: '#a2d2ff', color: '#0077b6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
          >
            🎣 打捞漂流瓶
          </button>
        </div>
      </div>

      {/* Collection Shelf / drawer */}
      <div style={{ marginTop: '3rem', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text)', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📦 收集的思念瓶罐 ({collectedBottles.length})
        </h3>
        {collectedBottles.length === 0 ? (
          <div className="card text-center text-light" style={{ padding: '3rem 1rem' }}>
            收藏架空空的。当打捞到对方写下的漂流瓶并开启后，它们会自动存放在这里。🧪
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.2rem' }}>
            {collectedBottles.map(bottle => (
              <div 
                key={bottle.id} 
                onClick={() => handleOpenBottle(bottle)}
                className="card animate-fade-in"
                style={{
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--glass-shadow)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(162, 210, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  <span>🍾 思念瓶</span>
                  <span>{new Date(bottle.created_at).toLocaleDateString()}</span>
                </div>
                <p 
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--color-text)',
                    fontStyle: 'italic',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%'
                  }}
                >
                  “{bottle.cleanText}”
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', alignSelf: 'flex-end', fontWeight: 600 }}>
                  重温思念 🔍
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write Bottle Modal */}
      {showWriteModal && (
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(20, 20, 25, 0.75)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '1.5rem'
          }}
        >
          <div 
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: 'var(--glass-shadow)',
              textAlign: 'left'
            }}
          >
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text)', marginBottom: '1rem', fontWeight: 600 }}>扔一个浪漫漂流瓶 🌊</h3>
            <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              写下你此刻的情话，塞入玻璃瓶投入大海。瓶子会悄悄在对方的主页背景中漂过。
            </p>

            <form onSubmit={handleThrowBottle}>
              <div className="form-group">
                <textarea 
                  className="form-control"
                  placeholder="写下悄悄话..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{ minHeight: '130px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSending}>
                  {isSending ? '正在塞入瓶中...' : '塞入木塞，投入大海 🍾'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowWriteModal(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fished Bottle Open Modal */}
      {openedBottle && renderOpenBottleModal()}

      {/* Drift Flow CSS Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes driftFlow {
          0% { transform: translate(-100px, 0) rotate(0deg); }
          50% { transform: translate(50vw, -12px) rotate(8deg); }
          100% { transform: translate(calc(100vw + 100px), 0) rotate(-6deg); }
        }
        @keyframes wobbleBob {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}} />
    </div>
  );
};

export default DriftBottles;
