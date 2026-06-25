import { useState } from 'react';
import './LoginPage.css';

export default function LoginPage({ onLogin, onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const result = mode === 'login'
      ? onLogin(username, password)
      : onRegister(username, password);

    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">📚</div>
        <h1 className="login-title">儿童识字乐园</h1>
        <p className="login-subtitle">让识字变得有趣！</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${mode === 'login' ? 'login-tab--active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              登录
            </button>
            <button
              type="button"
              className={`login-tab ${mode === 'register' ? 'login-tab--active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              注册
            </button>
          </div>

          <input
            className="login-input"
            type="text"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className="login-input"
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit">
            {mode === 'login' ? '🚀 登录' : '✨ 注册'}
          </button>
        </form>
      </div>
    </div>
  );
}
