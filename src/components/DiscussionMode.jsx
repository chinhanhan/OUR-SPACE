import { useState } from 'react';
import { getAiAdvice } from '../lib/gemini';

const DEEP_QUESTIONS = [
  "过去这一个月里，哪一件小事让你觉得‘被爱着’？",
  "如果下个月我们只能花一天时间高质量约会，你想做什么？",
  "最近这段时间，有没有哪个瞬间你觉得我没有理解你的感受？",
  "在你看来，我们俩在沟通方式上，还有什么可以共同改进的地方？",
  "最近压力最大的事情是什么？我能怎么帮你分担一点？",
  "回忆一下刚在一起时，最打动你的那个瞬间是什么？",
  "如果我们目前的相处模式可以改变一件事，你希望是什么？"
];

const DiscussionMode = ({ notes, actionItems, setActionItems, onFinish, onBack }) => {
  const [phase, setPhase] = useState('welcome'); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newAction, setNewAction] = useState('');
  const [assignee, setAssignee] = useState('我们一起');
  
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [randomQuestions] = useState(() => {
    const shuffled = [...DEEP_QUESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  });

  const appreciations = notes.filter(n => n.type === 'appreciation');
  const concerns = notes.filter(n => n.type === 'concern');

  const handleNext = () => {
    setAiAdvice(''); // Clear AI advice on next card
    if (phase === 'welcome') {
      setPhase('deepQuestions');
    } else if (phase === 'deepQuestions') {
      if (appreciations.length > 0) setPhase('appreciations');
      else if (concerns.length > 0) setPhase('concerns');
      else setPhase('actionItems');
      setCurrentIndex(0);
    } else if (phase === 'appreciations') {
      if (currentIndex < appreciations.length - 1) setCurrentIndex(currentIndex + 1);
      else {
        if (concerns.length > 0) { setPhase('concerns'); setCurrentIndex(0); }
        else setPhase('actionItems');
      }
    } else if (phase === 'concerns') {
      if (currentIndex < concerns.length - 1) setCurrentIndex(currentIndex + 1);
      else setPhase('actionItems');
    } else if (phase === 'actionItems') {
      setPhase('finished');
    }
  };

  const handleCallAi = async (note) => {
    setIsAiLoading(true);
    const advice = await getAiAdvice(note.text, note.emotion, note.author);
    setAiAdvice(advice);
    setIsAiLoading(false);
  };

  const handleAddAction = (e) => {
    e.preventDefault();
    if (!newAction.trim()) return;
    setActionItems([...actionItems, { id: Date.now(), text: newAction, isCompleted: false, assignee }]);
    setNewAction('');
  };

  const toggleAction = (id) => {
    setActionItems(actionItems.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item));
  };

  const renderWelcome = () => (
    <div className="card text-center animate-fade-in" style={{ padding: '4rem 2rem' }}>
      <h2 style={{ color: 'var(--color-primary)', marginBottom: '1.5rem' }}>欢迎来到讨论日</h2>
      <p className="text-light" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        感谢你们为了这段感情付出的努力。<br/>
        请记住我们的原则：<b>先听对方说完，就事论事，温柔沟通。</b>
      </p>
      <button className="btn btn-primary" onClick={handleNext}>准备好了，开始吧</button>
    </div>
  );

  const renderDeepQuestions = () => (
    <div className="card text-center animate-fade-in" style={{ padding: '3rem 2rem', borderTop: '4px solid var(--color-primary)' }}>
      <h2 style={{ color: 'var(--color-text)', marginBottom: '1rem' }}>破冰：深度灵魂拷问</h2>
      <p className="text-light" style={{ marginBottom: '2rem' }}>
        在正式打开纸条之前，让我们先放下防备，探讨一下下面两个问题。<br/>
        (只需口头分享，不需要记录)
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
        {randomQuestions.map((q, idx) => (
          <div key={idx} style={{ backgroundColor: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', fontSize: '1.1rem', fontWeight: 500, color: 'var(--color-primary)' }}>
            “{q}”
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={handleNext}>聊完了，我们去开盲盒吧</button>
    </div>
  );

  const renderNoteCard = (note, total, title, isAppreciation) => (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 className="text-light" style={{ marginBottom: '2rem' }}>{title} ({currentIndex + 1} / {total})</h3>
      
      <div className="card" style={{ 
          width: '100%', 
          minHeight: '200px', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'flex-start',
          backgroundColor: isAppreciation ? 'rgba(163, 201, 168, 0.1)' : 'rgba(224, 122, 95, 0.1)',
          borderLeft: `4px solid ${isAppreciation ? 'var(--color-primary)' : 'var(--color-danger)'}`,
          marginBottom: '2rem',
          position: 'relative'
        }}>
        
        <div style={{ width: '100%', alignSelf: 'flex-start', marginBottom: '1rem', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
          来自: <b>{note.author || '未知'}</b> 
          {!isAppreciation && note.emotion && <span style={{ marginLeft: '1rem', color: 'var(--color-danger)' }}>心情: {note.emotion}</span>}
        </div>
        
        {note.image_url && (
          <img 
            src={note.image_url} 
            alt="附件图片" 
            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', objectFit: 'contain' }} 
          />
        )}
        
        <p style={{ whiteSpace: 'pre-wrap', fontSize: '1.25rem', width: '100%' }}>{note.text}</p>
        
        {/* AI Action Box for Concerns */}
        {!isAppreciation && (
          <div style={{ width: '100%', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed rgba(224, 122, 95, 0.3)' }}>
            {!aiAdvice && (
              <button 
                className="btn btn-outline" 
                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                onClick={() => handleCallAi(note)}
                disabled={isAiLoading}
              >
                {isAiLoading ? '🤖 AI 思考中...' : '🤖 呼叫 AI 场外援助'}
              </button>
            )}
            {aiAdvice && (
              <div className="animate-fade-in" style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem' }}>
                <b style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.5rem' }}>🤖 AI 调解员说：</b>
                <p style={{ color: 'var(--color-text)' }}>{aiAdvice}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <button className="btn btn-primary" onClick={handleNext}>
        {currentIndex < total - 1 ? '下一张' : '看完了该环节'}
      </button>
    </div>
  );

  const renderActionItems = () => (
    <div className="card animate-fade-in">
      <h2 style={{ color: 'var(--color-text)', textAlign: 'center' }}>下一步行动计划</h2>
      <p className="text-light text-center" style={{ marginBottom: '2rem' }}>基于今天的讨论，我们在下个月做出哪些改变？</p>
      
      <form onSubmit={handleAddAction} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <select 
          className="form-control" 
          value={assignee} 
          onChange={(e) => setAssignee(e.target.value)}
          style={{ width: '120px' }}
        >
          <option value="我们一起">我们一起</option>
          <option value="男方">男方</option>
          <option value="女方">女方</option>
        </select>
        <input 
          type="text" 
          className="form-control" 
          placeholder="下个月争取周末一起做一顿饭..." 
          value={newAction}
          onChange={(e) => setNewAction(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary">添加</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {actionItems.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
            <input type="checkbox" checked={item.isCompleted} onChange={() => toggleAction(item.id)} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
            <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.9rem' }}>[{item.assignee || '共同'}]</span>
            <span style={{ flex: 1, textDecoration: item.isCompleted ? 'line-through' : 'none', color: item.isCompleted ? 'var(--color-text-light)' : 'var(--color-text)' }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button className="btn btn-primary" onClick={handleNext}>完成本次复盘并归档</button>
      </div>
    </div>
  );

  const renderFinished = () => (
    <div className="card text-center animate-fade-in" style={{ padding: '4rem 2rem' }}>
      <h2 style={{ color: 'var(--color-primary)', marginBottom: '1.5rem' }}>复盘完成 🎉</h2>
      <p className="text-light" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        感谢你们又一次为了更好的相处而努力。<br/>
        本次纸条已归档进“时光机”。希望下个月的我们，比这个月更相爱。
      </p>
      <button className="btn btn-outline" onClick={() => { onFinish(); onBack(); }}>返回首页</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {phase === 'welcome' && renderWelcome()}
      {phase === 'deepQuestions' && renderDeepQuestions()}
      {phase === 'appreciations' && renderNoteCard(appreciations[currentIndex], appreciations.length, '✨ 第一阶段：互相感谢', true)}
      {phase === 'concerns' && renderNoteCard(concerns[currentIndex], concerns.length, '💭 第二阶段：问题探讨', false)}
      {phase === 'actionItems' && renderActionItems()}
      {phase === 'finished' && renderFinished()}
    </div>
  );
};

export default DiscussionMode;
