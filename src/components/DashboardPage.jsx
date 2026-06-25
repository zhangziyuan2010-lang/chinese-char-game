import { useState } from 'react';
import LearnedChars from './LearnedChars.jsx';
import ErrorBook from './ErrorBook.jsx';
import './DashboardPage.css';

export default function DashboardPage({ username, stats, onStartGame, onLogout }) {
  const [showLearned, setShowLearned] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);

  const progressPercent = stats.totalCount > 0
    ? Math.round((stats.learnedCount / stats.totalCount) * 100)
    : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-avatar">👦</div>
        <h2 className="dashboard-username">{username}</h2>
        <button className="dashboard-logout" onClick={onLogout}>退出</button>
      </div>

      {/* 学习进度 */}
      <div className="dashboard-progress-section">
        <div className="dashboard-progress-label">
          学习进度：{stats.learnedCount} / {stats.totalCount} 字
        </div>
        <div className="dashboard-progress-bar">
          <div
            className="dashboard-progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="dashboard-progress-percent">{progressPercent}%</div>
      </div>

      {/* 主菜单按钮 */}
      <div className="dashboard-menu">
        <button
          className="dashboard-menu-btn"
          onClick={() => setShowLearned(true)}
        >
          📖 <span>已学字</span>
          <small>{stats.learnedCount} 个</small>
        </button>

        <div className="dashboard-game-area">
          <button
            className={`dashboard-menu-btn dashboard-menu-btn--primary ${showGameMenu ? 'dashboard-menu-btn--active' : ''}`}
            onClick={() => setShowGameMenu(!showGameMenu)}
          >
            🎮 <span>开始游戏</span>
            <small>{showGameMenu ? '▲ 收起' : '▼ 展开'}</small>
          </button>
          {showGameMenu && (
            <div className="dashboard-game-submenu">
              <button
                className="dashboard-game-option dashboard-game-option--new"
                onClick={() => { onStartGame('new'); setShowGameMenu(false); }}
              >
                🆕 <span>新学字</span>
                <small>学习没学过的字</small>
              </button>
              <button
                className="dashboard-game-option dashboard-game-option--review"
                onClick={() => { onStartGame('review'); setShowGameMenu(false); }}
              >
                🔄 <span>复习字</span>
                <small>巩固已学过的字</small>
              </button>
              <button
                className="dashboard-game-option dashboard-game-option--mixed"
                onClick={() => { onStartGame('mixed'); setShowGameMenu(false); }}
              >
                🎯 <span>混合模式</span>
                <small>5个新字 + 5个老字</small>
              </button>
            </div>
          )}
        </div>

        <button
          className="dashboard-menu-btn"
          onClick={() => setShowError(true)}
        >
          📝 <span>错题本</span>
          <small>{stats.errorCount} 个</small>
        </button>
      </div>

      {/* 弹窗 */}
      {showLearned && <LearnedChars onClose={() => setShowLearned(false)} />}
      {showError && <ErrorBook onClose={() => setShowError(false)} />}
    </div>
  );
}
