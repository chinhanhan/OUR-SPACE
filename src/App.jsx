import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useLocalStorage } from './hooks/useLocalStorage';
import Dashboard from './components/Dashboard';
import DiscussionMode from './components/DiscussionMode';
import Login from './components/Login';
import Archive from './components/Archive';
import BucketList from './components/BucketList';
import PresenceLayer from './components/PresenceLayer';
import YearlyReport from './components/YearlyReport';
import WeatherLayer from './components/WeatherLayer';
import PhotoWall from './components/PhotoWall';
import FlipTimerHub from './components/FlipTimerHub';
import LoveLetters from './components/LoveLetters';
import MilestoneRoadmap from './components/MilestoneRoadmap';
import RadarChart from './components/RadarChart';
import DriftBottles from './components/DriftBottles';
import { playPopSound } from './utils/audio';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [author, setAuthor] = useLocalStorage('our-space-author', null);
  
  const [notes, setNotes] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [moods, setMoods] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [sharedSettings, setSharedSettings] = useState({ tree_experience: 0, anniversary_date: null, last_interaction_date: new Date().toISOString() });
  const [bucketList, setBucketList] = useState([]);
  const [timeCapsules, setTimeCapsules] = useState([]);
  
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'discussion' | 'archive' | 'bucket_list' | 'report'
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const nextDiscussionDate = lastDay.toISOString();

  const fetchData = async () => {
    if (import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url' || !import.meta.env.VITE_SUPABASE_URL) return;

    // Fetch active notes
    const { data: notesData } = await supabase.from('notes').select('*').eq('status', 'sealed').order('created_at', { ascending: true });
    if (notesData) setNotes(notesData);

    // Fetch active action items
    const { data: actionsData } = await supabase.from('action_items').select('*').eq('status', 'active').order('created_at', { ascending: true });
    if (actionsData) {
      setActionItems(actionsData.map(item => ({ id: item.id, text: item.text, isCompleted: item.is_completed, assignee: item.assignee })));
    }

    // Fetch today's moods
    const { data: moodsData } = await supabase.from('moods').select('*').eq('date', new Date().toISOString().split('T')[0]);
    if (moodsData) setMoods(moodsData);

    // Fetch profiles
    const { data: profilesData } = await supabase.from('profiles').select('*');
    if (profilesData) setProfiles(profilesData);

    // Fetch bucket list
    const { data: bucketData } = await supabase.from('bucket_list').select('*').order('created_at', { ascending: false });
    if (bucketData) setBucketList(bucketData);

    // Fetch time capsules
    const { data: capsuleData } = await supabase.from('time_capsules').select('*').order('unlock_date', { ascending: true });
    if (capsuleData) setTimeCapsules(capsuleData);

    // Fetch shared settings
    const { data: settingsData } = await supabase.from('shared_settings').select('*').eq('id', 'global').single();
    if (settingsData) {
      // Tree decay logic
      const lastInteraction = new Date(settingsData.last_interaction_date || new Date());
      const now = new Date();
      const diffDays = Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 7) {
        const weeksPassed = Math.floor(diffDays / 7);
        const newExp = Math.max(0, settingsData.tree_experience - (weeksPassed * 2));
        
        // Only update DB if it changed significantly (just once per decay cycle)
        if (newExp < settingsData.tree_experience) {
          await supabase.from('shared_settings').update({ tree_experience: newExp }).eq('id', 'global');
          settingsData.tree_experience = newExp;
        }
      }
      setSharedSettings(settingsData);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();

      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url') {
        const sub1 = supabase.channel('n').on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, fetchData).subscribe();
        const sub2 = supabase.channel('a').on('postgres_changes', { event: '*', schema: 'public', table: 'action_items' }, fetchData).subscribe();
        const sub3 = supabase.channel('m').on('postgres_changes', { event: '*', schema: 'public', table: 'moods' }, fetchData).subscribe();
        const sub4 = supabase.channel('p').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData).subscribe();
        const sub5 = supabase.channel('s').on('postgres_changes', { event: '*', schema: 'public', table: 'shared_settings' }, fetchData).subscribe();
        const sub6 = supabase.channel('b').on('postgres_changes', { event: '*', schema: 'public', table: 'bucket_list' }, fetchData).subscribe();
        const sub7 = supabase.channel('t').on('postgres_changes', { event: '*', schema: 'public', table: 'time_capsules' }, fetchData).subscribe();

        return () => {
          supabase.removeChannel(sub1);
          supabase.removeChannel(sub2);
          supabase.removeChannel(sub3);
          supabase.removeChannel(sub4);
          supabase.removeChannel(sub5);
          supabase.removeChannel(sub6);
          supabase.removeChannel(sub7);
        };
      }
    }
  }, [isAuthenticated]);

  const updateInteraction = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    await supabase.from('shared_settings').update({ last_interaction_date: todayStr }).eq('id', 'global');
  };

  const handleAddNote = async (note) => {
    await supabase.from('notes').insert([{ type: note.type, text: note.text, author: note.author, emotion: note.emotion, image_url: note.image_url }]);
    // Add 1 EXP
    const { data: current } = await supabase.from('shared_settings').select('tree_experience').eq('id', 'global').single();
    if (current) {
      await supabase.from('shared_settings').update({ tree_experience: current.tree_experience + 1 }).eq('id', 'global');
    }
    await updateInteraction();
  };

  const handleAddCapsule = async (capsule) => {
    await supabase.from('time_capsules').insert([{ text: capsule.text, author: capsule.author, image_url: capsule.image_url, unlock_date: capsule.unlock_date }]);
    // Add 5 EXP
    const { data: current } = await supabase.from('shared_settings').select('tree_experience').eq('id', 'global').single();
    if (current) {
      await supabase.from('shared_settings').update({ tree_experience: current.tree_experience + 5 }).eq('id', 'global');
    }
    await updateInteraction();
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
    
    // Add 10 EXP
    const { data: current } = await supabase.from('shared_settings').select('tree_experience').eq('id', 'global').single();
    if (current) {
      await supabase.from('shared_settings').update({ tree_experience: current.tree_experience + 10 }).eq('id', 'global');
    }
    await updateInteraction();
  };

  const handleBucketListComplete = async () => {
    // Add 30 EXP
    const { data: current } = await supabase.from('shared_settings').select('tree_experience').eq('id', 'global').single();
    if (current) {
      await supabase.from('shared_settings').update({ tree_experience: current.tree_experience + 30 }).eq('id', 'global');
    }
    await updateInteraction();
  };

  const handleSetActionItems = async (newActionItems) => {
    if (newActionItems.length > actionItems.length) {
      const addedItem = newActionItems[newActionItems.length - 1];
      await supabase.from('action_items').insert([{ text: addedItem.text, is_completed: false, assignee: addedItem.assignee }]);
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
    const todayStr = new Date().toISOString().split('T')[0];
    await supabase.from('moods').delete().eq('author', author).eq('date', todayStr);
    await supabase.from('moods').insert([{ author, mood_emoji: emoji, date: todayStr }]);
  };

  const handleUpdateProfile = async (updates) => {
    await supabase.from('profiles').upsert([{ author, ...updates }]);
  };

  const handleUpdateSharedSettings = async (updates) => {
    await supabase.from('shared_settings').update(updates).eq('id', 'global');
  };

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  if (!author) {
    return (
      <div className="container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card text-center" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}>
          <h2 style={{ marginBottom: '2rem' }}>你是谁？</h2>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => setAuthor('男方')} style={{ fontSize: '1.2rem', padding: '1rem 2rem', background: 'rgba(255,255,255,0.8)' }}>👦 男方</button>
            <button className="btn btn-outline" onClick={() => setAuthor('女方')} style={{ fontSize: '1.2rem', padding: '1rem 2rem', background: 'rgba(255,255,255,0.8)' }}>👧 女方</button>
          </div>
          <p className="text-light" style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>设备会记住你的身份，之后不用再选。</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WeatherLayer notes={notes} />
      <PresenceLayer author={author} />
      <DriftBottles notes={notes} author={author} isBackgroundOnly={true} />
      
      <div className="container animate-fade-in">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--color-primary)' }}>🕊️ Our Space</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {view !== 'dashboard' && <button className="btn btn-outline" onClick={() => { playPopSound(); setView('dashboard'); }}>返回首页</button>}
            {view === 'dashboard' && (
              <>
                <button className="btn btn-outline" onClick={() => { playPopSound(); setView('archive'); }}>往期回忆</button>
                <button className="btn btn-outline" style={{ borderColor: '#fec89a', color: '#E07A5F' }} onClick={() => { playPopSound(); setView('bucket_list'); }}>🌟 愿望</button>
                <button className="btn btn-outline" style={{ borderColor: '#a2d2ff', color: '#0077b6' }} onClick={() => { playPopSound(); setView('photo_wall'); }}>📷 回忆墙</button>
                <button 
                  className="btn btn-outline" 
                  style={{ borderColor: '#c8b6ff', color: '#7b2cbf' }}
                  onClick={() => { playPopSound(); setShowMoreMenu(!showMoreMenu); }}
                >
                  ⚙️ 更多浪漫
                </button>
                <button className="btn btn-primary" onClick={() => { playPopSound(); setView('discussion'); }}>进入讨论日</button>
              </>
            )}
          </div>
        </header>

        {showMoreMenu && view === 'dashboard' && (
          <div 
            className="card animate-fade-in" 
            style={{ 
              display: 'flex', 
              gap: '1rem', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              padding: '1rem', 
              marginBottom: '2rem', 
              background: 'var(--glass-bg)', 
              borderColor: 'rgba(123, 44, 191, 0.2)' 
            }}
          >
            <button className="btn btn-outline" style={{ borderColor: '#ffb5a7', color: '#C66248' }} onClick={() => { playPopSound(); setShowMoreMenu(false); setView('report'); }}>📊 年度报告</button>
            <button className="btn btn-outline" style={{ borderColor: '#ffc6ff', color: '#b5179e' }} onClick={() => { playPopSound(); setShowMoreMenu(false); setView('milestones'); }}>🗺️ 时光足迹</button>
            <button className="btn btn-outline" style={{ borderColor: '#bdb2ff', color: '#560bad' }} onClick={() => { playPopSound(); setShowMoreMenu(false); setView('radar_chart'); }}>📊 情感雷达</button>
            <button className="btn btn-outline" style={{ borderColor: '#ffadad', color: '#9d0208' }} onClick={() => { playPopSound(); setShowMoreMenu(false); setView('love_letters'); }}>✉️ 火漆信箱</button>
            <button className="btn btn-outline" style={{ borderColor: '#caffbf', color: '#38b000' }} onClick={() => { playPopSound(); setShowMoreMenu(false); setView('flip_clocks'); }}>⏰ 翻翻时钟</button>
            <button className="btn btn-outline" style={{ borderColor: '#a2d2ff', color: '#0077b6' }} onClick={() => { playPopSound(); setShowMoreMenu(false); setView('drift_bottles'); }}>🌊 漂流瓶</button>
          </div>
        )}

        <main>
          {view === 'dashboard' && (
            <Dashboard
              notes={notes}
              onAddNote={handleAddNote}
              onAddCapsule={handleAddCapsule}
              nextDate={nextDiscussionDate}
              author={author}
              moods={moods}
              onAddMood={handleAddMood}
              profiles={profiles}
              onUpdateProfile={handleUpdateProfile}
              sharedSettings={sharedSettings}
              onUpdateSharedSettings={handleUpdateSharedSettings}
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
          {view === 'archive' && <Archive capsules={timeCapsules} />}
          {view === 'photo_wall' && (
            <PhotoWall 
              notes={notes} 
              bucketList={bucketList} 
              timeCapsules={timeCapsules} 
              onBack={() => setView('dashboard')} 
            />
          )}
          {view === 'milestones' && (
            <MilestoneRoadmap notes={notes} bucketList={bucketList} sharedSettings={sharedSettings} onBack={() => setView('dashboard')} />
          )}
          {view === 'radar_chart' && (
            <RadarChart notes={notes} bucketList={bucketList} profiles={profiles} sharedSettings={sharedSettings} onBack={() => setView('dashboard')} />
          )}
          {view === 'love_letters' && (
            <LoveLetters capsules={timeCapsules} author={author} onBack={() => setView('dashboard')} />
          )}
          {view === 'flip_clocks' && (
            <FlipTimerHub sharedSettings={sharedSettings} onBack={() => setView('dashboard')} />
          )}
          {view === 'drift_bottles' && (
            <DriftBottles notes={notes} author={author} onBack={() => setView('dashboard')} />
          )}
          {view === 'bucket_list' && (
            <BucketList items={bucketList} onBack={() => setView('dashboard')} onCompleteItem={handleBucketListComplete} />
          )}
          {view === 'report' && (
            <YearlyReport notes={notes} bucketList={bucketList} sharedSettings={sharedSettings} onBack={() => setView('dashboard')} />
          )}
        </main>
      </div>
    </>
  );
}

export default App;
