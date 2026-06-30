import { useMemo } from 'react';
import { getCurrentUser, getUserData } from '../utils/storage.js';
import charDB from '../data/charDB.js';
import { getChildMeaning } from '../utils/charText.js';
import './Modal.css';

export default function ErrorBook({ onClose }) {
  const user = getCurrentUser();
  const userData = getUserData(user);

  const errorChars = useMemo(() => {
    if (!userData?.errorChars) return [];
    const ids = new Set(userData.errorChars);
    return charDB.filter(c => ids.has(c.id));
  }, [userData]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📝 错题本（{errorChars.length}）</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {errorChars.length === 0 ? (
            <div className="modal-empty">🎉 太棒了！没有错字记录。</div>
          ) : (
            <div className="error-list">
              {errorChars.map(c => (
                <div key={c.id} className="error-item">
                  <div className="error-item-char">{c.char}</div>
                  <div className="error-item-info">
                    <div className="error-item-pinyin">{c.pinyin}</div>
                    <div className="error-item-meaning">{getChildMeaning(c)}</div>
                    <div className="error-item-sentence">{c.sentence}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
