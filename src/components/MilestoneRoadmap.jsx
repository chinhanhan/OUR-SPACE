import { useState } from 'react';
import { playPopSound, playChimeSound } from '../utils/audio';

const MilestoneRoadmap = ({ notes = [], bucketList = [], sharedSettings = {}, onBack }) => {
  const [customMilestones, setCustomMilestones] = useState(() => {
    const saved = localStorage.getItem('our-space-custom-milestones');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Save custom milestones
  const saveCustomMilestones = (list) => {
    setCustomMilestones(list);
    localStorage.setItem('our-space-custom-milestones', JSON.stringify(list));
  };

  // Helper to parse bucket list item text
  const parseBucketText = (text) => {
    const match = text.match(/^\[([a-z]+)\]\s*(.*)$/);
    return match ? match[2] : text;
  };

  // Scan database and build milestones
  const compileMilestones = () => {
    const list = [];

    // 1. Anniversary (Always unlocked if anniversary_date is set)
    if (sharedSettings.anniversary_date) {
      list.push({
        id: 'sys_anniversary',
        isSystem: true,
        title: '💖 我们故事的起点',
        desc: '在这一天，我们正式决定牵手，开启属于我们的专属空间。',
        date: sharedSettings.anniversary_date,
        isUnlocked: true,
        emoji: '🌹'
      });
    }

    // 2. First Note Written
    const activeNotes = notes.filter(n => n.status !== 'archived');
    if (activeNotes.length > 0) {
      // Find oldest note
      const oldestNote = [...activeNotes].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
      list.push({
        id: 'sys_first_note',
        isSystem: true,
        title: '📝 第一张有温度的纸条',
        desc: `写入了第一篇心语：“${oldestNote.text === '[手绘涂鸦]' ? '手绘涂鸦心愿' : oldestNote.text}”`,
        date: oldestNote.created_at.split('T')[0],
        isUnlocked: true,
        emoji: '✍️'
      });
    }

    // 3. First Wish Created
    if (bucketList.length > 0) {
      const oldestWish = [...bucketList].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
      list.push({
        id: 'sys_first_wish',
        isSystem: true,
        title: '🌟 许下第一个心愿',
        desc: `写在愿望清单里：“${parseBucketText(oldestWish.text)}”`,
        date: oldestWish.created_at.split('T')[0],
        isUnlocked: true,
        emoji: '🌠'
      });
    }

    // 4. First Wish Completed
    const completedWishes = bucketList.filter(b => b.is_completed);
    if (completedWishes.length > 0) {
      const oldestCompleted = [...completedWishes].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
      list.push({
        id: 'sys_first_completed_wish',
        isSystem: true,
        title: '🏆 实现第一个浪漫心愿',
        desc: `携手完成了愿望：“${parseBucketText(oldestCompleted.text)}”，并留下了打卡照！`,
        date: oldestCompleted.created_at.split('T')[0],
        isUnlocked: true,
        emoji: '🎉'
      });
    }

    // 5. Tree EXP Level 10
    const treeExp = sharedSettings.tree_experience || 0;
    list.push({
      id: 'sys_tree_l10',
      isSystem: true,
      title: '🌳 爱情树初长成 (10 EXP)',
      desc: '我们的爱情树经验突破 10 点，枝繁叶茂，开始绽放点点星光。',
      date: sharedSettings.anniversary_date, // system placeholder date
      isUnlocked: treeExp >= 10,
      emoji: '🌿'
    });

    // 6. Tree EXP Level 50
    list.push({
      id: 'sys_tree_l50',
      isSystem: true,
      title: '👑 参天爱情神树 (50 EXP)',
      desc: '小树已成长为参天巨木，见证了我们数月以来的细心浇灌与互相关怀。',
      date: sharedSettings.anniversary_date,
      isUnlocked: treeExp >= 50,
      emoji: '💖'
    });

    // 7. Add Custom Milestones
    customMilestones.forEach(c => {
      list.push({
        id: `custom_${c.id}`,
        isSystem: false,
        title: `📌 ${c.title}`,
        desc: c.desc,
        date: c.date,
        isUnlocked: true,
        emoji: '✨'
      });
    });

    // Sort all milestones by date ascending (oldest first)
    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const newItem = {
      id: Date.now(),
      title: newTitle.trim(),
      date: newDate,
      desc: newDesc.trim() || '无详细描述。'
    };

    saveCustomMilestones([...customMilestones, newItem]);
    setNewTitle('');
    setNewDate('');
    setNewDesc('');
    setShowAddForm(false);
    playChimeSound();
  };

  const handleDeleteCustom = (id) => {
    playPopSound();
    if (confirm('确认删除这个大事件纪念吗？')) {
      saveCustomMilestones(customMilestones.filter(c => c.id !== id));
    }
  };

  const milestones = compileMilestones();

  return (
    <div className="container animate-fade-in" style={{ padding: '0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>🗺️ 我们的浪漫时间轴</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => { playPopSound(); setShowAddForm(!showAddForm); }}>
            {showAddForm ? '取消记录' : '➕ 记录大事件'}
          </button>
          <button className="btn btn-outline" onClick={onBack}>返回首页</button>
        </div>
      </header>

      {/* Add Custom Milestone Form */}
      {showAddForm && (
        <form onSubmit={handleAddCustom} className="card animate-fade-in" style={{ marginBottom: '2rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--color-text)' }}>记录我们的大事件 (如第一次看电影、见家长等)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>事件名称 (如: 见家长 🌸)</label>
                <input type="text" className="form-control" placeholder="输入名称..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>纪念日期</label>
                <input type="date" className="form-control" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>浪漫备注 (描述当时的心情或细节)</label>
              <textarea className="form-control" placeholder="输入细节..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} style={{ minHeight: '80px' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>录入纪念史册</button>
          </div>
        </form>
      )}

      {/* Timeline Visual Canvas */}
      {milestones.length === 0 ? (
        <div className="card text-center text-light" style={{ padding: '4rem' }}>
          相爱时间轴是空的，设定纪念日或写入小纸条来解锁首个节点吧！
        </div>
      ) : (
        <div style={{ position: 'relative', padding: '2rem 0', maxWidth: '700px', margin: '0 auto' }}>
          
          {/* Vertical ribbon path */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: '4px',
              marginLeft: '-2px',
              background: 'linear-gradient(to bottom, var(--color-primary) 0%, var(--color-danger) 100%)',
              boxShadow: '0 0 10px rgba(224, 122, 95, 0.4)',
              borderRadius: '2px',
              zIndex: 1
            }}
          />

          {/* Render cards alternating */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', position: 'relative', zIndex: 2 }}>
            {milestones.map((m, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <div 
                  key={m.id} 
                  style={{
                    display: 'flex',
                    justifyContent: isLeft ? 'flex-start' : 'flex-end',
                    width: '100%',
                    position: 'relative'
                  }}
                >
                  {/* Central Node Circle */}
                  <div 
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '20px',
                      width: '20px',
                      height: '20px',
                      marginLeft: '-10px',
                      borderRadius: '50%',
                      background: m.isUnlocked ? 'var(--color-primary)' : '#c8c6bf',
                      border: '4px solid #fff',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                      zIndex: 3
                    }}
                  />

                  {/* Milestone Card */}
                  <div 
                    className="card"
                    style={{
                      width: '45%',
                      textAlign: 'left',
                      padding: '1.25rem',
                      opacity: m.isUnlocked ? 1 : 0.5,
                      filter: m.isUnlocked ? 'none' : 'blur(0.5px)',
                      border: m.isUnlocked ? '1px solid var(--glass-border)' : '1px dashed #dcdad4',
                      background: m.isUnlocked ? 'var(--glass-bg)' : 'rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>{m.emoji || '📌'}</span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                        {m.title}
                      </h4>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.6rem', fontWeight: 'bold' }}>
                      📅 {m.isUnlocked && m.id.startsWith('sys_tree') ? '达成时即时激活' : new Date(m.date).toLocaleDateString()}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: '1.5', margin: 0 }}>
                      {m.desc}
                    </p>

                    {/* Delete button for custom ones */}
                    {!m.isSystem && (
                      <button 
                        type="button" 
                        onClick={() => handleDeleteCustom(parseInt(m.id.split('_')[1]))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-danger)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          marginTop: '0.75rem',
                          padding: 0
                        }}
                      >
                        🗑️ 删除记录
                      </button>
                    )}

                    {/* Lock state notice */}
                    {!m.isUnlocked && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.5rem', fontWeight: 'bold' }}>
                        🔒 经验尚未达成
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
};

export default MilestoneRoadmap;
