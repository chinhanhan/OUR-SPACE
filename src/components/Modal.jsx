import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="card animate-fade-in" 
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '500px', position: 'relative' }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1.5rem', 
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'var(--color-text-light)'
          }}
        >
          &times;
        </button>
        {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
