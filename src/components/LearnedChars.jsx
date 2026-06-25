import { useMemo } from 'react';
import { getCurrentUser, getUserData } from '../utils/storage.js';
import charDB from '../data/charDB.js';
import './Modal.css';

export default function LearnedChars({ onClose }) {
  const user = getCurrentUser();
  const userData = getUserData(user);

  const learnedChars = useMemo(() => {
    if (!userData?.learnedChars) return [];
    const ids = new Set(userData.learnedChars);
    return charDB.filter(c => ids.has(c.id));
  }, [userData]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📖 已学字（{learnedChars.length}）</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {learnedChars.length === 0 ? (
            <div className="modal-empty">还没有学习过任何字，快去开始游戏吧！</div>
          ) : (
            <div className="char-grid">
              {learnedChars.map(c => (
                <div key={c.id} className="char-grid-item">
                  <span className="char-grid-char">{c.char}</span>
                  <span className="char-grid-pinyin">{c.pinyin}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
