import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../lib/supabase';

const Dashboard = ({ notes, onAddNote, nextDate, author, moods = [], onAddMood }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('appreciation');
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState('');
  const [daysLeft, setDaysLeft] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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
    if (!text.trim()) return;
    if (type === 'concern' && !emotion) {
      alert('请选择你当前的感受哦');
      return;
    }

    let imageUrl = null;
    if (imageFile) {
      setIsUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('media').upload(fileName, imageFile);
      
      if (error) {
        alert('图片上传失败: ' + error.message);
        setIsUploading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
      setIsUploading(false);
    }

    onAddNote({ type, text, author, emotion: type === 'concern' ? emotion : 'happy', image_url: imageUrl });
    setText('');
    setEmotion('');
    setImageFile(null);
    setIsModalOpen(false);
  };

  const getPartnerMood = () => {
    const partner = moods.find(m => m.author !== author);
    return partner ? partner.mood_emoji : '❓';
  };

  const getMyMood = () => {
    const me = moods.find(m => m.author === author);
    return me ? me.mood_emoji : '❓';
  };

  return (
    <div className="dashboard text-center">
      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <div>
          <div className="text-light" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>对方今天的心情</div>
          <div style={{ fontSize: '2.5rem' }}>{getPartnerMood()}</div>
        </div>
        <div style={{ width: '1px', height: '60px', backgroundColor: 'var(--color-border)' }}></div>
        <div>
          <div className="text-light" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>我今天的心情</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['☀️', '☁️', '🌧️', '⚡️'].map(emoji => (
              <button 
                key={emoji} 
                onClick={() => onAddMood(emoji)}
                style={{
                  background: getMyMood() === emoji ? 'var(--color-primary)' : 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '1.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '3rem 2rem' }}>
        <h3 className="text-light" style={{ fontWeight: 400, marginBottom: '0.5rem' }}>距离下一个“讨论日”还有</h3>
        <div style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
          {daysLeft} <span style={{ fontSize: '1.5rem', color: 'var(--color-text-light)', fontWeight: 400 }}>天</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <button className="btn btn-primary" onClick={() => { setType('appreciation'); setIsModalOpen(true); }}>
          ✨ 存入开心/感谢
        </button>
        <button className="btn btn-danger" onClick={() => { setType('concern'); setIsModalOpen(true); }}>
          💭 存入小情绪/建议
        </button>
      </div>

      <div className="card" style={{ background: 'transparent', boxShadow: 'none', border: '2px dashed var(--color-border)' }}>
        <h4>已封存的纸条箱</h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>✨</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{notes.filter(n => n.type === 'appreciation').length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>💭</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{notes.filter(n => n.type === 'concern').length}</div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={type === 'appreciation' ? '存入开心/感谢 ✨' : '非暴力沟通纸条 💭'}>
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem', textAlign: 'left' }}>
          
          {type === 'concern' && (
            <div className="form-group">
              <label className="form-label">1. 你现在感觉如何？</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['委屈', '生气', '被忽视', '焦虑', '伤心', '疲惫'].map(emo => (
                  <button 
                    type="button"
                    key={emo}
                    onClick={() => setEmotion(emo)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${emotion === emo ? 'var(--color-danger)' : 'var(--color-border)'}`,
                      backgroundColor: emotion === emo ? 'rgba(224, 122, 95, 0.1)' : 'transparent',
                      color: emotion === emo ? 'var(--color-danger)' : 'var(--color-text)',
                      cursor: 'pointer'
                    }}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              {type === 'appreciation' ? '写下让你开心的事：' : '2. 描述事情与你的期待：'}
            </label>
            {type === 'concern' && (
              <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                试试这样写：当发生 [客观事实] 时，我觉得很不舒服。我希望以后 [你的具体期待]。
              </p>
            )}
            <textarea
              className="form-control"
              placeholder={type === 'appreciation' ? "今天你帮我拿了快递，我很开心..." : "发生什么事了？你希望以后怎样？"}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">📸 附加图片 (可选)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files[0])} 
              className="form-control" 
              style={{ padding: '0.5rem' }}
            />
          </div>

          <button type="submit" disabled={isUploading} className={`btn ${type === 'appreciation' ? 'btn-primary' : 'btn-danger'}`} style={{ width: '100%' }}>
            {isUploading ? '正在上传图片并封存...' : `封存入箱 (由 ${author} 投递)`}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
