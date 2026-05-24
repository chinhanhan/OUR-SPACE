import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import LoveTree from './LoveTree';
import { supabase } from '../lib/supabase';
import { generateApology } from '../lib/gemini';
import { useTilt } from '../hooks/useTilt';
import { playPopSound, playChimeSound } from '../utils/audio';
import CanvasDoodle from './CanvasDoodle';

const Dashboard = ({ notes, onAddNote, onAddCapsule, nextDate, author, moods = [], onAddMood, profiles = [], onUpdateProfile, sharedSettings, onUpdateSharedSettings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('appreciation');
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'doodle'
  const doodleRef = React.useRef(null);
  
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [daysLeft, setDaysLeft] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Apology UI
  const [isApologyModalOpen, setIsApologyModalOpen] = useState(false);
  const [wrongdoing, setWrongdoing] = useState('');
  const [generatedApology, setGeneratedApology] = useState('');
  const [isGeneratingApology, setIsGeneratingApology] = useState(false);

  useEffect(() => {
    const calculateDaysLeft = () => {
      const diffDays = Math.ceil((new Date(nextDate) - new Date()) / (1000 * 60 * 60 * 24));
      setDaysLeft(diffDays > 0 ? diffDays : 0);
    };
    calculateDaysLeft();
    const timer = setInterval(calculateDaysLeft, 1000 * 60 * 60);
    return () => clearInterval(timer);
  }, [nextDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let doodleBlob = null;
    if (inputMode === 'doodle' && doodleRef.current) {
      doodleBlob = await doodleRef.current.getBlob();
    }

    if (inputMode === 'text' && !text.trim()) return;
    if (inputMode === 'doodle' && !doodleBlob && !text.trim()) {
      alert('请在画板上画点什么，或者输入文字~');
      return;
    }

    if (type === 'concern' && !emotion) {
      alert('请选择你当前的感受哦');
      return;
    }
    if (type === 'capsule' && !unlockDate) {
      alert('请选择时光胶囊的解锁日期');
      return;
    }

    let imageUrl = null;
    const fileToUpload = doodleBlob || imageFile;
    
    if (fileToUpload) {
      setIsUploading(true);
      const fileExt = doodleBlob ? 'png' : imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('media').upload(fileName, fileToUpload);
      
      if (!error) {
        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
      setIsUploading(false);
    }

    const finalContent = inputMode === 'doodle' && !text.trim() ? '[手绘涂鸦]' : text;

    if (type === 'capsule') {
      onAddCapsule({ text: finalContent, author, image_url: imageUrl, unlock_date: unlockDate });
      playChimeSound();
    } else {
      onAddNote({ type, text: finalContent, author, emotion: type === 'concern' ? emotion : 'happy', image_url: imageUrl });
      if (type === 'appreciation') playChimeSound();
      else playPopSound();
    }
    
    setText('');
    setEmotion('');
    setUnlockDate('');
    setImageFile(null);
    setInputMode('text');
    setIsModalOpen(false);
  };

  const handleGenerateApology = async () => {
    if (!wrongdoing.trim()) return;
    setIsGeneratingApology(true);
    const apology = await generateApology(wrongdoing, author);
    setGeneratedApology(apology);
    setIsGeneratingApology(false);
  };

  const getPartnerMood = () => {
    const partner = moods.find(m => m.author !== author);
    return partner ? partner.mood_emoji : '❓';
  };

  const getMyMood = () => {
    const me = moods.find(m => m.author === author);
    return me ? me.mood_emoji : '❓';
  };

  const myProfile = profiles.find(p => p.author === author);
  const partnerProfile = profiles.find(p => p.author !== author);
  const loveLanguages = ['肯定言辞', '高品质陪伴', '收到礼物', '服务行动', '身体接触'];

  const getPartnerLoveLanguageTip = (ll) => {
    switch (ll) {
      case '肯定言辞': return '夸夸Ta，发一条真诚的赞美消息。';
      case '高品质陪伴': return '放下手机，专心陪Ta聊聊天或看一部电影。';
      case '收到礼物': return '下班路上给Ta带个小甜点或者小花。';
      case '服务行动': return '顺手帮Ta倒杯水，或者主动洗个碗。';
      case '身体接触': return '给Ta一个大大的拥抱，或者牵牵手。';
      default: return '了解Ta的爱语，用Ta喜欢的方式去爱。';
    }
  };

  const calculateDaysTogether = () => {
    if (!sharedSettings.anniversary_date) return null;
    const diff = Math.floor((new Date() - new Date(sharedSettings.anniversary_date)) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  };

  const checkHighRisk = () => {
    const femaleProfile = profiles.find(p => p.author === '女方');
    if (!femaleProfile || !femaleProfile.cycle_last_date) return false;

    const lastDate = new Date(femaleProfile.cycle_last_date);
    const length = femaleProfile.cycle_length || 28;
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + length);

    const today = new Date();
    const daysUntilNext = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    return (daysUntilNext <= 3 && daysUntilNext >= -3);
  };

  const isHighRisk = checkHighRisk();

  const tiltRefTree = useTilt({ max: 5 });
  const tiltRefPartnerMood = useTilt({ max: 8 });
  const tiltRefMyMood = useTilt({ max: 8 });
  const tiltRefCountdown = useTilt({ max: 8 });
  const tiltRefCycle = useTilt({ max: 6 });
  const tiltRefLove = useTilt({ max: 6 });
  const tiltRefPartnerLove = useTilt({ max: 6 });

  const getPartnerMoodText = () => {
    const pm = getPartnerMood();
    switch (pm) {
      case '☀️': return '晴空万里，心情超赞 🌸';
      case '☁️': return '多云阴天，可能有点累 ☕';
      case '🌧️': return '细雨蒙蒙，需要抱抱 🧸';
      case '⚡️': return '电闪雷鸣，急需哄哄 ⚡';
      default: return '状态神秘，快去探寻 🕵️‍♂️';
    }
  };

  const getCycleReminderText = () => {
    const femaleProfile = profiles.find(p => p.author === '女方');
    if (!femaleProfile || !femaleProfile.cycle_last_date) {
      return { text: '女友尚未设置记录 💖', sub: '设置后可同步生理期状态' };
    }
    const lastDate = new Date(femaleProfile.cycle_last_date);
    const length = femaleProfile.cycle_length || 28;
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + length);
    const today = new Date();
    const daysUntilNext = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilNext <= 3 && daysUntilNext >= -3) {
      return { text: '🚨 处于高危预警期！', sub: '请加倍温柔体贴，热水备齐' };
    } else if (daysUntilNext < -3) {
      return { text: '💖 状态正常', sub: '继续维持轻松甜蜜的互动' };
    } else {
      return { text: `距离预计下次 🩸 剩 ${daysUntilNext} 天`, sub: '提前准备红糖水和包容心 🍵' };
    }
  };

  const cycleReminder = getCycleReminderText();

  return (
    <div className="dashboard text-center animate-fade-in">
      
      {isHighRisk && (
        <div className="card animate-fade-in" style={{ backgroundColor: 'var(--color-danger)', color: 'white', marginBottom: '2rem', padding: '1.5rem', border: 'none', animation: 'pulse-glow 2s infinite' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            🚨 高危求生预警
          </h3>
          <p style={{ marginTop: '0.5rem', fontSize: '1rem', opacity: 0.9 }}>
            生理期将至/进行中。前方可能伴随情绪波动！<br/>
            <b>请停止直男讲道理，多备热水，提供无限包容！</b>
          </p>
        </div>
      )}

      {/* Bento Grid System */}
      <div className="bento-grid">
        {/* Row 1: Hero Card (span 2) */}
        <div ref={tiltRefTree} className="card bento-col-2" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '2.5rem 2rem', background: 'var(--glass-bg)' }}>
            {sharedSettings.anniversary_date ? (
              <div style={{ textAlign: 'center' }}>
                <h3 className="text-light" style={{ fontWeight: 400, marginBottom: '0.5rem', fontSize: '1.1rem' }}>我们相爱的第</h3>
                <div style={{ fontSize: '3.8rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
                  {calculateDaysTogether()} <span style={{ fontSize: '1.2rem', color: 'var(--color-text-light)', fontWeight: 400 }}>天</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p className="text-light" style={{ marginBottom: '1rem' }}>设定纪念日，开启你们 hometown 爱情树</p>
                <input 
                  type="date" 
                  className="form-control" 
                  style={{ width: 'auto', display: 'inline-block' }}
                  onChange={(e) => onUpdateSharedSettings({ anniversary_date: e.target.value })}
                />
              </div>
            )}
            <LoveTree experience={sharedSettings.tree_experience || 0} />
          </div>
        </div>

        {/* Row 2: Mood widgets */}
        {/* Partner Mood Card */}
        <div ref={tiltRefPartnerMood} className="card bento-card-center">
          <span className="text-light" style={{ fontSize: '0.85rem', fontWeight: 600 }}>对方的心情</span>
          <div style={{ fontSize: '3.5rem', margin: '0.5rem 0', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
            {getPartnerMood()}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600 }}>
            {getPartnerMoodText()}
          </div>
        </div>

        {/* My Mood Card */}
        <div ref={tiltRefMyMood} className="card bento-card-center">
          <span className="text-light" style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>我今天的心情</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', width: '100%', maxWidth: '120px' }}>
            {['☀️', '☁️', '🌧️', '⚡️'].map(emoji => (
              <button 
                key={emoji} 
                type="button"
                onClick={() => { playPopSound(); onAddMood(emoji); }}
                style={{
                  background: getMyMood() === emoji ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.25)',
                  border: getMyMood() === emoji ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  fontSize: '1.3rem',
                  padding: '0.3rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: getMyMood() === emoji ? '0 4px 10px rgba(138, 178, 143, 0.3)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Countdown and Period Trackers */}
        {/* Countdown Card */}
        <div ref={tiltRefCountdown} className="card bento-card-center">
          <span className="text-light" style={{ fontSize: '0.85rem', fontWeight: 600 }}>讨论日倒计时</span>
          <div style={{ fontSize: '3.5rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.1, margin: '0.5rem 0' }}>
            {daysLeft} <span style={{ fontSize: '1rem', color: 'var(--color-text-light)', fontWeight: 400 }}>天</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600 }}>
            沟通是爱的必修课 💭
          </div>
        </div>

        {/* Cycle Widget */}
        {author === '女方' ? (
          <div ref={tiltRefCycle} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
              🩸 生理期记录
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.1rem' }}>上次第一天</label>
                <input type="date" className="form-control" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} value={myProfile?.cycle_last_date || ''} onChange={(e) => onUpdateProfile({ cycle_last_date: e.target.value })} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.1rem' }}>周期天数</label>
                <input type="number" className="form-control" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} value={myProfile?.cycle_length || 28} onChange={(e) => onUpdateProfile({ cycle_length: parseInt(e.target.value) })} />
              </div>
            </div>
          </div>
        ) : (
          <div ref={tiltRefCycle} className="card bento-card-center" style={{ border: '1px dashed rgba(224, 122, 95, 0.4)' }}>
            <span className="text-light" style={{ fontSize: '0.85rem', fontWeight: 600 }}>🩸 守护小助手</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-danger)', margin: '0.75rem 0', textAlign: 'center', lineHeight: 1.4 }}>
              {cycleReminder.text}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 500 }}>
              {cycleReminder.sub}
            </div>
          </div>
        )}

        {/* Row 4: Love Languages */}
        {/* My Love Language Card */}
        <div ref={tiltRefLove} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ marginBottom: '0.4rem', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600 }}>我的爱语</h4>
          {myProfile?.love_language ? (
            <div style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0.2rem 0' }}>{myProfile.love_language}</div>
          ) : (
            <div style={{ marginTop: '0.2rem' }}>
              <p className="text-light" style={{ fontSize: '0.75rem', marginBottom: '0.3rem' }}>设置你希望被爱的方式</p>
              <select className="form-control" style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} onChange={(e) => onUpdateProfile({ love_language: e.target.value })} defaultValue="">
                <option value="" disabled>选择...</option>
                {loveLanguages.map(ll => <option key={ll} value={ll}>{ll}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Partner Love Language Card */}
        <div ref={tiltRefPartnerLove} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ marginBottom: '0.4rem', color: 'var(--color-danger)', fontSize: '0.9rem', fontWeight: 600 }}>对方的爱语</h4>
          {partnerProfile?.love_language ? (
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.2rem' }}>{partnerProfile.love_language}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', lineHeight: 1.3 }}>
                💡 {getPartnerLoveLanguageTip(partnerProfile.love_language)}
              </div>
            </div>
          ) : (
            <p className="text-light" style={{ fontSize: '0.75rem', margin: '0.2rem 0' }}>对方尚未设定...</p>
          )}
        </div>

        {/* Row 5: iOS-Style Control Center Actions (span 2) */}
        <div className="bento-col-2" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
          <h4 className="text-light" style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🎛️ 控制中心 / 快捷操作
          </h4>
          <div className="bento-actions-grid">
            <button type="button" className="bento-action-card theme-appreciation" onClick={() => { playPopSound(); setType('appreciation'); setInputMode('text'); setIsModalOpen(true); }}>
              <div className="bento-action-icon">✨</div>
              <div className="bento-action-info">
                <h5 className="bento-action-title">存入开心/感谢</h5>
                <p className="bento-action-subtitle">记录生活小确幸</p>
              </div>
            </button>

            <button type="button" className="bento-action-card theme-concern" onClick={() => { playPopSound(); setType('concern'); setInputMode('text'); setIsModalOpen(true); }}>
              <div className="bento-action-icon">💭</div>
              <div className="bento-action-info">
                <h5 className="bento-action-title">存入情绪/建议</h5>
                <p className="bento-action-subtitle">非暴力倾听沟通</p>
              </div>
            </button>

            <button type="button" className="bento-action-card theme-capsule" onClick={() => { playPopSound(); setType('capsule'); setInputMode('text'); setIsModalOpen(true); }}>
              <div className="bento-action-icon">⌛️</div>
              <div className="bento-action-info">
                <h5 className="bento-action-title">埋下时光胶囊</h5>
                <p className="bento-action-subtitle">给未来彼此的信</p>
              </div>
            </button>

            <button type="button" className="bento-action-card theme-apology" onClick={() => { playPopSound(); setIsApologyModalOpen(true); }}>
              <div className="bento-action-icon">🚨</div>
              <div className="bento-action-info">
                <h5 className="bento-action-title">惹Ta生气了求助</h5>
                <p className="bento-action-subtitle">召唤 AI 紧急检讨</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={type === 'appreciation' ? '存入开心/感谢 ✨' : type === 'concern' ? '非暴力沟通纸条 💭' : '封存时光胶囊 ⌛️'}>
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem', textAlign: 'left' }}>
          
          {type === 'concern' && (
            <div className="form-group">
              <label className="form-label">1. 你现在感觉如何？</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['委屈', '生气', '被忽视', '焦虑', '伤心', '疲惫'].map(emo => (
                  <button type="button" key={emo} onClick={() => setEmotion(emo)}
                    style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: `1px solid ${emotion === emo ? 'var(--color-danger)' : 'var(--glass-border)'}`, backgroundColor: emotion === emo ? 'rgba(224, 122, 95, 0.1)' : 'transparent', color: emotion === emo ? 'var(--color-danger)' : 'var(--color-text)', cursor: 'pointer' }}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'capsule' && (
            <div className="form-group animate-fade-in">
              <label className="form-label">设定解封日期：</label>
              <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>不到这一天，这封信将无法被打开。</p>
              <input type="date" className="form-control" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                {type === 'appreciation' ? '写下让你开心的事：' : type === 'capsule' ? '写给未来的Ta：' : '2. 描述事情与你的期待：'}
              </label>
              {type !== 'concern' && (
                <div style={{ display: 'flex', background: 'var(--glass-bg)', borderRadius: 'var(--radius-full)', padding: '2px' }}>
                  <button type="button" onClick={() => setInputMode('text')} style={{ padding: '0.2rem 0.8rem', borderRadius: 'var(--radius-full)', border: 'none', background: inputMode === 'text' ? 'var(--color-primary)' : 'transparent', color: inputMode === 'text' ? '#fff' : 'var(--color-text)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>📝 文字</button>
                  <button type="button" onClick={() => setInputMode('doodle')} style={{ padding: '0.2rem 0.8rem', borderRadius: 'var(--radius-full)', border: 'none', background: inputMode === 'doodle' ? 'var(--color-primary)' : 'transparent', color: inputMode === 'doodle' ? '#fff' : 'var(--color-text)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>🎨 涂鸦</button>
                </div>
              )}
            </div>
            
            {inputMode === 'text' ? (
              <textarea
                className="form-control"
                placeholder={type === 'appreciation' ? "今天你帮我拿了快递，我很开心..." : type === 'capsule' ? "未来的我们，你们好吗..." : "发生什么事了？你希望以后怎样？"}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            ) : (
              <CanvasDoodle ref={doodleRef} />
            )}
          </div>

          {inputMode === 'text' && (
            <div className="form-group">
              <label className="form-label">📸 附加图片 (可选)</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="form-control" style={{ padding: '0.5rem' }} />
            </div>
          )}

          <button type="submit" disabled={isUploading} className={`btn ${type === 'appreciation' ? 'btn-primary' : type === 'capsule' ? 'btn-outline' : 'btn-danger'}`} style={{ width: '100%' }}>
            {isUploading ? '正在上传封存...' : `封存入箱`}
          </button>
        </form>
      </Modal>

      {/* AI Apology Modal */}
      <Modal isOpen={isApologyModalOpen} onClose={() => setIsApologyModalOpen(false)} title="🚨 紧急灭火器 (AI 检讨助手)">
        <div style={{ textAlign: 'left', marginTop: '1rem' }}>
          <p className="text-light" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            别慌，慢慢说，你刚才做了什么惹Ta生气的事？
          </p>
          <textarea 
            className="form-control" 
            placeholder="比如：我打游戏忘了回她消息..." 
            value={wrongdoing} 
            onChange={(e) => setWrongdoing(e.target.value)}
          />
          
          <button 
            className="btn btn-danger" 
            style={{ width: '100%', marginTop: '1rem' }} 
            onClick={handleGenerateApology} 
            disabled={isGeneratingApology || !wrongdoing.trim()}
          >
            {isGeneratingApology ? '🧠 AI 专家正在构思极其诚恳的检讨...' : '求助 AI 帮我写道歉信'}
          </button>

          {generatedApology && (
            <div className="animate-fade-in" style={{ marginTop: '2rem', padding: '1rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>✨ 生成完毕，快去请罪：</h4>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text)', fontSize: '1rem', lineHeight: 1.6 }}>{generatedApology}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
