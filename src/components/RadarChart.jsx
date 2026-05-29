

const RadarChart = ({ notes = [], bucketList = [], profiles = [], sharedSettings = {}, onBack }) => {
  
  // 1. Calculate Words of Affirmation (Appreciation notes)
  const appreciationCount = notes.filter(n => n.type === 'appreciation' && n.status !== 'archived').length;
  const valAffirmation = Math.min(100, Math.max(15, appreciationCount * 12)); // min value 15 for aesthetics

  // 2. Calculate Empathy / Comfort (Concern notes)
  const concernCount = notes.filter(n => n.type === 'concern' && n.status !== 'archived').length;
  const valEmpathy = Math.min(100, Math.max(15, concernCount * 18));

  // 3. Calculate Companionship / Quality Time (Tree Experience)
  const treeExp = sharedSettings.tree_experience || 0;
  const valCompanionship = Math.min(100, Math.max(15, treeExp * 2));

  // 4. Calculate Bucket List Completion Rate
  const totalWishes = bucketList.length;
  const completedWishes = bucketList.filter(b => b.is_completed).length;
  const valBucketList = totalWishes > 0 ? Math.min(100, Math.max(15, Math.round((completedWishes / totalWishes) * 100))) : 15;

  // 5. Calculate Service / Profile Completeness (filled fields out of birthdays, love language, period)
  const getCompletenessVal = () => {
    let filledCount = 0;
    const totalFields = 6;
    
    profiles.forEach(p => {
      if (p.love_language) filledCount++;
      if (p.cycle_last_date) filledCount++;
    });
    if (sharedSettings.anniversary_date) filledCount += 2;
    
    const girlBday = localStorage.getItem('our-space-girl-bday');
    const boyBday = localStorage.getItem('our-space-boy-bday');
    if (girlBday) filledCount++;
    if (boyBday) filledCount++;

    return Math.min(100, Math.max(20, Math.round((filledCount / totalFields) * 100)));
  };
  const valService = getCompletenessVal();

  // Radar Configurations
  const maxRadius = 100;
  const center = 150; // offset in SVG
  const dimensions = [
    { label: '✨ 肯定言辞', val: valAffirmation, color: '#8AB28F' },
    { label: '💭 情绪共鸣', val: valEmpathy, color: '#E07A5F' },
    { label: '🌳 浪漫陪伴', val: valCompanionship, color: '#739C78' },
    { label: '🏆 愿望达成', val: valBucketList, color: '#d89656' },
    { label: '⚡ 默契契合', val: valService, color: '#a2d2ff' }
  ];

  // Calculate coordinates for pentagon
  const getCoordinates = (value, idx) => {
    const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2; // offset by 90deg to start from top
    const r = (value / 100) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Build grid lines (concentric pentagons)
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPoints = gridLevels.map(level => 
    dimensions.map((_, idx) => {
      const coord = getCoordinates(level, idx);
      return `${coord.x},${coord.y}`;
    }).join(' ')
  );

  // Build data polygon points
  const dataPoints = dimensions.map((d, idx) => {
    const coord = getCoordinates(d.val, idx);
    return `${coord.x},${coord.y}`;
  }).join(' ');

  // Relationship Empathy Analysis Commentary
  const getAnalysis = () => {
    const sorted = [...dimensions].sort((a, b) => b.val - a.val);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    let msg = '';
    
    if (strongest.val < 30) {
      return {
        title: '🌱 新芽萌发期',
        detail: '你们的小屋刚添置不久，很多数据还在等待灌溉哦。试着多写一些感谢纸条，或添加几个周末心愿吧，爱情树会飞速成长！'
      };
    }

    if (strongest.label.includes('肯定言辞')) {
      msg += '你们是一对**极具温度的恋人**。你们非常乐意且擅长将爱意诉诸笔端，日常存入的“开心/感谢”纸条是空间最亮眼的风景。';
    } else if (strongest.label.includes('情绪共鸣')) {
      msg += '你们拥有**极强的同理心**。每当有矛盾或小情绪时，你们都能敞开心扉地进行非暴力复盘，这让关系坚如磐石。';
    } else if (strongest.label.includes('浪漫陪伴')) {
      msg += '你们的**日常陪伴极其深厚**。每天上线灌溉爱情树已经成为习惯，高额的经验值见证了你们细水长流的感情。';
    } else if (strongest.label.includes('愿望达成')) {
      msg += '你们是**执行力爆表浪漫玩家**。定下的愿望清单都会努力去完成，打卡相册记录了无数值得珍藏的一幕幕。';
    } else {
      msg += '你们的**默契档案十分完备**。彼此的生日、纪念日甚至生理期都掌握得清清楚楚，是彼此的贴心守护者。';
    }

    if (weakest.val < 45) {
      msg += `\n\n💡 **建议小贴士**：你们在 **【${weakest.label}】** 维度上还有提升空间。试着`;
      if (weakest.label.includes('肯定言辞')) {
        msg += '在控制中心存入几张暖心的感谢纸条，表达平时不好意思开口的谢意吧！';
      } else if (weakest.label.includes('情绪共鸣')) {
        msg += '在下一次“讨论日”来临前，写下一封倾听卡片，把想解决的小插曲摆到桌面上好好聊聊。';
      } else if (weakest.label.includes('浪漫陪伴')) {
        msg += '坚持每天来打卡看看对方，也可以多做互动，给爱情树多浇点水。';
      } else if (weakest.label.includes('愿望达成')) {
        msg += '规划一次周末约会，挑选愿望清单里的一个小日常（比如一起喝杯咖啡）并拍照打卡完成。';
      } else {
        msg += '去主页大卡片设定你们相恋的纪念日，或者补充彼此的爱语档案，让信息更加契合。';
      }
    } else {
      msg += '\n\n🎉 真是令人羡慕！你们在各个维度的指数都非常均衡且饱满，继续保持这股高频温暖的互动频率吧！';
    }

    return {
      title: '🌟 专属情感分析',
      detail: msg
    };
  };

  const analysis = getAnalysis();

  return (
    <div className="container animate-fade-in" style={{ padding: '0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>📊 我们的爱语默契雷达图</h2>
        <button className="btn btn-outline" onClick={onBack}>返回首页</button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        
        {/* Radar SVG Card */}
        <div 
          className="card text-center" 
          style={{ 
            padding: '2rem', 
            maxWidth: '380px', 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            position: 'relative'
          }}
        >
          <svg width="300" height="300" style={{ overflow: 'visible' }}>
            {/* 1. Draw grid concentric pentagons */}
            {gridPoints.map((points, idx) => (
              <polygon
                key={idx}
                points={points}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
              />
            ))}

            {/* 2. Draw axis lines */}
            {dimensions.map((_, idx) => {
              const outerCoord = getCoordinates(100, idx);
              return (
                <line
                  key={idx}
                  x1={center}
                  y1={center}
                  x2={outerCoord.x}
                  y2={outerCoord.y}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* 3. Draw grid value helper labels */}
            {[40, 80].map((level) => {
              const coord = getCoordinates(level, 0);
              return (
                <text
                  key={level}
                  x={coord.x - 12}
                  y={coord.y + 4}
                  fill="rgba(0,0,0,0.2)"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {level}
                </text>
              );
            })}

            {/* 4. Draw data polygon */}
            <polygon
              points={dataPoints}
              fill="rgba(138, 178, 143, 0.35)"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              style={{ filter: 'drop-shadow(0 4px 10px rgba(138, 178, 143, 0.2))' }}
            />

            {/* 5. Draw data vertices dots */}
            {dimensions.map((d, idx) => {
              const coord = getCoordinates(d.val, idx);
              return (
                <circle
                  key={idx}
                  cx={coord.x}
                  cy={coord.y}
                  r="5"
                  fill="#fff"
                  stroke={d.color}
                  strokeWidth="2.5"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                />
              );
            })}

            {/* 6. Draw axis labels */}
            {dimensions.map((d, idx) => {
              const labelCoord = getCoordinates(118, idx);
              let textAnchor = 'middle';
              
              if (idx === 1 || idx === 2) textAnchor = 'start';
              else if (idx === 3 || idx === 4) textAnchor = 'end';

              return (
                <text
                  key={idx}
                  x={labelCoord.x}
                  y={labelCoord.y + 4}
                  textAnchor={textAnchor}
                  fill="var(--color-text)"
                  fontSize="11.5"
                  fontWeight="600"
                >
                  {d.label} ({d.val})
                </text>
              );
            })}
          </svg>
        </div>

        {/* Dynamic commentary analysis card */}
        <div className="card text-left" style={{ maxWidth: '600px', width: '100%' }}>
          <h3 style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '1.15rem', marginBottom: '0.75rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem' }}>
            {analysis.title}
          </h3>
          <p 
            style={{ 
              fontSize: '0.95rem', 
              color: 'var(--color-text)', 
              lineHeight: '1.7', 
              whiteSpace: 'pre-wrap', 
              margin: 0 
            }}
            dangerouslySetInnerHTML={{ __html: analysis.detail.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
          />
        </div>

      </div>
    </div>
  );
};

export default RadarChart;
