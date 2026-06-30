import { useMemo } from 'react';
import { getChildMeaning } from '../utils/charText.js';
import './GameResultPage.css';

export default function GameResultPage({ score, wrongChars, roundChars, mode, username, onBackToLobby, onPlayAgain }) {
  const wrongCharData = useMemo(() => {
    if (!wrongChars || !roundChars) return [];
    const ids = new Set(wrongChars);
    return roundChars.filter(c => ids.has(c.id));
  }, [wrongChars, roundChars]);

  const isPerfect = score === 10;
  const modeLabel = mode === 'new'
    ? '新学字'
    : mode === 'review'
      ? '复习字'
      : mode === 'speak'
        ? '跟读练习'
        : '混合模式';

  return (
    <div className="result-page">
      <div className="result-card">
        {/* 分数展示 */}
        <div className="result-score-section">
          <div className="result-emoji">{isPerfect ? '🏆' : score >= 8 ? '😊' : score >= 6 ? '🤔' : '💪'}</div>
          <div className="result-score">{score} / 10</div>
          <div className="result-label">
            {isPerfect ? '太厉害了，全部正确！' : score >= 8 ? '很棒，继续加油！' : '再接再厉，你可以的！'}
          </div>
          <div className="result-mode">{modeLabel}</div>
        </div>

        {/* 错字回顾 */}
        {wrongCharData.length > 0 && (
          <div className="result-wrong-section">
            <h4>📝 需要复习的字（{wrongCharData.length} 个）</h4>
            <div className="result-wrong-list">
              {wrongCharData.map(c => (
                <div key={c.id} className="result-wrong-item">
                  <div className="result-wrong-char">{c.char}</div>
                  <div>
                    <div className="result-wrong-pinyin">{c.pinyin}</div>
                    <div className="result-wrong-meaning">{getChildMeaning(c)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="result-buttons">
          <button className="result-btn result-btn--again" onClick={onPlayAgain}>
            🔄 再来一局
          </button>
          <button className="result-btn result-btn--lobby" onClick={onBackToLobby}>
            🏠 返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
