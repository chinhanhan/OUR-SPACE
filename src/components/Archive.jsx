import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTilt } from '../hooks/useTilt';

const Archive = ({ capsules = [] }) => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchives = async () => {
      // Fetch archived notes
      const { data: notesData } = await supabase.from('notes').select('*').eq('status', 'archived').order('created_at', { ascending: false });
      
      // Fetch archived action items
      const { data: actionsData } = await supabase.from('action_items').select('*').eq('status', 'archived').order('created_at', { ascending: false });
      
      if (notesData) {
        // Group by archive_id
        const grouped = {};
        notesData.forEach(n => {
          if (!grouped[n.archive_id]) grouped[n.archive_id] = { id: n.archive_id, notes: [], actionItems: [], date: n.created_at };
          grouped[n.archive_id].notes.push(n);
        });
        
        if (actionsData) {
          actionsData.forEach(a => {
            if (grouped[a.archive_id]) grouped[a.archive_id].actionItems.push(a);
          });
        }
        
        setArchives(Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
      setLoading(false);
    };

    fetchArchives();
  }, []);

  const tiltRef = useTilt({ max: 5 });

  if (loading) return <div className="text-center text-light" style={{ marginTop: '4rem' }}>翻阅旧日记中...</div>;

  return (
    <div className="container animate-fade-in" style={{ padding: '0' }}>
      
      {capsules.length > 0 && (
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ color: 'var(--color-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>⌛️ 时光胶囊</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {capsules.map(cap => {
              const unlockDate = new Date(cap.unlock_date);
              const today = new Date();
              const isLocked = today < unlockDate;

              return (
                <div key={cap.id} className="card" style={{ padding: '2rem', textAlign: 'center', background: isLocked ? 'rgba(0,0,0,0.05)' : 'var(--glass-bg)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{isLocked ? '🔒' : '💌'}</div>
                  
                  {isLocked ? (
                    <div>
                      <h4 style={{ color: 'var(--color-text)', marginBottom: '0.5rem' }}>未到解锁时间</h4>
                      <p className="text-light">
                        来自 <b>{cap.author}</b> 的一封神秘信件。<br/>
                        将在 <b>{unlockDate.toLocaleDateString()}</b> 为你解锁。
                      </p>
                    </div>
                  ) : (
                    <div className="animate-fade-in" style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '1rem', fontWeight: 'bold' }}>
                        🎉 胶囊已解锁！写于 {new Date(cap.created_at).toLocaleDateString()}
                      </div>
                      {cap.image_url && (
                        <img src={cap.image_url} alt="胶囊图片" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} />
                      )}
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '1.1rem', color: 'var(--color-text)' }}>{cap.text}</p>
                      <div style={{ marginTop: '1rem', textAlign: 'right', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                        —— {cap.author}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h2 style={{ color: 'var(--color-text)', marginBottom: '1.5rem', textAlign: 'center' }}>📖 往期讨论复盘</h2>
      
      {archives.length === 0 ? (
        <div className="card text-center text-light">时光机里还是空的，快去完成你们的第一次复盘吧。</div>
      ) : (
        <div ref={tiltRef} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {archives.map((arc, index) => (
            <div key={arc.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <h3 style={{ color: 'var(--color-primary)' }}>第 {archives.length - index} 次复盘</h3>
                <span className="text-light" style={{ fontSize: '0.9rem' }}>{new Date(arc.date).toLocaleDateString()}</span>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>✨ 开心与感谢</h4>
                {arc.notes.filter(n => n.type === 'appreciation').map(n => (
                  <div key={n.id} style={{ padding: '0.5rem 0', color: 'var(--color-text)', borderBottom: '1px dashed var(--glass-border)' }}>
                    [{n.author}] {n.text}
                    {n.image_url && <div style={{ marginTop: '0.5rem' }}><img src={n.image_url} alt="附件" style={{ maxHeight: '100px', borderRadius: 'var(--radius-sm)' }}/></div>}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>💭 解决的问题</h4>
                {arc.notes.filter(n => n.type === 'concern').map(n => (
                  <div key={n.id} style={{ padding: '0.5rem 0', color: 'var(--color-text)', borderBottom: '1px dashed var(--glass-border)' }}>
                    [{n.author}] {n.text}
                    {n.image_url && <div style={{ marginTop: '0.5rem' }}><img src={n.image_url} alt="附件" style={{ maxHeight: '100px', borderRadius: 'var(--radius-sm)' }}/></div>}
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>🎯 当时定下的行动计划</h4>
                {arc.actionItems.map(a => (
                  <div key={a.id} style={{ padding: '0.5rem 0', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{a.is_completed ? '✅' : '⏳'}</span>
                    <span style={{ textDecoration: a.is_completed ? 'line-through' : 'none', opacity: a.is_completed ? 0.6 : 1 }}>
                      [{a.assignee}] {a.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Archive;
