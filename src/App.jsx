import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useLocalStorage } from './hooks/useLocalStorage';
import Dashboard from './components/Dashboard';
import DiscussionMode from './components/DiscussionMode';
import Login from './components/Login';
import Archive from './components/Archive';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [author, setAuthor] = useLocalStorage('our-space-author', null);
  
  const [notes, setNotes] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [moods, setMoods] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'discussion' | 'archive'
  
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const nextDiscussionDate = lastDay.toISOString();

  const fetchData = async () => {
    if (import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url' || !import.meta.env.VITE_SUPABASE_URL) return;

    // Fetch active notes
    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .eq('status', 'sealed')
      .order('created_at', { ascending: true });
    
    if (notesData) setNotes(notesData);

    // Fetch active action items
    const { data: actionsData } = await supabase
      .from('action_items')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: true });
    
    if (actionsData) {
      setActionItems(actionsData.map(item => ({
        id: item.id,
        text: item.text,
        isCompleted: item.is_completed,
        assignee: item.assignee
      })));
    }

    // Fetch today's moods
    const { data: moodsData } = await supabase
      .from('moods')
      .select('*')
      .eq('date', new Date().toISOString().split('T')[0]);
    if (moodsData) setMoods(moodsData);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();

      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url') {
        const sub1 = supabase.channel('n').on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, fetchData).subscribe();
        const sub2 = supabase.channel('a').on('postgres_changes', { event: '*', schema: 'public', table: 'action_items' }, fetchData).subscribe();
        const sub3 = supabase.channel('m').on('postgres_changes', { event: '*', schema: 'public', table: 'moods' }, fetchData).subscribe();

        return () => {
          supabase.removeChannel(sub1);
          supabase.removeChannel(sub2);
          supabase.removeChannel(sub3);
        };
      }
    }
  }, [isAuthenticated]);

  const handleAddNote = async (note) => {
    await supabase.from('notes').insert([{ 
      type: note.type, 
      text: note.text,
      author: note.author,
      emotion: note.emotion
    }]);
  };

  const handleArchive = async () => {
    const archiveId = `archive_${Date.now()}`;
    const noteIds = notes.map(n => n.id);
    const actionIds = actionItems.map(a => a.id);

    if (noteIds.length > 0) {
      await supabase.from('notes').update({ status: 'archived', archive_id: archiveId }).in('id', noteIds);
    }
    if (actionIds.length > 0) {
      await supabase.from('action_items').update({ status: 'archived', archive_id: archiveId }).in('id', actionIds);
    }
  };

  const handleSetActionItems = async (newActionItems) => {
    if (newActionItems.length > actionItems.length) {
      const addedItem = newActionItems[newActionItems.length - 1];
      await supabase.from('action_items').insert([{ 
        text: addedItem.text, 
        is_completed: false,
        assignee: addedItem.assignee
      }]);
    } else {
      for (const newItem of newActionItems) {
        const oldItem = actionItems.find(a => a.id === newItem.id);
        if (oldItem && oldItem.isCompleted !== newItem.isCompleted) {
          await supabase.from('action_items').update({ is_completed: newItem.isCompleted }).eq('id', newItem.id);
        }
      }
    }
  };

  const handleAddMood = async (emoji) => {
    // Delete existing mood for today for this author, then insert
    const todayStr = new Date().toISOString().split('T')[0];
    await supabase.from('moods').delete().eq('author', author).eq('date', todayStr);
    await supabase.from('moods').insert([{ author, mood_emoji: emoji, date: todayStr }]);
  };

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  if (!author) {
    return (
      <div className="container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card text-center">
          <h2 style={{ marginBottom: '2rem' }}>你是谁？</h2>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => setAuthor('男方')} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>👦 男方</button>
            <button className="btn btn-outline" onClick={() => setAuthor('女方')} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>👧 女方</button>
          </div>
          <p className="text-light" style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>设备会记住你的身份，之后不用再选。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>🕊️ Our Space</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {view === 'archive' && <button className="btn btn-outline" onClick={() => setView('dashboard')}>返回</button>}
          {view === 'dashboard' && <button className="btn btn-outline" onClick={() => setView('archive')}>往期回忆</button>}
          {view === 'dashboard' && <button className="btn btn-primary" onClick={() => setView('discussion')}>进入讨论日</button>}
          {view === 'discussion' && <button className="btn btn-outline" onClick={() => setView('dashboard')}>退出讨论</button>}
        </div>
      </header>

      <main>
        {view === 'dashboard' && (
          <Dashboard
            notes={notes}
            onAddNote={handleAddNote}
            nextDate={nextDiscussionDate}
            author={author}
            moods={moods}
            onAddMood={handleAddMood}
          />
        )}
        {view === 'discussion' && (
          <DiscussionMode
            notes={notes}
            actionItems={actionItems}
            setActionItems={handleSetActionItems}
            onFinish={handleArchive}
            onBack={() => setView('dashboard')}
          />
        )}
        {view === 'archive' && <Archive />}
      </main>
    </div>
  );
}

export default App;
