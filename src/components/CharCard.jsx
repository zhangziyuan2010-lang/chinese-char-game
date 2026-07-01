import { getExampleSentences } from '../utils/charText.js';
import './CharCard.css';

export default function CharCard({ charData, isSpeaking, speechDone, onReplay }) {
  const exampleSentences = getExampleSentences(charData);

  if (!charData) return null;

  return (
    <div className="char-card">
      <div className="char-card__big">{charData.char}</div>
      <div className="char-card__pinyin">{charData.pinyin}</div>
      <div className="char-card__sentence-label">例句</div>
      <div className="char-card__sentences">
        {exampleSentences.map((sentence, i) => (
          <div key={sentence} className="char-card__sentence">
            <span className="char-card__sentence-index">{i + 1}</span>
            <span>{sentence}</span>
          </div>
        ))}
      </div>

      {isSpeaking && <div className="char-card__speaking">🔊 朗读中...</div>}

      {!isSpeaking && speechDone && (
        <div className="char-card__done">✅ 朗读完成</div>
      )}

      {!isSpeaking && !speechDone && (
        <button className="char-card__replay" onClick={onReplay}>🔊 播放朗读</button>
      )}
    </div>
  );
}
