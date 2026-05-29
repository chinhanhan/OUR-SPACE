import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { playPopSound, playChimeSound } from '../utils/audio';
import { compressImage } from '../utils/image';

const generateBucketFileName = () => {
  return `bucket_${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
};

const BucketList = ({ items = [], onBack, onCompleteItem }) => {
  const [newItemText, setNewItemText] = useState('');
  const [category, setCategory] = useState('daily');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [completingId, setCompletingId] = useState(null);

  // Parse [category] prefix out of the text field
  const parseItem = (item) => {
    const match = item.text.match(/^\[([a-z]+)\]\s*(.*)$/);
    if (match) {
      return {
        ...item,
        category: match[1],
        cleanText: match[2]
      };
    }
    return {
      ...item,
      category: 'daily',
      cleanText: item.text
    };
  };

  const parsedItems = items.map(parseItem);
  const pendingItems = parsedItems.filter(i => !i.is_completed);
  const completedItems = parsedItems.filter(i => i.is_completed);

  // Stats calculations
  const totalCount = parsedItems.length;
  const completedCount = completedItems.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const strokeDashoffset = 220 - (220 * completionRate) / 100;

  // Category based count for badges
  const countByCategory = (cat) => completedItems.filter(i => i.category === cat).length;

  // Dynamic badge system
  const badges = [
    { id: 'traveler', name: '环球旅行家', emoji: '🎒', req: 3, current: countByCategory('travel'), desc: '共同达成 3 个旅行愿望' },
    { id: 'foodie', name: '绝世吃货', emoji: '🍔', req: 3, current: countByCategory('food'), desc: '共同享受 3 次美味打卡' },
    { id: 'movie', name: '光影恋人', emoji: '🎬', req: 3, current: countByCategory('movie'), desc: '共同观看 3 次精彩影音' },
    { id: 'daily', name: '人间烟火', emoji: '🏠', req: 3, current: countByCategory('daily'), desc: '共同经历 3 次日常浪漫' },
    { id: 'master', name: '浪漫满屋', emoji: '🏆', req: 10, current: completedCount, desc: '累计完成 10 个情侣愿望' }
  ];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    
    // Prefix categories locally before database insert
    const combinedText = `[${category}] ${newItemText.trim()}`;
    await supabase.from('bucket_list').insert([{ text: combinedText }]);
    setNewItemText('');
    setCategory('daily');
    playPopSound();
  };

  const handleComplete = async (id) => {
    setCompletingId(id);
    let imageUrl = null;
    
    if (imageFile) {
      setIsUploading(true);
      // Auto compress the iPhone/device photo before uploading
      const compressedFile = await compressImage(imageFile);
      
      const fileName = generateBucketFileName();
      const { error } = await supabase.storage.from('media').upload(fileName, compressedFile);
      
      if (!error) {
        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
      setIsUploading(false);
    }

    await supabase.from('bucket_list').update({ is_completed: true, image_url: imageUrl }).eq('id', id);
    onCompleteItem(); // triggers XP update on tree
    setCompletingId(null);
    setImageFile(null);
    playChimeSound();
  };

  const getCategoryDetails = (cat) => {
    switch (cat) {
      case 'travel': return { emoji: '🎒', text: '旅行探索', bg: 'rgba(162, 210, 255, 0.25)', color: '#0077b6' };
      case 'food': return { emoji: '🍔', text: '美味打卡', bg: 'rgba(254, 200, 154, 0.25)', color: '#d89656' };
      case 'movie': return { emoji: '🎬', text: '影音共鸣', bg: 'rgba(255, 181, 167, 0.25)', color: '#C66248' };
      default: return { emoji: '🏠', text: '日常琐事', bg: 'rgba(138, 178, 143, 0.25)', color: '#739C78' };
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>🌟 我们的愿望清单</h2>
        <button className="btn btn-outline" onClick={onBack}>返回首页</button>
      </header>

      {/* SVG Progress Wheel section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', padding: '1.5rem', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
        <div style={{ position: 'relative', width: '90px', height: '90px' }}>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="45" cy="45" r="35" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="7" fill="transparent" />
            <circle cx="45" cy="45" r="35" stroke="var(--color-primary)" strokeWidth="7" fill="transparent" strokeDasharray="220" strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
            {completionRate}%
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ margin: 0, color: 'var(--color-text)', fontSize: '1.2rem', fontWeight: 600 }}>浪漫打卡进度</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
            已共同实现 {completedCount} / {totalCount} 个浪漫小心愿
          </p>
        </div>
      </div>

      {/* Badge Achievement Board */}
      <div className="card" style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <h3 className="text-light" style={{ marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 600 }}>🏅 恋爱成就勋章墙</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
          {badges.map(b => {
            const isUnlocked = b.current >= b.req;
            return (
              <div 
                key={b.id} 
                className="card" 
                style={{ 
                  padding: '1rem 0.5rem', 
                  textAlign: 'center', 
                  opacity: isUnlocked ? 1 : 0.45,
                  border: isUnlocked ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
                  background: isUnlocked ? 'rgba(138, 178, 143, 0.1)' : 'var(--glass-bg)',
                  boxShadow: isUnlocked ? '0 8px 20px rgba(138, 178, 143, 0.15)' : 'none',
                  transform: isUnlocked ? 'scale(1.03)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                title={`${b.desc} (${b.current}/${b.req})`}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.25rem', filter: isUnlocked ? 'none' : 'grayscale(100%)' }}>
                  {b.emoji}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: '0.2rem' }}>
                  {b.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', fontWeight: 500 }}>
                  {isUnlocked ? '🎉 已解锁' : `进度: ${b.current}/${b.req}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Wish form */}
      <div className="card" style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text)' }}>添加新愿望</h4>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select 
            className="form-control" 
            style={{ width: 'auto', flexShrink: 0, padding: '0.5rem 1.8rem 0.5rem 0.6rem' }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="daily">🏠 日常</option>
            <option value="travel">🎒 旅行</option>
            <option value="food">🍔 美食</option>
            <option value="movie">🎬 影音</option>
          </select>
          <input 
            type="text" 
            className="form-control" 
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="比如：一起去冰岛看极光..." 
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>许下愿望</button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>
        {/* Pending Wishes */}
        <div>
          <h3 className="text-light" style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>待完成的浪漫 ({pendingItems.length})</h3>
          {pendingItems.length === 0 && <p className="text-light text-center" style={{ padding: '2rem' }}>暂无待完成愿望，快去添加吧！</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingItems.map(item => {
              const catInfo = getCategoryDetails(item.category);
              return (
                <div key={item.id} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: catInfo.bg, color: catInfo.color, fontSize: '0.75rem', fontWeight: 600, alignSelf: 'flex-start' }}>
                    {catInfo.emoji} {catInfo.text}
                  </span>
                  
                  <div style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--color-text)' }}>{item.cleanText}</div>
                  
                  {completingId === item.id ? (
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', marginTop: '0.5rem' }}>
                      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 500 }}>📸 上传打卡纪念照 (可选)，然后完成愿望：</p>
                      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="form-control" style={{ marginBottom: '1rem', padding: '0.4rem' }} />
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-primary" onClick={() => handleComplete(item.id)} disabled={isUploading} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                          {isUploading ? '正在上传并压缩...' : '🎉 确认完成！'}
                        </button>
                        <button className="btn btn-outline" onClick={() => setCompletingId(null)} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-outline" style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setCompletingId(item.id)}>
                      ✔️ 打卡完成 (+30 爱情树经验)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Completed Wishes */}
        {completedItems.length > 0 && (
          <div>
            <h3 className="text-light" style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>我们一起走过的路 ({completedItems.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {completedItems.map(item => {
                const catInfo = getCategoryDetails(item.category);
                return (
                  <div key={item.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt="打卡照" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
                    ) : (
                      <div style={{ width: '100%', height: '160px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '3rem' }}>
                        🏆
                      </div>
                    )}
                    
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: catInfo.bg, color: catInfo.color, fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {catInfo.emoji} {catInfo.text}
                    </span>
                    
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem', fontSize: '1rem' }}>{item.cleanText}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      完成于 {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BucketList;
