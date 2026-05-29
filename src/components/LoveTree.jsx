import { useEffect, useState, useRef } from 'react';

const LoveTree = ({ experience }) => {
  const prevExpRef = useRef(experience);
  const [showExpGain, setShowExpGain] = useState(false);

  const stage = experience < 5 ? 1 : experience < 15 ? 2 : experience < 30 ? 3 : 4;

  useEffect(() => {
    if (experience > prevExpRef.current) {
      const showTimer = setTimeout(() => {
        setShowExpGain(true);
      }, 50);
      const hideTimer = setTimeout(() => {
        setShowExpGain(false);
      }, 2000);
      prevExpRef.current = experience;
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
    prevExpRef.current = experience;
  }, [experience]);

  const renderStage1 = () => (
    <svg width="100" height="100" viewBox="0 0 100 100" className="tree-svg-wrapper">
      <path d="M45,90 C45,80 40,70 30,65 C40,65 45,75 50,85 C55,75 60,65 70,65 C60,70 55,80 55,90 Z" fill="var(--color-primary)" />
      <rect x="48" y="90" width="4" height="10" fill="#8B5A2B" />
    </svg>
  );

  const renderStage2 = () => (
    <svg width="120" height="140" viewBox="0 0 120 140" className="tree-svg-wrapper">
      <path d="M50,130 C45,100 20,80 10,70 C30,70 45,90 55,110 C65,90 80,70 100,70 C90,80 65,100 60,130 Z" fill="var(--color-primary)" />
      <path d="M55,90 C45,60 30,50 20,40 C40,40 50,60 57,80 C65,60 75,40 95,40 C85,50 70,60 60,90 Z" fill="var(--color-primary-hover)" />
      <rect x="53" y="130" width="8" height="10" fill="#8B5A2B" />
    </svg>
  );

  const renderStage3 = () => (
    <svg width="160" height="180" viewBox="0 0 160 180" className="tree-svg-wrapper tree-stage-3">
      <circle cx="80" cy="70" r="50" fill="var(--color-primary)" />
      <circle cx="50" cy="90" r="35" fill="var(--color-primary-hover)" />
      <circle cx="110" cy="90" r="35" fill="var(--color-primary-hover)" />
      <circle cx="80" cy="40" r="30" fill="#B5D5B9" />
      <path d="M70,180 L75,100 L85,100 L90,180 Z" fill="#8B5A2B" />
      <path d="M75,120 L50,100 L55,95 L78,110 Z" fill="#7A4B20" />
      <path d="M85,130 L110,105 L105,100 L82,120 Z" fill="#7A4B20" />
    </svg>
  );

  const renderStage4 = () => (
    <svg width="180" height="200" viewBox="0 0 180 200" className="tree-svg-wrapper tree-stage-4">
      <circle cx="90" cy="80" r="60" fill="var(--color-primary)" />
      <circle cx="50" cy="100" r="45" fill="var(--color-primary-hover)" />
      <circle cx="130" cy="100" r="45" fill="var(--color-primary-hover)" />
      <circle cx="90" cy="40" r="40" fill="#B5D5B9" />
      <path d="M80,200 L85,110 L95,110 L100,200 Z" fill="#8B5A2B" />
      <path d="M85,140 L50,110 L55,100 L88,125 Z" fill="#7A4B20" />
      <path d="M95,150 L130,115 L125,105 L92,135 Z" fill="#7A4B20" />
      
      {/* Apples / Hearts */}
      <path d="M50,60 C50,55 45,50 40,50 C35,50 30,55 30,60 C30,70 40,80 40,80 C40,80 50,70 50,60 Z" fill="var(--color-danger)" />
      <path d="M120,40 C120,35 115,30 110,30 C105,30 100,35 100,40 C100,50 110,60 110,60 C110,60 120,50 120,40 Z" fill="var(--color-danger)" />
      <path d="M140,80 C140,75 135,70 130,70 C125,70 120,75 120,80 C120,90 130,100 130,100 C130,100 140,90 140,80 Z" fill="var(--color-danger)" />
      <path d="M90,100 C90,95 85,90 80,90 C75,90 70,95 70,100 C70,110 80,120 80,120 C80,120 90,110 90,100 Z" fill="var(--color-danger)" />
    </svg>
  );

  const getStageText = () => {
    switch(stage) {
      case 1: return '爱情的种子正在发芽 🌱';
      case 2: return '小树苗正在茁壮成长 🌿';
      case 3: return '爱情树已枝繁叶茂 🌳';
      case 4: return '你们的爱结出了甜美的果实 🍎';
      default: return '';
    }
  };

  return (
    <div className="tree-container">
      {showExpGain && <div className="exp-popup">+ 经验值</div>}
      
      <div style={{ minHeight: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {stage === 1 && renderStage1()}
        {stage === 2 && renderStage2()}
        {stage === 3 && renderStage3()}
        {stage === 4 && renderStage4()}
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.2rem' }}>
          {getStageText()}
        </div>
        <div className="text-light" style={{ fontSize: '0.9rem' }}>
          当前经验值: {experience} 
          {stage === 1 && ` (距离下一级还差 ${5 - experience})`}
          {stage === 2 && ` (距离下一级还差 ${15 - experience})`}
          {stage === 3 && ` (距离下一级还差 ${30 - experience})`}
        </div>
      </div>
    </div>
  );
};

export default LoveTree;
