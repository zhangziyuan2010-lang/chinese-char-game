import { useState, useCallback, useEffect } from 'react';
import CharCard from './CharCard.jsx';
import { stopSpeak } from '../utils/speech.js';
import './GameLearnPhase.css';

export default function GameLearnPhase({ roundChars, onComplete }) {
  const [index, setIndex] = useState(0);
  const [showChar, setShowChar] = useState(true);
  const [speechDone, setSpeechDone] = useState(false);
  const hasChars = roundChars.length > 0;
  const isLast = index === roundChars.length - 1;

  const moveToIndex = useCallback((nextIndex) => {
    stopSpeak();
    setSpeechDone(false);
    setIndex(nextIndex);
    setShowChar(false);
    setTimeout(() => setShowChar(true), 100);
  }, []);

  const handlePrev = useCallback(() => {
    if (index === 0) return;
    moveToIndex(index - 1);
  }, [index, moveToIndex]);

  const handleNext = useCallback(() => {
    if (!speechDone) return;

    if (isLast) {
      stopSpeak();
      onComplete();
      return;
    }

    moveToIndex(index + 1);
  }, [index, isLast, moveToIndex, onComplete, speechDone]);

  // 组件卸载时取消朗读
  useEffect(() => {
    return () => stopSpeak();
  }, []);

  if (!hasChars) {
    return (
      <div className="learn-phase">
        <div className="learn-card-area">
          <div className="learn-card-hint">现在没有可以练习的字，先回首页选择新学字吧。</div>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-phase">
      {/* 进度条 */}
      <div className="learn-progress">
        <div className="learn-progress-dots">
          {roundChars.map((_, i) => (
            <div
              key={i}
              className={`learn-dot ${i < index ? 'learn-dot--done' : i === index ? 'learn-dot--active' : ''}`}
            ></div>
          ))}
        </div>
        <div className="learn-progress-text">{index + 1} / {roundChars.length}</div>
      </div>

      {/* 字卡 */}
      <div className="learn-card-area">
        {showChar && (
          <CharCard
            key={roundChars[index].id}
            charData={roundChars[index]}
            onSpeechDone={() => setSpeechDone(true)}
          />
        )}
      </div>

      <div className="learn-card-hint">
        {speechDone ? '朗读完成后，可以继续或返回复听' : '请认真听完朗读'}
      </div>

      <div className="learn-nav">
        <button
          className="learn-nav-btn"
          onClick={handlePrev}
          disabled={index === 0}
        >
          ← 上一个
        </button>
        <button
          className="learn-nav-btn learn-nav-btn--primary"
          onClick={handleNext}
          disabled={!speechDone}
        >
          {isLast ? '开始测验 →' : '下一个 →'}
        </button>
      </div>
    </div>
  );
}
