import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Archive = () => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchives = async () => {
      if (import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url' || !import.meta.env.VITE_SUPABASE_URL) {
        setLoading(false);
        return;
      }

      // We group by archive_id
      const { data: notes } = await supabase.from('notes').select('*').eq('status', 'archived');
      const { data: actions } = await supabase.from('action_items').select('*').eq('status', 'archived');

      if (notes && actions) {
        // Group by archive_id
        const grouped = {};
        
        notes.forEach(note => {
          if (!grouped[note.archive_id]) grouped[note.archive_id] = { id: note.archive_id, date: note.created_at, notes: [], actions: [] };
          grouped[note.archive_id].notes.push(note);
        });

        actions.forEach(action => {
          if (!grouped[action.archive_id]) grouped[action.archive_id] = { id: action.archive_id, date: action.created_at, notes: [], actions: [] };
          grouped[action.archive_id].actions.push(action);
        });

        // Convert to array and sort by date descending
        const archiveList = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
        setArchives(archiveList);
      }
      setLoading(false);
    };

    fetchArchives();
  }, []);

  if (loading) {
    return <div className="text-center" style={{ marginTop: '4rem' }}>加载时光机中...</div>;
  }

  if (archives.length === 0) {
    return (
      <div className="card text-center animate-fade-in" style={{ padding: '4rem 2rem' }}>
        <h2 style={{ color: 'var(--color-text-light)' }}>🗂️ 时光机空空如也</h2>
        <p className="text-light" style={{ marginTop: '1rem' }}>
          当你们完成第一次讨论日复盘后，这里会记录下你们的足迹。
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-primary)' }}>🕰️ 时光机回忆录</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {archives.map((archive, index) => (
          <div key={archive.id} className="card" style={{ borderTop: '4px solid var(--color-primary)' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text)' }}>
              第 {archives.length - index} 次复盘回忆 
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginLeft: '1rem', fontWeight: 400 }}>
                ({new Date(archive.date).toLocaleDateString()})
              </span>
            </h3>

            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>✨ 收获的感谢</h4>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                  {archive.notes.filter(n => n.type === 'appreciation').map(n => (
                    <li key={n.id} style={{ marginBottom: '1rem', backgroundColor: 'var(--color-bg)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                      {n.image_url && <img src={n.image_url} alt="附件" style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}/>}
                      <div>{n.text}</div>
                    </li>
                  ))}
                  {archive.notes.filter(n => n.type === 'appreciation').length === 0 && <span className="text-light">无</span>}
                </ul>
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--color-danger)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>💭 解决的问题</h4>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                  {archive.notes.filter(n => n.type === 'concern').map(n => (
                    <li key={n.id} style={{ marginBottom: '1rem', backgroundColor: 'var(--color-bg)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                      {n.image_url && <img src={n.image_url} alt="附件" style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}/>}
                      <div>{n.text}</div>
                    </li>
                  ))}
                  {archive.notes.filter(n => n.type === 'concern').length === 0 && <span className="text-light">无</span>}
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>🎯 当时的行动计划</h4>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                {archive.actions.map(a => (
                  <li key={a.id} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{a.is_completed ? '✅' : '⬜️'}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.9rem' }}>[{a.assignee || '共同'}]</span>
                    <span style={{ textDecoration: a.is_completed ? 'line-through' : 'none', color: a.is_completed ? 'var(--color-text-light)' : 'var(--color-text)' }}>{a.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Archive;
