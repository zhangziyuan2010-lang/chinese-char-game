import { useState, useCallback, useEffect } from 'react';
import CharCard from './CharCard.jsx';
import { stopSpeak } from '../utils/speech.js';
import './GameLearnPhase.css';

export default function GameLearnPhase({ roundChars, onComplete }) {
  const [index, setIndex] = useState(0);
  const [showChar, setShowChar] = useState(true);
  const isLast = index === roundChars.length - 1;

  // 当 index 改变（且非最后一个字）时，自动切换到下一个字
  // 对于非最后的字，CharCard 会在朗读完成后自动调用 onComplete
  const handleCharComplete = useCallback(() => {
    if (isLast) {
      // 最后一个字：用户点击「开始测验」按钮触发
      // 直接进入测验阶段
      stopSpeak();
      onComplete();
    } else {
      // 非最后一个字：自动切换到下一个
      setIndex(prev => prev + 1);
      setShowChar(false);
      // 短暂延迟后显示下一个字，触发重新渲染
      setTimeout(() => setShowChar(true), 100);
    }
  }, [isLast, onComplete]);

  // 组件卸载时取消朗读
  useEffect(() => {
    return () => stopSpeak();
  }, []);

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
            onComplete={handleCharComplete}
            isLast={isLast}
          />
        )}
      </div>

      <div className="learn-card-hint">
        {isLast ? '🎯 朗读完成后，点击下方按钮进入测验' : '⏳ 请认真听完朗读～'}
      </div>
    </div>
  );
}
