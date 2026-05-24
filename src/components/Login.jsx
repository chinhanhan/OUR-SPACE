import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPin = import.meta.env.VITE_SPACE_PIN || '1234';
    if (pin === correctPin) {
      onLogin();
    } else {
      setError('暗号错误，请重试');
      setPin('');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card text-center" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>🕊️ Our Space</h2>
        <p className="text-light" style={{ marginBottom: '2rem' }}>
          这是属于你们两人的私密空间。<br/>请输入空间暗号进入。
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              className="form-control text-center"
              placeholder="请输入 4 位数字暗号"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
              autoFocus
            />
          </div>
          {error && <p style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            进入空间
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
