import { useState, useEffect } from 'react';
import { useTilt } from '../hooks/useTilt';
import { playPopSound } from '../utils/audio';

// Helper to play a mechanical keyboard/flip clack sound
const playFlipSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Audio Context might be blocked or unsupported by browser autoplays
  }
};

// Component for a single digit card that flips when its value changes
const FlipDigit = ({ value }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [currentVal, setCurrentVal] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  if (value !== prevValue) {
    setPrevValue(value);
    setIsFlipping(true);
    playFlipSound();
  }

  useEffect(() => {
    if (isFlipping) {
      const timer = setTimeout(() => {
        setCurrentVal(value);
        setIsFlipping(false);
      }, 300); // matches CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [isFlipping, value]);

  return (
    <div 
      style={{
        position: 'relative',
        width: '45px',
        height: '65px',
        fontSize: '3rem',
        fontWeight: '700',
        color: '#fff',
        background: '#1e1e24',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        perspective: '200px'
      }}
    >
      {/* Top half cover */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(0,0,0,0.4)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />
      
      {/* Changing Digit Text */}
      <span 
        style={{
          lineHeight: '1',
          display: 'block',
          animation: isFlipping ? 'flipCardDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
        }}
      >
        {currentVal}
      </span>
      
      {/* Retro fold divider line */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: '#000',
          opacity: 0.5,
          zIndex: 3
        }}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flipCardDown {
          0% { transform: rotateX(0deg); opacity: 1; }
          45% { transform: rotateX(90deg); opacity: 0.3; }
          55% { transform: rotateX(-90deg); opacity: 0.3; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
      `}} />
    </div>
  );
};

// Component for a multi-digit flip display (e.g. "045")
const FlipNumber = ({ number, length = 3 }) => {
  const padded = String(number || 0).padStart(length, '0');
  const digits = padded.split('');

  return (
    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
      {digits.map((digit, idx) => (
        <FlipDigit key={idx} value={digit} />
      ))}
    </div>
  );
};

const FlipTimerHub = ({ sharedSettings, onBack }) => {
  const tiltRef = useTilt({ max: 4 });
  
  // Custom dates managed in localStorage for zero-migration persistence
  const [girlBday, setGirlBday] = useState(() => localStorage.getItem('our-space-girl-bday') || '11-05');
  const [boyBday, setBoyBday] = useState(() => localStorage.getItem('our-space-boy-bday') || '03-20');
  const [travelDate, setTravelDate] = useState(() => localStorage.getItem('our-space-travel-date') || '2026-10-01');
  const [isEditing, setIsEditing] = useState(false);

  // Custom activities/clocks
  const [customClocks, setCustomClocks] = useState(() => {
    const saved = localStorage.getItem('our-space-custom-flip-clocks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  // Anniversary days countup
  const getAnniversaryDays = () => {
    if (!sharedSettings.anniversary_date) return 0;
    const diff = Math.floor((new Date() - new Date(sharedSettings.anniversary_date)) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  };

  // Helper to calculate days until next occurrence of MM-DD
  const getDaysUntilBirthday = (bdayStr) => {
    const [month, day] = bdayStr.split('-').map(Number);
    const today = new Date();
    const bdayThisYear = new Date(today.getFullYear(), month - 1, day);
    
    if (today > bdayThisYear) {
      // birthday has passed, calculate for next year
      const nextYearBday = new Date(today.getFullYear() + 1, month - 1, day);
      return Math.ceil((nextYearBday - today) / (1000 * 60 * 60 * 24));
    }
    return Math.ceil((bdayThisYear - today) / (1000 * 60 * 60 * 24));
  };

  // Helper to calculate days until next travel (YYYY-MM-DD)
  const getDaysUntilTravel = () => {
    const target = new Date(travelDate);
    const today = new Date();
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('our-space-girl-bday', girlBday);
    localStorage.setItem('our-space-boy-bday', boyBday);
    localStorage.setItem('our-space-travel-date', travelDate);
    setIsEditing(false);
    playPopSound();
  };

  const handleAddCustomClock = (e) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;
    
    const newClock = {
      id: String(Date.now()),
      title: newEventTitle.trim(),
      date: newEventDate
    };
    
    const updated = [...customClocks, newClock];
    setCustomClocks(updated);
    localStorage.setItem('our-space-custom-flip-clocks', JSON.stringify(updated));
    setNewEventTitle('');
    setNewEventDate('');
    playPopSound();
  };

  const handleDeleteCustomClock = (id) => {
    const updated = customClocks.filter(clock => clock.id !== id);
    setCustomClocks(updated);
    localStorage.setItem('our-space-custom-flip-clocks', JSON.stringify(updated));
    playPopSound();
  };

  const getCustomClockDaysAndType = (dateStr) => {
    const target = new Date(dateStr);
    const today = new Date();
    const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = targetDate - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0) {
      return {
        days: diffDays,
        label: '距离还有',
        color: '#7b2cbf',
        emoji: '⏳'
      };
    } else {
      return {
        days: Math.abs(diffDays),
        label: '已累计',
        color: '#2a9d8f',
        emoji: '🎉'
      };
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>⏰ 我们的翻牌纪念时钟</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? '退出编辑' : '⚙️ 调整日期'}
          </button>
          <button className="btn btn-outline" onClick={onBack}>返回首页</button>
        </div>
      </header>

      {/* Edit Overlay settings form */}
      {isEditing && (
        <div className="card animate-fade-in" style={{ marginBottom: '2rem', textAlign: 'left' }}>
          <form onSubmit={handleSaveSettings}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--color-text)' }}>调整纪念日与倒计时目标</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>👧 女生生日 (格式: MM-DD)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="例如 11-05" 
                  value={girlBday} 
                  onChange={(e) => setGirlBday(e.target.value)} 
                  required 
                  pattern="\d{2}-\d{2}"
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>👦 男生生日 (格式: MM-DD)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="例如 03-20" 
                  value={boyBday} 
                  onChange={(e) => setBoyBday(e.target.value)} 
                  required 
                  pattern="\d{2}-\d{2}"
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>✈️ 下一次共同旅行 (YYYY-MM-DD)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={travelDate} 
                  onChange={(e) => setTravelDate(e.target.value)} 
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">保存基础纪念日</button>
          </form>

          {/* Add custom event form */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--glass-border)' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.8rem', fontWeight: 600 }}>➕ 新增自定义活动/纪念日</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: '180px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>事件名称 (如: 一起去迪士尼)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="输入事件名称" 
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>目标日期</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={handleAddCustomClock}
                style={{ padding: '0.65rem 1.5rem' }}
              >
                添加卡片
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Flip Cards */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        {/* Anniversary Card */}
        <div 
          ref={tiltRef} 
          className="card" 
          style={{ 
            padding: '2.5rem 1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '230px'
          }}
        >
          <span style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>❤️</span>
          <h4 style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.2rem' }}>我们相爱的第</h4>
          <FlipNumber number={getAnniversaryDays()} length={4} />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '1.2rem', fontWeight: 500 }}>
            始于 {sharedSettings.anniversary_date || '未知日期'}
          </span>
        </div>

        {/* Girl Birthday Card */}
        <div 
          className="card" 
          style={{ 
            padding: '2.5rem 1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '230px'
          }}
        >
          <span style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>👧</span>
          <h4 style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.2rem' }}>距离女生生日还有</h4>
          <FlipNumber number={getDaysUntilBirthday(girlBday)} length={3} />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '1.2rem', fontWeight: 500 }}>
            目标生日: {girlBday}
          </span>
        </div>

        {/* Boy Birthday Card */}
        <div 
          className="card" 
          style={{ 
            padding: '2.5rem 1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '230px'
          }}
        >
          <span style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>👦</span>
          <h4 style={{ color: '#0077b6', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.2rem' }}>距离男生生日还有</h4>
          <FlipNumber number={getDaysUntilBirthday(boyBday)} length={3} />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '1.2rem', fontWeight: 500 }}>
            目标生日: {boyBday}
          </span>
        </div>

        {/* Travel Date Card */}
        <div 
          className="card" 
          style={{ 
            padding: '2.5rem 1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '230px'
          }}
        >
          <span style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>✈️</span>
          <h4 style={{ color: '#d89656', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.2rem' }}>距离共同旅行还有</h4>
          <FlipNumber number={getDaysUntilTravel()} length={3} />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '1.2rem', fontWeight: 500 }}>
            目标旅行: {new Date(travelDate).toLocaleDateString()}
          </span>
        </div>

        {/* Custom Clocks */}
        {customClocks.map(clock => {
          const { days, label, color, emoji } = getCustomClockDaysAndType(clock.date);
          return (
            <div 
              key={clock.id}
              className="card animate-fade-in" 
              style={{ 
                padding: '2.5rem 1.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '230px',
                position: 'relative'
              }}
            >
              {isEditing && (
                <button 
                  onClick={() => handleDeleteCustomClock(clock.id)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(230, 57, 70, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: '#e63946',
                    transition: 'all 0.2s'
                  }}
                  title="删除此纪念日"
                >
                  🗑️
                </button>
              )}
              <span style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{emoji}</span>
              <h4 style={{ color: color, fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.4rem', textAlign: 'center' }}>
                {clock.title}
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '1.2rem' }}>
                {label}
              </span>
              <FlipNumber number={days} length={3} />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '1.2rem', fontWeight: 500 }}>
                目标日期: {new Date(clock.date).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FlipTimerHub;
