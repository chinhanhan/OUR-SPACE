import { useState } from 'react';
import { useTilt } from '../hooks/useTilt';

// Child component for individual Polaroid cards to isolate the useTilt hook refs
const PolaroidCard = ({ item, onClick }) => {
  const tiltRef = useTilt({ max: 8, scale: 1.04 });
  
  // Format dates
  const dateStr = new Date(item.date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div 
      ref={tiltRef} 
      className="card polaroid-card animate-fade-in"
      onClick={onClick}
      style={{
        background: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '0.9rem 0.9rem 2.2rem 0.9rem', // classic polaroid margin bottom
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'transform 0.15s ease-out, box-shadow 0.2s ease',
        transformStyle: 'preserve-3d',
        margin: '0 auto',
        width: '100%',
        maxWidth: '260px'
      }}
    >
      {/* Photo slot */}
      <div 
        style={{ 
          width: '100%', 
          aspectRatio: '1', 
          overflow: 'hidden', 
          backgroundColor: '#eaeaea',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
          marginBottom: '1rem',
          transform: 'translateZ(15px)' // 3D Layer lift
        }}
      >
        <img 
          src={item.imageUrl} 
          alt={item.text} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </div>

      {/* Polaroid Caption */}
      <div 
        style={{ 
          fontFamily: '"STKaiti", "KaiTi", "Georgia", serif', 
          fontSize: '1rem', 
          fontWeight: 'bold', 
          color: '#2B2D42', 
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          padding: '0 0.25rem',
          transform: 'translateZ(25px)' // Higher 3D lift
        }}
      >
        {item.text}
      </div>

      {/* Polaroid Date */}
      <div 
        style={{ 
          fontSize: '0.7rem', 
          color: '#8D99AE', 
          marginTop: '0.4rem',
          fontFamily: 'Outfit, sans-serif',
          transform: 'translateZ(20px)'
        }}
      >
        {dateStr}
      </div>

      {/* Mini tag indicator */}
      <div 
        style={{ 
          position: 'absolute',
          top: '12px',
          right: '12px',
          padding: '0.15rem 0.4rem',
          borderRadius: '4px',
          fontSize: '0.65rem',
          fontWeight: 'bold',
          color: '#fff',
          background: item.typeColor,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          transform: 'translateZ(30px)'
        }}
      >
        {item.typeLabel}
      </div>
    </div>
  );
};

const PhotoWall = ({ notes = [], bucketList = [], timeCapsules = [], onBack }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  // Sweet romantic quotes shown randomly in the gallery modal
  const loveQuotes = [
    "“所爱隔山海，山海皆可平。”",
    "“你是这平淡生活里的唯一偏爱。”",
    "“和你在一起的每一刻，都是漫长岁月里的闪光点。”",
    "“星河滚烫，你是人间理想。”",
    "“答案很长，我准备用一生的时间来回答你。”",
    "“承蒙你的出现，够我欢喜好多年。”",
    "“你是清晨的第一缕微光，也是日暮的最后一抹晚霞。”",
    "“喜欢你，像风走了八百里，不问归期。”",
    "“愿得一人心，白首不相离。”",
    "“风筝有风，海豚有海，而我有你。”"
  ];

  // Pick a random quote index based on the item ID to make it deterministic for the same photo
  const getLoveQuote = (id) => {
    const numId = typeof id === 'number' ? id : (id.split('_').pop() || '0');
    const index = parseInt(numId, 36) % loveQuotes.length;
    return loveQuotes[isNaN(index) ? 0 : index];
  };

  // Parse [category] prefix for bucket list wishes
  const parseBucketText = (text) => {
    const match = text.match(/^\[([a-z]+)\]\s*(.*)$/);
    return match ? match[2] : text;
  };

  // Compile all data with image URLs
  const compilePhotos = () => {
    const list = [];

    // 1. From Appreciation/Concern Notes
    notes.forEach(n => {
      if (n.image_url) {
        list.push({
          id: `note_${n.id}`,
          imageUrl: n.image_url,
          text: n.text === '[手绘涂鸦]' ? '🎨 我们的一幅手绘涂鸦' : n.text,
          date: n.created_at,
          author: n.author,
          typeLabel: n.type === 'appreciation' ? '✨ 开心' : '💭 情绪',
          typeColor: n.type === 'appreciation' ? 'var(--color-primary)' : 'var(--color-danger)'
        });
      }
    });

    // 2. From Completed Bucket List Items
    bucketList.forEach(b => {
      if (b.is_completed && b.image_url) {
        list.push({
          id: `bucket_${b.id}`,
          imageUrl: b.image_url,
          text: `🏆 实现了愿望: ${parseBucketText(b.text)}`,
          date: b.created_at,
          author: '共同达成',
          typeLabel: '🌟 愿望',
          typeColor: '#d89656'
        });
      }
    });

    // 3. From Unlocked Time Capsules
    timeCapsules.forEach(t => {
      const isUnlocked = new Date() >= new Date(t.unlock_date);
      if (isUnlocked && t.image_url) {
        list.push({
          id: `capsule_${t.id}`,
          imageUrl: t.image_url,
          text: `⌛️ 时光胶囊: ${t.text}`,
          date: t.created_at,
          author: t.author,
          typeLabel: '💌 胶囊',
          typeColor: '#a2d2ff'
        });
      }
    });

    // Sort by date descending (latest photos first)
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const photos = compilePhotos();

  return (
    <div className="container animate-fade-in" style={{ padding: '0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>📷 我们的拍立得回忆墙</h2>
        <button className="btn btn-outline" onClick={onBack}>返回首页</button>
      </header>

      {photos.length === 0 ? (
        <div className="card text-center text-light" style={{ padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎞️</div>
          回忆墙上还空空的呢。快去添加带有打卡照的愿望、写带有图片的纸条，或者埋下时光胶囊吧！
        </div>
      ) : (
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '2rem',
            padding: '1rem 0'
          }}
        >
          {photos.map(photo => (
            <PolaroidCard 
              key={photo.id} 
              item={photo} 
              onClick={() => setSelectedItem(photo)} 
            />
          ))}
        </div>
      )}

      {/* Dark glassmorphic gallery modal */}
      {selectedItem && (
        <div 
          className="animate-fade-in"
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(20, 20, 25, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              maxWidth: '550px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              color: 'var(--color-text)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Image */}
            <div style={{ width: '100%', maxHeight: '380px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.1)' }}>
              <img 
                src={selectedItem.imageUrl} 
                alt={selectedItem.text} 
                style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '380px' }} 
              />
            </div>

            {/* Content Details */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', background: selectedItem.typeColor, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {selectedItem.typeLabel}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  {new Date(selectedItem.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: 500, lineHeight: '1.5', margin: '0.5rem 0', wordBreak: 'break-word' }}>
                {selectedItem.text}
              </p>
              <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '0.25rem' }}>
                来自: <b>{selectedItem.author}</b>
              </div>
            </div>

            {/* Romantic Quote divider */}
            <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem', textAlign: 'center' }}>
              <div 
                style={{ 
                  fontFamily: '"STKaiti", "KaiTi", serif', 
                  fontStyle: 'italic', 
                  color: 'var(--color-primary-hover)', 
                  fontSize: '1.05rem', 
                  lineHeight: '1.4' 
                }}
              >
                {getLoveQuote(selectedItem.id)}
              </div>
            </div>

            <button 
              className="btn btn-outline" 
              onClick={() => setSelectedItem(null)}
              style={{ alignSelf: 'center', marginTop: '0.5rem', padding: '0.5rem 2rem' }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoWall;
