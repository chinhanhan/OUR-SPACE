import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { playPopSound, playChimeSound } from '../utils/audio';

const BucketList = ({ items, onBack, onCompleteItem }) => {
  const [newItemText, setNewItemText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [completingId, setCompletingId] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    
    await supabase.from('bucket_list').insert([{ text: newItemText }]);
    setNewItemText('');
    playPopSound();
  };

  const handleComplete = async (id) => {
    setCompletingId(id);
    let imageUrl = null;
    
    if (imageFile) {
      setIsUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `bucket_${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('media').upload(fileName, imageFile);
      
      if (!error) {
        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
      setIsUploading(false);
    }

    await supabase.from('bucket_list').update({ is_completed: true, image_url: imageUrl }).eq('id', id);
    onCompleteItem(); // triggers XP boost
    setCompletingId(null);
    setImageFile(null);
    playChimeSound();
  };

  const pendingItems = items.filter(i => !i.is_completed);
  const completedItems = items.filter(i => i.is_completed);

  return (
    <div className="container animate-fade-in" style={{ padding: '0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>🌟 愿望清单</h2>
        <button className="btn btn-outline" onClick={onBack}>返回首页</button>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>添加新愿望</h4>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="比如：一起去冰岛看极光..." 
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>许下愿望</button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Pending */}
        <div>
          <h3 className="text-light" style={{ marginBottom: '1rem' }}>待完成的浪漫 ({pendingItems.length})</h3>
          {pendingItems.length === 0 && <p className="text-light text-center">暂无待完成愿望，快去添加吧！</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingItems.map(item => (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>{item.text}</div>
                
                {completingId === item.id ? (
                  <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>上传打卡纪念照 (可选)，然后完成愿望：</p>
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="form-control" style={{ marginBottom: '1rem' }} />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="btn btn-primary" onClick={() => handleComplete(item.id)} disabled={isUploading}>
                        {isUploading ? '正在上传打卡照...' : '🎉 确认完成！'}
                      </button>
                      <button className="btn btn-outline" onClick={() => setCompletingId(null)}>取消</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-outline" style={{ alignSelf: 'flex-start' }} onClick={() => setCompletingId(item.id)}>
                    ✔️ 打卡完成 (+30 爱情树经验)
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Completed */}
        {completedItems.length > 0 && (
          <div>
            <h3 className="text-light" style={{ marginBottom: '1rem' }}>我们一起走过的路 ({completedItems.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {completedItems.map(item => (
                <div key={item.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt="打卡照" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} />
                  ) : (
                    <div style={{ width: '100%', height: '150px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '3rem' }}>
                      🏆
                    </div>
                  )}
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>{item.text}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                    完成于 {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BucketList;
