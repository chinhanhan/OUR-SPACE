import { useMemo } from 'react';

const YearlyReport = ({ notes = [], bucketList = [], sharedSettings = {}, onBack }) => {
  
  const stats = useMemo(() => {
    // 1. Total Notes
    const totalNotes = notes.length;
    
    // 2. Appreciation vs Concern
    const appreciationCount = notes.filter(n => n.type === 'appreciation').length;
    const concernCount = notes.filter(n => n.type === 'concern').length;
    
    // 3. Who sent more appreciation?
    let maleAppreciation = 0;
    let femaleAppreciation = 0;
    notes.forEach(n => {
      if (n.type === 'appreciation') {
        if (n.author === '男方') maleAppreciation++;
        if (n.author === '女方') femaleAppreciation++;
      }
    });

    const mostAppreciative = maleAppreciation > femaleAppreciation ? '男方' : (femaleAppreciation > maleAppreciation ? '女方' : '不分伯仲');

    // 4. Most frequent negative emotion
    const emotionCounts = {};
    notes.forEach(n => {
      if (n.type === 'concern' && n.emotion) {
        emotionCounts[n.emotion] = (emotionCounts[n.emotion] || 0) + 1;
      }
    });
    
    let topEmotion = '无';
    let topEmotionCount = 0;
    for (const [emo, count] of Object.entries(emotionCounts)) {
      if (count > topEmotionCount) {
        topEmotion = emo;
        topEmotionCount = count;
      }
    }

    // 5. Bucket List
    const completedBucket = bucketList.filter(b => b.is_completed).length;

    // 6. Days Together
    let daysTogether = 0;
    if (sharedSettings.anniversary_date) {
      const diff = Math.floor((new Date() - new Date(sharedSettings.anniversary_date)) / (1000 * 60 * 60 * 24));
      daysTogether = diff >= 0 ? diff : 0;
    }

    return {
      totalNotes,
      appreciationCount,
      concernCount,
      mostAppreciative,
      topEmotion,
      completedBucket,
      daysTogether,
      treeExp: sharedSettings.tree_experience || 0
    };
  }, [notes, bucketList, sharedSettings]);

  return (
    <div className="container animate-fade-in" style={{ padding: '0', maxWidth: '500px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>📊 2026 年度回忆录</h2>
        <button className="btn btn-outline" onClick={onBack}>返回</button>
      </header>

      {/* Report Poster */}
      <div id="report-poster" style={{ 
        background: 'linear-gradient(135deg, #ffb5a7 0%, #fec89a 100%)', 
        borderRadius: 'var(--radius-md)', 
        padding: '2.5rem 2rem', 
        color: '#fff',
        boxShadow: '0 20px 40px rgba(224, 122, 95, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Decor */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', fontSize: '150px', opacity: 0.1 }}>✨</div>
        <div style={{ position: 'absolute', bottom: '-20px', left: '-30px', fontSize: '100px', opacity: 0.1 }}>🌳</div>

        <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Our Space</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>年度专属感情报告</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', zIndex: 2 }}>
          
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>相爱的时光</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              今年是你们相爱的第 <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.daysTogether}</span> 天
            </div>
            <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
              共同完成了 {stats.completedBucket} 个心愿 🌟
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>纸条与沟通</div>
            <div style={{ fontSize: '1.2rem', lineHeight: 1.6 }}>
              你们一共交换了 <b>{stats.totalNotes}</b> 张纸条。<br/>
              其中有 <b>{stats.appreciationCount}</b> 张是感谢与夸奖。<br/>
              <b>{stats.mostAppreciative}</b> 是今年的“夸夸王” 🏆
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>情绪与成长</div>
            <div style={{ fontSize: '1.2rem', lineHeight: 1.6 }}>
              你们今年最常经历的负面情绪是：<b style={{ color: '#FFE0E0' }}>{stats.topEmotion}</b>。<br/>
              但你们通过 {stats.concernCount} 次深度沟通化解了它们。<br/>
              最终，爱情树长到了 <b>{stats.treeExp}</b> 级 🌳！
            </div>
          </div>

        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem', opacity: 0.8, fontSize: '0.9rem' }}>
          感谢 2026 有你相伴。
        </div>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p className="text-light" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>手机端可以截屏保存这张专属海报哦~</p>
      </div>
    </div>
  );
};

export default YearlyReport;
